export type Role = 'admin' | 'manager'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: Role
  role_display: string
  is_active: boolean
}

export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

export interface Supplier {
  id: number
  name: string
  inn: string
  contact_email: string
  phone: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  name: string
  sku: string
  unit_price: string
  quantity_in_stock: number
  supplier: number
  supplier_name: string
  created_at: string
  updated_at: string
}

export interface SupplyItem {
  id?: number
  product: number
  product_name?: string
  product_sku?: string
  quantity: number
  unit_price: string
}

export type SupplyStatus = 'pending' | 'received'

export interface Supply {
  id: number
  supplier: number
  supplier_name: string
  status: SupplyStatus
  status_display: string
  received_at: string | null
  created_at: string
  updated_at: string
  items: SupplyItem[]
}

export interface OrderItem {
  id?: number
  product: number
  product_name?: string
  product_sku?: string
  quantity: number
  unit_price: string
}

export type OrderStatus = 'new' | 'assembled' | 'shipped'

export interface Order {
  id: number
  customer_name: string
  status: OrderStatus
  status_display: string
  shipped_at: string | null
  created_at: string
  updated_at: string
  items: OrderItem[]
  total_amount: number | string
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
