import { render, screen } from '@testing-library/react'
import { describe, expect, it, beforeEach } from 'vitest'
import App from './App'

describe('App routing', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState({}, '', '/')
  })

  it('redirects unauthenticated user to /login', () => {
    render(<App />)
    expect(screen.getByText(/войдите, чтобы продолжить/i)).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('renders layout when user is authenticated', () => {
    localStorage.setItem('access', 'token')
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
        role_display: 'Администратор',
        is_active: true,
      }),
    )
    render(<App />)
    expect(screen.getByText('Поставки и заказы')).toBeInTheDocument()
    expect(screen.getAllByText('Поставщики').length).toBeGreaterThan(0)
    expect(screen.getByText('Администратор')).toBeInTheDocument()
  })
})
