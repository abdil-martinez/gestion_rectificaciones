import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const { refreshToken, setAuth, clearAuth, user } = useAuthStore.getState()

      if (refreshToken) {
        try {
          const refreshRes = await axios.post(
            '/api/auth/token/refresh/',
            { refresh: refreshToken }
          )
          const newAccessToken = refreshRes.data.access
          setAuth(user, newAccessToken, refreshToken)
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return api(originalRequest)
        } catch {
          clearAuth()
          window.location.href = '/login'
        }
      } else {
        clearAuth()
        window.location.href = '/login'
      }
    }

    return Promise.reject(err)
  }
)

export default api
