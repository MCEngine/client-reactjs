import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from './Async.js';
import { Field, Form } from './Form.js';
import { ConfirmButton } from './ConfirmButton.js';
import type { ApiToken, Page } from '../api/types.js';

export const SCOPES = [
  { id: 'artifact:read', label: 'Download artifacts' },
  { id: 'artifact:write', label: 'Publish versions (CI)' },
  { id: 'product:write', label: 'Create and edit products' },
  { id: 'fleet:read', label: 'Read a server’s desired state' },
  { id: 'fleet:write', label: 'Register a server and report what is installed' },
] as const;

export interface TokenManagerProps {
  /** The collection the tokens live in — `/api/v1/tokens`, or an org's. */
  basePath: string;
  /** Named in the revoke confirmation, so it says whose access ends. */
  ownerLabel: string;
}

/**
 * List, mint and revoke API tokens against one collection.
 *
 * Personal tokens and an organization's differ only in the collection they live
 * in: the same fields, the same scopes, the same shown-once rule. Two copies of
 * this would be two places to fix when the scope list changes.
 */
export function TokenManager({ basePath, ownerLabel }: TokenManagerProps) {
  const { api } = useAuth();
  const state = useAsync(() => api.request<Page<ApiToken>>(basePath), [api, basePath]);

  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [minted, setMinted] = useState<string | undefined>(undefined);

  return (
    <>
      {minted !== undefined && (
        <section className="panel" aria-labelledby="minted-heading">
          <h2 id="minted-heading">Your new token</h2>
          <p role="status">Copy it now. This is the only time it is shown.</p>
          <p className="secret">{minted}</p>
          <div className="btn-row">
            <button className="btn" type="button" onClick={() => setMinted(undefined)}>
              I have copied it
            </button>
          </div>
        </section>
      )}

      <AsyncBoundary
        state={state}
        isEmpty={(p) => p.data.length === 0}
        empty={<p className="muted">No tokens yet.</p>}
      >
        {(page) => (
          <ul className="stack">
            {page.data.map((token) => (
              <li key={token.id}>
                <div className="row-between">
                  <strong>{token.name}</strong> <code>{token.prefix}…</code>
                </div>
                <ul className="chip-row">
                  {token.scopes.map((scope) => (
                    <li className="chip" key={scope}>
                      {scope}
                    </li>
                  ))}
                </ul>
                <p className="muted">
                  {token.created_by === undefined ? (
                    token.last_used_at === undefined ? (
                      'Never used'
                    ) : (
                      `Last used ${new Date(token.last_used_at).toLocaleString()}`
                    )
                  ) : (
                    <>
                      Minted by <code>{token.created_by.handle}</code>
                      {token.last_used_at === undefined
                        ? ' · never used'
                        : ` · last used ${new Date(token.last_used_at).toLocaleString()}`}
                    </>
                  )}
                </p>
                <ConfirmButton
                  label="Revoke"
                  confirmLabel="Revoke"
                  description={`Anything using ${token.name} stops working immediately.`}
                  onConfirm={async () => {
                    await api.request(`${basePath}/${token.id}`, { method: 'DELETE' });
                    state.reload();
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </AsyncBoundary>

      <section className="panel">
        <h2>Create a token</h2>
        <p className="muted">It will belong to {ownerLabel}.</p>
        <Form
          submitLabel="Create token"
          onSubmit={async () => {
            const created = await api.request<ApiToken>(basePath, {
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
          <fieldset className="field">
            <legend>Scopes</legend>
            {SCOPES.map((scope) => (
              <p className="field" key={scope.id}>
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
      </section>
    </>
  );
}
