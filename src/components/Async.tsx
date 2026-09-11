import { useCallback, useEffect, useState, type DependencyList, type ReactNode } from 'react';
import { ApiError, NetworkError } from '../api/errors.js';

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'failed'; error: unknown };

/**
 * Runs an async read and tracks its state.
 *
 * A late response from a superseded request is discarded rather than applied —
 * without that, switching quickly between two products renders whichever
 * request happened to finish last.
 */
export function useAsync<T>(load: () => Promise<T>, deps: DependencyList): AsyncState<T> & { reload(): void } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let current = true;
    setState({ status: 'loading' });
    void load()
      .then((value) => {
        if (current) setState({ status: 'ready', value });
      })
      .catch((error: unknown) => {
        if (current) setState({ status: 'failed', error });
      });
    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}

/** Turns any thrown value into something worth showing a person. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof NetworkError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}

export interface AsyncBoundaryProps<T> {
  state: AsyncState<T>;
  children: (value: T) => ReactNode;
  /** Rendered instead of `children` when `isEmpty` says the result is empty. */
  empty?: ReactNode;
  /**
   * Decides emptiness.
   *
   * The caller decides rather than this component guessing, because what is
   * "empty" depends on the shape: a page of results is empty when `data` is,
   * and an array heuristic here would silently never fire for one.
   */
  isEmpty?: (value: T) => boolean;
}

export function AsyncBoundary<T>({ state, children, empty, isEmpty }: AsyncBoundaryProps<T>) {
  if (state.status === 'loading')
    return (
      <p className="async-status" role="status">
        Loading…
      </p>
    );
  if (state.status === 'failed')
    return (
      <div className="callout callout--danger" role="alert">
        <span className="callout__icon" aria-hidden="true">
          !
        </span>
        <p className="callout__body">{describeError(state.error)}</p>
      </div>
    );
  if (empty !== undefined && isEmpty?.(state.value) === true) return <>{empty}</>;
  return <>{children(state.value)}</>;
}
