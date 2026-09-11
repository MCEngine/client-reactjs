import { render, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider } from '../src/auth/AuthContext.js';
import { createApiClient, type ApiClient } from '../src/api/client.js';

export interface StubRoute {
  status?: number;
  body?: unknown;
  /** Called with the request, for asserting what the panel sent. */
  onCall?(input: string, init: RequestInit): void;
}

/**
 * A fetch stub keyed by `METHOD /path`.
 *
 * The panel is tested against the server's *contract*, not against the server:
 * these routes are written from `wiki/information/api-contract.md`, and a
 * mismatch between them and the real service is a contract change that has to
 * be made in both repositories.
 */
export function stubFetch(routes: Record<string, StubRoute | StubRoute[]>): typeof fetch {
  const remaining = new Map<string, StubRoute[]>(
    Object.entries(routes).map(([key, value]) => [key, Array.isArray(value) ? [...value] : [value]]),
  );

  return (async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(String(input), 'http://localhost');
    const key = `${init.method ?? 'GET'} ${url.pathname}`;
    const queue = remaining.get(key);

    if (queue === undefined || queue.length === 0) {
      return new Response(
        JSON.stringify({ error: { code: 'route_not_found', message: `No stub for ${key}.` } }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // The last entry repeats, so a route called many times needs one stub.
    const route = queue.length > 1 ? queue.shift()! : queue[0]!;
    route.onCall?.(url.toString(), init);

    const status = route.status ?? 200;
    if (status === 204) return new Response(null, { status });
    return new Response(JSON.stringify(route.body ?? {}), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as unknown as typeof fetch;
}

export function testClient(fetcher: typeof fetch): ApiClient {
  return createApiClient({ fetcher });
}

export function renderWithAuth(ui: ReactNode, client: ApiClient, path = '/'): RenderResult {
  return render(
    <AuthProvider client={client}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </AuthProvider>,
  );
}
