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
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  InputAdornment
} from '@mui/material';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function Register() {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');
  
  const [openDialog, setOpenDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleRegister = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setServerError('');
    
    // Validasi email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Format email tidak valid (contoh: user@domain.com)');
      return;
    }
    
    // Validasi password (min 8 char, angka, dan simbol)
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*.,])[a-zA-Z0-9!@#$%^&*.,]{8,}$/;
    if (!passwordRegex.test(password)) {
      setPasswordError('Password minimal 8 karakter, mengandung angka dan simbol');
      return;
    }

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setOpenDialog(true);
      } else {
        setServerError(data.message); // Menampilkan pesan dari backend
      }
    } catch (error) {
      console.error("Gagal mendaftar:", error);
      setServerError("Terjadi kesalahan, tidak dapat terhubung ke server.");
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    navigate('/login');
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
              onChange={(e) => {
                setEmail(e.target.value);
                if (serverError) setServerError('');
                if (emailError) setEmailError('');
              }}
              error={!!emailError || !!serverError}
              helperText={emailError || serverError}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              error={!!passwordError}
              helperText={passwordError}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
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
      
      {/* Dialog Pendaftaran Berhasil */}
      <Dialog open={openDialog} onClose={handleCloseDialog} aria-labelledby="register-dialog-title">
        <DialogTitle id="register-dialog-title">{"Pendaftaran Berhasil!"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Akun Anda telah berhasil dibuat. Silakan masuk menggunakan email dan password baru Anda.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary" variant="contained" disableElevation sx={{ borderRadius: 2 }}>
            Lanjut Login
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}