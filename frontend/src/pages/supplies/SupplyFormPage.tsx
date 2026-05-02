import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import type { Paginated, Product, Supplier } from '../../api/types'
import { extractError } from '../../utils/errors'

interface Line {
  product: number | ''
  quantity: number
  unit_price: string
}

const EMPTY_LINE: Line = { product: '', quantity: 1, unit_price: '0.00' }

export default function SupplyFormPage() {
  const navigate = useNavigate()
  const [supplier, setSupplier] = useState<number | ''>('')
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY_LINE }])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      apiClient.get<Paginated<Supplier>>('/suppliers/', { params: { page_size: 200 } }),
      apiClient.get<Paginated<Product>>('/products/', { params: { page_size: 200 } }),
    ])
      .then(([s, p]) => {
        setSuppliers(s.data.results)
        setProducts(p.data.results)
      })
      .catch((err) => setError(extractError(err, 'Не удалось загрузить справочники.')))
      .finally(() => setLoading(false))
  }, [])

  const filteredProducts = supplier === ''
    ? products
    : products.filter((p) => p.supplier === supplier)

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  function addLine() {
    setLines((prev) => [...prev, { ...EMPTY_LINE }])
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  function setProductOnLine(index: number, productId: number) {
    const product = products.find((p) => p.id === productId)
    updateLine(index, {
      product: productId,
      unit_price: product?.unit_price ?? '0.00',
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (supplier === '') {
      setError('Выберите поставщика.')
      return
    }
    if (lines.length === 0 || lines.some((l) => l.product === '' || l.quantity < 1)) {
      setError('Заполните хотя бы одну позицию.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await apiClient.post('/supplies/', {
        supplier,
        items: lines.map((l) => ({
          product: l.product,
          quantity: Number(l.quantity),
          unit_price: l.unit_price,
        })),
      })
      navigate('/supplies')
    } catch (err) {
      setError(extractError(err, 'Не удалось создать поставку.'))
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
        Новая поставка
      </Typography>
      <Card>
        <CardContent>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              select
              label="Поставщик"
              value={supplier}
              onChange={(e) => setSupplier(Number(e.target.value))}
              required
              sx={{ maxWidth: 480 }}
              disabled={submitting}
            >
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>

            <Typography variant="h6" sx={{ mt: 2 }}>
              Позиции
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '50%' }}>Товар</TableCell>
                  <TableCell sx={{ width: 140 }}>Количество</TableCell>
                  <TableCell sx={{ width: 160 }}>Цена</TableCell>
                  <TableCell sx={{ width: 60 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((line, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <TextField
                        select
                        value={line.product}
                        onChange={(e) => setProductOnLine(idx, Number(e.target.value))}
                        required
                        fullWidth
                        size="small"
                        disabled={submitting}
                      >
                        {filteredProducts.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(idx, { quantity: Number(e.target.value) })
                        }
                        required
                        size="small"
                        disabled={submitting}
                        slotProps={{ htmlInput: { min: 1 } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={line.unit_price}
                        onChange={(e) => updateLine(idx, { unit_price: e.target.value })}
                        required
                        size="small"
                        disabled={submitting}
                        slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => removeLine(idx)}
                        disabled={submitting || lines.length === 1}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button startIcon={<AddIcon />} onClick={addLine} sx={{ alignSelf: 'flex-start' }}>
              Добавить позицию
            </Button>

            {error && <Alert severity="error">{error}</Alert>}

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Сохранение…' : 'Создать поставку'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/supplies')}
                disabled={submitting}
              >
                Отмена
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
