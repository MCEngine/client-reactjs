import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App.js';
import { renderWithAuth, stubFetch, testClient, type StubRoute } from './helpers.js';
import type { Product } from '../src/api/types.js';

const ALICE = {
  id: '01ABC',
  type: 'user' as const,
  handle: 'alice',
  display_name: 'Alice',
  created_at: '2026-01-01T00:00:00.000Z',
};

const ACME = {
  id: '01ORG',
  type: 'org' as const,
  handle: 'acme',
  display_name: 'Acme',
  created_at: '2026-01-01T00:00:00.000Z',
};

const PRODUCT: Product = {
  id: '01PROD',
  slug: 'acme-tools',
  name: 'Acme Tools',
  summary: 'Tools for servers.',
  kind: 'bukkit_plugin' as const,
  visibility: 'public' as const,
  owner_org_id: '01ORG',
  downloads_count: 42,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const SIGNED_IN: Record<string, StubRoute | StubRoute[]> = {
  'POST /api/v1/auth/refresh': { body: { access_token: 'a', expires_in: 900, token_type: 'Bearer' } },
  'GET /api/v1/me': { body: ALICE },
};

const VERSIONS = {
  data: [
    {
      version: '1.10.0',
      channel: 'release',
      is_latest: true,
      published_at: '2026-02-01T00:00:00.000Z',
      compatibility: [{ platform: 'paper', minecraft_version: '1.21.11' }],
      changelog: 'Fixed a thing.',
      file: { name: 'AcmeTools-1.10.0.jar', size_bytes: 2_097_152, sha256: 'a'.repeat(64) },
    },
    {
      version: '1.9.0',
      channel: 'release',
      is_latest: false,
      published_at: '2026-01-15T00:00:00.000Z',
      compatibility: [],
      file: { name: 'AcmeTools-1.9.0.jar', size_bytes: 2_000_000, sha256: 'b'.repeat(64) },
    },
  ],
  next_cursor: null,
};

describe('/product/:product_id/', () => {
  const base = (product: Product = PRODUCT) => ({
    'POST /api/v1/auth/refresh': { status: 401, body: { error: { code: 'x', message: 'no' } } },
    'GET /api/v1/products/acme-tools': { body: product },
    'GET /api/v1/products/acme-tools/versions': { body: VERSIONS },
    'GET /api/v1/accounts/01ORG': { body: ACME },
  });

  it('shows the id, name, detail and the publishing organization', async () => {
    const client = testClient(
      stubFetch({ ...base({ ...PRODUCT, description: 'A longer description.' }) }),
    );
    renderWithAuth(<App />, client, '/product/acme-tools');

    expect(await screen.findByRole('heading', { name: 'Acme Tools' })).toBeInTheDocument();
    expect(screen.getByText('acme-tools')).toBeInTheDocument();
    expect(screen.getByText(/Tools for servers/)).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Acme' })).toBeInTheDocument();
    expect(screen.getByText('A longer description.')).toBeInTheDocument();
  });

  it('shows no source link at all when repo_url is unset', async () => {
    const client = testClient(stubFetch(base()));
    renderWithAuth(<App />, client, '/product/acme-tools');

    await screen.findByRole('heading', { name: 'Acme Tools' });
    expect(screen.queryByText('Source')).not.toBeInTheDocument();
  });

  it('shows the source link when repo_url is set', async () => {
    const client = testClient(
      stubFetch(base({ ...PRODUCT, repo_url: 'https://github.com/acme/tools' })),
    );
    renderWithAuth(<App />, client, '/product/acme-tools');

    expect(
      await screen.findByRole('link', { name: 'https://github.com/acme/tools' }),
    ).toBeInTheDocument();
  });

  it('offers versions newest first, and selects the latest on arrival', async () => {
    const client = testClient(stubFetch(base()));
    renderWithAuth(<App />, client, '/product/acme-tools');

    const select = await screen.findByLabelText('Version');

    // 1.10.0 above 1.9.0: the server orders by the normalized form, and the
    // panel does not re-sort. The options keep the order they arrived in.
    expect(
      within(select).getAllByRole('option').map((option) => option.textContent),
    ).toEqual(['1.10.0 (latest) — release', '1.9.0 — release']);

    // The latest is what a person almost always wants, so it is chosen already
    // rather than being whichever row happens to be first.
    expect(select).toHaveValue('1.10.0');
    expect(screen.getByText('a'.repeat(64))).toBeInTheDocument();

    // The point of the picker: the versions that were not chosen are not on the
    // page at all. Without this the list could still be rendered below and
    // nothing would fail.
    expect(screen.queryByText('b'.repeat(64))).not.toBeInTheDocument();
    expect(screen.getByText(/2 versions published/)).toBeInTheDocument();
  });

  it('swaps the detail when another version is picked', async () => {
    const client = testClient(stubFetch(base()));
    renderWithAuth(<App />, client, '/product/acme-tools');

    const select = await screen.findByLabelText('Version');
    await userEvent.selectOptions(select, '1.9.0');

    expect(screen.getByText('b'.repeat(64))).toBeInTheDocument();
    expect(screen.queryByText('a'.repeat(64))).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Download AcmeTools-1\.9\.0\.jar/ }),
    ).toBeInTheDocument();

    // The badge follows the selection rather than the arrival state.
    expect(screen.queryByText('latest')).not.toBeInTheDocument();
  });

  it('renders the description as text, never as markup', async () => {
    const client = testClient(
      stubFetch(base({ ...PRODUCT, description: '<img src=x onerror="alert(1)">' })),
    );
    renderWithAuth(<App />, client, '/product/acme-tools');

    await screen.findByRole('heading', { name: 'Acme Tools' });
    // A publisher writes this and everyone reads it, so it is text.
    expect(screen.getByText('<img src=x onerror="alert(1)">')).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });
});

