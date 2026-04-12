import { Navigate, useLocation } from 'react-router-dom'
import type { ReactElement } from 'react'
import { getAuthSession, type AppRole } from '../auth/session'

type RequireRoleProps = {
  allowedRoles: AppRole[]
  children: ReactElement
}

export default function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const location = useLocation()
  const session = getAuthSession()

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  if (!allowedRoles.includes(session.role) && session.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
