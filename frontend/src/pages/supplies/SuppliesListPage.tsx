import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import type { Paginated, Supply } from '../../api/types'
import { extractError } from '../../utils/errors'

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('ru-RU')
}

export default function SuppliesListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Supply[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiClient.get<Paginated<Supply>>('/supplies/', {
        params: { page_size: 100 },
      })
      setItems(response.data.results)
      setError(null)
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить поставки.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const columns = useMemo<GridColDef<Supply>[]>(
    () => [
      { field: 'id', headerName: '№', width: 80 },
      { field: 'supplier_name', headerName: 'Поставщик', flex: 1, minWidth: 220 },
      {
        field: 'status_display',
        headerName: 'Статус',
        width: 140,
        renderCell: (params) => (
          <Chip
            label={params.value}
            size="small"
            color={params.row.status === 'received' ? 'success' : 'warning'}
          />
        ),
      },
      {
        field: 'created_at',
        headerName: 'Создана',
        width: 180,
        valueFormatter: (value: string) => formatDate(value),
      },
      {
        field: 'received_at',
        headerName: 'Принята',
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
          Поставки
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/supplies/new')}
        >
          Создать
        </Button>
      </Box>

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
            onRowClick={(params) => navigate(`/supplies/${params.row.id}`)}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            pageSizeOptions={[10, 25, 50]}
            sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
          />
        )}
      </Box>
    </Box>
  )
}
