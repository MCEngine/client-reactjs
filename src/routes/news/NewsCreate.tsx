import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { NewsForm } from './NewsForm.js';
import type { News } from '../../api/types.js';

/** `/news/create` — write one. */
export function NewsCreate() {
  const { api } = useAuth();
  const navigate = useNavigate();

  return (
    <main className="container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/news">News</Link>
        <span className="sep" aria-hidden="true">
          /
        </span>
        <span>Write</span>
      </nav>

      <p className="eyebrow">What is happening</p>
      <h1>Write a news item</h1>
      <p className="lead">
        Written in Markdown. Publishing needs an account whose handle is in the server's
        <code> NEWS_AUTHORS</code> list — without that the server answers this form with
        “This account may not write news.”
      </p>

      <NewsForm
        submitLabel="Publish"
        successMessage="Published."
        onSubmit={async (input) => {
          const created = await api.request<News>('/api/v1/news', {
            method: 'POST',
            body: input,
          });
          void navigate(`/news/${created.id}`);
        }}
      />
    </main>
  );
}
