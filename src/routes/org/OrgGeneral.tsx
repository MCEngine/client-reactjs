import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../../components/Async.js';
import { Field, Form } from '../../components/Form.js';
import { CooldownNotice } from '../../components/Cooldown.js';
import { NotFound } from '../NotFound.js';
import type { Account } from '../../api/types.js';

/**
 * `/org/:handle/setting/general/` — what the organization is called.
 *
 * The same two routes an account's own settings use, because an organization
 * *is* an account: `PATCH /accounts/:handle` for the profile and
 * `PUT /accounts/:handle/handle` for the handle, both of which already admit an
 * org admin.
 */
export function OrgGeneral() {
  const { api } = useAuth();
  const { handle } = useParams<{ handle: string }>();
  const org = useAsync(() => api.request<Account>(`/api/v1/accounts/${handle}`), [api, handle]);

  if (handle === undefined) return <NotFound />;

  return (
    <main className="container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/org">Organization</Link>
        <span className="sep" aria-hidden="true">
          /
        </span>
        <Link to={`/org/${handle}/settings`}>{handle}</Link>
        <span className="sep" aria-hidden="true">
          /
        </span>
        <span>General</span>
      </nav>

      <p className="eyebrow">Organization</p>
      <h1>General</h1>

      <AsyncBoundary state={org}>
        {(value) => (
          <>
            <Profile org={value} onSaved={() => org.reload()} />
            <HandleSection org={value} />
          </>
        )}
      </AsyncBoundary>
    </main>
  );

  function Profile({ org: current, onSaved }: { org: Account; onSaved: () => void }) {
    const [displayName, setDisplayName] = useState(current.display_name);
    const [bio, setBio] = useState(current.bio ?? '');

    return (
      <section className="panel" aria-labelledby="profile-heading">
        <h2 id="profile-heading">Profile</h2>
        <Form
          submitLabel="Save profile"
          successMessage="Saved."
          onSubmit={async () => {
            await api.request(`/api/v1/accounts/${current.handle}`, {
              method: 'PATCH',
              // Cleared to null rather than "": the profile shows a description
              // only when it is set, and an empty string is set.
              body: { displayName, bio: bio === '' ? null : bio },
            });
            onSaved();
          }}
        >
          <Field label="Display name" value={displayName} onChange={setDisplayName} required />
          <Field label="Description" value={bio} onChange={setBio} />
        </Form>
      </section>
    );
  }

  function HandleSection({ org: current }: { org: Account }) {
    const navigate = useNavigate();
    const [next, setNext] = useState(current.handle);
    const [error, setError] = useState<unknown>(undefined);

    return (
      <section className="panel" aria-labelledby="handle-heading">
        <h2 id="handle-heading">Handle</h2>
        <p className="muted">
          The handle is the address of every page about this organization, and it shares one
          namespace with user handles. Changing it releases the old one and locks the new one
          for thirty days. Existing links stop working.
        </p>
        <Form
          submitLabel="Change handle"
          successMessage="Handle changed."
          onSubmit={async () => {
            setError(undefined);
            try {
              const updated = await api.request<Account>(
                `/api/v1/accounts/${current.handle}/handle`,
                { method: 'PUT', body: { handle: next } },
              );
              // This page's own address just changed with it.
              void navigate(`/org/${updated.handle}/setting/general`, { replace: true });
            } catch (cause) {
              setError(cause);
              throw cause;
            }
          }}
        >
          <Field
            label="New handle"
            value={next}
            onChange={(v) => setNext(v.toLowerCase())}
            required
          />
        </Form>
        <CooldownNotice error={error} />
      </section>
    );
  }
}
