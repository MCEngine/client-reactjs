import { useAuth } from '../../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../../components/Async.js';
import { ConfirmButton } from '../../components/ConfirmButton.js';
import type { Page, Session } from '../../api/types.js';

export function Devices() {
  const { api } = useAuth();
  const state = useAsync(() => api.request<Page<Session>>('/api/v1/me/sessions'), [api]);

  return (
    <main className="container">
      <p className="eyebrow">Security</p>
      <h1>Signed-in devices</h1>
      <p className="lead">
        Each device holds its own session. Revoking one does not touch the others — signing in
        somewhere new never signs you out here.
      </p>

      <AsyncBoundary
        state={state}
        isEmpty={(p) => p.data.length === 0}
        empty={<p className="muted">No other devices.</p>}
      >
        {(page) => (
          <ul className="stack">
            {page.data.map((session) => (
              <li key={session.id}>
                <div className="row-between">
                  <strong>{session.device_label ?? 'Unnamed device'}</strong>
                  {session.current && <span className="badge badge--accent">this device</span>}
                </div>
                <p className="muted">
                  Last used {new Date(session.last_used_at).toLocaleString()}
                  {session.ip_last_seen !== undefined && <> · from {session.ip_last_seen}</>}
                </p>

                {!session.current && (
                  <ConfirmButton
                    label="Revoke"
                    confirmLabel="Revoke"
                    description="That device will have to sign in again."
                    onConfirm={async () => {
                      await api.request(`/api/v1/me/sessions/${session.id}`, { method: 'DELETE' });
                      state.reload();
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </AsyncBoundary>
    </main>
  );
}
