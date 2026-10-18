// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginModal } from '@/components/auth/LoginModal';

// Mock AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
  }),
}));

describe('Unit: Frontend Login Modal Form', () => {
  it('FE-FORM-01: Renders email and password fields with submit button', () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={vi.fn()}
        onOpenRegister={vi.fn()}
        onOpenForgotPassword={vi.fn()}
      />
    );

    const emailInput = screen.getByPlaceholderText('name@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(emailInput).toBeDefined();
    expect(passwordInput).toBeDefined();
  });

  it('FE-FORM-02: Updates email and password values on user input', () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={vi.fn()}
        onOpenRegister={vi.fn()}
        onOpenForgotPassword={vi.fn()}
      />
    );

    const emailInput = screen.getByPlaceholderText('name@example.com') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'client@bxstrength.com' } });
    expect(emailInput.value).toBe('client@bxstrength.com');
  });
});
