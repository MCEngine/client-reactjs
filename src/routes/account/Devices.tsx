import { useAuth } from '../../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../../components/Async.js';
import { ConfirmButton } from '../../components/ConfirmButton.js';
import type { Page, Session } from '../../api/types.js';

export function Devices() {
  const { api } = useAuth();
  const state = useAsync(() => api.request<Page<Session>>('/api/v1/me/sessions'), [api]);

  return (
    <main>
      <h1>Signed-in devices</h1>
      <p>
        Each device holds its own session. Revoking one does not touch the others — signing in
        somewhere new never signs you out here.
      </p>

      <AsyncBoundary state={state} isEmpty={(p) => p.data.length === 0} empty={<p>No other devices.</p>}>
        {(page) => (
          <ul>
            {page.data.map((session) => (
              <li key={session.id}>
                <strong>{session.device_label ?? 'Unnamed device'}</strong>
                {session.current && <span> (this device)</span>}
                <div>Last used {new Date(session.last_used_at).toLocaleString()}</div>
                {session.ip_last_seen !== undefined && <div>From {session.ip_last_seen}</div>}

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
