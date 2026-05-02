import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const ACCESS_KEY = 'access'
export const REFRESH_KEY = 'refresh'
export const USER_KEY = 'user'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

let isRefreshing = false
let waitQueue: Array<(token: string | null) => void> = []

function clearAuthAndRedirect() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined
    const status = error.response?.status

    if (status !== 401 || !original || original._retry || original.url?.includes('/auth/')) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitQueue.push((token) => {
          if (token) {
            original.headers!.Authorization = `Bearer ${token}`
            resolve(apiClient(original))
          } else {
            reject(error)
          }
        })
      })
    }

    original._retry = true
    isRefreshing = true
    const refresh = localStorage.getItem(REFRESH_KEY)
    if (!refresh) {
      isRefreshing = false
      clearAuthAndRedirect()
      return Promise.reject(error)
    }

    try {
      const resp = await axios.post(`${API_URL}/auth/refresh/`, { refresh })
      const newAccess = resp.data.access as string
      localStorage.setItem(ACCESS_KEY, newAccess)
      waitQueue.forEach((cb) => cb(newAccess))
      waitQueue = []
      isRefreshing = false
      original.headers!.Authorization = `Bearer ${newAccess}`
      return apiClient(original)
    } catch (refreshError) {
      waitQueue.forEach((cb) => cb(null))
      waitQueue = []
      isRefreshing = false
      clearAuthAndRedirect()
      return Promise.reject(refreshError)
    }
  },
)
