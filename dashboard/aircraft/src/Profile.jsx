import React from 'react';
import { Box, Paper, Typography, Avatar, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function Profile() {
  const navigate = useNavigate();
  // Ambil data user dari localStorage
  const user = JSON.parse(localStorage.getItem('user')) || { nama: 'Guest', email: '-' };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f6f8' }}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 4, textAlign: 'center' }}>
          <Avatar sx={{ width: 80, height: 80, margin: '0 auto', bgcolor: '#1976d2', mb: 2 }}>
            <AccountCircleIcon sx={{ fontSize: 60 }} />
          </Avatar>
          <Typography variant="h5" fontWeight="bold">{user.nama}</Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>{user.email}</Typography>
          
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/dashboard')}
            fullWidth
          >
            Kembali ke Dashboard
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}