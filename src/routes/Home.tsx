import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.js';

/**
 * `/` — what this is, for someone who arrived without being told.
 *
 * The catalogue used to be here. It is a fine page and a poor front door: it
 * answers "what has been published" to a reader who has not yet been told what
 * publishing means or who does the downloading.
 */
export function Home() {
  const { status } = useAuth();

  return (
    <main className="container">
      <div className="hero">
        <p className="eyebrow">MCEngine</p>
        <h1>MCPluginManager</h1>
        <p className="lead">
          Install, update and remove plugins across a fleet of Minecraft servers from one place.
          Publish a jar once; every server you run picks it up on its own.
        </p>
        <div className="btn-row">
          <Link className="btn btn--primary" to="/products">
            Browse products
          </Link>
          {status === 'authenticated' ? (
            <Link className="btn" to="/fleet">
              Your servers
            </Link>
          ) : (
            <>
              <Link className="btn" to="/login">
                Sign in
              </Link>
              <Link className="btn" to="/register">
                Create an account
              </Link>
            </>
          )}
        </div>
      </div>

      <section className="section" aria-labelledby="how-heading">
        <h2 id="how-heading">How it fits together</h2>
        <p className="lead">Three pieces. You are looking at one of them.</p>

        <ul className="card-grid">
          <li>
            <div className="card">
              <span className="card__title">This panel</span>
              <span className="card__desc">
                Where a person works: publish a version, mint a token, and tell a server which
                version it should be running. It stores nothing itself — every fact on the page
                comes from the server below.
              </span>
            </div>
          </li>
          <li>
            <div className="card">
              <span className="card__title">The central server</span>
              <span className="card__desc">
                Holds accounts and organizations, the artifact catalogue, the scoped tokens a
                Minecraft server downloads with, and the record of what each server should have
                installed.
              </span>
            </div>
          </li>
          <li>
            <div className="card">
              <span className="card__title">The plugin</span>
              <span className="card__desc">
                Runs on your Minecraft server. It reports what is installed, asks what should
                change, verifies every download against its checksum, and stages the result for
                the next restart.
              </span>
            </div>
          </li>
        </ul>
      </section>

      <section className="section" aria-labelledby="why-heading">
        <h2 id="why-heading">What it does differently</h2>

        <ul className="feature-list">
          <li>
            <strong>Nothing is installed without a checksum that matches.</strong> The server
            declares a SHA-256 with every version; the plugin verifies the bytes before the file
            reaches anywhere the server would load it from, and deletes it otherwise.
          </li>
          <li>
            <strong>Nothing is loaded or unloaded behind your back.</strong> Bukkit has no safe
            unload, so an install or an update is staged into <code>plugins/update/</code> and
            applied by the server itself on its next start. A removal happens at shutdown. Every
            message says "when the server restarts", because that is what actually happens.
          </li>
          <li>
            <strong>One product page carries exactly one jar.</strong> Two jars means two
            products — enforced by the schema, not by a convention someone has to remember.
          </li>
          <li>
            <strong>Publishing works from CI.</strong> The same nine checks apply whether a jar
            arrives from this panel or from a build machine holding a scoped token.
          </li>
        </ul>
      </section>

      <section className="section" aria-labelledby="start-heading">
        <h2 id="start-heading">Getting started</h2>
        <div className="accordion">
          <details className="acc">
            <summary>Publishing something</summary>
            <div className="acc__body">
              <p>
                Create an account, then an organization — only organizations publish, and a
                product belongs to one. Create a product, then publish a version by uploading its
                jar.
              </p>
              <div className="btn-row">
                <Link className="btn" to="/org">
                  Create an organization
                </Link>
              </div>
            </div>
          </details>

          <details className="acc">
            <summary>Managing a server</summary>
            <div className="acc__body">
              <p>
                Register the server to get its key, put that key in the plugin's{' '}
                <code>config.yml</code>, and it starts reporting what it has installed. From then
                on you set the version you want and the server converges on it.
              </p>
              <div className="btn-row">
                <Link className="btn" to="/fleet">
                  Register a server
                </Link>
              </div>
            </div>
          </details>

          <details className="acc">
            <summary>Just looking</summary>
            <div className="acc__body">
              <p>
                The catalogue is public. Every version lists its checksum and what it is
                compatible with, and a public product can be downloaded without an account.
              </p>
              <div className="btn-row">
                <Link className="btn" to="/products">
                  Open the catalogue
                </Link>
              </div>
            </div>
          </details>
        </div>
      </section>
    </main>
  );
}
