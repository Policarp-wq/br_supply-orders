import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../api/client'
import SupplyDetailPage from './SupplyDetailPage'

const PENDING_SUPPLY = {
  id: 7,
  supplier: 1,
  supplier_name: 'ООО Тест',
  status: 'pending' as const,
  status_display: 'Ожидается',
  received_at: null,
  created_at: '2025-01-01T10:00:00Z',
  updated_at: '2025-01-01T10:00:00Z',
  items: [
    {
      id: 1,
      product: 1,
      product_name: 'Кофе',
      product_sku: 'SKU-001',
      quantity: 10,
      unit_price: '950.00',
    },
  ],
}

function renderAt(id: number) {
  return render(
    <MemoryRouter initialEntries={[`/supplies/${id}`]}>
      <Routes>
        <Route path="/supplies/:id" element={<SupplyDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SupplyDetailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows pending supply with Принять button', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: PENDING_SUPPLY })

    renderAt(7)

    await waitFor(() => {
      expect(screen.getByText('Поставка №7')).toBeInTheDocument()
      expect(screen.getByText('ООО Тест')).toBeInTheDocument()
      expect(screen.getByText('Ожидается')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /принять поставку/i })).toBeInTheDocument()
    })
  })

  it('calls receive endpoint when Принять clicked', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: PENDING_SUPPLY })
    const post = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValueOnce({ data: { ...PENDING_SUPPLY, status: 'received' } })

    renderAt(7)
    await waitFor(() => screen.getByRole('button', { name: /принять поставку/i }))
    fireEvent.click(screen.getByRole('button', { name: /принять поставку/i }))

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/supplies/7/receive/')
    })
  })
})
