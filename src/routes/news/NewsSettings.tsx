import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../../components/Async.js';
import { ConfirmButton } from '../../components/ConfirmButton.js';
import { NotFound } from '../NotFound.js';
import type { News } from '../../api/types.js';

/**
 * `/news/:news_id/settings` — hide it, show it again, or delete it.
 *
 * Hiding and deleting are different answers to the same moment: hiding is what
 * you do when something is wrong and you want to think, deleting is what you do
 * when you are sure. Both ask first.
 */
export function NewsSettings() {
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
        <span>Settings</span>
      </nav>

      <p className="eyebrow">What is happening</p>
      <h1>Settings</h1>

      <AsyncBoundary state={item}>
        {(value) => (
          <>
            <p className="lead">{value.title}</p>

            <section className="panel" aria-labelledby="visibility-heading">
              <h2 id="visibility-heading">Visibility</h2>
              <p>
                {value.hidden
                  ? 'This item is hidden. It is out of the list, and anyone who may not edit it gets a not-found.'
                  : 'This item is visible to everyone, signed in or not.'}
              </p>
              <ConfirmButton
                label={value.hidden ? 'Show it again' : 'Hide it'}
                confirmLabel={value.hidden ? 'Show it' : 'Hide it'}
                description={
                  value.hidden
                    ? 'It goes back in the list and anyone can read it again.'
                    : 'It leaves the list immediately, and anyone who may not edit it gets a not-found. Nothing is deleted — you can show it again here.'
                }
                onConfirm={async () => {
                  await api.request(`/api/v1/news/${value.id}`, {
                    method: 'PATCH',
                    body: { hidden: !value.hidden },
                  });
                  item.reload();
                }}
              />
            </section>

            <section aria-labelledby="delete-heading">
              <h2 id="delete-heading">Delete</h2>
              <p>
                Gone for good, along with anything linking to it. Hide it instead if you might
                want it back.
              </p>
              <ConfirmButton
                label="Delete this item"
                confirmLabel="Delete permanently"
                description="This cannot be undone."
                onConfirm={async () => {
                  await api.request(`/api/v1/news/${value.id}`, { method: 'DELETE' });
                  void navigate('/news');
                }}
              />
            </section>
          </>
        )}
      </AsyncBoundary>
    </main>
  );
}
