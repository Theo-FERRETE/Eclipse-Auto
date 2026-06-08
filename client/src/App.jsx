import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import Home from '@/pages/Home/Home'
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute'
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary'

const Catalogue = lazy(() => import('@/pages/Catalogue/Catalogue'))
const VehicleDetail = lazy(() => import('@/pages/VehicleDetail/VehicleDetail'))
const Login = lazy(() => import('@/pages/Login/Login'))
const Register = lazy(() => import('@/pages/Register/Register'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword/ResetPassword'))
const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard'))
const Reservation = lazy(() => import('@/pages/Reservation/Reservation'))
const Contact = lazy(() => import('@/pages/Contact/Contact'))
const MentionsLegales = lazy(() => import('@/pages/MentionsLegales/MentionsLegales'))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard/AdminDashboard'))
const AdminVehicles = lazy(() => import('@/pages/admin/AdminVehicles/AdminVehicles'))
const AdminReservations = lazy(() => import('@/pages/admin/AdminReservations/AdminReservations'))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers/AdminUsers'))
const NotFound = lazy(() => import('@/pages/NotFound/NotFound'))

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Navbar />
      <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalogue" element={<Catalogue />} />
        <Route path="/vehicles/:slug" element={<VehicleDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/reserve/:slug" element={
          <ProtectedRoute><Reservation /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/vehicles" element={
          <ProtectedRoute requireAdmin><AdminVehicles /></ProtectedRoute>
        } />
        <Route path="/admin/reservations" element={
          <ProtectedRoute requireAdmin><AdminReservations /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      <Footer />
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App