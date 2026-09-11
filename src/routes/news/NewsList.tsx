import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { describeError } from '../../components/Async.js';
import type { News, Page } from '../../api/types.js';

const PAGE = 10;

/**
 * `/news` — ten at a time, more as you reach the bottom.
 *
 * Keyset paging, not a page number: the cursor is the id of the last item, so
 * something published while a reader is scrolling cannot shift the list under
 * them and show the same item twice.
 */
export function NewsList() {
  const { api, status } = useAuth();
  const [items, setItems] = useState<News[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<unknown>(undefined);
  const sentinel = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (after: string | null) => {
      setLoading(true);
      setError(undefined);
      try {
        const page = await api.request<Page<News>>('/api/v1/news', {
          query: { limit: PAGE, ...(after === null ? {} : { cursor: after }) },
        });
        setItems((current) => [...current, ...page.data]);
        setCursor(page.next_cursor);
        if (page.next_cursor === null) setDone(true);
      } catch (cause) {
        setError(cause);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    void load(null);
  }, [load]);

  /*
   * The sentinel is watched rather than the scroll position: an observer fires
   * when the end of the list is actually in view, where a scroll handler has to
   * guess from pixel arithmetic and fires on every frame while it does.
   *
   * The button below is not a fallback nobody sees — it is how this works with
   * a keyboard, and in any environment without an observer.
   */
  useEffect(() => {
    if (done || loading || typeof IntersectionObserver === 'undefined') return;
    const target = sentinel.current;
    if (target === null) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void load(cursor);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [cursor, done, loading, load]);

  return (
    <main className="container">
      <p className="eyebrow">What is happening</p>
      <h1>News</h1>

      {status === 'authenticated' && (
        <div className="btn-row">
          <Link className="btn btn--primary" to="/news/create">
            Write a news item
          </Link>
        </div>
      )}

      {error !== undefined && (
        <div className="callout callout--danger" role="alert">
          <span className="callout__icon" aria-hidden="true">
            !
          </span>
          <p className="callout__body">{describeError(error)}</p>
        </div>
      )}

      {items.length === 0 && !loading && error === undefined && (
        <p className="muted">Nothing has been published yet.</p>
      )}

      <ul className="stack">
        {items.map((item) => (
          <li key={item.id}>
            <article className="panel">
              <h2>
                <Link to={`/news/${item.id}`}>{item.title}</Link>
              </h2>
              <p className="muted">
                {new Date(item.created_at).toLocaleDateString()}
                {item.author === undefined ? '' : ` · ${item.author.display_name}`}
                {item.hidden ? ' · hidden' : ''}
              </p>
              <p>{item.summary}</p>
            </article>
          </li>
        ))}
      </ul>

      <div ref={sentinel} />

      {loading && (
        <p className="async-status" role="status">
          Loading…
        </p>
      )}

      {!done && !loading && (
        <div className="btn-row">
          <button className="btn" type="button" onClick={() => void load(cursor)}>
            Load more
          </button>
        </div>
      )}
    </main>
  );
}
