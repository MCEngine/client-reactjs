import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App.js';
import { renderWithAuth, stubFetch, testClient, type StubRoute } from './helpers.js';

const ALICE = {
  id: '01ABC',
  type: 'user' as const,
  handle: 'alice',
  display_name: 'Alice',
  created_at: '2026-01-01T00:00:00.000Z',
};

const SIGNED_IN: Record<string, StubRoute | StubRoute[]> = {
  'POST /api/v1/auth/refresh': { body: { access_token: 'a', expires_in: 900, token_type: 'Bearer' } },
  'GET /api/v1/me': { body: ALICE },
};

const ANONYMOUS: Record<string, StubRoute | StubRoute[]> = {
  'POST /api/v1/auth/refresh': { status: 401, body: { error: { code: 'x', message: 'no' } } },
};

describe('the sign-in gate', () => {
  it('redirects an anonymous visitor away from a settings page', async () => {
    const client = testClient(stubFetch(ANONYMOUS));
    renderWithAuth(<App />, client, '/settings/tokens');
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('lets a signed-in person through', async () => {
    const client = testClient(
      stubFetch({ ...SIGNED_IN, 'GET /api/v1/tokens': { body: { data: [], next_cursor: null } } }),
    );
    renderWithAuth(<App />, client, '/settings/tokens');
    expect(await screen.findByRole('heading', { name: 'API tokens' })).toBeInTheDocument();
  });
});

describe('signing in', () => {
  it('sends the credentials and the device label', async () => {
    let sent: unknown;
    const client = testClient(
      stubFetch({
        ...ANONYMOUS,
        'POST /api/v1/auth/login': {
          body: { access_token: 'a', expires_in: 900, token_type: 'Bearer' },
          onCall: (_u, init) => (sent = JSON.parse(String(init.body))),
        },
        'GET /api/v1/me': { body: ALICE },
        'GET /api/v1/products': { body: { data: [], next_cursor: null } },
      }),
    );

    renderWithAuth(<App />, client, '/login');
    await screen.findByRole('heading', { name: 'Sign in' });

    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'a long enough passphrase');
    await userEvent.type(screen.getByLabelText('Name this device'), 'laptop');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(sent).toEqual({
        email: 'alice@example.com',
        password: 'a long enough passphrase',
        deviceLabel: 'laptop',
      });
    });
  });

  it('shows the server’s message when the credentials are wrong', async () => {
    const client = testClient(
      stubFetch({
        ...ANONYMOUS,
        'POST /api/v1/auth/login': {
          status: 401,
          body: {
            error: { code: 'invalid_credentials', message: 'That email address or password is wrong.' },
          },
        },
      }),
    );

    renderWithAuth(<App />, client, '/login');
    await screen.findByRole('heading', { name: 'Sign in' });

    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That email address or password is wrong.',
    );
  });
});

describe('the handle cooldown', () => {
  it('renders the date the server gave rather than recomputing the rule', async () => {
    const client = testClient(
      stubFetch({
        ...SIGNED_IN,
        'GET /api/v1/me/emails': { body: { data: [], next_cursor: null } },
        'PUT /api/v1/accounts/alice/handle': {
          status: 409,
          body: {
            error: {
              code: 'handle_cooldown',
              message: 'This handle was changed 12 days ago.',
              details: { available_at: '2026-02-15T00:00:00.000Z' },
            },
          },
        },
      }),
    );

    renderWithAuth(<App />, client, '/settings/account');
    await screen.findByRole('heading', { name: 'Handle' });

    await userEvent.clear(screen.getByLabelText('New handle'));
    await userEvent.type(screen.getByLabelText('New handle'), 'alicia');
    await userEvent.click(screen.getByRole('button', { name: 'Change handle' }));

    // The panel does not know what thirty days means; it renders what the
    // server said, so the two cannot disagree.
    const notices = await screen.findAllByRole('alert');
    expect(notices.some((n) => n.textContent?.includes('2026'))).toBe(true);
  });
});

describe('email addresses', () => {
  it('disables "make primary" for an unverified address and says why', async () => {
    const client = testClient(
      stubFetch({
        ...SIGNED_IN,
        'GET /api/v1/me/emails': {
          body: {
            data: [
              { id: 'e1', email: 'alice@example.com', is_primary: true, verified: true },
              { id: 'e2', email: 'new@example.com', is_primary: false, verified: false },
            ],
            next_cursor: null,
          },
        },
      }),
    );

    renderWithAuth(<App />, client, '/settings/account');
    const button = await screen.findByRole('button', { name: 'Make primary' });

    // The server refuses it anyway. This renders the reason rather than being
    // the check.
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Verify this address first.');
  });
});

