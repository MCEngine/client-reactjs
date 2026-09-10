import { ApiError, NetworkError, type ApiErrorBody } from './errors.js';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** A multipart body. Set instead of `body` when uploading. */
  form?: FormData;
  signal?: AbortSignal;
  query?: Record<string, string | number | undefined>;
}

export interface ApiClient {
  request<T>(path: string, options?: RequestOptions): Promise<T>;
  setAccessToken(token: string | undefined): void;
  getAccessToken(): string | undefined;
}

export interface ApiClientOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
  /**
   * Called when a request fails with 401 and a retry might succeed.
   *
   * Returns the new access token, or undefined when the session is genuinely
   * over. The client retries **once** — a refresh that yields another 401 means
   * the session is gone, and retrying again would loop.
   */
  onUnauthorized?: () => Promise<string | undefined>;
}

const NO_BODY = new Set([204, 205, 304]);

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const baseUrl = options.baseUrl ?? '';
  const doFetch = options.fetcher ?? globalThis.fetch.bind(globalThis);
  let accessToken: string | undefined;

  const send = async (path: string, opts: RequestOptions, token: string | undefined) => {
    const url = new URL(`${baseUrl}${path}`, globalThis.location?.origin ?? 'http://localhost');
    for (const [key, value] of Object.entries(opts.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const headers: Record<string, string> = {};
    if (token !== undefined) headers['Authorization'] = `Bearer ${token}`;
    // FormData sets its own Content-Type with the multipart boundary; setting
    // one here would replace it and the server would fail to parse the body.
    if (opts.form === undefined && opts.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    return doFetch(url.toString(), {
      method: opts.method ?? 'GET',
      headers,
      // The refresh token lives in an HttpOnly cookie, so every request has to
      // carry credentials for /auth/refresh to work at all.
      credentials: 'include',
      ...(opts.signal === undefined ? {} : { signal: opts.signal }),
      ...(opts.form !== undefined
        ? { body: opts.form }
        : opts.body !== undefined
          ? { body: JSON.stringify(opts.body) }
          : {}),
    });
  };

  return {
    setAccessToken(token) {
      accessToken = token;
    },

    getAccessToken() {
      return accessToken;
    },

    async request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
      let response: Response;
      try {
        response = await send(path, opts, accessToken);
      } catch (error) {
        throw new NetworkError(error);
      }

      if (response.status === 401 && options.onUnauthorized !== undefined) {
        const refreshed = await options.onUnauthorized();
        if (refreshed !== undefined) {
          accessToken = refreshed;
          try {
            response = await send(path, opts, refreshed);
          } catch (error) {
            throw new NetworkError(error);
          }
        }
      }

      if (NO_BODY.has(response.status)) return undefined as T;

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        payload = undefined;
      }

      if (!response.ok) {
        const body =
          payload !== undefined && typeof payload === 'object' && payload !== null && 'error' in payload
            ? (payload as ApiErrorBody)
            : { error: { code: 'unexpected_response', message: `The server returned ${response.status}.` } };
        throw new ApiError(response.status, body);
      }

      return payload as T;
    },
  };
}
