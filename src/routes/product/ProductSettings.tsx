import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../../components/Async.js';
import { NotFound } from '../NotFound.js';
import type { Product } from '../../api/types.js';

/** `/product/:product_id/settings/` — the settings landing page. */
export function ProductSettings() {
  const { api } = useAuth();
  const { productId } = useParams<{ productId: string }>();
  const product = useAsync(
    () => api.request<Product>(`/api/v1/products/${productId}`),
    [api, productId],
  );

  if (productId === undefined) return <NotFound />;

  return (
    <main className="container">
      <AsyncBoundary state={product}>
        {(value) => (
          <>
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link to="/">Products</Link>
              <span className="sep" aria-hidden="true">
                /
              </span>
              <Link to={`/product/${value.slug}`}>{value.name}</Link>
              <span className="sep" aria-hidden="true">
                /
              </span>
              <span>Settings</span>
            </nav>

            <h1>{value.name} settings</h1>

            <nav aria-label="Product settings">
              <ul className="card-grid">
                <li>
                  <Link
                    className="card"
                    to={`/product/${value.slug}/setting/update`}
                    aria-label="Publish a version"
                  >
                    <span className="card__title">Publish a version</span>
                    <span className="card__desc">
                      Upload a jar, write its changelog, and say what it works with.
                    </span>
                    <span className="card__more">Publish →</span>
                  </Link>
                </li>
                <li>
                  <Link
                    className="card"
                    to={`/product/${value.slug}/setting/general`}
                    aria-label="General"
                  >
                    <span className="card__title">General</span>
                    <span className="card__desc">
                      Rename the product, change its id, change its visibility, or delete it.
                    </span>
                    <span className="card__more">Open →</span>
                  </Link>
                </li>
              </ul>
            </nav>
          </>
        )}
      </AsyncBoundary>
    </main>
  );
}
