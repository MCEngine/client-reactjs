import { useState } from 'react';

/**
 * `/ci-cd` — a pipeline that publishes a jar, for both forges.
 *
 * The files are written out in full rather than described, because the thing a
 * person wants from this page is a file they can commit. The base URL is this
 * deployment's own, so what is copied works without a third variable to set.
 */
export function CiCd() {
  const origin = typeof window === 'undefined' ? 'https://panel.example.com' : window.location.origin;
  const [copied, setCopied] = useState<string | undefined>(undefined);

  const github = `name: Publish to MCPluginManager

on:
  release:
    types: [published]

env:
  # Rename these two to anything you like — nothing outside this file reads
  # them. Whatever you call them, the references below have to match.
  PLUGIN_ID: \${{ vars.PLUGIN_ID }}
  USER_TOKEN: \${{ secrets.USER_TOKEN }}

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'

      - run: ./gradlew --no-daemon build

      - name: Publish the jar
        run: |
          # The tag is the version: v1.2.3 publishes 1.2.3.
          VERSION="\${GITHUB_REF_NAME#v}"
          JAR=$(ls build/libs/*.jar | grep -Ev -- '-(sources|javadoc)\\.jar$' | head -n 1)

          # --fail-with-body: a 4xx must fail the job *and* print what the
          # server said, or a rejected publish looks like a successful one.
          curl --fail-with-body -sS \\
            -X PUT "${origin}/api/v1/products/\${PLUGIN_ID}/versions/\${VERSION}" \\
            -H "Authorization: Bearer \${USER_TOKEN}" \\
            -F "channel=release" \\
            -F "file=@\${JAR}"
`;

  const gitlab = `stages: [publish]

publish:
  stage: publish
  image: eclipse-temurin:21-jdk
  rules:
    # Tags only: a publish on every push would fail the second time, because a
    # version is published once.
    - if: $CI_COMMIT_TAG

  script:
    - ./gradlew --no-daemon build
    - VERSION="\${CI_COMMIT_TAG#v}"
    - JAR=$(ls build/libs/*.jar | grep -Ev -- '-(sources|javadoc)\\.jar$' | head -n 1)
    - |
      curl --fail-with-body -sS \\
        -X PUT "${origin}/api/v1/products/\${PLUGIN_ID}/versions/\${VERSION}" \\
        -H "Authorization: Bearer \${USER_TOKEN}" \\
        -F "channel=release" \\
        -F "file=@\${JAR}"
`;

  const copy = (what: string, text: string) => {
    void navigator.clipboard?.writeText(text);
    setCopied(what);
  };

  return (
    <main className="container">
      <p className="eyebrow">Publishing</p>
      <h1>Publishing from CI</h1>
      <p className="lead">
        A pipeline that uploads your jar when you tag a release. Copy the file for your forge,
        set two variables, and tag something.
      </p>

      <section className="panel" aria-labelledby="variables-heading">
        <h2 id="variables-heading">The two variables</h2>
        <dl className="deflist">
          <div className="deflist__row">
            <dt className="deflist__term">
              <code>PLUGIN_ID</code>
            </dt>
            <dd>
              The product's id — the last part of its address here, like{' '}
              <code>acme-tools</code>. It is unique across every organization, so it is the whole
              address. Not a secret.
            </dd>
          </div>
          <div className="deflist__row">
            <dt className="deflist__term">
              <code>USER_TOKEN</code>
            </dt>
            <dd>
              An API token carrying the <code>artifact:write</code> scope. Mint it under{' '}
              <strong>Tokens</strong> — or, better for CI, under an organization's{' '}
              <strong>Organization tokens</strong>, which keeps working when whoever set the
              pipeline up leaves. A secret: it publishes as you.
            </dd>
          </div>
        </dl>

        <p>
          <strong>The names are yours.</strong> Nothing outside the file reads them — rename both
          to <code>MY_THING_ID</code> and <code>MY_THING_TOKEN</code> if you prefer, as long as
          the references in the <code>curl</code> line change with them.
        </p>

        <h3>Where they go</h3>
        <ul>
          <li>
            <strong>GitHub</strong> — repository <em>Settings → Secrets and variables → Actions</em>.
            <code>PLUGIN_ID</code> as a <em>variable</em>, <code>USER_TOKEN</code> as a{' '}
            <em>secret</em>: a secret is masked in logs, a variable is not, and only one of them
            needs to be.
          </li>
          <li>
            <strong>GitLab</strong> — <em>Settings → CI/CD → Variables</em>. Tick{' '}
            <strong>Masked</strong> on <code>USER_TOKEN</code>, and <strong>Protected</strong> if
            you only ever publish from protected tags.
          </li>
        </ul>
      </section>

      <section className="panel" aria-labelledby="github-heading">
        <h2 id="github-heading">GitHub Actions</h2>
        <p className="muted">
          <code>.github/workflows/publish.yml</code>
        </p>
        <pre className="md-code">
          <code>{github}</code>
        </pre>
        <div className="btn-row">
          <button className="btn" type="button" onClick={() => copy('GitHub', github)}>
            {copied === 'GitHub' ? 'Copied' : 'Copy'}
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="gitlab-heading">
        <h2 id="gitlab-heading">GitLab CI</h2>
        <p className="muted">
          <code>.gitlab-ci.yml</code>
        </p>
        <pre className="md-code">
          <code>{gitlab}</code>
        </pre>
        <div className="btn-row">
          <button className="btn" type="button" onClick={() => copy('GitLab', gitlab)}>
            {copied === 'GitLab' ? 'Copied' : 'Copy'}
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="notes-heading">
        <h2 id="notes-heading">What the request does</h2>
        <p>
          <code>PUT /api/v1/products/&lt;id&gt;/versions/&lt;version&gt;</code>, multipart, with
          the jar as <code>file</code>. The version is the address, not a field — publishing{' '}
          <code>1.2.3</code> twice is a conflict rather than a silent overwrite, which is what
          makes a published version mean one set of bytes forever.
        </p>
        <ul>
          <li>
            <code>channel</code> — <code>release</code>, <code>beta</code> or <code>alpha</code>.
          </li>
          <li>
            <code>changelog</code> — optional. Add{' '}
            <code>-F "changelog=$(git tag -l --format='%(contents)' "$GITHUB_REF_NAME")"</code> to
            send the tag's message.
          </li>
          <li>
            <code>compatibility</code> — optional JSON, like{' '}
            <code>[{'{'}"platform":"paper","minecraftVersion":"1.21"{'}'}]</code>. A server that
            cannot tell whether a version fits will not offer it.
          </li>
        </ul>
        <p>
          The response is the published version, and a failure is a JSON body with a{' '}
          <code>code</code> in it — <code>--fail-with-body</code> is what puts that in your job
          log instead of an exit status nobody can read.
        </p>
      </section>
    </main>
  );
}
