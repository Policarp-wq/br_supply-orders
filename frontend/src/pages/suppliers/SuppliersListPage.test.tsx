import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../api/client'
import SuppliersListPage from './SuppliersListPage'

describe('SuppliersListPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders suppliers fetched from API', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            name: 'ООО Тест',
            inn: '7700000123',
            contact_email: 'test@example.com',
            phone: '+7 495 000-00-00',
            created_at: '',
            updated_at: '',
          },
        ],
      },
    })

    render(
      <MemoryRouter>
        <SuppliersListPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('ООО Тест')).toBeInTheDocument()
      expect(screen.getByText('7700000123')).toBeInTheDocument()
    })
  })

  it('shows error alert when API call fails', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValueOnce({
      response: { status: 500, data: { detail: 'server error' } },
    })

    render(
      <MemoryRouter>
        <SuppliersListPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('server error')).toBeInTheDocument()
    })
  })
})
