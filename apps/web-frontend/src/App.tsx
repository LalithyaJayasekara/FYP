import { Navigate, Route, Routes } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import ClinicianPage from './pages/ClinicianPage'
import ClinicianLabelingPage from './pages/ClinicianLabelingPage'
import CalibrationDashboardPage from './pages/CalibrationDashboardPage'
import RequireRole from './components/RequireRole'
import EmployeePage from './pages/EmployeePage'
import EmployeeDisclosurePage from './pages/EmployeeDisclosurePage'
import GuestProfilePage from './pages/GuestProfilePage'
import GuestQuestionnairePage from './pages/GuestQuestionnairePage'
import HomePage from './pages/HomePage'
import HrManagerPage from './pages/HrManagerPage'
import NotFoundPage from './pages/NotFoundPage'
import ScreeningPage from './pages/ScreeningPage'
import SplashPage from './pages/SplashPage'
import UnauthorizedPage from './pages/UnauthorizedPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/welcome" replace />} />
      <Route path="/welcome" element={<SplashPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/guest" element={<GuestProfilePage />} />
      <Route path="/guest/questionnaire" element={<GuestQuestionnairePage />} />
      <Route path="/screening" element={<ScreeningPage />} />
      <Route
        path="/home"
        element={
          <RequireRole allowedRoles={['clinician', 'hr-manager', 'employee', 'admin']}>
            <HomePage />
          </RequireRole>
        }
      />
      <Route
        path="/clinician"
        element={
          <RequireRole allowedRoles={['clinician']}>
            <ClinicianPage />
          </RequireRole>
        }
      />
      <Route
        path="/clinician-labeling"
        element={
          <RequireRole allowedRoles={['clinician']}>
            <ClinicianLabelingPage />
          </RequireRole>
        }
      />
      <Route
        path="/calibration-dashboard"
        element={
          <RequireRole allowedRoles={['clinician']}>
            <CalibrationDashboardPage />
          </RequireRole>
        }
      />
      <Route
        path="/calibration-dashboard/hr-readonly"
        element={
          <RequireRole allowedRoles={['hr-manager']}>
            <CalibrationDashboardPage readOnly />
          </RequireRole>
        }
      />
      <Route
        path="/hr-manager"
        element={
          <RequireRole allowedRoles={['hr-manager']}>
            <HrManagerPage />
          </RequireRole>
        }
      />
      <Route
        path="/employee-disclosure"
        element={
          <RequireRole allowedRoles={['employee']}>
            <EmployeeDisclosurePage />
          </RequireRole>
        }
      />
      <Route
        path="/employee"
        element={
          <RequireRole allowedRoles={['employee']}>
            <EmployeePage />
          </RequireRole>
        }
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/employeel" element={<Navigate to="/employee" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