describe('/product/:product_id/settings/', () => {
  it('links to both settings pages', async () => {
    const client = testClient(
      stubFetch({ ...SIGNED_IN, 'GET /api/v1/products/acme-tools': { body: PRODUCT } }),
    );
    renderWithAuth(<App />, client, '/product/acme-tools/settings');

    expect(await screen.findByRole('link', { name: 'Publish a version' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'General' })).toBeInTheDocument();
  });

  it('sends an anonymous visitor to sign in', async () => {
    const client = testClient(
      stubFetch({
        'POST /api/v1/auth/refresh': { status: 401, body: { error: { code: 'x', message: 'no' } } },
      }),
    );
    renderWithAuth(<App />, client, '/product/acme-tools/settings');
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });
});

describe('/product/:product_id/setting/update/', () => {
  const base = {
    ...SIGNED_IN,
    'GET /api/v1/products/acme-tools': { body: PRODUCT },
    'GET /api/v1/accounts/01ORG': { body: ACME },
    'GET /api/v1/orgs/acme/settings': {
      body: {
        membership_tier: 'free',
        storage_quota_bytes: 1_073_741_824,
        storage_used_bytes: 5_242_880,
        max_file_bytes: 33_554_432,
      },
    },
  };

  it('publishes to the version’s own URL, with the version out of the body', async () => {
    let sentBody: unknown;
    const client = testClient(
      stubFetch({
        ...base,
        'PUT /api/v1/products/01PROD/versions/1.11.0': {
          status: 201,
          body: { version: '1.11.0', channel: 'release', is_latest: true, published_at: null, compatibility: [] },
          onCall: (_u, init) => (sentBody = init.body),
        },
      }),
    );

    renderWithAuth(<App />, client, '/product/acme-tools/setting/update');

    await userEvent.type(await screen.findByLabelText('Version'), '1.11.0');
    await userEvent.type(screen.getByLabelText('Minecraft version'), '1.21.11');
    await userEvent.upload(
      screen.getByLabelText('Jar'),
      new File([new Uint8Array([0x50, 0x4b, 3, 4])], 'AcmeTools-1.11.0.jar', {
        type: 'application/java-archive',
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));

    await waitFor(() => expect(sentBody).toBeInstanceOf(FormData));
    const form = sentBody as FormData;

    // The stub keys on the exact URL, so reaching this line at all is the
    // assertion that the version went into the path. It must not also be in the
    // body: the server refuses that outright, rather than ignoring it.
    expect(form.get('version')).toBeNull();
    expect(JSON.parse(String(form.get('compatibility')))).toEqual([
      { platform: 'paper', minecraftVersion: '1.21.11' },
    ]);
    expect(form.get('file')).toBeInstanceOf(File);
  });

  it('names the missing version rather than requesting /versions/', async () => {
    // `required` is satisfied by whitespace, which trims to nothing — and an
    // empty path segment would request /versions/ and come back as a 404 that
    // says nothing about what the person got wrong.
    const client = testClient(stubFetch(base));
    renderWithAuth(<App />, client, '/product/acme-tools/setting/update');

    await userEvent.type(await screen.findByLabelText('Version'), '   ');
    await userEvent.upload(
      screen.getByLabelText('Jar'),
      new File([new Uint8Array([0x50, 0x4b, 3, 4])], 'AcmeTools.jar', {
        type: 'application/java-archive',
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a version');
  });

  it('offers exactly one file input, because a version carries one jar', async () => {
    const client = testClient(stubFetch(base));
    renderWithAuth(<App />, client, '/product/acme-tools/setting/update');
    await screen.findByLabelText('Jar');

    expect(document.querySelectorAll('input[type="file"]')).toHaveLength(1);
    expect(screen.getByText(/publish them as two products/)).toBeInTheDocument();
  });

  it('shows the remaining quota before anything is chosen', async () => {
    const client = testClient(stubFetch(base));
    renderWithAuth(<App />, client, '/product/acme-tools/setting/update');
    expect(await screen.findByText(/1019 MB of quota left/)).toBeInTheDocument();
  });

  it('shows the server’s refusal when the jar is wrong', async () => {
    const client = testClient(
      stubFetch({
        ...base,
        'PUT /api/v1/products/01PROD/versions/1.11.0': {
          status: 422,
          body: {
            error: {
              code: 'wrong_artifact_kind',
              message: 'A bukkit plugin must contain one of: plugin.yml, paper-plugin.yml.',
            },
          },
        },
      }),
    );

    renderWithAuth(<App />, client, '/product/acme-tools/setting/update');

    await userEvent.type(await screen.findByLabelText('Version'), '1.11.0');
    await userEvent.upload(
      screen.getByLabelText('Jar'),
      new File(['not a jar'], 'x.jar', { type: 'application/java-archive' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('must contain one of: plugin.yml');
  });
});

describe('/product/:product_id/setting/general/', () => {
  const base = { ...SIGNED_IN, 'GET /api/v1/products/acme-tools': { body: PRODUCT } };

  it('renders the cooldown date the server gave', async () => {
    const client = testClient(
      stubFetch({
        ...base,
        'PUT /api/v1/products/01PROD/slug': {
          status: 409,
          body: {
            error: {
              code: 'product_slug_cooldown',
              message: 'Changed 12 days ago.',
              details: { available_at: '2026-03-01T00:00:00.000Z' },
            },
          },
        },
      }),
    );

    renderWithAuth(<App />, client, '/product/acme-tools/setting/general');
    await screen.findByRole('heading', { name: 'Product id' });

    await userEvent.clear(screen.getByLabelText('New id'));
    await userEvent.type(screen.getByLabelText('New id'), 'acme-kit');
    await userEvent.click(screen.getByRole('button', { name: 'Change id' }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.some((a) => a.textContent?.includes('2026'))).toBe(true);
  });

  it('offers cancel and confirm, and deletes only after the id is typed', async () => {
    const onCall = vi.fn();
    const client = testClient(
      stubFetch({ ...base, 'DELETE /api/v1/products/01PROD': { status: 204, onCall } }),
    );

    renderWithAuth(<App />, client, '/product/acme-tools/setting/general');
    await screen.findByRole('heading', { name: 'Delete this product' });

    await userEvent.click(screen.getByRole('button', { name: 'Delete this product' }));
    expect(onCall).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    const dialog = screen.getByRole('group', { name: 'Delete this product' });
    const confirm = within(dialog).getByRole('button', { name: 'Delete permanently' });
    expect(confirm).toBeDisabled();

    await userEvent.type(within(dialog).getByRole('textbox'), 'acme-tools');
    expect(confirm).toBeEnabled();

    await userEvent.click(confirm);
    await waitFor(() => expect(onCall).toHaveBeenCalledTimes(1));
  });

  it('repeats the id in the delete body, matching what the server requires', async () => {
    let sent: unknown;
    const client = testClient(
      stubFetch({
        ...base,
        'DELETE /api/v1/products/01PROD': {
          status: 204,
          onCall: (_u, init) => (sent = JSON.parse(String(init.body))),
        },
      }),
    );

    renderWithAuth(<App />, client, '/product/acme-tools/setting/general');
    await screen.findByRole('heading', { name: 'Delete this product' });

    await userEvent.click(screen.getByRole('button', { name: 'Delete this product' }));
    const dialog = screen.getByRole('group', { name: 'Delete this product' });
    await userEvent.type(within(dialog).getByRole('textbox'), 'acme-tools');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete permanently' }));

    // Otherwise a confirmed dialog is answered with "confirmation mismatch".
    await waitFor(() => expect(sent).toEqual({ slug: 'acme-tools' }));
  });

  it('clears the source repository to null rather than to an empty string', async () => {
    let sent: Record<string, unknown> | undefined;
    const client = testClient(
      stubFetch({
        ...base,
        'GET /api/v1/products/acme-tools': {
          body: { ...PRODUCT, repo_url: 'https://github.com/acme/tools' },
        },
        'PATCH /api/v1/products/01PROD': {
          body: PRODUCT,
          onCall: (_u, init) => (sent = JSON.parse(String(init.body)) as Record<string, unknown>),
        },
      }),
    );

    renderWithAuth(<App />, client, '/product/acme-tools/setting/general');
    await screen.findByRole('heading', { name: 'Details' });

    await userEvent.clear(screen.getByLabelText('Source repository'));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    // "" is set, and the product page shows the link whenever it is set.
    await waitFor(() => expect(sent?.['repoUrl']).toBeNull());
  });
});
