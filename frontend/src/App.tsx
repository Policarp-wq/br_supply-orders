import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import OrdersPage from './pages/OrdersPage'
import ProductFormPage from './pages/products/ProductFormPage'
import ProductsListPage from './pages/products/ProductsListPage'
import SupplierFormPage from './pages/suppliers/SupplierFormPage'
import SuppliersListPage from './pages/suppliers/SuppliersListPage'
import SuppliesListPage from './pages/supplies/SuppliesListPage'
import SupplyDetailPage from './pages/supplies/SupplyDetailPage'
import SupplyFormPage from './pages/supplies/SupplyFormPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/suppliers" element={<SuppliersListPage />} />
              <Route path="/suppliers/new" element={<SupplierFormPage />} />
              <Route path="/suppliers/:id/edit" element={<SupplierFormPage />} />
              <Route path="/products" element={<ProductsListPage />} />
              <Route path="/products/new" element={<ProductFormPage />} />
              <Route path="/products/:id/edit" element={<ProductFormPage />} />
              <Route path="/supplies" element={<SuppliesListPage />} />
              <Route path="/supplies/new" element={<SupplyFormPage />} />
              <Route path="/supplies/:id" element={<SupplyDetailPage />} />
              <Route path="/orders/*" element={<OrdersPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
