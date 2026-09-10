import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../components/Async.js';
import type { Page, Product } from '../api/types.js';

export function Home() {
  const { api } = useAuth();
  const state = useAsync(() => api.request<Page<Product>>('/api/v1/products'), [api]);

  return (
    <main>
      <h1>Products</h1>
      <AsyncBoundary
        state={state}
        isEmpty={(page) => page.data.length === 0}
        empty={<p>No products have been published yet.</p>}
      >
        {(page) => (
          <ul>
            {page.data.map((product) => (
              <li key={product.id}>
                <Link to={`/product/${product.slug}`}>{product.name}</Link>
                <p>{product.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </AsyncBoundary>
    </main>
  );
}
