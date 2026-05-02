import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../../api/client'
import type { Supply } from '../../api/types'
import { extractError } from '../../utils/errors'

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('ru-RU')
}

export default function SupplyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [supply, setSupply] = useState<Supply | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!id) return
    setLoading(true)
    apiClient
      .get<Supply>(`/supplies/${id}/`)
      .then((r) => {
        setSupply(r.data)
        setError(null)
      })
      .catch((err) => setError(extractError(err, 'Не удалось загрузить поставку.')))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function handleReceive() {
    if (!id) return
    setActing(true)
    setError(null)
    try {
      await apiClient.post(`/supplies/${id}/receive/`)
      setSuccess('Поставка принята, остатки обновлены.')
      load()
    } catch (err) {
      setError(extractError(err, 'Не удалось принять поставку.'))
    } finally {
      setActing(false)
    }
  }

  if (loading || !supply) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        {loading ? <CircularProgress /> : <Alert severity="error">{error}</Alert>}
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Поставка №{supply.id}
        </Typography>
        <Button variant="text" onClick={() => navigate('/supplies')}>
          К списку
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', rowGap: 1, columnGap: 2 }}>
            <Typography color="text.secondary">Поставщик:</Typography>
            <Typography>{supply.supplier_name}</Typography>
            <Typography color="text.secondary">Статус:</Typography>
            <Box>
              <Chip
                label={supply.status_display}
                size="small"
                color={supply.status === 'received' ? 'success' : 'warning'}
              />
            </Box>
            <Typography color="text.secondary">Создана:</Typography>
            <Typography>{formatDate(supply.created_at)}</Typography>
            <Typography color="text.secondary">Принята:</Typography>
            <Typography>{formatDate(supply.received_at)}</Typography>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        Позиции
      </Typography>
      <Card sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Товар</TableCell>
              <TableCell>Артикул</TableCell>
              <TableCell align="right">Количество</TableCell>
              <TableCell align="right">Цена</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {supply.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.product_name}</TableCell>
                <TableCell>{item.product_sku}</TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">{item.unit_price}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {supply.status === 'pending' && (
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircleIcon />}
          onClick={handleReceive}
          disabled={acting}
        >
          {acting ? 'Принимаем…' : 'Принять поставку'}
        </Button>
      )}

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        message={success}
      />
    </Box>
  )
}
