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
import AdminDashboard from '@/pages/admin/AdminDashboard/AdminDashboard'
import AdminVehicles from '@/pages/admin/AdminVehicles/AdminVehicles'
import AdminReservations from '@/pages/admin/AdminReservations/AdminReservations'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalogue" element={<Catalogue />} />
        <Route path="/vehicles/:slug" element={<VehicleDetail />} />
        <Route path="/reserve/:slug" element={<Reservation />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/vehicles" element={<AdminVehicles />} />
        <Route path="/admin/reservations" element={<AdminReservations />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App