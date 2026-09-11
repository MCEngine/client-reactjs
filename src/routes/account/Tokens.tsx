import { TokenManager } from '../../components/TokenManager.js';

/** `/settings/tokens` — the caller's own tokens. */
export function Tokens() {
  return (
    <main className="container">
      <p className="eyebrow">Machines</p>
      <h1>API tokens</h1>
      <p className="lead">
        A token authenticates a machine — a Minecraft server, or a CI job. It is shown once,
        here, and never again: the server stores only a digest of it.
      </p>
      <TokenManager basePath="/api/v1/tokens" ownerLabel="you" />
    </main>
  );
}
