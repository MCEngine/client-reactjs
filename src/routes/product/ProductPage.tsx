import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../../components/Async.js';
import { formatBytes } from '../org/OrgMembers.js';
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
    <main className="container">
      <AsyncBoundary state={product}>
        {(value) => (
          <>
            <div className="hero">
              <p className="eyebrow">
                <code>{value.slug}</code>
              </p>
              <h1>{value.name}</h1>
              <p className="lead">{value.summary}</p>
              <Publisher orgId={value.owner_org_id} />
              <div className="btn-row">
                <Link className="btn" to={`/product/${value.slug}/settings`}>
                  Settings
                </Link>
              </div>
            </div>

            <dl className="deflist panel">
              <div className="deflist__row">
                <dt className="deflist__term">Kind</dt>
                <dd>{value.kind.replace('_', ' ')}</dd>
              </div>
              <div className="deflist__row">
                <dt className="deflist__term">Downloads</dt>
                <dd>{value.downloads_count.toLocaleString()}</dd>
              </div>
              {value.license !== undefined && (
                <div className="deflist__row">
                  <dt className="deflist__term">License</dt>
                  <dd>{value.license}</dd>
                </div>
              )}
              {/* Shown only when set — the server omits the key entirely rather
                  than sending null, so an absent link is not a broken one. */}
              {value.repo_url !== undefined && (
                <div className="deflist__row">
                  <dt className="deflist__term">Source</dt>
                  <dd>
                    <a href={value.repo_url} rel="noreferrer noopener">
                      {value.repo_url}
                    </a>
                  </dd>
                </div>
              )}
              {value.homepage_url !== undefined && (
                <div className="deflist__row">
                  <dt className="deflist__term">Homepage</dt>
                  <dd>
                    <a href={value.homepage_url} rel="noreferrer noopener">
                      {value.homepage_url}
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            {value.description !== undefined && (
              <section className="panel" aria-labelledby="detail-heading">
                <h2 id="detail-heading">Detail</h2>
                {/* Rendered as text, not as markup. The description is written
                    by a publisher and read by everyone; interpreting it as HTML
                    would make it a cross-site scripting surface. */}
                <p>{value.description}</p>
              </section>
            )}

          </>
        )}
      </AsyncBoundary>

      <section className="section" aria-labelledby="versions-heading">
        <h2 id="versions-heading">Versions</h2>
        <AsyncBoundary
          state={versions}
          isEmpty={(page) => page.data.length === 0}
          empty={<p className="muted">Nothing has been published yet.</p>}
        >
          {(page) => <VersionPicker page={page} productId={productId} />}
        </AsyncBoundary>
      </section>
    </main>
  );

  /**
   * One version at a time, chosen from a dropdown.
   *
   * Rendering every version in full made the page as long as the product was
   * old — twenty versions meant twenty checksums and twenty changelogs, and the
   * one almost everyone wants was at the top only by luck.
   *
   * A separate component because it holds state: the render prop above cannot
   * call a hook.
   */
  function VersionPicker({ page, productId: id }: { page: Page<ProductVersion>; productId: string }) {
    /*
     * The server marks the latest per channel and orders by `version_norm`,
     * which is why 1.10.0 sits above 1.9.0. Neither is recomputed here: the
     * default is the row the server flagged, falling back to the first one it
     * sent, and the options keep the order they arrived in.
     */
    const preferred = page.data.find((candidate) => candidate.is_latest) ?? page.data[0];
    const [chosen, setChosen] = useState<string | undefined>(undefined);

    const version =
      page.data.find((candidate) => candidate.version === chosen) ?? preferred;

    // AsyncBoundary's `isEmpty` already handles the no-versions case; this is
    // for the type, not for a state the page can reach.
    if (version === undefined) return null;

    return (
      <div className="panel">
        <div className="field">
          <label>
            Version
            <select value={version.version} onChange={(event) => setChosen(event.target.value)}>
              {page.data.map((candidate) => (
                <option key={candidate.version} value={candidate.version}>
                  {candidate.version}
                  {candidate.is_latest ? ' (latest)' : ''} — {candidate.channel}
                </option>
              ))}
            </select>
          </label>
          {/* The count stays visible, so collapsing the list does not hide how
              much there is. */}
          <small className="field__hint">
            {page.data.length === 1 ? '1 version published.' : `${page.data.length} versions published.`}
          </small>
        </div>

        <div className="row-between">
          <strong>{version.version}</strong>
          <span className="chip-row">
            {version.is_latest && <span className="badge badge--ok">latest</span>}
            <span className="badge badge--accent">{version.channel}</span>
          </span>
        </div>

        {version.compatibility.length > 0 && (
          <ul className="chip-row">
            {version.compatibility.map((c) => (
              <li className="chip" key={`${c.platform}-${c.minecraft_version}`}>
                {c.platform} {c.minecraft_version}
              </li>
            ))}
          </ul>
        )}

        {version.file !== undefined && (
          <>
            <div className="btn-row">
              <a
                className="btn btn--primary"
                href={`/api/v1/products/${id}/versions/${version.version}/download`}
              >
                Download {version.file.name}
              </a>
              <span className="muted">({formatBytes(version.file.size_bytes)})</span>
            </div>
            <small className="code-label">SHA-256</small>
            <p className="mono-block">{version.file.sha256}</p>
          </>
        )}

        {version.changelog !== undefined && <p>{version.changelog}</p>}
      </div>
    );
  }

  function Publisher({ orgId }: { orgId: string }) {
    const org = useAsync(() => api.request<Account>(`/api/v1/accounts/${orgId}`), [orgId]);
    if (org.status !== 'ready') return null;
    return (
      <p className="muted">
        Published by <Link to={`/org/${org.value.handle}/settings`}>{org.value.display_name}</Link>
      </p>
    );
  }
}
