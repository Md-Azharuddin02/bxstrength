// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function TestConsumer() {
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'LOGGED_IN' : 'LOGGED_OUT'}</span>
      <span data-testid="user-email">{user?.email || 'NONE'}</span>
      <button onClick={logout} data-testid="logout-btn">Logout</button>
    </div>
  );
}

describe('Unit: Frontend AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('FE-AUTH-01: Renders initial unauthenticated state when no session stored', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_OUT');
    expect(screen.getByTestId('user-email').textContent).toBe('NONE');
  });

  it('FE-AUTH-02: Clears session on logout', () => {
    const userObj = {
      id: 'u-1',
      name: 'Logged In User',
      email: 'test@bxstrength.com',
      role: 'client',
      isVerified: true,
      status: 'active',
    };
    localStorage.setItem('velocity_current_user', JSON.stringify(userObj));
    localStorage.setItem('velocity_users', JSON.stringify([userObj]));
    localStorage.setItem('velocity_jwt_token', 'test_token_123');

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_IN');

    act(() => {
      screen.getByTestId('logout-btn').click();
    });

    expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_OUT');
  });
});
