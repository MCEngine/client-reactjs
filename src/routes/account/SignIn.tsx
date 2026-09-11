import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { Field, Form } from '../../components/Form.js';

export function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [deviceLabel, setDeviceLabel] = useState('');

  return (
    <main className="container narrow">
      <div className="panel">
      <p className="eyebrow">Welcome back</p>
      <h1>Sign in</h1>
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
