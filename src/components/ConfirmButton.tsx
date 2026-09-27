import { useEffect, useRef, useState, type ReactNode } from 'react';

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
 * The confirmation is a **dialog over the page**, not a panel that appears
 * inside it: a destructive action should interrupt, and something that expands
 * in place can be confirmed without the eye ever leaving the button. Escape
 * cancels, and the cancel button takes focus when it opens — so the key a
 * hurried person hits, and the button focus lands on, are both the safe one.
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
  const cancelRef = useRef<HTMLButtonElement>(null);

  const ready = confirmationPhrase === undefined || typed === confirmationPhrase;

  const close = () => {
    setOpen(false);
    setTyped('');
  };

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) {
    return (
      <button
        className="btn btn--danger"
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="modal" role="presentation" onClick={(event) => {
      // A click on the scrim is a cancel; a click inside the dialog is not.
      if (event.target === event.currentTarget) close();
    }}>
      <div className="modal__dialog" role="dialog" aria-modal="true" aria-label={label}>
        <h2 className="modal__title">{label}</h2>
        <p>{description}</p>

        {confirmationPhrase !== undefined && (
          <p className="field">
            <label>
              Type <code>{confirmationPhrase}</code> to confirm
              <input
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                aria-label={`Type ${confirmationPhrase} to confirm`}
                autoComplete="off"
              />
            </label>
          </p>
        )}

        <div className="btn-row">
          {/* Cancel comes first, and is the plainer of the two. The dangerous
              button should never be the one a hurried click lands on. */}
          <button className="btn" type="button" ref={cancelRef} onClick={close} disabled={busy}>
            Cancel
          </button>

          <button
            className="btn btn--sponsor"
            type="button"
            onClick={() => {
              setBusy(true);
              void Promise.resolve(onConfirm()).finally(() => {
                setBusy(false);
                close();
              });
            }}
            disabled={!ready || busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
