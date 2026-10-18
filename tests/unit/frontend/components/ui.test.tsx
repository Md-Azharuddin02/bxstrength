// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

describe('Unit: Frontend ConfirmModal Component', () => {
  it('FE-UI-01: Renders confirmation modal with title and action message', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        title="Confirm Plan Cancellation"
        message="Are you sure you want to cancel your monthly subscription?"
        onConfirm={onConfirm}
        onCancel={onClose}
      />
    );

    expect(screen.getByText('Confirm Plan Cancellation')).toBeDefined();
    expect(screen.getByText(/Are you sure you want to cancel/i)).toBeDefined();

    const input = screen.getByPlaceholderText('Type "CONFIRM"');
    fireEvent.change(input, { target: { value: 'CONFIRM' } });

    const confirmBtn = screen.getByRole('button', { name: /confirm action/i });
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
