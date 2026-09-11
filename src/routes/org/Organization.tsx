import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../../components/Async.js';
import { Field, Form } from '../../components/Form.js';
import type { Account, OrgMembership, Page } from '../../api/types.js';

/**
 * `/org` — the organizations you are in, and the form that makes another.
 *
 * Both on one page because an organization is not a thing most people have
 * many of: a list with nothing in it and a create page one click away is two
 * pages to say what one says.
 */
export function Organization() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const memberships = useAsync(
    () => api.request<Page<OrgMembership>>('/api/v1/me/orgs'),
    [api],
  );

  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');

  return (
    <main className="container">
      <p className="eyebrow">Publishing</p>
      <h1>Organization</h1>
      <p className="lead">
        Only an organization publishes a product. These are the ones you belong to, with the
        role you hold in each.
      </p>

      <AsyncBoundary
        state={memberships}
        isEmpty={(page) => page.data.length === 0}
        empty={
          <p className="muted">
            You are not in an organization yet. Create one below and you become its owner.
          </p>
        }
      >
        {(page) => (
          <ul className="card-grid">
            {page.data.map((membership) => (
              <li key={membership.org.id}>
                {/*
                  Everything about one organization is inside the card, and that
                  is structural rather than cosmetic: `.card-grid > li` is
                  `display: contents`, so every child of the li becomes a grid
                  item. The role sat outside the card and took a cell of its own.
                */}
                <Link
                  className="card"
                  to={`/org/${membership.org.handle}/settings`}
                  // Without this the accessible name runs the name, the handle,
                  // the role and "Open" together into one string.
                  aria-label={`${membership.org.display_name} settings`}
                >
                  <span className="card__title">{membership.org.display_name}</span>
                  <span className="card__desc">
                    <code>{membership.org.handle}</code>
                  </span>
                  {/* Wrapped, so the badge sizes to its text rather than
                      stretching across the card as a flex item would. */}
                  <span>
                    <span className="badge badge--accent">{membership.role}</span>
                  </span>
                  <span className="card__more">Open →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AsyncBoundary>

      <section className="panel" aria-labelledby="create-heading">
        <h2 id="create-heading">Create an organization</h2>
        <p>
          You become its owner, and an organization has exactly one — ownership moves by
          transfer, never by invitation.
        </p>
        <Form
          submitLabel="Create organization"
          onSubmit={async () => {
            const org = await api.request<Account>('/api/v1/orgs', {
              method: 'POST',
              body: { handle, displayName },
            });
            // Straight to its settings: the next thing anyone does with a new
            // organization is invite somebody or mint a token for it.
            void navigate(`/org/${org.handle}/settings`);
          }}
        >
          <Field
            label="Handle"
            value={handle}
            onChange={(v) => setHandle(v.toLowerCase())}
            required
            hint="Shares one namespace with user handles, so it has to be free."
          />
          <Field label="Display name" value={displayName} onChange={setDisplayName} required />
        </Form>
      </section>
    </main>
  );
}
