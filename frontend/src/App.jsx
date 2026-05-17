import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import MainLayout from './components/Layout/MainLayout'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import SolicitudList from './pages/solicitudes/SolicitudList'
import SolicitudDetail from './pages/solicitudes/SolicitudDetail'
import SolicitudWizard from './pages/solicitudes/SolicitudWizard'
import WorkflowView from './pages/workflow/WorkflowView'
import ReportesPage from './pages/reportes/ReportesPage'
import ConfigPage from './pages/config/ConfigPage'
import UsersPage from './pages/usuarios/UsersPage'

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (!['ADMIN', 'SUPER'].includes(user?.rol)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="solicitudes" element={<SolicitudList />} />
        <Route path="solicitudes/nueva" element={<SolicitudWizard />} />
        <Route path="solicitudes/:id" element={<SolicitudDetail />} />
        <Route path="workflow" element={<WorkflowView />} />
        <Route
          path="reportes"
          element={
            <AdminRoute>
              <ReportesPage />
            </AdminRoute>
          }
        />
        <Route
          path="config"
          element={
            <AdminRoute>
              <ConfigPage />
            </AdminRoute>
          }
        />
        <Route
          path="config/:tabla"
          element={
            <AdminRoute>
              <ConfigPage />
            </AdminRoute>
          }
        />
        <Route
          path="usuarios"
          element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
