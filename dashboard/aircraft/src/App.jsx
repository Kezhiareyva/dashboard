import { CssBaseline } from "@mui/material";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PressureDashboard from "./PressureDashboard";
import Login from './Login';

function App() {
  return (
    <BrowserRouter>
      {/* CssBaseline diletakkan di sini agar efek reset CSS dari Material UI berlaku untuk semua halaman */}
      <CssBaseline /> 
      
      <Routes>
        {/* Rute awal akan menampilkan halaman Login */}
        <Route path="/" element={<Login />} />
        
        {/* Rute /dashboard akan menampilkan halaman PressureDashboard */}
        <Route path="/dashboard" element={<PressureDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
