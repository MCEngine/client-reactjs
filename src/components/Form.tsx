import { useState, type FormEvent, type ReactNode } from 'react';
import { describeError } from './Async.js';

export interface FormProps {
  submitLabel: string;
  children: ReactNode;
  onSubmit(): Promise<void>;
  /** Shown after a successful submit, until the next one. */
  successMessage?: string;
}

/**
 * A form that submits once at a time and shows what went wrong.
 *
 * Every write in the panel goes through this, so a failed request always
 * produces a visible message rather than a silent no-op — which is what an
 * unhandled rejection in an `onClick` looks like to a person.
 */
export function Form({ submitLabel, children, onSubmit, successMessage }: FormProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [done, setDone] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(undefined);
    setDone(false);

    void onSubmit()
      .then(() => setDone(true))
      .catch((cause: unknown) => setError(describeError(cause)))
      .finally(() => setBusy(false));
  };

  return (
    <form onSubmit={submit}>
      {children}

      {error !== undefined && (
        <div className="callout callout--danger" role="alert">
          <span className="callout__icon" aria-hidden="true">
            !
          </span>
          <p className="callout__body">{error}</p>
        </div>
      )}
      {done && successMessage !== undefined && (
        <div className="callout callout--ok" role="status">
          <span className="callout__icon" aria-hidden="true">
            ✓
          </span>
          <p className="callout__body">{successMessage}</p>
        </div>
      )}

      <div className="form__actions">
        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? 'Working…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export interface FieldProps {
  label: string;
  value: string;
  onChange(value: string): void;
  type?: 'text' | 'email' | 'password' | 'url';
  required?: boolean;
  hint?: ReactNode;
  disabled?: boolean;
}

export function Field({ label, value, onChange, type = 'text', required, hint, disabled }: FieldProps) {
  return (
    <p className="field">
      <label>
        {label}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          disabled={disabled}
        />
      </label>
      {hint !== undefined && <small className="field__hint">{hint}</small>}
    </p>
  );
}
