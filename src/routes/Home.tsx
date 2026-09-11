import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../components/Async.js';
import type { Page, Product } from '../api/types.js';

export function Home() {
  const { api } = useAuth();
  const state = useAsync(() => api.request<Page<Product>>('/api/v1/products'), [api]);

  return (
    <main className="container">
      <div className="hero">
        <p className="eyebrow">Catalogue</p>
        <h1>Products</h1>
        <p className="lead">
          Every plugin and mod published here, with the checksum each Minecraft server verifies
          its download against.
        </p>
      </div>

      <AsyncBoundary
        state={state}
        isEmpty={(page) => page.data.length === 0}
        empty={
          <div className="callout callout--info">
            <span className="callout__icon" aria-hidden="true">
              i
            </span>
            <p className="callout__body">No products have been published yet.</p>
          </div>
        }
      >
        {(page) => (
          <ul className="card-grid">
            {page.data.map((product) => (
              <li key={product.id}>
                {/* The whole card is the link, so the target is the card rather
                    than a few words inside it. */}
                <Link className="card" to={`/product/${product.slug}`} aria-label={product.name}>
                  <span className="card__title">{product.name}</span>
                  <span className="card__desc">{product.summary}</span>
                  <span className="card__more">View →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AsyncBoundary>
    </main>
  );
}
