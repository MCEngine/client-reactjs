import { useState, type ReactNode } from 'react';

export interface ConfirmButtonProps {
  label: string;
  /** What the person must type to confirm. Omit for a plain two-step confirm. */
  confirmationPhrase?: string;
  description: ReactNode;
  confirmLabel?: string;
  onConfirm(): Promise<void> | void;
  disabled?: boolean;
}

/**
 * A destructive action behind an explicit confirm, with a cancel beside it.
 *
 * The panel never fires a destructive request from one click. Where the server
 * also requires the name to be repeated in the body — deleting a product does —
 * this asks for the same phrase, so the two agree and the person is not told
 * "confirmation mismatch" by a dialog that never asked.
 *
 * This is a courtesy, not a guard: the guard is on the server, and a check that
 * exists only here would be a bug.
 */
export function ConfirmButton({
  label,
  confirmationPhrase,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  disabled = false,
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  const ready = confirmationPhrase === undefined || typed === confirmationPhrase;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} disabled={disabled}>
        {label}
      </button>
    );
  }

  return (
    <div role="group" aria-label={label}>
      <p>{description}</p>

      {confirmationPhrase !== undefined && (
        <label>
          Type <code>{confirmationPhrase}</code> to confirm
          <input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            aria-label={`Type ${confirmationPhrase} to confirm`}
            autoComplete="off"
          />
        </label>
      )}

      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setTyped('');
        }}
        disabled={busy}
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={() => {
          setBusy(true);
          void Promise.resolve(onConfirm()).finally(() => {
            setBusy(false);
            setOpen(false);
            setTyped('');
          });
        }}
        disabled={!ready || busy}
      >
        {busy ? 'Working…' : confirmLabel}
      </button>
    </div>
  );
}
