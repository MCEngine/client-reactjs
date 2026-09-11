import { Link, useParams } from 'react-router-dom';
import { TokenManager } from '../../components/TokenManager.js';
import { NotFound } from '../NotFound.js';

/**
 * `/org/:handle/setting/token/` — credentials the organization owns.
 *
 * Not the same list as `/settings/tokens`: one of these belongs to the
 * organization rather than to whoever made it, so it keeps working when that
 * person leaves and stops when the organization revokes it.
 */
export function OrgTokens() {
  const { handle } = useParams<{ handle: string }>();
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
        <span>Tokens</span>
      </nav>

      <p className="eyebrow">Organization</p>
      <h1>Tokens</h1>
      <p className="lead">
        A token here belongs to <code>{handle}</code>, not to you: it publishes for this
        organization and for nothing else, and it outlives whoever created it. Only an admin
        can see this page.
      </p>

      <TokenManager basePath={`/api/v1/orgs/${handle}/tokens`} ownerLabel={handle} />
    </main>
  );
}
