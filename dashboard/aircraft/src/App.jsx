import { CssBaseline } from "@mui/material";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PressureDashboard from "./PressureDashboard";
import Login from './Login';
import Register from './Register';
import Profile from './Profile';

function App() {
  return (
    <BrowserRouter>
      {/* CssBaseline diletakkan di sini agar efek reset CSS dari Material UI berlaku untuk semua halaman */}
      <CssBaseline /> 
      
      <Routes>
        {/* Rute awal akan menampilkan halaman Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        {/* Rute /dashboard akan menampilkan halaman PressureDashboard */}
        <Route path="/dashboard" element={<PressureDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
