import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../../components/Async.js';
import { Field, Form } from '../../components/Form.js';
import { ConfirmButton } from '../../components/ConfirmButton.js';
import { CooldownNotice } from '../../components/Cooldown.js';
import { NotFound } from '../NotFound.js';
import type { Product } from '../../api/types.js';

/**
 * `/product/:product_id/setting/general/` — renaming, the id, and deletion.
 *
 * The id change carries the same thirty-day cooldown as an account handle, and
 * deletion requires the id to be repeated. Both rules belong to the server; this
 * page renders them.
 */
export function ProductGeneral() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const product = useAsync(
    () => api.request<Product>(`/api/v1/products/${productId}`),
    [api, productId],
  );

  if (productId === undefined) return <NotFound />;

  return (
    <main>
      <h1>General settings</h1>
      <AsyncBoundary state={product}>
        {(value) => (
          <>
            <p>
              <Link to={`/product/${value.slug}/settings`}>Back to settings</Link>
            </p>
            <Details product={value} onSaved={() => product.reload()} />
            <Slug product={value} onSaved={() => product.reload()} />
            <Danger product={value} />
          </>
        )}
      </AsyncBoundary>
    </main>
  );

  function Details({ product: current, onSaved }: { product: Product; onSaved: () => void }) {
    const [name, setName] = useState(current.name);
    const [summary, setSummary] = useState(current.summary);
    const [description, setDescription] = useState(current.description ?? '');
    const [repoUrl, setRepoUrl] = useState(current.repo_url ?? '');
    const [visibility, setVisibility] = useState(current.visibility);

    return (
      <section aria-labelledby="details-heading">
        <h2 id="details-heading">Details</h2>
        <Form
          submitLabel="Save"
          successMessage="Saved."
          onSubmit={async () => {
            await api.request(`/api/v1/products/${current.id}`, {
              method: 'PATCH',
              body: {
                name,
                summary,
                description: description === '' ? null : description,
                // Cleared to null rather than to an empty string: the product
                // page shows the link only when it is set, and "" is set.
                repoUrl: repoUrl === '' ? null : repoUrl,
                visibility,
              },
            });
            onSaved();
          }}
        >
          <Field label="Name" value={name} onChange={setName} required />
          <Field label="Summary" value={summary} onChange={setSummary} required />
          <p>
            <label>
              Description
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
          </p>
          <Field
            label="Source repository"
            type="url"
            value={repoUrl}
            onChange={setRepoUrl}
            hint="Optional. Leave it empty and the product page shows no source link at all."
          />
          <p>
            <label>
              Visibility
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as Product['visibility'])}
              >
                <option value="public">public</option>
                <option value="unlisted">unlisted</option>
                <option value="private">private</option>
              </select>
            </label>
          </p>
        </Form>
      </section>
    );
  }

  function Slug({ product: current, onSaved }: { product: Product; onSaved: () => void }) {
    const [slug, setSlug] = useState(current.slug);
    const [error, setError] = useState<unknown>(undefined);

    return (
      <section aria-labelledby="id-heading">
        <h2 id="id-heading">Product id</h2>
        <p>
          The id is the address of this page and is unique across every organization. Changing
          it releases the old one and locks the new one for thirty days. Existing links stop
          working.
        </p>
        <Form
          submitLabel="Change id"
          successMessage="Id changed."
          onSubmit={async () => {
            setError(undefined);
            try {
              const updated = await api.request<Product>(`/api/v1/products/${current.id}/slug`, {
                method: 'PUT',
                body: { slug },
              });
              onSaved();
              // The old URL no longer resolves, so the page moves with it.
              void navigate(`/product/${updated.slug}/setting/general`, { replace: true });
            } catch (cause) {
              setError(cause);
              throw cause;
            }
          }}
        >
          <Field label="New id" value={slug} onChange={(v) => setSlug(v.toLowerCase())} required />
        </Form>
        <CooldownNotice error={error} />
      </section>
    );
  }

  function Danger({ product: current }: { product: Product }) {
    return (
      <section aria-labelledby="delete-heading">
        <h2 id="delete-heading">Delete this product</h2>
        <p>
          Every version, every jar and every download count goes with it. Servers that have it
          installed keep the jar they already have, and stop receiving updates.
        </p>
        <ConfirmButton
          label="Delete this product"
          confirmLabel="Delete permanently"
          confirmationPhrase={current.slug}
          description={
            <>
              This cannot be undone. Type <code>{current.slug}</code> to confirm.
            </>
          }
          onConfirm={async () => {
            // The server requires the id in the body too. The dialog asks for
            // the same phrase so the two agree, rather than a confirmed dialog
            // being answered with "confirmation mismatch".
            await api.request(`/api/v1/products/${current.id}`, {
              method: 'DELETE',
              body: { slug: current.slug },
            });
            void navigate('/');
          }}
        />
      </section>
    );
  }
}
