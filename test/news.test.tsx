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

const ANONYMOUS = {
  'POST /api/v1/auth/refresh': {
    status: 401,
    body: { error: { code: 'no_refresh_token', message: 'none' } },
  },
};

const item = (n: number, over: Record<string, unknown> = {}) => ({
  id: `01NEWS${String(n).padStart(2, '0')}`,
  title: `Release ${n}`,
  summary: `What changed in ${n}.`,
  body: `# Release ${n}\n\nIt **shipped**.`,
  created_at: '2026-03-01T00:00:00.000Z',
  updated_at: '2026-03-01T00:00:00.000Z',
  hidden: false,
  author: ALICE,
  ...over,
});

describe('the news list', () => {
  it('asks for ten and loads the next ten on demand', async () => {
    const calls: string[] = [];
    const client = testClient(
      stubFetch({
        ...ANONYMOUS,
        'GET /api/v1/news': [
          {
            body: {
              data: Array.from({ length: 10 }, (_, i) => item(i + 1)),
              next_cursor: '01NEWS10',
            },
            onCall: (url) => calls.push(url),
          },
          {
            body: { data: [item(11)], next_cursor: null },
            onCall: (url) => calls.push(url),
          },
        ],
      }),
    );

    renderWithAuth(<App />, client, '/news');

    expect(await screen.findByRole('link', { name: 'Release 1' })).toBeInTheDocument();
    expect(new URL(calls[0]!).searchParams.get('limit')).toBe('10');

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByRole('link', { name: 'Release 11' })).toBeInTheDocument();
    // Keyset, not a page number: the second request carries the last id.
    expect(new URL(calls[1]!).searchParams.get('cursor')).toBe('01NEWS10');
    // And nothing asks for more once the page came back short.
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument(),
    );
  });

  it('says so plainly when nothing is published', async () => {
    const client = testClient(
      stubFetch({ ...ANONYMOUS, 'GET /api/v1/news': { body: { data: [], next_cursor: null } } }),
    );
    renderWithAuth(<App />, client, '/news');
    expect(await screen.findByText(/Nothing has been published yet/)).toBeInTheDocument();
  });

  it('offers writing only to a signed-in person', async () => {
    const anonymous = testClient(
      stubFetch({ ...ANONYMOUS, 'GET /api/v1/news': { body: { data: [], next_cursor: null } } }),
    );
    const { unmount } = renderWithAuth(<App />, anonymous, '/news');
    await screen.findByText(/Nothing has been published yet/);
    expect(screen.queryByRole('link', { name: 'Write a news item' })).not.toBeInTheDocument();
    unmount();

    const signedIn = testClient(
      stubFetch({ ...SIGNED_IN, 'GET /api/v1/news': { body: { data: [], next_cursor: null } } }),
    );
    renderWithAuth(<App />, signedIn, '/news');
    expect(await screen.findByRole('link', { name: 'Write a news item' })).toBeInTheDocument();
  });
});

describe('a news item', () => {
  it('renders its Markdown, needing no account', async () => {
    const client = testClient(
      stubFetch({ ...ANONYMOUS, 'GET /api/v1/news/01NEWS01': { body: item(1) } }),
    );

    renderWithAuth(<App />, client, '/news/01NEWS01');

    expect(await screen.findByRole('heading', { level: 1, name: 'Release 1' })).toBeInTheDocument();
    // The body's own `#` heading lands one level down, under the page's title.
    expect(screen.getByRole('heading', { level: 2, name: 'Release 1' })).toBeInTheDocument();
    expect(screen.getByText('shipped').tagName).toBe('STRONG');
  });

  it('says when it is hidden', async () => {
    const client = testClient(
      stubFetch({
        ...SIGNED_IN,
        'GET /api/v1/news/01NEWS01': { body: item(1, { hidden: true, hidden_at: '2026-03-02T00:00:00.000Z' }) },
      }),
    );
    renderWithAuth(<App />, client, '/news/01NEWS01');
    expect(await screen.findByText(/This item is hidden/)).toBeInTheDocument();
  });
});

