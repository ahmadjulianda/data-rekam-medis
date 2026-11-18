import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { LoaderCircle } from 'lucide-react'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute, RoleGuard } from './components/layout/ProtectedRoute'

const LoginPage = lazy(() => import('./features/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const PatientsPage = lazy(() => import('./features/patients/PatientsPage').then((m) => ({ default: m.PatientsPage })))
const PatientDetailPage = lazy(() => import('./features/patients/PatientDetailPage').then((m) => ({ default: m.PatientDetailPage })))
const MedicalRecordsPage = lazy(() => import('./features/medical-records/MedicalRecordsPage').then((m) => ({ default: m.MedicalRecordsPage })))
const MedicalRecordDetailPage = lazy(() => import('./features/medical-records/MedicalRecordDetailPage').then((m) => ({ default: m.MedicalRecordDetailPage })))
const PrescriptionsPage = lazy(() => import('./features/prescriptions/PrescriptionsPage').then((m) => ({ default: m.PrescriptionsPage })))
const StaffPage = lazy(() => import('./features/staff/StaffPage').then((m) => ({ default: m.StaffPage })))
const ProfilePage = lazy(() => import('./features/staff/ProfilePage').then((m) => ({ default: m.ProfilePage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const basePath = import.meta.env.VITE_BASE_PATH?.trim() || '/'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={basePath}>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center gap-2 bg-frame text-body text-muted">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Memuat halaman…
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route element={<RoleGuard permission="patients.view" />}>
                  <Route path="pasien" element={<PatientsPage />} />
                  <Route path="pasien/:id" element={<PatientDetailPage />} />
                </Route>
                <Route element={<RoleGuard permission="records.view" />}>
                  <Route path="rekam-medis" element={<MedicalRecordsPage />} />
                  <Route path="rekam-medis/:id" element={<MedicalRecordDetailPage />} />
                </Route>
                <Route element={<RoleGuard permission="prescriptions.view" />}>
                  <Route path="resep" element={<PrescriptionsPage />} />
                </Route>
                <Route element={<RoleGuard permission="staff.manage" />}>
                  <Route path="staf" element={<StaffPage />} />
                </Route>
                <Route path="profil" element={<ProfilePage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster position="bottom-right" closeButton richColors={false} />
    </QueryClientProvider>
  )
}
