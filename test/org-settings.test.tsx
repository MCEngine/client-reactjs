import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App.js';
import { renderWithAuth, stubFetch, testClient } from './helpers.js';

const ALICE = {
  id: '01ALICE',
  type: 'user' as const,
  handle: 'alice',
  display_name: 'Alice',
  created_at: '2026-01-01T00:00:00.000Z',
};

const ACME = {
  id: '01ACME',
  type: 'org' as const,
  handle: 'acme',
  display_name: 'Acme',
  created_at: '2026-02-01T00:00:00.000Z',
};

const SIGNED_IN = {
  'POST /api/v1/auth/refresh': { body: { access_token: 'a', expires_in: 900, token_type: 'Bearer' } },
  'GET /api/v1/me': { body: ALICE },
  'GET /api/v1/accounts/acme': { body: ACME },
  'GET /api/v1/orgs/acme/settings': {
    body: {
      membership_tier: 'free',
      storage_quota_bytes: 1024 * 1024 * 100,
      storage_used_bytes: 1024 * 1024,
      max_file_bytes: 1024 * 1024 * 10,
    },
  },
};

describe('the settings landing', () => {
  it('shows what the organization is and offers one page per subject', async () => {
    const client = testClient(stubFetch(SIGNED_IN));
    renderWithAuth(<App />, client, '/org/acme/settings');

    expect(await screen.findByRole('heading', { level: 1, name: 'Acme settings' })).toBeInTheDocument();
    expect(await screen.findByText(/on the free tier/)).toBeInTheDocument();

    const nav = within(screen.getByRole('navigation', { name: 'Organization settings' }));
    // Explicit accessible names: without them the card's title, description
    // and "Open →" run together into one string.
    // "Organization tokens" rather than "Tokens": the nav has one of those
    // already, pointing at the personal list.
    for (const name of ['General', 'Members', 'Organization tokens']) {
      expect(nav.getByRole('link', { name })).toBeInTheDocument();
    }
  });

  it('opens each subject at its own address', async () => {
    const client = testClient(
      stubFetch({
        ...SIGNED_IN,
        'GET /api/v1/orgs/acme/members': { body: { data: [], next_cursor: null } },
        'GET /api/v1/orgs/acme/tokens': { body: { data: [], next_cursor: null } },
      }),
    );

    renderWithAuth(<App />, client, '/org/acme/settings');
    await userEvent.click(await screen.findByRole('link', { name: 'Members' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Members' })).toBeInTheDocument();
  });
});

describe('the general page', () => {
  it('saves the profile against the account route', async () => {
    const onCall = vi.fn();
    const client = testClient(
      stubFetch({ ...SIGNED_IN, 'PATCH /api/v1/accounts/acme': { body: ACME, onCall } }),
    );

    renderWithAuth(<App />, client, '/org/acme/setting/general');

    const name = await screen.findByLabelText('Display name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Acme Inc');
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(onCall).toHaveBeenCalled();
    // An organization is an account, so it is the account route that renames
    // it — not a second one that would have to be kept in step.
    expect(JSON.parse(onCall.mock.calls[0]![1].body as string)).toEqual({
      displayName: 'Acme Inc',
      bio: null,
    });
  });
});

describe("an organization's tokens", () => {
  it('mints against the org collection, not the personal one', async () => {
    const onCall = vi.fn();
    const client = testClient(
      stubFetch({
        ...SIGNED_IN,
        'GET /api/v1/orgs/acme/tokens': { body: { data: [], next_cursor: null } },
        'POST /api/v1/orgs/acme/tokens': {
          status: 201,
          body: { id: 't1', name: 'ci', prefix: 'abcd1234', scopes: ['artifact:write'], created_at: ACME.created_at, token: 'mcpm_secret' },
          onCall,
        },
      }),
    );

    renderWithAuth(<App />, client, '/org/acme/setting/token');

    await userEvent.type(await screen.findByLabelText('Name'), 'ci');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Publish versions (CI)' }));
    await userEvent.click(screen.getByRole('button', { name: 'Create token' }));

    expect(onCall).toHaveBeenCalled();
    expect(onCall.mock.calls[0]![0]).toContain('/api/v1/orgs/acme/tokens');
    // Shown once, and it is the organization's rather than Alice's.
    expect(await screen.findByText('mcpm_secret')).toBeInTheDocument();
  });
});

describe('the address the members page used to have', () => {
  it('still opens the members page', async () => {
    const client = testClient(
      stubFetch({ ...SIGNED_IN, 'GET /api/v1/orgs/acme/members': { body: { data: [], next_cursor: null } } }),
    );

    renderWithAuth(<App />, client, '/org/acme/members');
    expect(await screen.findByRole('heading', { level: 1, name: 'Members' })).toBeInTheDocument();
  });
});
