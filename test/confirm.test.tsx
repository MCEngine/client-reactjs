import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmButton } from '../src/components/ConfirmButton.js';

describe('ConfirmButton', () => {
  it('never fires from a single click', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmButton label="Delete" description="This cannot be undone." onConfirm={onConfirm} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('offers a cancel beside the confirm, and cancelling does nothing', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmButton label="Delete" description="Gone forever." onConfirm={onConfirm} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('keeps confirm disabled until the phrase matches exactly', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmButton
        label="Delete product"
        confirmationPhrase="acme-tools"
        description="Repeat the id."
        onConfirm={onConfirm}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Delete product' }));
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    expect(confirm).toBeDisabled();

    await userEvent.type(screen.getByRole('textbox'), 'acme-too');
    expect(confirm).toBeDisabled();

    await userEvent.type(screen.getByRole('textbox'), 'ls');
    expect(confirm).toBeEnabled();

    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('is disabled outright when the action is not available', () => {
    render(
      <ConfirmButton label="Delete" description="x" onConfirm={vi.fn()} disabled />,
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });
});
