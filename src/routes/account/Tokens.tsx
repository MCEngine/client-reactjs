import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../../components/Async.js';
import { Field, Form } from '../../components/Form.js';
import { ConfirmButton } from '../../components/ConfirmButton.js';
import type { ApiToken, Page } from '../../api/types.js';

const SCOPES = [
  { id: 'artifact:read', label: 'Download artifacts' },
  { id: 'artifact:write', label: 'Publish versions (CI)' },
  { id: 'product:write', label: 'Create and edit products' },
  { id: 'fleet:read', label: 'Read a server’s desired state' },
  { id: 'fleet:write', label: 'Register a server and report what is installed' },
] as const;

export function Tokens() {
  const { api } = useAuth();
  const state = useAsync(() => api.request<Page<ApiToken>>('/api/v1/tokens'), [api]);

  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [minted, setMinted] = useState<string | undefined>(undefined);

  return (
    <main>
      <h1>API tokens</h1>
      <p>
        A token authenticates a machine — a Minecraft server, or a CI job. It is shown once,
        here, and never again: the server stores only a digest of it.
      </p>

      {minted !== undefined && (
        <section aria-labelledby="minted-heading">
          <h2 id="minted-heading">Your new token</h2>
          <p role="status">Copy it now. This is the only time it is shown.</p>
          <code>{minted}</code>
          <button type="button" onClick={() => setMinted(undefined)}>
            I have copied it
          </button>
        </section>
      )}

      <AsyncBoundary state={state} isEmpty={(p) => p.data.length === 0} empty={<p>No tokens yet.</p>}>
        {(page) => (
          <ul>
            {page.data.map((token) => (
              <li key={token.id}>
                <strong>{token.name}</strong> <code>{token.prefix}…</code>
                <div>{token.scopes.join(', ')}</div>
                <div>
                  {token.last_used_at === undefined
                    ? 'Never used'
                    : `Last used ${new Date(token.last_used_at).toLocaleString()}`}
                </div>
                <ConfirmButton
                  label="Revoke"
                  confirmLabel="Revoke"
                  description={`Anything using ${token.name} stops working immediately.`}
                  onConfirm={async () => {
                    await api.request(`/api/v1/tokens/${token.id}`, { method: 'DELETE' });
                    state.reload();
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </AsyncBoundary>

      <h2>Create a token</h2>
      <Form
        submitLabel="Create token"
        onSubmit={async () => {
          const created = await api.request<ApiToken>('/api/v1/tokens', {
            method: 'POST',
            body: { name, scopes: selected },
          });
          setMinted(created.token);
          setName('');
          setSelected([]);
          state.reload();
        }}
      >
        <Field label="Name" value={name} onChange={setName} required />
        <fieldset>
          <legend>Scopes</legend>
          {SCOPES.map((scope) => (
            <p key={scope.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(scope.id)}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, scope.id]
                        : current.filter((s) => s !== scope.id),
                    )
                  }
                />
                {scope.label}
              </label>
            </p>
          ))}
        </fieldset>
      </Form>
    </main>
  );
}
