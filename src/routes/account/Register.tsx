import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { Field, Form } from '../../components/Form.js';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <main className="container narrow">
      <div className="panel">
      <p className="eyebrow">Get started</p>
      <h1>Create an account</h1>
      <Form
        submitLabel="Create account"
        onSubmit={async () => {
          /*
           * Checked here and nowhere else. The server has no opinion about a
           * second copy of a field -- it is not a rule about accounts, it is a
           * guard against a typo becoming an account nobody can sign in to,
           * and the only moment that can be caught is before the request.
           */
          if (password !== confirmPassword) {
            throw new Error('Those passwords do not match.');
          }

          await register({ handle, displayName, email, password });
          void navigate('/');
        }}
      >
        <Field
          label="Handle"
          value={handle}
          onChange={(v) => setHandle(v.toLowerCase())}
          required
          hint="Lowercase letters, digits and hyphens. Users and organizations share one namespace, so this is yours alone."
        />
        <Field label="Display name" value={displayName} onChange={setDisplayName} required />
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
          hint="At least twelve characters. Length beats punctuation."
        />
        <Field
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          required
          hint="Type it again. A typo here is an account you cannot sign in to."
        />
      </Form>
      <p className="muted">
        Already have one? <Link to="/login">Sign in</Link>.
      </p>
      </div>
    </main>
  );
}
