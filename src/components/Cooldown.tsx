import { ApiError } from '../api/errors.js';

/**
 * Renders a cooldown refusal as a date rather than as a bare "no".
 *
 * The server puts `available_at` in the error details for both the handle and
 * the product-id cooldowns. The panel does not compute the cooldown itself —
 * that would be a second implementation of a server rule, and the two would
 * eventually disagree with the browser being the copy that is wrong.
 */
export function CooldownNotice({ error }: { error: unknown }) {
  if (!(error instanceof ApiError)) return null;
  const at = error.availableAt;

  return (
    <div className="callout callout--warn" role="alert">
      <span className="callout__icon" aria-hidden="true">
        !
      </span>
      <p className="callout__body">
        {error.message}
        {at !== undefined && (
          <>
            {' '}
            Available again on <time dateTime={at.toISOString()}>{at.toDateString()}</time>.
          </>
        )}
      </p>
    </div>
  );
}
