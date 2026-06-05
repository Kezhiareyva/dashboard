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
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Simpan data user dan token JWT ke localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token); // <--- SIMPAN TOKEN DI SINI
        navigate('/dashboard', { replace: true }); 
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Gagal login:", error);
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
          <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 48, height: 48 }}>
            <LockOutlinedIcon />
          </Avatar>
          
          <Typography component="h1" variant="h5" fontWeight={700} gutterBottom sx={{ mt: 1 }}>
            Selamat Datang
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 3, textAlign: 'center' }}>
            Silakan masuk ke sistem pemantauan altimeter
          </Typography>
          
          <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Alamat Email"
              name="email"
              autoComplete="email"
              autoFocus
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disableElevation
              sx={{ mt: 4, mb: 3, borderRadius: 2, py: 1.5, textTransform: 'none', fontSize: '1rem', fontWeight: 600 }}
            >
              Masuk Dashboard
            </Button>

            {/* Tambahan Tautan Sign Up */}
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Belum punya akun?{' '}
                <Link component={RouterLink} to="/register" variant="body2" sx={{ fontWeight: 600, textDecoration: 'none' }}>
                  Daftar di sini
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}