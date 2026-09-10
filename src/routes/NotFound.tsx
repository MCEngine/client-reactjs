import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <main>
      <h1>Not found</h1>
      <p>There is nothing at this address, or it is not visible to you.</p>
      <Link to="/">Back to products</Link>
    </main>
  );
}