describe('tokens', () => {
  it('shows a minted token once and never lists it afterwards', async () => {
    const client = testClient(
      stubFetch({
        ...SIGNED_IN,
        'GET /api/v1/tokens': [
          { body: { data: [], next_cursor: null } },
          {
            body: {
              data: [
                {
                  id: 't1',
                  name: 'ci',
                  prefix: 'abcd1234',
                  scopes: ['artifact:write'],
                  created_at: '2026-01-01T00:00:00.000Z',
                },
              ],
              next_cursor: null,
            },
          },
        ],
        'POST /api/v1/tokens': {
          status: 201,
          body: {
            id: 't1',
            name: 'ci',
            prefix: 'abcd1234',
            scopes: ['artifact:write'],
            created_at: '2026-01-01T00:00:00.000Z',
            token: 'mcpm_abcd1234SECRETVALUE',
          },
        },
      }),
    );

    renderWithAuth(<App />, client, '/settings/tokens');
    await screen.findByRole('heading', { name: 'API tokens' });

    await userEvent.type(screen.getByLabelText('Name'), 'ci');
    await userEvent.click(screen.getByLabelText('Publish versions (CI)'));
    await userEvent.click(screen.getByRole('button', { name: 'Create token' }));

    expect(await screen.findByText('mcpm_abcd1234SECRETVALUE')).toBeInTheDocument();

    // Dismissing it removes the only copy the panel ever had.
    await userEvent.click(screen.getByRole('button', { name: 'I have copied it' }));
    await waitFor(() => {
      expect(screen.queryByText('mcpm_abcd1234SECRETVALUE')).not.toBeInTheDocument();
    });
  });

  it('revokes only after a confirm', async () => {
    const onCall = vi.fn();
    const client = testClient(
      stubFetch({
        ...SIGNED_IN,
        'GET /api/v1/tokens': {
          body: {
            data: [
              {
                id: 't1',
                name: 'ci',
                prefix: 'abcd1234',
                scopes: ['artifact:write'],
                created_at: '2026-01-01T00:00:00.000Z',
              },
            ],
            next_cursor: null,
          },
        },
        'DELETE /api/v1/tokens/t1': { status: 204, onCall },
      }),
    );

    renderWithAuth(<App />, client, '/settings/tokens');
    await screen.findByText('ci');

    // The trigger and the confirm are both labelled "Revoke", so the confirm
    // is queried inside the group the component opens.
    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(onCall).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCall).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    const dialog = screen.getByRole('group', { name: 'Revoke' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Revoke' }));
    await waitFor(() => expect(onCall).toHaveBeenCalledTimes(1));
  });
});

describe('the fleet', () => {
  it('shows the server key once, on registration', async () => {
    const client = testClient(
      stubFetch({
        ...SIGNED_IN,
        'GET /api/v1/fleet/servers': [
          { body: { data: [], next_cursor: null } },
          {
            body: {
              data: [{ id: 's1', name: 'survival', created_at: '2026-01-01T00:00:00.000Z' }],
              next_cursor: null,
            },
          },
        ],
        'POST /api/v1/fleet/servers': {
          status: 201,
          body: {
            id: 's1',
            name: 'survival',
            created_at: '2026-01-01T00:00:00.000Z',
            server_key: '01SERVERKEYVALUE0000000000',
          },
        },
      }),
    );

    renderWithAuth(<App />, client, '/fleet');
    await screen.findByRole('heading', { name: 'Your servers' });

    await userEvent.type(screen.getByLabelText('Name'), 'survival');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('01SERVERKEYVALUE0000000000')).toBeInTheDocument();
    expect(screen.getByText(/config\.yml/)).toBeInTheDocument();
  });

  it('shows drift between what is installed and what should be', async () => {
    const client = testClient(
      stubFetch({
        ...SIGNED_IN,
        'GET /api/v1/fleet/servers/s1': {
          body: {
            id: 's1',
            name: 'survival',
            created_at: '2026-01-01T00:00:00.000Z',
            platform: 'paper',
            mc_version: '1.21.11',
            plugins: [
              {
                plugin_id: 'Essentials',
                state: 'pending_update',
                installed_version: '2.19.0',
                desired_version: '2.20.1',
                drifted: true,
              },
            ],
          },
        },
      }),
    );

    renderWithAuth(<App />, client, '/fleet/s1');
    expect(await screen.findByRole('rowheader', { name: 'Essentials' })).toBeInTheDocument();
    expect(screen.getByText('2.19.0')).toBeInTheDocument();
    expect(screen.getByText('2.20.1')).toBeInTheDocument();
    expect(screen.getByText(/drifted/)).toBeInTheDocument();
  });
});

describe('organizations', () => {
  it('does not offer owner as an invitable role', async () => {
    const client = testClient(
      stubFetch({
        ...SIGNED_IN,
        'GET /api/v1/orgs/acme/members': {
          body: {
            data: [{ role: 'owner', joined_at: '2026-01-01T00:00:00.000Z', user: ALICE }],
            next_cursor: null,
          },
        },
        'GET /api/v1/orgs/acme/settings': {
          body: {
            membership_tier: 'free',
            storage_quota_bytes: 1073741824,
            storage_used_bytes: 5242880,
            max_file_bytes: 33554432,
          },
        },
      }),
    );

    renderWithAuth(<App />, client, '/org/acme/members');
    await screen.findByRole('heading', { name: 'Invite someone' });

    const options = screen.getAllByRole('option').map((o) => o.textContent);
    // Ownership moves by transfer, and the form says so rather than letting
    // someone try and be refused.
    expect(options).not.toContain('owner');
    expect(screen.getByText(/exactly one, and it moves by transfer/)).toBeInTheDocument();
  });

  it('shows storage usage against the quota', async () => {
    const client = testClient(
      stubFetch({
        ...SIGNED_IN,
        'GET /api/v1/orgs/acme/members': { body: { data: [], next_cursor: null } },
        'GET /api/v1/orgs/acme/settings': {
          body: {
            membership_tier: 'free',
            storage_quota_bytes: 1073741824,
            storage_used_bytes: 5242880,
            max_file_bytes: 33554432,
          },
        },
      }),
    );

    renderWithAuth(<App />, client, '/org/acme/members');
    expect(await screen.findByText(/5.0 MB of 1.0 GB used on the free tier/)).toBeInTheDocument();
  });
});
