import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App.js';
import { renderWithAuth, stubFetch, testClient } from './helpers.js';

const ANONYMOUS = {
  'POST /api/v1/auth/refresh': { status: 401, body: { error: { code: 'x', message: 'no' } } },
};

const NO_DEMO = { ...ANONYMOUS, 'GET /api/v1/meta': { body: { demo_account: null } } };
const WITH_DEMO = {
  ...ANONYMOUS,
  'GET /api/v1/meta': {
    body: { demo_account: { email: 'demo@example.test', password: 'a-demo-password' } },
  },
};

describe('signing in', () => {
  it('shows nothing about a demo account when the server has none', async () => {
    const client = testClient(stubFetch(NO_DEMO));
    renderWithAuth(<App />, client, '/login');

    await screen.findByLabelText('Email');
    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument();
  });

  it('shows the credentials, and says the account is shared, when there is one', async () => {
    const client = testClient(stubFetch(WITH_DEMO));
    renderWithAuth(<App />, client, '/login');

    expect(await screen.findByText('demo@example.test')).toBeInTheDocument();
    expect(screen.getByText('a-demo-password')).toBeInTheDocument();
    expect(screen.getByText(/shared demo account/)).toBeInTheDocument();
  });

  it('fills the form from the demo account rather than making you retype it', async () => {
    const client = testClient(stubFetch(WITH_DEMO));
    renderWithAuth(<App />, client, '/login');

    await userEvent.click(await screen.findByRole('button', { name: 'Fill the form' }));

    expect(screen.getByLabelText('Email')).toHaveValue('demo@example.test');
    expect(screen.getByLabelText('Password')).toHaveValue('a-demo-password');
  });

  it('still offers registering, which the demo account does not replace', async () => {
    const client = testClient(stubFetch(WITH_DEMO));
    renderWithAuth(<App />, client, '/login');

    const main = await screen.findByRole('main');
    expect(within(main).getByRole('link', { name: 'Create one' })).toBeInTheDocument();
  });

  it('renders a working form even when /meta fails', async () => {
    // A missing convenience must not look like a broken sign-in page.
    const client = testClient(
      stubFetch({ ...ANONYMOUS, 'GET /api/v1/meta': { status: 500, body: { error: { code: 'x', message: 'boom' } } } }),
    );
    renderWithAuth(<App />, client, '/login');

    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();

    // And shows no error. This is the assertion that was missing the first time:
    // the form rendered, but the failed read also rendered an alert beside it.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows no error when the deployment simply has no demo account', async () => {
    const client = testClient(stubFetch(NO_DEMO));
    renderWithAuth(<App />, client, '/login');

    await screen.findByLabelText('Email');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('registering', () => {
  const fill = async (password: string, confirm: string) => {
    await userEvent.type(await screen.findByLabelText('Handle'), 'alice');
    await userEvent.type(screen.getByLabelText('Display name'), 'Alice');
    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com');
    await userEvent.type(screen.getByLabelText('Password'), password);
    await userEvent.type(screen.getByLabelText('Confirm password'), confirm);
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
  };

  it('refuses two passwords that do not match, without asking the server', async () => {
    let called = false;
    const client = testClient(
      stubFetch({
        ...ANONYMOUS,
        'POST /api/v1/auth/register': {
          status: 201,
          body: {},
          onCall: () => {
            called = true;
          },
        },
      }),
    );
    renderWithAuth(<App />, client, '/register');

    await fill('correct horse battery', 'correct horse batery');

    expect(await screen.findByRole('alert')).toHaveTextContent('Those passwords do not match.');
    // The point of checking here: a typo never becomes an account.
    expect(called).toBe(false);
  });

  it('registers when they match', async () => {
    let sent: unknown;
    const client = testClient(
      stubFetch({
        ...ANONYMOUS,
        'POST /api/v1/auth/register': {
          status: 201,
          body: { access_token: 'a', expires_in: 900, token_type: 'Bearer' },
          onCall: (_u, init) => (sent = init.body),
        },
        'GET /api/v1/me': { body: { id: '1', type: 'user', handle: 'alice', display_name: 'Alice', created_at: 'x' } },
      }),
    );
    renderWithAuth(<App />, client, '/register');

    await fill('correct horse battery', 'correct horse battery');

    expect(sent).toBeTypeOf('string');
    const body = JSON.parse(String(sent)) as Record<string, unknown>;
    expect(body.password).toBe('correct horse battery');
    // The confirmation is a panel-side guard, not a field the server knows.
    expect(body).not.toHaveProperty('confirmPassword');
  });
});
