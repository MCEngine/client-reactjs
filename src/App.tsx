import { useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.js';
import { Home } from './routes/Home.js';
import { Products } from './routes/Products.js';
import { NotFound } from './routes/NotFound.js';
import { RequireAuth } from './routes/RequireAuth.js';
import { SignIn } from './routes/account/SignIn.js';
import { Register } from './routes/account/Register.js';
import { AccountSettings } from './routes/account/AccountSettings.js';
import { Devices } from './routes/account/Devices.js';
import { Tokens } from './routes/account/Tokens.js';
import { Organization } from './routes/org/Organization.js';
import { OrgSettings } from './routes/org/OrgSettings.js';
import { OrgGeneral } from './routes/org/OrgGeneral.js';
import { OrgMembers } from './routes/org/OrgMembers.js';
import { OrgTokens } from './routes/org/OrgTokens.js';
import { Fleet } from './routes/fleet/Fleet.js';
import { ProductPage } from './routes/product/ProductPage.js';
import { ProductSettings } from './routes/product/ProductSettings.js';
import { ProductUpdate } from './routes/product/ProductUpdate.js';
import { ProductGeneral } from './routes/product/ProductGeneral.js';
import { ServerDetail } from './routes/fleet/ServerDetail.js';

/** Keeps `/org/:handle/members` working now that it is a settings page. */
function MembersRedirect() {
  const { handle } = useParams<{ handle: string }>();
  return <Navigate to={`/org/${handle ?? ''}/setting/member`} replace />;
}

/**
 * The shell.
 *
 * Routes are added by the task that builds them, so every commit has a route
 * table matching the pages that exist.
 */
export function App() {
  const { status, account, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  /*
   * The panel is the design system's "runtime-composed chrome" without the
   * runtime: this component *is* the one file navigation lives in, and
   * `NavLink` already knows which route is active. See
   * .agents/design/panel-application.md.
   */
  const navLink = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'nav__link is-active' : 'nav__link';

  // Following a link on a phone should close the menu that covers the page.
  const close = () => setMenuOpen(false);

  return (
    <>
      <header className="site-header">
        <nav className="nav" aria-label="Main">
          <Link className="nav__brand" to="/" onClick={close}>
            MCPluginManager
          </Link>

          <button
            className="nav__toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="nav-links"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>

          <div
            className={menuOpen ? 'nav__links is-open' : 'nav__links'}
            id="nav-links"
          >
            <NavLink className={navLink} to="/" end onClick={close}>
              Home
            </NavLink>
            <NavLink className={navLink} to="/products" onClick={close}>
              Products
            </NavLink>

            {status === 'loading' && (
              <span className="nav__status" role="status">
                Checking your session…
              </span>
            )}

            {status === 'anonymous' && (
              <NavLink className={navLink} to="/login" onClick={close}>
                Sign in
              </NavLink>
            )}

            {status === 'authenticated' && account !== undefined && (
              <>
                <NavLink className={navLink} to="/fleet" onClick={close}>
                  Servers
                </NavLink>
                {/*
                  Signed-in only, because the route is behind RequireAuth and a
                  link that bounces to sign-in is worse than no link.
                */}
                <NavLink className={navLink} to="/org" onClick={close}>
                  Organization
                </NavLink>
                <NavLink className={navLink} to="/settings/tokens" onClick={close}>
                  Tokens
                </NavLink>
                <NavLink className={navLink} to="/settings/devices" onClick={close}>
                  Devices
                </NavLink>
                <NavLink className={navLink} to="/settings/account" onClick={close}>
                  {account.display_name}
                </NavLink>
                <button
                  className="btn btn--quiet"
                  type="button"
                  onClick={() => {
                    close();
                    void signOut();
                  }}
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      <div className="shell">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/register" element={<Register />} />

        {/*
          The four product routes, exactly as specified: the public page, the
          settings landing, publishing a version, and general. Only the public
          one is reachable without signing in.
        */}
        <Route path="/product/:productId" element={<ProductPage />} />
        <Route
          path="/product/:productId/settings"
          element={
            <RequireAuth>
              <ProductSettings />
            </RequireAuth>
          }
        />
        <Route
          path="/product/:productId/setting/update"
          element={
            <RequireAuth>
              <ProductUpdate />
            </RequireAuth>
          }
        />
        <Route
          path="/product/:productId/setting/general"
          element={
            <RequireAuth>
              <ProductGeneral />
            </RequireAuth>
          }
        />

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
          path="/org"
          element={
            <RequireAuth>
              <Organization />
            </RequireAuth>
          }
        />
        {/*
          The create form moved onto /org. This keeps the address that was
          published on the landing page working rather than answering it with
          the not-found page.
        */}
        <Route path="/org/new" element={<Navigate to="/org" replace />} />
        {/*
          One page per subject, mirroring the product settings shape:
          `settings` is the landing and `setting/{subject}` is a page.
        */}
        <Route
          path="/org/:handle/settings"
          element={
            <RequireAuth>
              <OrgSettings />
            </RequireAuth>
          }
        />
        <Route
          path="/org/:handle/setting/general"
          element={
            <RequireAuth>
              <OrgGeneral />
            </RequireAuth>
          }
        />
        <Route
          path="/org/:handle/setting/member"
          element={
            <RequireAuth>
              <OrgMembers />
            </RequireAuth>
          }
        />
        <Route
          path="/org/:handle/setting/token"
          element={
            <RequireAuth>
              <OrgTokens />
            </RequireAuth>
          }
        />
        {/* The address the members page had before it became a settings page. */}
        <Route path="/org/:handle/members" element={<MembersRedirect />} />

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

      <footer className="site-footer">
        <div className="site-footer__inner">
          <span className="site-footer__brand">MCPluginManager</span>
          <span>
            This panel holds no state of its own — every fact on it comes from the central
            server.
          </span>
        </div>
      </footer>
      </div>
    </>
  );
}
