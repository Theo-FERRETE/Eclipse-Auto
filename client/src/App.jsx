import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import Home from '@/pages/Home/Home'
import Catalogue from '@/pages/Catalogue/Catalogue'
import VehicleDetail from '@/pages/VehicleDetail/VehicleDetail'
import Login from '@/pages/Login/Login'
import Register from '@/pages/Register/Register'
import Dashboard from '@/pages/Dashboard/Dashboard'
import Reservation from '@/pages/Reservation/Reservation'
import Contact from '@/pages/Contact/Contact'
import MentionsLegales from '@/pages/MentionsLegales/MentionsLegales'
import AdminDashboard from '@/pages/admin/AdminDashboard/AdminDashboard'
import AdminVehicles from '@/pages/admin/AdminVehicles/AdminVehicles'
import AdminReservations from '@/pages/admin/AdminReservations/AdminReservations'
import AdminUsers from '@/pages/admin/AdminUsers/AdminUsers'
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalogue" element={<Catalogue />} />
        <Route path="/vehicles/:slug" element={<VehicleDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contact" element={<Contact />} />
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
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App