import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { Field, Form } from '../../components/Form.js';
import type { Account } from '../../api/types.js';

export function CreateOrg() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');

  return (
    <main>
      <h1>Create an organization</h1>
      <p>
        Only an organization can publish a product. You become its owner, and an organization
        has exactly one — ownership moves by transfer, never by invitation.
      </p>
      <Form
        submitLabel="Create organization"
        onSubmit={async () => {
          const org = await api.request<Account>('/api/v1/orgs', {
            method: 'POST',
            body: { handle, displayName },
          });
          void navigate(`/org/${org.handle}/members`);
        }}
      >
        <Field
          label="Handle"
          value={handle}
          onChange={(v) => setHandle(v.toLowerCase())}
          required
          hint="Shares one namespace with user handles, so it has to be free."
        />
        <Field label="Display name" value={displayName} onChange={setDisplayName} required />
      </Form>
    </main>
  );
}
