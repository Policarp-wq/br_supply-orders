import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import { apiClient } from '../api/client'
import LoginPage from './LoginPage'

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('shows form with username and password fields', () => {
    renderLogin()
    expect(screen.getByLabelText(/логин/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument()
  })

  it('shows error message when login fails', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValueOnce({
      response: { status: 401, data: { detail: 'Неверный логин или пароль.' } },
    })

    renderLogin()
    fireEvent.change(screen.getByLabelText(/логин/i), { target: { value: 'a' } })
    fireEvent.change(screen.getByLabelText(/пароль/i), { target: { value: 'b' } })
    fireEvent.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(() => {
      expect(screen.getByText('Неверный логин или пароль.')).toBeInTheDocument()
    })
  })

  it('stores user on successful login', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        access: 'a',
        refresh: 'r',
        user: {
          id: 1,
          username: 'admin',
          email: '',
          first_name: '',
          last_name: '',
          role: 'admin',
          role_display: 'Администратор',
          is_active: true,
        },
      },
    })

    renderLogin()
    fireEvent.change(screen.getByLabelText(/логин/i), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText(/пароль/i), { target: { value: 'admin' } })
    fireEvent.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(() => {
      expect(localStorage.getItem('access')).toBe('a')
    })
  })
})
