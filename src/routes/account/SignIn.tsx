import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { useAsync } from '../../components/Async.js';
import { Field, Form } from '../../components/Form.js';
import type { Meta } from '../../api/types.js';

export function SignIn() {
  const { signIn, api } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [deviceLabel, setDeviceLabel] = useState('');

  /*
   * Whether this deployment has a demo account is the server's to answer, not
   * the bundle's: the two are configured separately, one at runtime and one at
   * build time. Baking credentials in here would couple them at exactly the
   * point they are decoupled.
   */
  const meta = useAsync(() => api.request<Meta>('/api/v1/meta'), [api]);

  return (
    <main className="container narrow">
      <div className="panel">
      <p className="eyebrow">Welcome back</p>
      <h1>Sign in</h1>

      {/*
        Rendered only once the server has said there is one. Deliberately not an
        AsyncBoundary: that renders a failure as an alert, and a deployment
        without a demo account -- or one whose /meta read failed -- would then
        show an error on its sign-in page. A missing convenience must be
        invisible, not broken.
      */}
      {meta.status === 'ready' && meta.value.demo_account !== null && (
        <div className="callout callout--info">
          <span className="callout__icon" aria-hidden="true">
            i
          </span>
          <div className="callout__body">
            <p>
              <strong>Try it without registering.</strong> This deployment has a shared demo
              account — anyone can sign in as it, so treat anything you publish with it as public
              and temporary.
            </p>
            <div className="deflist">
              <div className="deflist__row">
                <span className="deflist__term">Email</span>
                <span>
                  <code>{meta.value.demo_account.email}</code>
                </span>
              </div>
              <div className="deflist__row">
                <span className="deflist__term">Password</span>
                <span>
                  <code>{meta.value.demo_account.password}</code>
                </span>
              </div>
            </div>
            <div className="btn-row">
              <button
                className="btn"
                type="button"
                onClick={() => {
                  const demo = meta.value.demo_account;
                  if (demo === null) return;
                  setEmail(demo.email);
                  setPassword(demo.password);
                }}
              >
                Fill the form
              </button>
            </div>
            <p className="muted">
              Registering your own account still works, and is the better way to try that part.
            </p>
          </div>
        </div>
      )}

      <Form
        submitLabel="Sign in"
        onSubmit={async () => {
          await signIn(email, password, deviceLabel === '' ? undefined : deviceLabel);
          void navigate('/');
        }}
      >
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field label="Password" type="password" value={password} onChange={setPassword} required />
        <Field
          label="Name this device"
          value={deviceLabel}
          onChange={setDeviceLabel}
          hint="Optional. It appears in your device list so you can tell sessions apart."
        />
      </Form>
      <p className="muted">
        No account? <Link to="/register">Create one</Link>.
      </p>
      </div>
    </main>
  );
}
