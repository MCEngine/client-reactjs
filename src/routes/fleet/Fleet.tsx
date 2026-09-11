import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../../components/Async.js';
import { Field, Form } from '../../components/Form.js';
import type { MinecraftServer, Page } from '../../api/types.js';

export function Fleet() {
  const { api } = useAuth();
  const state = useAsync(() => api.request<Page<MinecraftServer>>('/api/v1/fleet/servers'), [api]);
  const [name, setName] = useState('');
  const [registered, setRegistered] = useState<MinecraftServer | undefined>(undefined);

  return (
    <main className="container">
      <p className="eyebrow">Fleet</p>
      <h1>Your servers</h1>
      <p className="lead">
        Each registered server reports what it has installed and is told what it should be
        running.
      </p>

      {registered?.server_key !== undefined && (
        <section className="panel" aria-labelledby="key-heading">
          <h2 id="key-heading">Server key for {registered.name}</h2>
          <p role="status">
            Put this in the plugin’s <code>config.yml</code>. It is shown once, here, and never
            again.
          </p>
          <p className="secret">{registered.server_key}</p>
          <div className="btn-row">
            <button className="btn" type="button" onClick={() => setRegistered(undefined)}>
              I have copied it
            </button>
          </div>
        </section>
      )}

      <AsyncBoundary
        state={state}
        isEmpty={(p) => p.data.length === 0}
        empty={<p className="muted">No servers registered yet.</p>}
      >
        {(page) => (
          <ul className="card-grid">
            {page.data.map((server) => (
              <li key={server.id}>
                <Link className="card" to={`/fleet/${server.id}`} aria-label={server.name}>
                  <span className="card__title">{server.name}</span>
                  {server.platform !== undefined && (
                    <span className="card__desc">
                      {server.platform} {server.mc_version ?? ''}
                    </span>
                  )}
                  <span className="card__desc muted">
                    {server.last_seen_at === undefined
                      ? 'Never checked in'
                      : `Last seen ${new Date(server.last_seen_at).toLocaleString()}`}
                  </span>
                  <span className="card__more">Open →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AsyncBoundary>

      <section className="panel">
      <h2>Register a server</h2>
      <Form
        submitLabel="Register"
        onSubmit={async () => {
          const created = await api.request<MinecraftServer>('/api/v1/fleet/servers', {
            method: 'POST',
            body: { name },
          });
          setRegistered(created);
          setName('');
          state.reload();
        }}
      >
        <Field label="Name" value={name} onChange={setName} required />
      </Form>
      </section>
    </main>
  );
}
