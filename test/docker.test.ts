import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * The container image's start-up script, exercised as a script.
 *
 * There is no Docker daemon in `npm run check` and this needs none: the script
 * is POSIX `sh`, so sourcing it and reading back the environment is exactly
 * what the base image's entrypoint does one step before it renders the
 * template. The failure this guards against cost a live deployment — nginx
 * resolving names through Docker's embedded DNS on a platform that has none,
 * which surfaces as a 502 from an API that is up.
 */

const SCRIPT = 'docker/10-api-upstream.envsh';
const TEMPLATE = 'docker/default.conf.template';

function sourceScript(env: Record<string, string>): Record<string, string> {
  const out = execFileSync('sh', ['-c', `. ./${SCRIPT} >/dev/null; env`], {
    encoding: 'utf8',
    // A clean environment: whatever the developer has exported must not decide
    // what the container would do. PATH is written out rather than inherited
    // for the same reason — `process` is deliberately not a global here, since
    // src/ is browser code and must never believe Node's globals exist.
    env: { PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin', ...env },
  });
  return Object.fromEntries(
    out
      .split('\n')
      .filter((line) => line.includes('='))
      .map((line): [string, string] => {
        const at = line.indexOf('=');
        return [line.slice(0, at), line.slice(at + 1)];
      }),
  );
}

function withResolvConf(contents: string): string {
  const path = join(mkdtempSync(join(tmpdir(), 'resolv-')), 'resolv.conf');
  writeFileSync(path, contents);
  return path;
}

describe('the resolver', () => {
  it('comes from resolv.conf when nothing set it', () => {
    const env = sourceScript({
      API_UPSTREAM: 'server:3000',
      RESOLV_CONF: withResolvConf('search example.com\nnameserver 10.0.0.2\nnameserver 10.0.0.3\n'),
    });
    expect(env['DNS_RESOLVER']).toBe('10.0.0.2 10.0.0.3');
  });

  it('brackets an IPv6 nameserver, which nginx requires', () => {
    const env = sourceScript({
      API_UPSTREAM: 'server:3000',
      RESOLV_CONF: withResolvConf('nameserver fd00::1\n'),
    });
    expect(env['DNS_RESOLVER']).toBe('[fd00::1]');
  });

  it('keeps an explicit DNS_RESOLVER over the file', () => {
    const env = sourceScript({
      API_UPSTREAM: 'server:3000',
      DNS_RESOLVER: '1.1.1.1',
      RESOLV_CONF: withResolvConf('nameserver 10.0.0.2\n'),
    });
    expect(env['DNS_RESOLVER']).toBe('1.1.1.1');
  });

  it('falls back to Docker embedded DNS when there is nothing to read', () => {
    const env = sourceScript({ API_UPSTREAM: 'server:3000', RESOLV_CONF: '/nonexistent' });
    expect(env['DNS_RESOLVER']).toBe('127.0.0.11');
  });
});

describe('the upstream', () => {
  const resolv = () => withResolvConf('nameserver 10.0.0.2\n');

  it('takes host:port as plaintext, and asks the upstream for its own Host', () => {
    const env = sourceScript({ API_UPSTREAM: 'api:10000', RESOLV_CONF: resolv() });
    expect(env['API_PROXY_SCHEME']).toBe('http');
    expect(env['API_PROXY_ADDR']).toBe('api:10000');
    // Never the browser's Host. A public edge builds its https redirect from
    // whatever Host it is sent, and the browser's points back at the panel —
    // which is a redirect loop rather than a failure.
    expect(env['API_PROXY_HOST']).toBe('api:10000');
  });

  it('leaves the port out of Host when it is the scheme\'s own', () => {
    const plain = sourceScript({ API_UPSTREAM: 'http://api.example.com', RESOLV_CONF: resolv() });
    expect(plain['API_PROXY_ADDR']).toBe('api.example.com:80');
    expect(plain['API_PROXY_HOST']).toBe('api.example.com');

    const secure = sourceScript({ API_UPSTREAM: 'https://api.example.com:8443', RESOLV_CONF: resolv() });
    expect(secure['API_PROXY_HOST']).toBe('api.example.com:8443');
  });

  it('takes an https URL, defaults the port, and asks for that Host', () => {
    const env = sourceScript({
      API_UPSTREAM: 'https://api.example.com',
      RESOLV_CONF: resolv(),
    });
    expect(env['API_PROXY_SCHEME']).toBe('https');
    expect(env['API_PROXY_ADDR']).toBe('api.example.com:443');
    // A public endpoint routes on Host; the panel's own hostname reaches nothing.
    expect(env['API_PROXY_HOST']).toBe('api.example.com');
    expect(env['API_PROXY_SNI']).toBe('api.example.com');
  });

  it('drops a path, which the API paths already carry', () => {
    const env = sourceScript({ API_UPSTREAM: 'https://api.example.com/api/', RESOLV_CONF: resolv() });
    expect(env['API_PROXY_ADDR']).toBe('api.example.com:443');
  });

  it('re-brackets an IPv6 literal', () => {
    const env = sourceScript({ API_UPSTREAM: '[fd00::5]:3000', RESOLV_CONF: resolv() });
    expect(env['API_PROXY_ADDR']).toBe('[fd00::5]:3000');
    expect(env['API_PROXY_SNI']).toBe('fd00::5');
  });

  it('defaults to the Compose service when nothing is set', () => {
    const env = sourceScript({ RESOLV_CONF: resolv() });
    expect(env['API_PROXY_ADDR']).toBe('server:3000');
  });
});

describe('the image and the template agree', () => {
  it('leaves DNS_RESOLVER unset in the image, so the script can derive it', () => {
    const dockerfile = readFileSync('Dockerfile', 'utf8');
    // A default here would defeat the derivation: the script only reads
    // resolv.conf when the variable is empty.
    expect(dockerfile).not.toMatch(/ENV[^\n]*DNS_RESOLVER=/);
    expect(dockerfile).toMatch(/COPY --chmod=0755 docker\/10-api-upstream\.envsh/);
  });

  it('ships the script executable, or the entrypoint skips it', () => {
    const mode = execFileSync('git', ['ls-files', '-s', SCRIPT], { encoding: 'utf8' }).split(' ')[0];
    expect(mode).toBe('100755');
  });


  it('never asks the upstream for the browser\'s Host', () => {
    const template = readFileSync(TEMPLATE, 'utf8');
    const host = /proxy_set_header\s+Host\s+(\S+);/.exec(template)?.[1];
    // This exact line looped a live deployment: a public upstream reached over
    // plaintext answered `301 https://<the Host it was sent>`, which was the
    // panel, which proxied again.
    expect(host).toBe('${API_PROXY_HOST}');
    expect(template).toMatch(/proxy_set_header\s+X-Forwarded-Host\s+\$host;/);
  });

  it('answers an upstream redirect rather than passing it on', () => {
    const template = readFileSync(TEMPLATE, 'utf8');
    expect(template).toMatch(/proxy_intercept_errors on;/);
    expect(template).toMatch(/error_page 301 302 303 307 308 = @api_redirected;/);
    // In the service's own error shape, so the panel renders the reason.
    expect(template).toMatch(/location @api_redirected \{[\s\S]*upstream_redirected/);
  });

  it('forwards the scheme the browser used, not the one this container saw', () => {
    const template = readFileSync(TEMPLATE, 'utf8');
    expect(template).toMatch(/map \$http_x_forwarded_proto \$forwarded_proto/);
    expect(template).toMatch(/proxy_set_header\s+X-Forwarded-Proto\s+\$forwarded_proto;/);
  });

  it('substitutes only values the script exports or the image sets', () => {
    const template = readFileSync(TEMPLATE, 'utf8');
    const referenced = [...template.matchAll(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map((m) => m[1]);
    const exported = sourceScript({ RESOLV_CONF: withResolvConf('nameserver 10.0.0.2\n') });
    for (const name of new Set(referenced)) {
      // An unsubstituted ${NAME} reaches nginx verbatim and fails to parse at
      // start-up — after the deploy has already been reported as succeeded.
      expect(exported, `${name} is referenced by the template`).toHaveProperty(name!);
    }
  });
});
