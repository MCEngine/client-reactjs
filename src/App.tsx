import { Link, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.js';
import { Home } from './routes/Home.js';
import { NotFound } from './routes/NotFound.js';

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
              <Link to={`/@${account.handle}`}>{account.display_name}</Link>
              <button type="button" onClick={() => void signOut()}>
                Sign out
              </button>
            </>
          )}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
