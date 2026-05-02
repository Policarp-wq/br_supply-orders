import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import type { Paginated, Product, Supplier } from '../../api/types'
import { extractError } from '../../utils/errors'

interface FormState {
  name: string
  sku: string
  supplier: number | ''
  unit_price: string
}

const EMPTY: FormState = { name: '', sku: '', supplier: '', unit_price: '' }

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<FormState>(EMPTY)
  const [stock, setStock] = useState<number>(0)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const promises: Promise<unknown>[] = [
      apiClient
        .get<Paginated<Supplier>>('/suppliers/', { params: { page_size: 200 } })
        .then((r) => setSuppliers(r.data.results)),
    ]
    if (isEdit) {
      promises.push(
        apiClient.get<Product>(`/products/${id}/`).then((r) => {
          setForm({
            name: r.data.name,
            sku: r.data.sku,
            supplier: r.data.supplier,
            unit_price: r.data.unit_price,
          })
          setStock(r.data.quantity_in_stock)
        }),
      )
    }
    Promise.all(promises)
      .catch((err) => setError(extractError(err, 'Не удалось загрузить данные.')))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (form.supplier === '') {
      setError('Выберите поставщика.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const payload = { ...form, supplier: form.supplier }
      if (isEdit) {
        await apiClient.patch(`/products/${id}/`, payload)
      } else {
        await apiClient.post('/products/', payload)
      }
      navigate('/products')
    } catch (err) {
      setError(extractError(err, 'Не удалось сохранить товар.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!isEdit) return
    if (!window.confirm('Удалить товар?')) return
    setSubmitting(true)
    try {
      await apiClient.delete(`/products/${id}/`)
      navigate('/products')
    } catch (err) {
      setError(extractError(err, 'Не удалось удалить товар.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEdit ? 'Редактирование товара' : 'Новый товар'}
      </Typography>
      <Card sx={{ maxWidth: 600 }}>
        <CardContent>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              label="Наименование"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              fullWidth
              disabled={submitting}
            />
            <TextField
              label="Артикул"
              value={form.sku}
              onChange={(e) => update('sku', e.target.value)}
              required
              fullWidth
              disabled={submitting}
            />
            <TextField
              select
              label="Поставщик"
              value={form.supplier}
              onChange={(e) => update('supplier', Number(e.target.value))}
              required
              fullWidth
              disabled={submitting}
            >
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Цена за единицу"
              type="number"
              value={form.unit_price}
              onChange={(e) => update('unit_price', e.target.value)}
              required
              fullWidth
              disabled={submitting}
              slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
            />
            {isEdit && (
              <TextField
                label="Остаток на складе"
                value={stock}
                disabled
                fullWidth
                helperText="Меняется автоматически приёмом поставок и отгрузкой заказов"
              />
            )}
            {error && <Alert severity="error">{error}</Alert>}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Сохранение…' : 'Сохранить'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/products')}
                disabled={submitting}
              >
                Отмена
              </Button>
              {isEdit && user?.role === 'admin' && (
                <Button
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                  disabled={submitting}
                  sx={{ ml: 'auto' }}
                >
                  Удалить
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
