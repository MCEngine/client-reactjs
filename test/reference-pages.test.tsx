import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { App } from '../src/App.js';
import { renderWithAuth, stubFetch, testClient } from './helpers.js';

const ANONYMOUS = {
  'POST /api/v1/auth/refresh': {
    status: 401,
    body: { error: { code: 'no_refresh_token', message: 'none' } },
  },
};

const anonymous = () => testClient(stubFetch(ANONYMOUS));

describe('the CI/CD page', () => {
  it('carries a file for both forges, needing no account', async () => {
    renderWithAuth(<App />, anonymous(), '/ci-cd');

    const github = await screen.findByRole('region', { name: 'GitHub Actions' });
    const gitlab = screen.getByRole('region', { name: 'GitLab CI' });

    // The thing a person wants from this page is a file they can commit, so
    // each one is written out whole rather than described.
    expect(within(github).getByText(/actions\/setup-java@v4/)).toBeInTheDocument();
    expect(within(gitlab).getByText(/if: \$CI_COMMIT_TAG/)).toBeInTheDocument();

    for (const region of [github, gitlab]) {
      const text = region.textContent ?? '';
      // The real route, with the version in the path where the server wants it.
      expect(text).toContain('/api/v1/products/${PLUGIN_ID}/versions/${VERSION}');
      expect(text).toContain('Authorization: Bearer ${USER_TOKEN}');
      expect(text).toContain('-F "file=@${JAR}"');
      // A rejected publish has to fail the job and say why.
      expect(text).toContain('--fail-with-body');
    }
  });

  it('says the variable names are the developer’s to choose', async () => {
    renderWithAuth(<App />, anonymous(), '/ci-cd');
    expect(await screen.findByText(/The names are yours/)).toBeInTheDocument();
    expect(screen.getByText(/MY_THING_ID/)).toBeInTheDocument();
  });

  it('points the snippet at this deployment, so a copy works as it is', async () => {
    renderWithAuth(<App />, anonymous(), '/ci-cd');
    const github = await screen.findByRole('region', { name: 'GitHub Actions' });
    expect(github.textContent).toContain(`${window.location.origin}/api/v1/products/`);
  });
});

describe('the policy page', () => {
  it('needs no account and says whose policy it is', async () => {
    renderWithAuth(<App />, anonymous(), '/policy');

    expect(await screen.findByRole('heading', { level: 1, name: 'Policy' })).toBeInTheDocument();
    // A policy that claimed to be more than the operator's would be a promise
    // this software cannot keep.
    expect(screen.getByText(/policy of/)).toBeInTheDocument();
    expect(screen.getByText(/not legal advice/)).toBeInTheDocument();
  });

  it('is linked from the footer, where a policy link is looked for', async () => {
    const { container } = renderWithAuth(<App />, anonymous(), '/');
    await screen.findByRole('heading', { level: 1 });
    const footer = container.querySelector('.site-footer');
    expect(within(footer as HTMLElement).getByRole('link', { name: 'Policy' })).toBeInTheDocument();
  });
});
