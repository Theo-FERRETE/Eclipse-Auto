import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from '@/components/Navbar/Navbar'
import Home from '@/pages/Home/Home'
import Catalogue from '@/pages/Catalogue/Catalogue'
import VehicleDetail from '@/pages/VehicleDetail/VehicleDetail'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalogue" element={<Catalogue />} />
        <Route path="/vehicles/:slug" element={<VehicleDetail />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App