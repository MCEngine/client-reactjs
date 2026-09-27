import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../../components/Async.js';
import { Markdown } from '../../components/Markdown.js';
import { NotFound } from '../NotFound.js';
import type { News } from '../../api/types.js';

/** `/news/:news_id` — one item, its Markdown rendered. */
export function NewsDetail() {
  const { api, status } = useAuth();
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
        <span>This item</span>
      </nav>

      <AsyncBoundary state={item}>
        {(value) => (
          <article>
            <p className="eyebrow">
              {new Date(value.created_at).toLocaleDateString()}
              {value.author === undefined ? '' : ` · ${value.author.display_name}`}
            </p>
            <h1>{value.title}</h1>
            <p className="lead">{value.summary}</p>

            {value.hidden && (
              <div className="callout callout--warn" role="status">
                <span className="callout__icon" aria-hidden="true">
                  !
                </span>
                <p className="callout__body">
                  This item is hidden. Only its author and the other news authors can read it.
                </p>
              </div>
            )}

            {/* The one place a reader sees somebody else's writing, so it is
                also the one place the renderer's guarantees matter. */}
            <div className="prose">
              <Markdown>{value.body}</Markdown>
            </div>

            {status === 'authenticated' && (
              <div className="btn-row">
                <Link className="btn" to={`/news/edit/${value.id}`}>
                  Edit
                </Link>
                <Link className="btn" to={`/news/${value.id}/settings`}>
                  Settings
                </Link>
              </div>
            )}
          </article>
        )}
      </AsyncBoundary>
    </main>
  );
}
