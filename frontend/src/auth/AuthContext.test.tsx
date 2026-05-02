import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import { apiClient } from '../api/client'

function Probe() {
  const { user, isAuthenticated, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="username">{user?.username ?? '-'}</span>
      <span data-testid="role">{user?.role ?? '-'}</span>
      <button
        type="button"
        onClick={() => {
          void login('admin', 'admin')
        }}
      >
        login
      </button>
      <button type="button" onClick={logout}>
        logout
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('login stores tokens and user, exposes isAuthenticated', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        access: 'a',
        refresh: 'r',
        user: {
          id: 1,
          username: 'admin',
          email: 'a@l',
          first_name: '',
          last_name: '',
          role: 'admin',
          role_display: 'Администратор',
          is_active: true,
        },
      },
    })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    expect(screen.getByTestId('auth').textContent).toBe('no')
    await act(async () => {
      screen.getByText('login').click()
    })

    expect(screen.getByTestId('auth').textContent).toBe('yes')
    expect(screen.getByTestId('username').textContent).toBe('admin')
    expect(screen.getByTestId('role').textContent).toBe('admin')
    expect(localStorage.getItem('access')).toBe('a')
    expect(localStorage.getItem('refresh')).toBe('r')
  })

  it('logout clears state and storage', async () => {
    localStorage.setItem('access', 'a')
    localStorage.setItem('refresh', 'r')
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 1,
        username: 'admin',
        email: '',
        first_name: '',
        last_name: '',
        role: 'admin',
        role_display: '',
        is_active: true,
      }),
    )

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    expect(screen.getByTestId('auth').textContent).toBe('yes')
    await act(async () => {
      screen.getByText('logout').click()
    })

    expect(screen.getByTestId('auth').textContent).toBe('no')
    expect(localStorage.getItem('access')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})
