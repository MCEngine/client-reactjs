import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createApiClient, type ApiClient } from '../api/client.js';
import { ApiError } from '../api/errors.js';
import type { Account, IssuedSession } from '../api/types.js';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthValue {
  status: AuthStatus;
  account: Account | undefined;
  api: ApiClient;
  signIn(email: string, password: string, deviceLabel?: string): Promise<void>;
  register(input: { handle: string; displayName: string; email: string; password: string }): Promise<void>;
  signOut(): Promise<void>;
  refreshAccount(): Promise<void>;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
  /** Injected in tests. Production builds one from the API base URL. */
  client?: ApiClient;
  baseUrl?: string;
}

/**
 * Holds the access token in memory and nothing anywhere else.
 *
 * Not `localStorage`: a token there is readable by any script that ends up on
 * the page, and it outlives the tab. The refresh token is an HttpOnly cookie the
 * panel cannot read at all, which is what lets a reload recover a session
 * without the panel ever having stored a credential.
 */
export function AuthProvider({ children, client, baseUrl }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [account, setAccount] = useState<Account | undefined>(undefined);

  // A second client with no refresh hook, used only to call refresh itself.
  // Without it, a failing refresh would try to refresh, and recurse. Declared
  // before the main client because that one closes over it.
  //
  // An injected client is used for both. A test that supplies one supplies the
  // whole transport, and building a real client here for the refresh call would
  // send it past the stub to the network -- which is a bug that only shows up
  // as a session that never recovers.
  const bare = useMemo(
    () => client ?? createApiClient(baseUrl === undefined ? {} : { baseUrl }),
    [client, baseUrl],
  );

  // A ref, not state: the client must not change identity between renders, or
  // every effect depending on it re-runs and the in-flight refresh is lost.
  const apiRef = useRef<ApiClient>(undefined as unknown as ApiClient);
  if (apiRef.current === undefined) {
    apiRef.current =
      client ??
      createApiClient({
        ...(baseUrl === undefined ? {} : { baseUrl }),
        onUnauthorized: async () => {
          try {
            const issued = await bare.request<IssuedSession>('/api/v1/auth/refresh', {
              method: 'POST',
            });
            return issued.access_token;
          } catch {
            return undefined;
          }
        },
      });
  }
  const api = apiRef.current;

  const loadAccount = useCallback(async () => {
    try {
      const me = await api.request<Account>('/api/v1/me');
      setAccount(me);
      setStatus('authenticated');
    } catch (error) {
      if (error instanceof ApiError && error.isAuthFailure) {
        setAccount(undefined);
        setStatus('anonymous');
        return;
      }
      // A network failure is not a sign-out: the session may be perfectly fine
      // and the server merely unreachable.
      setStatus('anonymous');
    }
  }, [api]);

  // On load, try the refresh cookie. This is what makes a reload keep the
  // session without the panel ever having stored a token.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const issued = await bare.request<IssuedSession>('/api/v1/auth/refresh', { method: 'POST' });
        if (cancelled) return;
        api.setAccessToken(issued.access_token);
        await loadAccount();
      } catch {
        if (!cancelled) setStatus('anonymous');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, bare, loadAccount]);

  const adopt = useCallback(
    async (issued: IssuedSession) => {
      api.setAccessToken(issued.access_token);
      await loadAccount();
    },
    [api, loadAccount],
  );

  const value = useMemo<AuthValue>(
    () => ({
      status,
      account,
      api,
      async signIn(email, password, deviceLabel) {
        const issued = await api.request<IssuedSession>('/api/v1/auth/login', {
          method: 'POST',
          body: { email, password, ...(deviceLabel === undefined ? {} : { deviceLabel }) },
        });
        await adopt(issued);
      },
      async register(input) {
        const issued = await api.request<IssuedSession>('/api/v1/auth/register', {
          method: 'POST',
          body: input,
        });
        await adopt(issued);
      },
      /**
       * Signs out locally whatever the server says, and never rejects.
       *
       * The person clicked sign out; they are signed out. Propagating a server
       * failure here gives the caller nothing to do with it — there is no
       * recovery — and leaves an unhandled rejection behind every click that
       * happened while the network was down. The refresh cookie is cleared by
       * the server when it can be, and is useless without a live session row
       * when it cannot.
       */
      async signOut() {
        try {
          await api.request('/api/v1/auth/logout', { method: 'POST' });
        } catch {
          // Deliberately ignored, per the note above.
        }
        api.setAccessToken(undefined);
        setAccount(undefined);
        setStatus('anonymous');
      },
      refreshAccount: loadAccount,
    }),
    [status, account, api, adopt, loadAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (value === undefined) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return value;
}
