import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { App } from '../src/App.js';
import { renderWithAuth, stubFetch, testClient } from './helpers.js';

const ANONYMOUS = {
  'POST /api/v1/auth/refresh': { status: 401, body: { error: { code: 'x', message: 'no' } } },
};

const ALICE = {
  id: '01ABC',
  type: 'user' as const,
  handle: 'alice',
  display_name: 'Alice',
  created_at: '2026-01-01T00:00:00.000Z',
};

describe('/', () => {
  it('explains what this is, rather than opening on the catalogue', async () => {
    const client = testClient(stubFetch(ANONYMOUS));
    renderWithAuth(<App />, client, '/');

    expect(await screen.findByRole('heading', { level: 1, name: 'MCPluginManager' })).toBeInTheDocument();

    // The three pieces, named. A front door that does not say what the thing is
    // has not done its job.
    for (const piece of ['This panel', 'The central server', 'The plugin']) {
      expect(screen.getByText(piece)).toBeInTheDocument();
    }
  });

  it('does not fetch the catalogue', async () => {
    // The landing page reads nothing. If it ever starts to, the stub has no
    // route for it and the page would render an error instead.
    const client = testClient(stubFetch(ANONYMOUS));
    renderWithAuth(<App />, client, '/');

    await screen.findByRole('heading', { level: 1, name: 'MCPluginManager' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('offers a way in to someone signed out', async () => {
    const client = testClient(stubFetch(ANONYMOUS));
    renderWithAuth(<App />, client, '/');

    const main = await screen.findByRole('main');
    expect(within(main).getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(within(main).getByRole('link', { name: 'Create an account' })).toBeInTheDocument();
    expect(within(main).getByRole('link', { name: 'Browse products' })).toBeInTheDocument();
  });

  it('offers the fleet instead once you are signed in', async () => {
    const client = testClient(
      stubFetch({
        'POST /api/v1/auth/refresh': { body: { access_token: 'a', expires_in: 900, token_type: 'Bearer' } },
        'GET /api/v1/me': { body: ALICE },
      }),
    );
    renderWithAuth(<App />, client, '/');

    const main = await screen.findByRole('main');
    expect(await within(main).findByRole('link', { name: 'Your servers' })).toBeInTheDocument();
    expect(within(main).queryByRole('link', { name: 'Create an account' })).not.toBeInTheDocument();
  });

  it('keeps the catalogue one click away, at its own address', async () => {
    const client = testClient(stubFetch(ANONYMOUS));
    renderWithAuth(<App />, client, '/');

    const main = await screen.findByRole('main');
    expect(within(main).getByRole('link', { name: 'Browse products' })).toHaveAttribute(
      'href',
      '/products',
    );
  });
});
