import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import type { Paginated, Product } from '../../api/types'
import { extractError } from '../../utils/errors'

export default function ProductsListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiClient.get<Paginated<Product>>('/products/', {
        params: { search: search || undefined, page_size: 100 },
      })
      setItems(response.data.results)
      setError(null)
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить товары.'))
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    void load()
  }, [load])

  const columns = useMemo<GridColDef<Product>[]>(
    () => [
      { field: 'name', headerName: 'Наименование', flex: 1, minWidth: 220 },
      { field: 'sku', headerName: 'Артикул', width: 140 },
      { field: 'supplier_name', headerName: 'Поставщик', flex: 1, minWidth: 180 },
      {
        field: 'unit_price',
        headerName: 'Цена',
        width: 120,
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'quantity_in_stock',
        headerName: 'Остаток',
        width: 110,
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'actions',
        headerName: '',
        width: 80,
        sortable: false,
        renderCell: (params) => (
          <Tooltip title="Редактировать">
            <IconButton
              size="small"
              onClick={() => navigate(`/products/${params.row.id}/edit`)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [navigate],
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Товары
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/products/new')}
        >
          Создать
        </Button>
      </Box>

      <TextField
        size="small"
        label="Поиск по наименованию или артикулу"
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
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            pageSizeOptions={[10, 25, 50]}
          />
        )}
      </Box>
    </Box>
  )
}
