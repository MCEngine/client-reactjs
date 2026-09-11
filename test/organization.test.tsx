import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
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

const SIGNED_IN = {
  'POST /api/v1/auth/refresh': { body: { access_token: 'a', expires_in: 900, token_type: 'Bearer' } },
  'GET /api/v1/me': { body: ALICE },
};

const ACME = {
  role: 'owner',
  joined_at: '2026-02-01T00:00:00.000Z',
  org: {
    id: '01ACME',
    type: 'org' as const,
    handle: 'acme',
    display_name: 'Acme',
    created_at: '2026-02-01T00:00:00.000Z',
  },
};

describe('the organization page', () => {
  it('lists what you are in, with the role you hold', async () => {
    const client = testClient(
      stubFetch({
        ...SIGNED_IN,
        'GET /api/v1/me/orgs': {
          body: {
            data: [ACME, { ...ACME, role: 'maintainer', org: { ...ACME.org, id: '01OTHER', handle: 'other', display_name: 'Other' } }],
            next_cursor: null,
          },
        },
      }),
    );

    renderWithAuth(<App />, client, '/org');

    expect(await screen.findByRole('link', { name: 'Acme settings' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Other settings' })).toBeInTheDocument();
    // The role is what decides whether the settings pages will let you do
    // anything, so it is on the card rather than a page deeper — and *inside*
    // it, because `.card-grid > li` is `display: contents` and anything beside
    // the card takes a grid cell of its own.
    const acme = screen.getByRole('link', { name: 'Acme settings' });
    expect(within(acme).getByText('owner')).toBeInTheDocument();
    expect(
      within(screen.getByRole('link', { name: 'Other settings' })).getByText('maintainer'),
    ).toBeInTheDocument();
  });

  it('says so plainly when you are in none, and still offers the form', async () => {
    const client = testClient(
      stubFetch({ ...SIGNED_IN, 'GET /api/v1/me/orgs': { body: { data: [], next_cursor: null } } }),
    );

    renderWithAuth(<App />, client, '/org');

    expect(await screen.findByText(/not in an organization yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create organization' })).toBeInTheDocument();
  });

  it('creates one and opens its settings', async () => {
    const onCall = vi.fn();
    const client = testClient(
      stubFetch({
        ...SIGNED_IN,
        'GET /api/v1/me/orgs': { body: { data: [], next_cursor: null } },
        'POST /api/v1/orgs': { status: 201, body: ACME.org, onCall },
        'GET /api/v1/accounts/acme': { body: ACME.org },
        'GET /api/v1/orgs/acme/settings': {
          body: {
            membership_tier: 'free',
            storage_quota_bytes: 1024,
            storage_used_bytes: 0,
            max_file_bytes: 512,
          },
        },
      }),
    );

    renderWithAuth(<App />, client, '/org');

    await userEvent.type(await screen.findByLabelText('Handle'), 'acme');
    await userEvent.type(screen.getByLabelText('Display name'), 'Acme');
    await userEvent.click(screen.getByRole('button', { name: 'Create organization' }));

    await waitFor(() => expect(onCall).toHaveBeenCalled());
    expect(JSON.parse(onCall.mock.calls[0]![1].body as string)).toEqual({
      handle: 'acme',
      displayName: 'Acme',
    });

    // Not back to the list: the next thing anyone does with a new organization
    // is invite somebody or mint a token for it.
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Acme settings' }),
    ).toBeInTheDocument();
  });

  it('keeps the old create address working', async () => {
    const client = testClient(
      stubFetch({ ...SIGNED_IN, 'GET /api/v1/me/orgs': { body: { data: [], next_cursor: null } } }),
    );

    // The landing page published /org/new before the form moved.
    renderWithAuth(<App />, client, '/org/new');
    expect(await screen.findByRole('heading', { level: 1, name: 'Organization' })).toBeInTheDocument();
  });
});
