import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../../components/Async.js';
import { NewsForm } from './NewsForm.js';
import { NotFound } from '../NotFound.js';
import type { News } from '../../api/types.js';

/** `/news/edit/:news_id` — change one that is already published. */
export function NewsEdit() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const { newsId } = useParams<{ newsId: string }>();
  const item = useAsync(() => api.request<News>(`/api/v1/news/${newsId}`), [api, newsId]);

  if (newsId === undefined) return <NotFound />;

  return (
    <main className="container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/news">News</Link>
        <span className="sep" aria-hidden="true">
          /
        </span>
        <Link to={`/news/${newsId}`}>This item</Link>
        <span className="sep" aria-hidden="true">
          /
        </span>
        <span>Edit</span>
      </nav>

      <p className="eyebrow">What is happening</p>
      <h1>Edit</h1>

      <AsyncBoundary state={item}>
        {(value) => (
          <NewsForm
            initial={value}
            submitLabel="Save"
            successMessage="Saved."
            onSubmit={async (input) => {
              await api.request(`/api/v1/news/${value.id}`, { method: 'PATCH', body: input });
              void navigate(`/news/${value.id}`);
            }}
          />
        )}
      </AsyncBoundary>
    </main>
  );
}
