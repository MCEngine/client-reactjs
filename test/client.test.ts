import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from '../src/api/client.js';
import { ApiError, NetworkError } from '../src/api/errors.js';
import { stubFetch } from './helpers.js';

/** Runs `run`, asserts it threw, and hands the error back typed. */
async function caught<T extends Error>(run: () => Promise<unknown>): Promise<T> {
  try {
    await run();
  } catch (error) {
    return error as T;
  }
  throw new Error('Expected a rejection, but the call resolved.');
}

describe('the API client', () => {
  it('sends the access token as a bearer credential', async () => {
    let seen: RequestInit | undefined;
    const api = createApiClient({
      fetcher: stubFetch({ 'GET /api/v1/me': { body: { id: 'x' }, onCall: (_u, i) => (seen = i) } }),
    });
    api.setAccessToken('token-abc');

    await api.request('/api/v1/me');
    expect((seen?.headers as Record<string, string>)['Authorization']).toBe('Bearer token-abc');
  });

  it('always sends credentials, because the refresh token is a cookie', async () => {
    let seen: RequestInit | undefined;
    const api = createApiClient({
      fetcher: stubFetch({ 'GET /api/v1/me': { body: {}, onCall: (_u, i) => (seen = i) } }),
    });
    await api.request('/api/v1/me');
    expect(seen?.credentials).toBe('include');
  });

  it('does not set a Content-Type for a multipart body', async () => {
    let seen: RequestInit | undefined;
    const api = createApiClient({
      fetcher: stubFetch({
        'POST /api/v1/products/p/versions': { body: {}, onCall: (_u, i) => (seen = i) },
      }),
    });

    const form = new FormData();
    form.set('version', '1.0.0');
    await api.request('/api/v1/products/p/versions', { method: 'POST', form });

    // Setting one would replace the boundary FormData generates, and the
    // server would fail to parse the body.
    expect((seen?.headers as Record<string, string>)['Content-Type']).toBeUndefined();
  });

  it('turns an error envelope into an ApiError carrying the code', async () => {
    const api = createApiClient({
      fetcher: stubFetch({
        'PUT /api/v1/accounts/alice/handle': {
          status: 409,
          body: {
            error: {
              code: 'handle_cooldown',
              message: 'Too soon.',
              details: { available_at: '2026-02-01T00:00:00.000Z' },
            },
          },
        },
      }),
    });

    const error = await caught<ApiError>(() =>
      api.request('/api/v1/accounts/alice/handle', { method: 'PUT' }),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('handle_cooldown');
    expect(error.status).toBe(409);
    expect(error.availableAt?.toISOString()).toBe('2026-02-01T00:00:00.000Z');
  });

  it('handles a failure body that is not an envelope', async () => {
    const api = createApiClient({
      fetcher: (async () => new Response('<html>502</html>', { status: 502 })) as unknown as typeof fetch,
    });
    const error = await caught<ApiError>(() => api.request('/api/v1/me'));
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('unexpected_response');
  });

  it('returns undefined for a 204 rather than trying to parse a body', async () => {
    const api = createApiClient({
      fetcher: stubFetch({ 'DELETE /api/v1/tokens/t1': { status: 204 } }),
    });
    await expect(api.request('/api/v1/tokens/t1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('distinguishes a network failure from a refusal', async () => {
    const api = createApiClient({
      fetcher: (async () => {
        throw new TypeError('Failed to fetch');
      }) as unknown as typeof fetch,
    });
    await expect(api.request('/api/v1/me')).rejects.toBeInstanceOf(NetworkError);
  });

  it('refreshes once on a 401 and retries with the new token', async () => {
    const onUnauthorized = vi.fn(async () => 'fresh-token');
    let attempt = 0;
    const fetcher = (async (_input: string, init: RequestInit) => {
      attempt += 1;
      const auth = (init.headers as Record<string, string>)['Authorization'];
      if (attempt === 1) {
        return new Response(JSON.stringify({ error: { code: 'unauthorized', message: 'no' } }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ token: auth }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as unknown as typeof fetch;

    const api = createApiClient({ fetcher, onUnauthorized });
    const result = await api.request<{ token: string }>('/api/v1/me');

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(result.token).toBe('Bearer fresh-token');
    expect(api.getAccessToken()).toBe('fresh-token');
  });

  it('gives up rather than looping when the refresh also fails', async () => {
    const onUnauthorized = vi.fn(async () => undefined);
    const api = createApiClient({
      fetcher: stubFetch({
        'GET /api/v1/me': {
          status: 401,
          body: { error: { code: 'unauthorized', message: 'no' } },
        },
      }),
      onUnauthorized,
    });

    await expect(api.request('/api/v1/me')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('puts query parameters on the URL, skipping undefined ones', async () => {
    let seen: string | undefined;
    const api = createApiClient({
      fetcher: stubFetch({ 'GET /api/v1/products': { body: {}, onCall: (u) => (seen = u) } }),
    });
    await api.request('/api/v1/products', { query: { kind: 'bukkit_plugin', cursor: undefined } });
    expect(seen).toContain('kind=bukkit_plugin');
    expect(seen).not.toContain('cursor');
  });
});
