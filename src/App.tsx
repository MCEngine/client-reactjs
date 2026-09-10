import { Link, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.js';
import { Home } from './routes/Home.js';
import { NotFound } from './routes/NotFound.js';
import { RequireAuth } from './routes/RequireAuth.js';
import { SignIn } from './routes/account/SignIn.js';
import { Register } from './routes/account/Register.js';
import { AccountSettings } from './routes/account/AccountSettings.js';
import { Devices } from './routes/account/Devices.js';
import { Tokens } from './routes/account/Tokens.js';
import { CreateOrg } from './routes/org/CreateOrg.js';
import { Members } from './routes/org/Members.js';
import { Fleet } from './routes/fleet/Fleet.js';
import { ServerDetail } from './routes/fleet/ServerDetail.js';

/**
 * The shell.
 *
 * Routes are added by the task that builds them, so every commit has a route
 * table matching the pages that exist.
 */
export function App() {
  const { status, account, signOut } = useAuth();

  return (
    <>
      <header>
        <Link to="/">MCPluginManager</Link>
        <nav aria-label="Account">
          {status === 'loading' && <span role="status">Checking your session…</span>}
          {status === 'anonymous' && <Link to="/login">Sign in</Link>}
          {status === 'authenticated' && account !== undefined && (
            <>
              <Link to="/settings/account">{account.display_name}</Link>
              <Link to="/settings/devices">Devices</Link>
              <Link to="/settings/tokens">Tokens</Link>
              <Link to="/fleet">Servers</Link>
              <button type="button" onClick={() => void signOut()}>
                Sign out
              </button>
            </>
          )}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/settings/account"
          element={
            <RequireAuth>
              <AccountSettings />
            </RequireAuth>
          }
        />
        <Route
          path="/settings/devices"
          element={
            <RequireAuth>
              <Devices />
            </RequireAuth>
          }
        />
        <Route
          path="/settings/tokens"
          element={
            <RequireAuth>
              <Tokens />
            </RequireAuth>
          }
        />

        <Route
          path="/org/new"
          element={
            <RequireAuth>
              <CreateOrg />
            </RequireAuth>
          }
        />
        <Route
          path="/org/:handle/members"
          element={
            <RequireAuth>
              <Members />
            </RequireAuth>
          }
        />

        <Route
          path="/fleet"
          element={
            <RequireAuth>
              <Fleet />
            </RequireAuth>
          }
        />
        <Route
          path="/fleet/:id"
          element={
            <RequireAuth>
              <ServerDetail />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
