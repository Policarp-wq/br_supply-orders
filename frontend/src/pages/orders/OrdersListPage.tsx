import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import type { Order, OrderStatus, Paginated } from '../../api/types'
import { extractError } from '../../utils/errors'

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('ru-RU')
}

const STATUS_COLOR: Record<OrderStatus, 'default' | 'info' | 'success'> = {
  new: 'info',
  assembled: 'default',
  shipped: 'success',
}

export default function OrdersListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiClient.get<Paginated<Order>>('/orders/', {
        params: { search: search || undefined, page_size: 100 },
      })
      setItems(response.data.results)
      setError(null)
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить заказы.'))
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    void load()
  }, [load])

  const columns = useMemo<GridColDef<Order>[]>(
    () => [
      { field: 'id', headerName: '№', width: 80 },
      { field: 'customer_name', headerName: 'Клиент', flex: 1, minWidth: 220 },
      {
        field: 'status_display',
        headerName: 'Статус',
        width: 140,
        renderCell: (params) => (
          <Chip label={params.value} size="small" color={STATUS_COLOR[params.row.status]} />
        ),
      },
      {
        field: 'total_amount',
        headerName: 'Сумма',
        width: 130,
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'created_at',
        headerName: 'Создан',
        width: 180,
        valueFormatter: (value: string) => formatDate(value),
      },
      {
        field: 'shipped_at',
        headerName: 'Отгружен',
        width: 180,
        valueFormatter: (value: string | null) => formatDate(value),
      },
    ],
    [],
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Заказы
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/orders/new')}
        >
          Создать
        </Button>
      </Box>

      <TextField
        size="small"
        label="Поиск по клиенту"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 360 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 560, width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={items}
            columns={columns}
            disableRowSelectionOnClick
            onRowClick={(params) => navigate(`/orders/${params.row.id}`)}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            pageSizeOptions={[10, 25, 50]}
            sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
          />
        )}
      </Box>
    </Box>
  )
}
