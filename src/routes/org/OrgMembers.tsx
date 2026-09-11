import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../../components/Async.js';
import { Field, Form } from '../../components/Form.js';
import { ConfirmButton } from '../../components/ConfirmButton.js';
import { NotFound } from '../NotFound.js';
import type { OrgMember, Page } from '../../api/types.js';

const ROLES = ['admin', 'maintainer', 'member'] as const;

/** `/org/:handle/setting/member/` — who is in the organization, and what they may do. */
export function OrgMembers() {
  const { api } = useAuth();
  const { handle } = useParams<{ handle: string }>();
  const [invite, setInvite] = useState('');
  const [role, setRole] = useState<(typeof ROLES)[number]>('member');

  const members = useAsync(
    () => api.request<Page<OrgMember>>(`/api/v1/orgs/${handle}/members`),
    [api, handle],
  );

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
        <span>Members</span>
      </nav>

      <p className="eyebrow">Organization</p>
      <h1>Members</h1>

      <section className="panel" aria-labelledby="members-heading">
        <h2 id="members-heading">Who is in {handle}</h2>
        <AsyncBoundary state={members}>
          {(page) => (
            <ul className="stack">
              {page.data.map((member) => (
                <li key={member.user.id}>
                  <div className="row-between">
                    <span>
                      <strong>{member.user.display_name}</strong> <code>{member.user.handle}</code>
                    </span>
                    <span className="badge badge--accent">{member.role}</span>
                  </div>

                  {member.role !== 'owner' && (
                    <div className="btn-row">
                      <label className="field">
                        Role
                        <select
                          value={member.role}
                          onChange={(event) => {
                            void api
                              .request(`/api/v1/orgs/${handle}/members/${member.user.handle}`, {
                                method: 'PATCH',
                                body: { role: event.target.value },
                              })
                              .finally(() => members.reload());
                          }}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </label>

                      <ConfirmButton
                        label="Remove"
                        confirmLabel="Remove"
                        description={`Remove ${member.user.handle} from ${handle}?`}
                        onConfirm={async () => {
                          await api.request(`/api/v1/orgs/${handle}/members/${member.user.handle}`, {
                            method: 'DELETE',
                          });
                          members.reload();
                        }}
                      />
                    </div>
                  )}

                  {member.role === 'owner' && (
                    <p className="muted">
                      The owner cannot be removed or demoted — transfer instead.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </AsyncBoundary>

        <h3>Invite someone</h3>
        <Form
          submitLabel="Invite"
          successMessage="Invited."
          onSubmit={async () => {
            await api.request(`/api/v1/orgs/${handle}/members`, {
              method: 'POST',
              body: { handle: invite, role },
            });
            setInvite('');
            members.reload();
          }}
        >
          <Field label="Their handle" value={invite} onChange={(v) => setInvite(v.toLowerCase())} required />
          <p className="field">
            <label>
              Role
              <select value={role} onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </p>
          <small className="field__hint">
            Owner is not offered: an organization has exactly one, and it moves by transfer.
          </small>
        </Form>
      </section>
    </main>
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}
