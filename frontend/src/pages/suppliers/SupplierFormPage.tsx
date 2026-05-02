import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import type { Supplier } from '../../api/types'
import { extractError } from '../../utils/errors'

interface FormState {
  name: string
  inn: string
  contact_email: string
  phone: string
}

const EMPTY: FormState = { name: '', inn: '', contact_email: '', phone: '' }

export default function SupplierFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isEdit) return
    apiClient
      .get<Supplier>(`/suppliers/${id}/`)
      .then((response) => {
        setForm({
          name: response.data.name,
          inn: response.data.inn,
          contact_email: response.data.contact_email,
          phone: response.data.phone,
        })
      })
      .catch((err) =>
        setError(extractError(err, 'Не удалось загрузить поставщика.')),
      )
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (isEdit) {
        await apiClient.patch(`/suppliers/${id}/`, form)
      } else {
        await apiClient.post('/suppliers/', form)
      }
      navigate('/suppliers')
    } catch (err) {
      setError(extractError(err, 'Не удалось сохранить поставщика.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!isEdit) return
    if (!window.confirm('Удалить поставщика?')) return
    setSubmitting(true)
    try {
      await apiClient.delete(`/suppliers/${id}/`)
      navigate('/suppliers')
    } catch (err) {
      setError(extractError(err, 'Не удалось удалить поставщика.'))
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
        {isEdit ? 'Редактирование поставщика' : 'Новый поставщик'}
      </Typography>
      <Card sx={{ maxWidth: 600 }}>
        <CardContent>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              label="Название"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              fullWidth
              disabled={submitting}
            />
            <TextField
              label="ИНН"
              value={form.inn}
              onChange={(e) => update('inn', e.target.value)}
              required
              fullWidth
              disabled={submitting}
              helperText="10 или 12 цифр"
            />
            <TextField
              label="Email"
              type="email"
              value={form.contact_email}
              onChange={(e) => update('contact_email', e.target.value)}
              fullWidth
              disabled={submitting}
            />
            <TextField
              label="Телефон"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              fullWidth
              disabled={submitting}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Сохранение…' : 'Сохранить'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/suppliers')}
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
