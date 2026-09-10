import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.js';
import { AsyncBoundary, useAsync } from '../../components/Async.js';
import { Field, Form } from '../../components/Form.js';
import { formatBytes } from '../org/Members.js';
import { NotFound } from '../NotFound.js';
import type { OrgSettings, Product } from '../../api/types.js';

const PLATFORMS = ['spigot', 'paper', 'folia', 'fabric', 'forge', 'neoforge'] as const;

/**
 * `/product/:product_id/setting/update/` — publishing a version.
 *
 * One jar. A product page carries exactly one file per version, and the server
 * enforces that as a primary key, so a second file input would be a control
 * that cannot succeed.
 */
export function ProductUpdate() {
  const { api } = useAuth();
  const { productId } = useParams<{ productId: string }>();

  const product = useAsync(
    () => api.request<Product>(`/api/v1/products/${productId}`),
    [api, productId],
  );

  const [version, setVersion] = useState('');
  const [channel, setChannel] = useState<'release' | 'beta' | 'alpha'>('release');
  const [changelog, setChangelog] = useState('');
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>('paper');
  const [minecraftVersion, setMinecraftVersion] = useState('');
  const [file, setFile] = useState<File | undefined>(undefined);

  if (productId === undefined) return <NotFound />;

  return (
    <main>
      <h1>Publish a version</h1>

      <AsyncBoundary state={product}>
        {(value) => (
          <>
            <p>
              <Link to={`/product/${value.slug}/settings`}>Back to settings</Link>
            </p>
            <Limits orgId={value.owner_org_id} />

            <Form
              submitLabel="Publish"
              successMessage="Published."
              onSubmit={async () => {
                if (file === undefined) throw new Error('Choose a jar to upload.');

                const form = new FormData();
                form.set('version', version);
                form.set('channel', channel);
                if (changelog !== '') form.set('changelog', changelog);
                if (minecraftVersion !== '') {
                  form.set(
                    'compatibility',
                    JSON.stringify([{ platform, minecraftVersion }]),
                  );
                }
                form.set('file', file);

                await api.request(`/api/v1/products/${value.id}/versions`, {
                  method: 'POST',
                  form,
                });
                setVersion('');
                setChangelog('');
                setFile(undefined);
              }}
            >
              <Field
                label="Version"
                value={version}
                onChange={setVersion}
                required
                hint="Like 1.2.3, optionally with a -beta.1 suffix. Compared numerically, so 1.10.0 is newer than 1.9.0."
              />

              <p>
                <label>
                  Channel
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as 'release' | 'beta' | 'alpha')}
                  >
                    <option value="release">release</option>
                    <option value="beta">beta</option>
                    <option value="alpha">alpha</option>
                  </select>
                </label>
              </p>

              <p>
                <label>
                  Jar
                  {/*
                    Not `required`. The submit handler checks it and reports
                    "Choose a jar to upload." through the form's own error line,
                    which is a better message than the browser's bubble and is
                    rendered in the same place as every other failure. jsdom also
                    never marks a file input valid, so `required` here would make
                    the whole form untestable.
                  */}
                  <input
                    type="file"
                    accept=".jar,application/java-archive"
                    onChange={(event) => setFile(event.target.files?.[0])}
                  />
                </label>
                <small>
                  One jar per version. If your project ships two, publish them as two products.
                </small>
              </p>

              <p>
                <label>
                  Changelog
                  <textarea value={changelog} onChange={(e) => setChangelog(e.target.value)} />
                </label>
              </p>

              <fieldset>
                <legend>Compatibility</legend>
                <p>
                  <label>
                    Platform
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as (typeof PLATFORMS)[number])}
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>
                </p>
                <Field
                  label="Minecraft version"
                  value={minecraftVersion}
                  onChange={setMinecraftVersion}
                  hint="Optional, but a server that cannot tell will not offer the update."
                />
              </fieldset>
            </Form>
          </>
        )}
      </AsyncBoundary>
    </main>
  );

  function Limits({ orgId }: { orgId: string }) {
    // The org handle is needed to read settings, and the product carries only
    // the id — so the account is resolved first.
    const settings = useAsync(async () => {
      const org = await api.request<{ handle: string }>(`/api/v1/accounts/${orgId}`);
      return api.request<OrgSettings>(`/api/v1/orgs/${org.handle}/settings`);
    }, [orgId]);

    if (settings.status !== 'ready') return null;
    const remaining = settings.value.storage_quota_bytes - settings.value.storage_used_bytes;

    return (
      <p>
        {formatBytes(remaining)} of quota left. Largest single file:{' '}
        {formatBytes(settings.value.max_file_bytes)}.
      </p>
    );
  }
}
