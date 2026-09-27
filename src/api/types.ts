/**
 * The payload shapes `@mcengine/server-expressjs` returns.
 *
 * Types only, mirroring `wiki/information/api-contract.md` in that repository.
 * When a payload changes there, this file follows — it never leads, and it
 * never adds a field the server does not send.
 *
 * Optional properties are optional because the server **omits** them rather
 * than sending null: its rule is "show it only when set", and an absent key is
 * harder to render by accident than a null.
 */

export interface Account {
  id: string;
  type: 'user' | 'org';
  handle: string;
  display_name: string;
  created_at: string;
  bio?: string;
  avatar_url?: string;
}

export interface Email {
  id: string;
  email: string;
  is_primary: boolean;
  verified: boolean;
}

export interface Session {
  id: string;
  created_at: string;
  last_used_at: string;
  expires_at: string;
  current: boolean;
  device_label?: string;
  user_agent?: string;
  ip_last_seen?: string;
}

/** A membership as the member sees it, from `GET /me/orgs`. */
export interface OrgMembership {
  role: 'owner' | 'admin' | 'maintainer' | 'member';
  joined_at: string;
  org: Account;
}

export interface OrgMember {
  role: 'owner' | 'admin' | 'maintainer' | 'member';
  joined_at: string;
  user: Account;
}

export interface OrgSettings {
  membership_tier: 'free' | 'pro' | 'enterprise';
  storage_quota_bytes: number;
  storage_used_bytes: number;
  max_file_bytes: number;
}

export interface ApiToken {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  created_at: string;
  /**
   * Who minted it.
   *
   * The one that matters belongs to an organization: such a token acts *as* the
   * organization, so this is the only thing that still says which admin made
   * it.
   */
  created_by?: Pick<Account, 'id' | 'handle' | 'display_name'>;
  expires_at?: string;
  last_used_at?: string;
  /** Present only in the response that creates it. Never again. */
  token?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  summary: string;
  kind: 'bukkit_plugin' | 'mod_client' | 'mod_server';
  visibility: 'public' | 'unlisted' | 'private';
  owner_org_id: string;
  downloads_count: number;
  created_at: string;
  updated_at: string;
  description?: string;
  repo_url?: string;
  homepage_url?: string;
  license?: string;
}

export interface ProductVersion {
  version: string;
  channel: 'release' | 'beta' | 'alpha';
  is_latest: boolean;
  published_at: string | null;
  compatibility: { platform: string; minecraft_version: string }[];
  changelog?: string;
  file?: { name: string; size_bytes: number; sha256: string };
}

export interface MinecraftServer {
  id: string;
  name: string;
  created_at: string;
  server_url?: string;
  platform?: 'spigot' | 'paper' | 'folia';
  mc_version?: string;
  agent_version?: string;
  last_seen_at?: string;
  /** Returned only when the server is registered. Never again. */
  server_key?: string;
}

export interface InstalledPlugin {
  plugin_id: string;
  state: 'installed' | 'pending_update' | 'pending_delete' | 'failed';
  installed_version: string | null;
  desired_version: string | null;
  drifted: boolean;
  product_id?: string;
  last_error?: string;
}

export interface Page<T> {
  data: T[];
  next_cursor: string | null;
}

export interface IssuedSession {
  access_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

/**
 * What the deployment says about itself, before you have any credentials.
 *
 * `demo_account` is `null` unless the operator turned it on. When it is not
 * null the password is real and deliberately public — see the server's
 * `wiki/information/api-contract.md`.
 */
export interface Meta {
  readonly demo_account: { readonly email: string; readonly password: string } | null;
}

/** A news item. `body` is Markdown, as written — the server never renders it. */
export interface News {
  id: string;
  title: string;
  summary: string;
  body: string;
  created_at: string;
  updated_at: string;
  hidden: boolean;
  hidden_at?: string;
  author?: Account;
}
