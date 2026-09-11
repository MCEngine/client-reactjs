/**
 * `/policy` — what this deployment allows, and what it does with what you give it.
 *
 * Written as the operator's policy rather than as a legal template: every claim
 * here is one this software actually makes true, and the page says plainly
 * which parts the operator has to decide. A policy that promises what the code
 * does not do is worse than no page.
 */
export function Policy() {
  return (
    <main className="container narrow">
      <p className="eyebrow">The rules</p>
      <h1>Policy</h1>
      <p className="lead">
        What may be published here, what happens when something should not have been, and what
        this service stores about you.
      </p>

      <div className="callout callout--info">
        <span className="callout__icon" aria-hidden="true">
          i
        </span>
        <p className="callout__body">
          This is the policy of <strong>this deployment</strong>, and whoever runs it may change
          it. It describes what the software does; it is not legal advice, and an operator with
          obligations of their own should say so here.
        </p>
      </div>

      <section className="panel" aria-labelledby="publishing-heading">
        <h2 id="publishing-heading">What may be published</h2>
        <p>
          A product here is a jar that Minecraft servers download and <strong>execute</strong>.
          That is the whole of why this section exists.
        </p>
        <ul>
          <li>Publish only code you wrote or have the right to distribute.</li>
          <li>
            Do not publish anything built to damage the servers that install it, take control of
            them, or collect from them what their owners have not agreed to give.
          </li>
          <li>
            Say what your product does. A server owner deciding whether to install something is
            reading your summary and your changelog.
          </li>
          <li>
            An organization publishes; a person does not. Whoever owns the organization is
            answerable for what it publishes, including versions published by its tokens.
          </li>
        </ul>
      </section>

      <section className="panel" aria-labelledby="integrity-heading">
        <h2 id="integrity-heading">What is guaranteed about a download</h2>
        <ul>
          <li>
            Every version records the SHA-256 of its jar, and it is shown on the product page.
            The plugin verifies what it downloaded against it before installing.
          </li>
          <li>
            <strong>A published version is one set of bytes, forever.</strong> Publishing the same
            version twice is refused rather than overwriting — so a server that installed{' '}
            <code>1.2.3</code> has the <code>1.2.3</code> everyone else has.
          </li>
          <li>
            Deleting a product removes its versions and their jars. Servers that already installed
            one keep the file they have and stop receiving updates.
          </li>
        </ul>
      </section>

      <section className="panel" aria-labelledby="removal-heading">
        <h2 id="removal-heading">Removal</h2>
        <p>
          The operator of this deployment can remove a product, a version or an account. Expect
          that to happen without warning where something is malicious, infringing, or misdescribed
          in a way that puts a server owner at risk.
        </p>
        <p>
          Report something by contacting whoever runs this deployment. This software has no
          built-in reporting route, and a policy that pretended otherwise would be a page that
          sends people nowhere.
        </p>
      </section>

      <section className="panel" aria-labelledby="data-heading">
        <h2 id="data-heading">What is stored about you</h2>
        <ul>
          <li>
            <strong>Your account</strong> — handle, display name, description, and the email
            addresses you add. Your password is stored only as a scrypt hash; nobody, operator
            included, can read it back.
          </li>
          <li>
            <strong>Your sessions</strong> — one row per signed-in device, with the label you gave
            it, so you can see them and end them. The refresh token is stored only as a digest.
          </li>
          <li>
            <strong>Your tokens</strong> — name, scopes, the first eight characters, and when each
            was last used. The token itself is stored as a digest and is shown once, when minted.
          </li>
          <li>
            <strong>What you did</strong> — an audit trail of changes to accounts, organizations,
            products and tokens, with who did them. Your own is at{' '}
            <code>/me/audit</code>; an organization's admins can read the organization's.
          </li>
          <li>
            <strong>What your servers report</strong> — which plugins are installed and at which
            version, for the servers you register.
          </li>
        </ul>
        <p>
          Public without signing in: handles, display names, descriptions, organizations, and
          public products with their versions and checksums. Never public: email addresses,
          sessions, tokens, audit trails, and anything about a private product.
        </p>
      </section>

      <section className="panel" aria-labelledby="accounts-heading">
        <h2 id="accounts-heading">Accounts</h2>
        <ul>
          <li>One account per person. Handles are unique across people and organizations alike.</li>
          <li>
            Changing a handle releases the old one and locks the new one for thirty days. Links to
            the old handle stop working, including links other people wrote.
          </li>
          <li>
            An account must keep at least one way in — a password or a linked identity. Removing
            the last one is refused rather than leaving an account nobody can reach.
          </li>
          <li>Keep your tokens to yourself: a token publishes as whoever owns it.</li>
        </ul>
      </section>
    </main>
  );
}
