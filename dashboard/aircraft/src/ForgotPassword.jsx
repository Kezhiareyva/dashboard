import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Box, Button, Container, TextField, Typography, Paper, Avatar, Link, CircularProgress, IconButton, InputAdornment
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleReset = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    
    if (newPassword.length < 6) {
      setPasswordError('Password minimal 6 karakter');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResetSuccess(true);
        setTimeout(() => {
          navigate('/login', { replace: true }); 
        }, 2000);
      } else {
        setIsLoading(false);
        if (data.field === 'email') {
          setEmailError(data.message);
        } else if (data.field === 'password') {
          setPasswordError(data.message);
        } else {
          setEmailError(data.message);
        }
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Gagal reset password:", error);
      alert("Terjadi kesalahan, tidak dapat terhubung ke server.");
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f6f8' }}>
      <Container component="main" maxWidth="xs">
        <Paper elevation={4} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 4 }}>
          <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 48, height: 48 }}>
            <LockResetIcon />
          </Avatar>
          
          <Typography component="h1" variant="h5" fontWeight={700} gutterBottom sx={{ mt: 1 }}>
            Lupa Password
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 3, textAlign: 'center' }}>
            Masukkan email terdaftar dan password baru Anda.
          </Typography>
          
          {!resetSuccess ? (
            <Box component="form" onSubmit={handleReset} sx={{ mt: 1, width: '100%' }}>
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                error={!!emailError}
                helperText={emailError}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="Password Baru"
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                error={!!passwordError}
                helperText={passwordError || "Minimal 6 karakter"}
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
                disableElevation
                disabled={isLoading}
                sx={{ mt: 4, mb: 3, borderRadius: 2, py: 1.5, textTransform: 'none', fontSize: '1rem', fontWeight: 600 }}
              >
                {isLoading ? <CircularProgress size={26} color="inherit" /> : "Reset Password"}
              </Button>

              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  Kembali ke{' '}
                  <Link component={RouterLink} to="/login" variant="body2" sx={{ fontWeight: 600, textDecoration: 'none' }}>
                    Halaman Login
                  </Link>
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ mt: 4, mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CircularProgress color="success" size={60} sx={{ mb: 3 }} />
              <Typography variant="h6" fontWeight={700} color="success.main" textAlign="center">
                Password Berhasil Diubah!
              </Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                Sedang mengarahkan ke halaman login...
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
