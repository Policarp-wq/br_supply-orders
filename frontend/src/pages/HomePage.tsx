import { Box, Card, CardContent, Grid, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const TILES = [
  { to: '/suppliers', title: 'Поставщики', subtitle: 'Справочник контрагентов' },
  { to: '/products', title: 'Товары', subtitle: 'Каталог и остатки на складе' },
  { to: '/supplies', title: 'Поставки', subtitle: 'Документы прихода от поставщиков' },
  { to: '/orders', title: 'Заказы', subtitle: 'Заказы клиентов и их отгрузка' },
]

export default function HomePage() {
  const { user } = useAuth()
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Добро пожаловать, {user?.username}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Роль: {user?.role_display}. Перейдите в нужный раздел через меню или плитки ниже.
      </Typography>
      <Grid container spacing={2}>
        {TILES.map((tile) => (
          <Grid key={tile.to} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              component={RouterLink}
              to={tile.to}
              sx={{ textDecoration: 'none', display: 'block', height: '100%' }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {tile.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {tile.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
