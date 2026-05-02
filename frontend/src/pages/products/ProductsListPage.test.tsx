import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../api/client'
import ProductsListPage from './ProductsListPage'

describe('ProductsListPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders products with supplier name and stock', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            name: 'Кофе зерновой',
            sku: 'SKU-001',
            unit_price: '950.00',
            quantity_in_stock: 42,
            supplier: 1,
            supplier_name: 'ООО ОптТорг',
            created_at: '',
            updated_at: '',
          },
        ],
      },
    })

    render(
      <MemoryRouter>
        <ProductsListPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Кофе зерновой')).toBeInTheDocument()
      expect(screen.getByText('ООО ОптТорг')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()
    })
  })
})
