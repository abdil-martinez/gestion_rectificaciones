import api from './axios'

export const login = (username, password) =>
  api.post('/auth/token/', { username, password })

export const refreshToken = (refresh) =>
  api.post('/auth/token/refresh/', { refresh })

export const getMe = () => api.get('/accounts/me/')
export const updateMe = (data) => api.patch('/accounts/me/', data)
export const changePassword = (data) => api.post('/accounts/change-password/', data)

export const getUsers = (params) => api.get('/accounts/users/', { params })
export const getUser = (id) => api.get(`/accounts/users/${id}/`)
export const createUser = (data) => api.post('/accounts/users/', data)
export const updateUser = (id, data) => api.patch(`/accounts/users/${id}/`, data)
export const deleteUser = (id) => api.delete(`/accounts/users/${id}/`)
