import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App.js';
import { renderWithAuth, stubFetch, testClient } from './helpers.js';
import { createApiClient } from '../src/api/client.js';

const ALICE = {
  id: '01ABC',
  type: 'user' as const,
  handle: 'alice',
  display_name: 'Alice',
  created_at: '2026-01-01T00:00:00.000Z',
};

describe('the auth provider', () => {
  it('recovers a session from the refresh cookie on load', async () => {
    // The panel stores nothing. A reload works because the cookie is HttpOnly
    // and the browser sends it, not because a token was kept anywhere.
    const client = testClient(
      stubFetch({
        'POST /api/v1/auth/refresh': { body: { access_token: 'a', expires_in: 900, token_type: 'Bearer' } },
        'GET /api/v1/me': { body: ALICE },
      }),
    );

    renderWithAuth(<App />, client);
    expect(await screen.findByRole('link', { name: 'Alice' })).toBeInTheDocument();
  });

  it('shows a sign-in link when there is no session to recover', async () => {
    const client = testClient(
      stubFetch({
        'POST /api/v1/auth/refresh': {
          status: 401,
          body: { error: { code: 'no_refresh_token', message: 'none' } },
        },
      }),
    );

    renderWithAuth(<App />, client);
    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('does not treat an unreachable server as a sign-out loop', async () => {
    const client = createApiClient({
      fetcher: (async () => {
        throw new TypeError('Failed to fetch');
      }) as unknown as typeof fetch,
    });

    renderWithAuth(<App />, client);
    // Anonymous, because nothing else can be shown -- but it settles rather
    // than staying on "checking" forever.
    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('clears the account on sign-out even if the request fails', async () => {
    const client = testClient(
      stubFetch({
        'POST /api/v1/auth/refresh': { body: { access_token: 'a', expires_in: 900, token_type: 'Bearer' } },
        'GET /api/v1/me': { body: ALICE },
        'POST /api/v1/auth/logout': { status: 500, body: { error: { code: 'internal_error', message: 'x' } } },
      }),
    );

    renderWithAuth(<App />, client);
    await screen.findByRole('link', { name: 'Alice' });

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    // A person who clicked sign out must end up signed out locally whatever
    // the server said.
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    });
  });

  it('never puts a token in localStorage', async () => {
    const client = testClient(
      stubFetch({
        'POST /api/v1/auth/refresh': { body: { access_token: 'secret-token', expires_in: 900, token_type: 'Bearer' } },
        'GET /api/v1/me': { body: ALICE },
      }),
    );

    renderWithAuth(<App />, client);
    await screen.findByRole('link', { name: 'Alice' });

    expect(JSON.stringify(globalThis.localStorage)).not.toContain('secret-token');
    expect(globalThis.localStorage.length).toBe(0);
  });
});

describe('the product list', () => {
  it('lists what the catalogue returns', async () => {
    const client = testClient(
      stubFetch({
        'POST /api/v1/auth/refresh': { status: 401, body: { error: { code: 'x', message: 'x' } } },
        'GET /api/v1/products': {
          body: {
            data: [
              {
                id: '01P',
                slug: 'acme-tools',
                name: 'Acme Tools',
                summary: 'Tools for servers.',
                kind: 'bukkit_plugin',
                visibility: 'public',
                owner_org_id: '01O',
                downloads_count: 4,
                created_at: '2026-01-01T00:00:00.000Z',
                updated_at: '2026-01-01T00:00:00.000Z',
              },
            ],
            next_cursor: null,
          },
        },
      }),
    );

    renderWithAuth(<App />, client);

    /*
     * The whole card is the link, so without an explicit label its accessible
     * name is the title, the summary and the "View →" affordance run together —
     * which is what a screen reader reads out. `toHaveAccessibleName` is an
     * exact match, so this test fails the moment that regresses.
     */
    const link = await screen.findByRole('link', { name: 'Acme Tools' });
    expect(link).toHaveAccessibleName('Acme Tools');
    expect(screen.getByText('Tools for servers.')).toBeInTheDocument();
  });

  it('says so plainly when the catalogue is empty', async () => {
    const client = testClient(
      stubFetch({
        'POST /api/v1/auth/refresh': { status: 401, body: { error: { code: 'x', message: 'x' } } },
        'GET /api/v1/products': { body: { data: [], next_cursor: null } },
      }),
    );

    renderWithAuth(<App />, client);
    expect(await screen.findByText('No products have been published yet.')).toBeInTheDocument();
  });

  it('shows the server’s message when a read fails', async () => {
    const client = testClient(
      stubFetch({
        'POST /api/v1/auth/refresh': { status: 401, body: { error: { code: 'x', message: 'x' } } },
        'GET /api/v1/products': {
          status: 500,
          body: { error: { code: 'internal_error', message: 'Something went wrong.' } },
        },
      }),
    );

    renderWithAuth(<App />, client);
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong.');
  });
});
