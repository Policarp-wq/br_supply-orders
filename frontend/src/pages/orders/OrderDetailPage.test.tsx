import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../api/client'
import OrderDetailPage from './OrderDetailPage'

const NEW_ORDER = {
  id: 11,
  customer_name: 'ИП Клиент',
  status: 'new' as const,
  status_display: 'Новый',
  shipped_at: null,
  created_at: '2025-01-02T10:00:00Z',
  updated_at: '2025-01-02T10:00:00Z',
  total_amount: 480,
  items: [
    {
      id: 1,
      product: 1,
      product_name: 'Кофе',
      product_sku: 'SKU-001',
      quantity: 2,
      unit_price: '110.00',
    },
  ],
}

function renderAt(id: number) {
  return render(
    <MemoryRouter initialEntries={[`/orders/${id}`]}>
      <Routes>
        <Route path="/orders/:id" element={<OrderDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OrderDetailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows new order with assemble button only', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: NEW_ORDER })

    renderAt(11)

    await waitFor(() => {
      expect(screen.getByText('Заказ №11')).toBeInTheDocument()
      expect(screen.getByText('Новый')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /собрать/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /отгрузить/i })).toBeNull()
    })
  })

  it('shows ship button for assembled order', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { ...NEW_ORDER, status: 'assembled', status_display: 'Собран' },
    })

    renderAt(11)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /отгрузить/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /собрать/i })).toBeNull()
    })
  })

  it('calls assemble endpoint when Собрать clicked', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: NEW_ORDER })
    const post = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { ...NEW_ORDER, status: 'assembled' },
    })

    renderAt(11)
    await waitFor(() => screen.getByRole('button', { name: /собрать/i }))
    fireEvent.click(screen.getByRole('button', { name: /собрать/i }))

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/orders/11/assemble/')
    })
  })
})
