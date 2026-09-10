import { useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../../components/Async.js';
import { ConfirmButton } from '../../components/ConfirmButton.js';
import { NotFound } from '../NotFound.js';
import type { InstalledPlugin, MinecraftServer } from '../../api/types.js';

type ServerDetailPayload = MinecraftServer & { plugins: InstalledPlugin[] };

export function ServerDetail() {
  const { api } = useAuth();
  const { id } = useParams<{ id: string }>();
  const state = useAsync(
    () => api.request<ServerDetailPayload>(`/api/v1/fleet/servers/${id}`),
    [api, id],
  );

  if (id === undefined) return <NotFound />;

  return (
    <main>
      <AsyncBoundary state={state}>
        {(server) => (
          <>
            <h1>{server.name}</h1>
            <p>
              {server.platform ?? 'Unknown platform'} {server.mc_version ?? ''} — agent{' '}
              {server.agent_version ?? 'unknown'}
            </p>

            <h2>Installed plugins</h2>
            {server.plugins.length === 0 ? (
              <p>This server has not reported an inventory yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th scope="col">Plugin</th>
                    <th scope="col">Installed</th>
                    <th scope="col">Should be</th>
                    <th scope="col">State</th>
                    <th scope="col" />
                  </tr>
                </thead>
                <tbody>
                  {server.plugins.map((plugin) => (
                    <tr key={plugin.plugin_id}>
                      <th scope="row">{plugin.plugin_id}</th>
                      <td>{plugin.installed_version ?? '—'}</td>
                      <td>{plugin.desired_version ?? '—'}</td>
                      <td>
                        {plugin.state}
                        {plugin.drifted && <span> (drifted)</span>}
                        {plugin.last_error !== undefined && <div role="alert">{plugin.last_error}</div>}
                      </td>
                      <td>
                        <ConfirmButton
                          label="Remove"
                          confirmLabel="Remove"
                          description={`${plugin.plugin_id} will be removed the next time this server checks in.`}
                          onConfirm={async () => {
                            await api.request(
                              `/api/v1/fleet/servers/${server.id}/plugins/${plugin.plugin_id}`,
                              { method: 'DELETE' },
                            );
                            state.reload();
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </AsyncBoundary>
    </main>
  );
}
