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
    <main>
      <h1>Your servers</h1>

      {registered?.server_key !== undefined && (
        <section aria-labelledby="key-heading">
          <h2 id="key-heading">Server key for {registered.name}</h2>
          <p role="status">
            Put this in the plugin’s <code>config.yml</code>. It is shown once, here, and never
            again.
          </p>
          <code>{registered.server_key}</code>
          <button type="button" onClick={() => setRegistered(undefined)}>
            I have copied it
          </button>
        </section>
      )}

      <AsyncBoundary
        state={state}
        isEmpty={(p) => p.data.length === 0}
        empty={<p>No servers registered yet.</p>}
      >
        {(page) => (
          <ul>
            {page.data.map((server) => (
              <li key={server.id}>
                <Link to={`/fleet/${server.id}`}>{server.name}</Link>
                {server.platform !== undefined && (
                  <span>
                    {' '}
                    — {server.platform} {server.mc_version ?? ''}
                  </span>
                )}
                <div>
                  {server.last_seen_at === undefined
                    ? 'Never checked in'
                    : `Last seen ${new Date(server.last_seen_at).toLocaleString()}`}
                </div>
              </li>
            ))}
          </ul>
        )}
      </AsyncBoundary>

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
    </main>
  );
}
