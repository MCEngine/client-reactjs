/**
 * The error envelope every route in `@mcengine/server-expressjs` returns.
 *
 * Mirrored here as a type only. This repository does not own the contract and
 * does not re-implement any of it — see `wiki/information/api-contract.md` in
 * the server repository.
 */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/** A request the server refused, carrying the code the panel branches on. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown> | undefined;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.error.code;
    this.details = body.error.details;
  }

  /** True when signing in again would fix it. */
  get isAuthFailure(): boolean {
    return this.status === 401;
  }

  /**
   * When a cooldown says the action becomes possible, if it said so.
   *
   * The server puts `available_at` in `details` for both the handle and the
   * product-id cooldowns, so the panel can render "in 18 days" rather than a
   * bare refusal.
   */
  get availableAt(): Date | undefined {
    const raw = this.details?.['available_at'];
    if (typeof raw !== 'string') return undefined;
    const at = new Date(raw);
    return Number.isNaN(at.getTime()) ? undefined : at;
  }
}

/** A failure that never reached the server. */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('The server could not be reached.');
    this.name = 'NetworkError';
    this.cause = cause;
  }
}
