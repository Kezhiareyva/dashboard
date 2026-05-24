import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  TextField, 
  Typography, 
  Paper,
  Avatar,
  Link
} from '@mui/material';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';

export default function Register() {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert("Pendaftaran berhasil! Silakan masuk dengan akun baru kamu.");
        navigate('/login'); 
      } else {
        alert(data.message); // Menampilkan pesan dari backend (misal: "Email sudah terdaftar!")
      }
    } catch (error) {
      console.error("Gagal mendaftar:", error);
      alert("Terjadi kesalahan, tidak dapat terhubung ke server.");
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        width: '100vw',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f4f6f8' 
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper 
          elevation={4} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderRadius: 4
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: '#2e7d32', width: 48, height: 48 }}>
            <AppRegistrationIcon />
          </Avatar>
          
          <Typography component="h1" variant="h5" fontWeight={700} gutterBottom sx={{ mt: 1 }}>
            Buat Akun Baru
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 3, textAlign: 'center' }}>
            Daftarkan dirimu untuk memantau dashboard altimeter.
          </Typography>
          
          <Box component="form" onSubmit={handleRegister} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="nama"
              label="Nama Lengkap"
              name="nama"
              autoComplete="name"
              autoFocus
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Alamat Email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="success"
              disableElevation
              sx={{ mt: 4, mb: 3, borderRadius: 2, py: 1.5, textTransform: 'none', fontSize: '1rem', fontWeight: 600 }}
            >
              Daftar Sekarang
            </Button>

            {/* Tautan untuk kembali ke halaman Login */}
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Sudah punya akun?{' '}
                <Link component={RouterLink} to="/login" variant="body2" sx={{ fontWeight: 600, textDecoration: 'none' }}>
                  Masuk di sini
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}