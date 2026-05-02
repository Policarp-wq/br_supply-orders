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
import BuildIcon from '@mui/icons-material/Build'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../../api/client'
import type { Order, OrderStatus } from '../../api/types'
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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!id) return
    setLoading(true)
    apiClient
      .get<Order>(`/orders/${id}/`)
      .then((r) => {
        setOrder(r.data)
        setError(null)
      })
      .catch((err) => setError(extractError(err, 'Не удалось загрузить заказ.')))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function transition(action: 'assemble' | 'ship') {
    if (!id) return
    setActing(true)
    setError(null)
    try {
      await apiClient.post(`/orders/${id}/${action}/`)
      setSuccess(action === 'assemble' ? 'Заказ переведён в «Собран».' : 'Заказ отгружен.')
      load()
    } catch (err) {
      setError(extractError(err, 'Не удалось выполнить переход.'))
    } finally {
      setActing(false)
    }
  }

  if (loading || !order) {
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
          Заказ №{order.id}
        </Typography>
        <Button variant="text" onClick={() => navigate('/orders')}>
          К списку
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', rowGap: 1, columnGap: 2 }}>
            <Typography color="text.secondary">Клиент:</Typography>
            <Typography>{order.customer_name}</Typography>
            <Typography color="text.secondary">Статус:</Typography>
            <Box>
              <Chip
                label={order.status_display}
                size="small"
                color={STATUS_COLOR[order.status]}
              />
            </Box>
            <Typography color="text.secondary">Создан:</Typography>
            <Typography>{formatDate(order.created_at)}</Typography>
            <Typography color="text.secondary">Отгружен:</Typography>
            <Typography>{formatDate(order.shipped_at)}</Typography>
            <Typography color="text.secondary">Сумма:</Typography>
            <Typography>{order.total_amount}</Typography>
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
            {order.items.map((item) => (
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

      <Box sx={{ display: 'flex', gap: 2 }}>
        {order.status === 'new' && (
          <Button
            variant="contained"
            startIcon={<BuildIcon />}
            onClick={() => transition('assemble')}
            disabled={acting}
          >
            {acting ? '…' : 'Собрать'}
          </Button>
        )}
        {order.status === 'assembled' && (
          <Button
            variant="contained"
            color="success"
            startIcon={<LocalShippingIcon />}
            onClick={() => transition('ship')}
            disabled={acting}
          >
            {acting ? '…' : 'Отгрузить'}
          </Button>
        )}
      </Box>

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        message={success}
      />
    </Box>
  )
}
