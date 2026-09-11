import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext.js';
import { AsyncBoundary, describeError, useAsync } from '../../components/Async.js';
import { Field, Form } from '../../components/Form.js';
import { ConfirmButton } from '../../components/ConfirmButton.js';
import { CooldownNotice } from '../../components/Cooldown.js';
import type { Account, Email, Page } from '../../api/types.js';

export function AccountSettings() {
  const { api, account, refreshAccount } = useAuth();

  if (account === undefined) {
    return (
      <main className="container">
        <h1>Account</h1>
        <p className="async-status" role="status">
          Checking your session…
        </p>
      </main>
    );
  }

  return (
    <main className="container">
      <p className="eyebrow">You</p>
      <h1>Account settings</h1>
      <Profile account={account} onSaved={refreshAccount} />
      <HandleSection account={account} onSaved={refreshAccount} />
      <Emails />
    </main>
  );

  function Profile({ account: current, onSaved }: { account: Account; onSaved: () => Promise<void> }) {
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
              body: { displayName, bio: bio === '' ? null : bio },
            });
            await onSaved();
          }}
        >
          <Field label="Display name" value={displayName} onChange={setDisplayName} required />
          <Field label="Bio" value={bio} onChange={setBio} />
        </Form>
      </section>
    );
  }

  function HandleSection({ account: current, onSaved }: { account: Account; onSaved: () => Promise<void> }) {
    const [handle, setHandle] = useState(current.handle);
    const [error, setError] = useState<unknown>(undefined);

    return (
      <section className="panel" aria-labelledby="handle-heading">
        <h2 id="handle-heading">Handle</h2>
        <p className="muted">
          Changing your handle releases the old one and locks the new one for thirty days.
          Links to the old handle stop working.
        </p>
        <Form
          submitLabel="Change handle"
          successMessage="Handle changed."
          onSubmit={async () => {
            setError(undefined);
            try {
              await api.request(`/api/v1/accounts/${current.handle}/handle`, {
                method: 'PUT',
                body: { handle },
              });
              await onSaved();
            } catch (cause) {
              // Rendered by CooldownNotice, which turns available_at into a
              // date rather than the panel recomputing the rule.
              setError(cause);
              throw cause;
            }
          }}
        >
          <Field
            label="New handle"
            value={handle}
            onChange={(v) => setHandle(v.toLowerCase())}
            required
          />
        </Form>
        <CooldownNotice error={error} />
      </section>
    );
  }

  function Emails() {
    const state = useAsync(() => api.request<Page<Email>>('/api/v1/me/emails'), [api]);
    const [adding, setAdding] = useState('');

    return (
      <section className="panel" aria-labelledby="emails-heading">
        <h2 id="emails-heading">Email addresses</h2>
        <AsyncBoundary state={state}>
          {(page) => (
            <ul className="stack">
              {page.data.map((email) => (
                <li key={email.id}>
                  <div className="row-between">
                    <span>{email.email}</span>
                    <span className="chip-row">
                      {email.is_primary && <span className="badge badge--ok">primary</span>}
                      {!email.verified && <span className="badge badge--warn">unverified</span>}
                    </span>
                  </div>

                  <div className="btn-row">
                  {!email.is_primary && (
                    <button
                      className="btn"
                      type="button"
                      // The server refuses an unverified address as primary;
                      // this disables the control and says why, rather than
                      // being the check itself.
                      disabled={!email.verified}
                      title={email.verified ? undefined : 'Verify this address first.'}
                      onClick={() => {
                        void api
                          .request(`/api/v1/me/emails/${email.id}/primary`, { method: 'POST' })
                          .then(() => state.reload())
                          .catch(() => state.reload());
                      }}
                    >
                      Make primary
                    </button>
                  )}

                  {!email.is_primary && (
                    <ConfirmButton
                      label="Remove"
                      description={`Remove ${email.email} from this account?`}
                      confirmLabel="Remove"
                      onConfirm={async () => {
                        await api.request(`/api/v1/me/emails/${email.id}`, { method: 'DELETE' });
                        state.reload();
                      }}
                    />
                  )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AsyncBoundary>

        <Form
          submitLabel="Add address"
          successMessage="Added. Verify it before making it primary."
          onSubmit={async () => {
            await api.request('/api/v1/me/emails', { method: 'POST', body: { email: adding } });
            setAdding('');
            state.reload();
          }}
        >
          <Field label="New email" type="email" value={adding} onChange={setAdding} required />
        </Form>
      </section>
    );
  }
}

export { describeError };
