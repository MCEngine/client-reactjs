import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../../components/Async.js';
import { formatBytes } from '../org/Members.js';
import { NotFound } from '../NotFound.js';
import type { Account, Page, Product, ProductVersion } from '../../api/types.js';

/**
 * `/product/:product_id/` — the page everyone sees.
 *
 * `:product_id` is a slug or an opaque id; the server resolves either, which is
 * why the URL needs no organization prefix.
 */
export function ProductPage() {
  const { api } = useAuth();
  const { productId } = useParams<{ productId: string }>();

  const product = useAsync(
    () => api.request<Product>(`/api/v1/products/${productId}`),
    [api, productId],
  );
  const versions = useAsync(
    () => api.request<Page<ProductVersion>>(`/api/v1/products/${productId}/versions`),
    [api, productId],
  );

  if (productId === undefined) return <NotFound />;

  return (
    <main>
      <AsyncBoundary state={product}>
        {(value) => (
          <>
            <h1>{value.name}</h1>
            <p>
              <code>{value.slug}</code> — {value.summary}
            </p>
            <Publisher orgId={value.owner_org_id} />

            <dl>
              <dt>Kind</dt>
              <dd>{value.kind.replace('_', ' ')}</dd>
              <dt>Downloads</dt>
              <dd>{value.downloads_count.toLocaleString()}</dd>
              {value.license !== undefined && (
                <>
                  <dt>License</dt>
                  <dd>{value.license}</dd>
                </>
              )}
              {/* Shown only when set — the server omits the key entirely rather
                  than sending null, so an absent link is not a broken one. */}
              {value.repo_url !== undefined && (
                <>
                  <dt>Source</dt>
                  <dd>
                    <a href={value.repo_url} rel="noreferrer noopener">
                      {value.repo_url}
                    </a>
                  </dd>
                </>
              )}
              {value.homepage_url !== undefined && (
                <>
                  <dt>Homepage</dt>
                  <dd>
                    <a href={value.homepage_url} rel="noreferrer noopener">
                      {value.homepage_url}
                    </a>
                  </dd>
                </>
              )}
            </dl>

            {value.description !== undefined && (
              <section aria-labelledby="detail-heading">
                <h2 id="detail-heading">Detail</h2>
                {/* Rendered as text, not as markup. The description is written
                    by a publisher and read by everyone; interpreting it as HTML
                    would make it a cross-site scripting surface. */}
                <p>{value.description}</p>
              </section>
            )}

            <p>
              <Link to={`/product/${value.slug}/settings`}>Settings</Link>
            </p>
          </>
        )}
      </AsyncBoundary>

      <section aria-labelledby="versions-heading">
        <h2 id="versions-heading">Versions</h2>
        <AsyncBoundary
          state={versions}
          isEmpty={(page) => page.data.length === 0}
          empty={<p>Nothing has been published yet.</p>}
        >
          {(page) => (
            <ul>
              {page.data.map((version) => (
                <li key={version.version}>
                  <strong>{version.version}</strong>
                  {version.is_latest && <span> (latest)</span>}
                  <span> — {version.channel}</span>

                  {version.compatibility.length > 0 && (
                    <div>
                      Works with{' '}
                      {version.compatibility
                        .map((c) => `${c.platform} ${c.minecraft_version}`)
                        .join(', ')}
                    </div>
                  )}

                  {version.file !== undefined && (
                    <div>
                      <a href={`/api/v1/products/${productId}/versions/${version.version}/download`}>
                        Download {version.file.name}
                      </a>{' '}
                      ({formatBytes(version.file.size_bytes)})
                      <div>
                        <small>
                          SHA-256 <code>{version.file.sha256}</code>
                        </small>
                      </div>
                    </div>
                  )}

                  {version.changelog !== undefined && <p>{version.changelog}</p>}
                </li>
              ))}
            </ul>
          )}
        </AsyncBoundary>
      </section>
    </main>
  );

  function Publisher({ orgId }: { orgId: string }) {
    const org = useAsync(() => api.request<Account>(`/api/v1/accounts/${orgId}`), [orgId]);
    if (org.status !== 'ready') return null;
    return (
      <p>
        Published by <Link to={`/org/${org.value.handle}/members`}>{org.value.display_name}</Link>
      </p>
    );
  }
}
