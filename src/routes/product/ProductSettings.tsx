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
    <main>
      <AsyncBoundary state={product}>
        {(value) => (
          <>
            <h1>{value.name} settings</h1>
            <nav aria-label="Product settings">
              <ul>
                <li>
                  <Link to={`/product/${value.slug}/setting/update`}>Publish a version</Link>
                  <p>Upload a jar, write its changelog, and say what it works with.</p>
                </li>
                <li>
                  <Link to={`/product/${value.slug}/setting/general`}>General</Link>
                  <p>Rename the product, change its id, change its visibility, or delete it.</p>
                </li>
              </ul>
            </nav>
            <p>
              <Link to={`/product/${value.slug}`}>Back to the product page</Link>
            </p>
          </>
        )}
      </AsyncBoundary>
    </main>
  );
}
