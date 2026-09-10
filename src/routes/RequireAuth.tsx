import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.js';
import type { ReactNode } from 'react';

/**
 * Sends an anonymous visitor to sign in, remembering where they were going.
 *
 * A convenience, not a guard. Every route behind this also requires a
 * credential on the server, and a check that existed only here would be a bug —
 * anyone can render a component by asking for its data directly.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <p role="status">Checking your session…</p>;
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
