import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../../components/Async.js';
import { NotFound } from '../NotFound.js';
import { formatBytes } from './OrgMembers.js';
import type { Account, OrgSettings as OrgSettingsPayload } from '../../api/types.js';

/**
 * `/org/:handle/settings` — the landing page for one organization.
 *
 * Same shape as a product's settings landing: what it is at the top, then one
 * card per subject. Every subject is its own page rather than a section here,
 * because a page that does four unrelated things has no useful address.
 */
export function OrgSettings() {
  const { api } = useAuth();
  const { handle } = useParams<{ handle: string }>();

  const org = useAsync(() => api.request<Account>(`/api/v1/accounts/${handle}`), [api, handle]);
  const settings = useAsync(
    () => api.request<OrgSettingsPayload>(`/api/v1/orgs/${handle}/settings`),
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
        <span>{handle}</span>
      </nav>

      <AsyncBoundary state={org}>
        {(value) => (
          <>
            <p className="eyebrow">Organization</p>
            <h1>{value.display_name} settings</h1>
            <p className="lead">
              <code>{value.handle}</code>
            </p>
          </>
        )}
      </AsyncBoundary>

      {/*
        Storage is read-only and belongs to no subject page: it is the fact you
        came to check before deciding to do anything else.
      */}
      <section className="panel" aria-labelledby="usage-heading">
        <h2 id="usage-heading">Storage</h2>
        <AsyncBoundary state={settings}>
          {(value) => (
            <p>
              {formatBytes(value.storage_used_bytes)} of {formatBytes(value.storage_quota_bytes)}{' '}
              used on the {value.membership_tier} tier. Largest single file:{' '}
              {formatBytes(value.max_file_bytes)}.
            </p>
          )}
        </AsyncBoundary>
      </section>

      <nav aria-label="Organization settings">
        <ul className="card-grid">
          <li>
            <Link className="card" to={`/org/${handle}/setting/general`} aria-label="General">
              <span className="card__title">General</span>
              <span className="card__desc">
                The display name, the description, and the handle every link uses.
              </span>
              <span className="card__more">Open →</span>
            </Link>
          </li>
          <li>
            <Link className="card" to={`/org/${handle}/setting/member`} aria-label="Members">
              <span className="card__title">Members</span>
              <span className="card__desc">
                Who is in it and what each may do. Invite, change a role, remove.
              </span>
              <span className="card__more">Open →</span>
            </Link>
          </li>
          <li>
            {/*
              "Organization tokens", not "Tokens": the nav carries a Tokens
              link of its own to the personal list, and two links with one name
              going to different places is the ambiguity that costs someone a
              wrong click. The visible title stays inside the name.
            */}
            <Link
              className="card"
              to={`/org/${handle}/setting/token`}
              aria-label="Organization tokens"
            >
              <span className="card__title">Tokens</span>
              <span className="card__desc">
                Credentials the organization owns, for CI that outlives whoever set it up.
              </span>
              <span className="card__more">Open →</span>
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
