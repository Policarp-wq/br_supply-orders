import { AxiosError } from 'axios'

export function extractError(err: unknown, fallback = 'Произошла ошибка.'): string {
  const axiosError = err as AxiosError<unknown>
  const data = axiosError.response?.data
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.detail === 'string') return obj.detail
    for (const value of Object.values(obj)) {
      if (Array.isArray(value) && value.length && typeof value[0] === 'string') {
        return value[0]
      }
      if (typeof value === 'string') return value
    }
  }
  return axiosError.message || fallback
}
