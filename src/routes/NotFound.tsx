import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <main className="container narrow">
      <div className="panel">
        <p className="eyebrow">404</p>
        <h1>Not found</h1>
        <p className="lead">There is nothing at this address, or it is not visible to you.</p>
        <div className="btn-row">
          <Link className="btn btn--primary" to="/">
            Back to products
          </Link>
        </div>
      </div>
    </main>
  );
}