describe('writing and editing', () => {
  it('sends the Markdown as typed, and previews it with the reader’s renderer', async () => {
    const onCall = vi.fn();
    const client = testClient(
      stubFetch({
        ...SIGNED_IN,
        'POST /api/v1/news': { status: 201, body: item(1), onCall },
        'GET /api/v1/news/01NEWS01': { body: item(1) },
      }),
    );

    renderWithAuth(<App />, client, '/news/create');

    await userEvent.type(await screen.findByLabelText('Title'), 'Release 1');
    await userEvent.type(screen.getByLabelText('Summary'), 'What changed in 1.');
    await userEvent.type(screen.getByLabelText('Body'), '# Heading');

    await userEvent.click(screen.getByRole('button', { name: 'Show preview' }));
    const preview = screen.getByRole('region', { name: 'Preview' });
    expect(within(preview).getByRole('heading', { level: 2, name: 'Heading' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
    await waitFor(() => expect(onCall).toHaveBeenCalled());
    expect(JSON.parse(onCall.mock.calls[0]![1].body as string)).toEqual({
      title: 'Release 1',
      summary: 'What changed in 1.',
      body: '# Heading',
    });
  });

  it('loads what is there before editing it', async () => {
    const onCall = vi.fn();
    const client = testClient(
      stubFetch({
        ...SIGNED_IN,
        'GET /api/v1/news/01NEWS01': { body: item(1) },
        'PATCH /api/v1/news/01NEWS01': { body: item(1), onCall },
      }),
    );

    renderWithAuth(<App />, client, '/news/edit/01NEWS01');

    const title = await screen.findByLabelText('Title');
    expect(title).toHaveValue('Release 1');
    await userEvent.clear(title);
    await userEvent.type(title, 'Release 1, corrected');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onCall).toHaveBeenCalled());
    expect(JSON.parse(onCall.mock.calls[0]![1].body as string).title).toBe('Release 1, corrected');
  });
});

describe('the settings page', () => {
  it('hides only after the dialog is confirmed, and can be cancelled', async () => {
    const onCall = vi.fn();
    const client = testClient(
      stubFetch({
        ...SIGNED_IN,
        'GET /api/v1/news/01NEWS01': { body: item(1) },
        'PATCH /api/v1/news/01NEWS01': { body: item(1, { hidden: true }), onCall },
      }),
    );

    renderWithAuth(<App />, client, '/news/01NEWS01/settings');

    await userEvent.click(await screen.findByRole('button', { name: 'Hide it' }));
    const dialog = screen.getByRole('dialog', { name: 'Hide it' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(onCall).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Hide it' }));
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Hide it' })).getByRole('button', { name: 'Hide it' }),
    );

    await waitFor(() => expect(onCall).toHaveBeenCalled());
    expect(JSON.parse(onCall.mock.calls[0]![1].body as string)).toEqual({ hidden: true });
  });

  it('deletes only after the dialog is confirmed', async () => {
    const onCall = vi.fn();
    const client = testClient(
      stubFetch({
        ...SIGNED_IN,
        'GET /api/v1/news/01NEWS01': { body: item(1) },
        'DELETE /api/v1/news/01NEWS01': { status: 204, onCall },
        'GET /api/v1/news': { body: { data: [], next_cursor: null } },
      }),
    );

    renderWithAuth(<App />, client, '/news/01NEWS01/settings');

    await userEvent.click(await screen.findByRole('button', { name: 'Delete this item' }));
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Delete this item' })).getByRole('button', {
        name: 'Delete permanently',
      }),
    );

    await waitFor(() => expect(onCall).toHaveBeenCalled());
    // Back to the list, because the page it was on no longer exists.
    expect(await screen.findByRole('heading', { level: 1, name: 'News' })).toBeInTheDocument();
  });
});
