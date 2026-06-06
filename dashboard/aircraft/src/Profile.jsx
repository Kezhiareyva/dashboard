import React from 'react';
import { Box, Paper, Typography, Avatar, Button, Container, Divider, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SidebarLayout from './SidebarLayout';

export default function Profile() {
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('user')) || { nama: 'Guest', email: '-' };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  return (
    <SidebarLayout title="Profil Saya">
      <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center' }}>
          <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: 4, textAlign: 'center', border: (theme) => `1px solid ${theme.palette.divider}`, backgroundColor: 'background.paper', width: '100%', maxWidth: 650 }}>
            <Avatar sx={{ width: 100, height: 100, margin: '0 auto', bgcolor: 'primary.main', mb: 3 }}>
              <AccountCircleIcon sx={{ fontSize: 72 }} />
            </Avatar>
            <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>{user.nama}</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>{user.email}</Typography>
            
            <Chip 
              icon={<AdminPanelSettingsIcon />} 
              label={user.role || 'VIEWER'} 
              color={user.role === 'SUPERADMIN' ? 'error' : user.role === 'ADMIN' ? 'primary' : 'default'} 
              sx={{ mb: 4, fontWeight: 'bold' }} 
            />
            
            <Divider sx={{ mb: 4 }} />
            
            <Button 
              variant="outlined" 
              color="error"
              startIcon={<LogoutIcon />} 
              onClick={handleLogout}
              fullWidth
              size="large"
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Keluar
            </Button>
          </Paper>
        </Container>
      </Box>
    </SidebarLayout>
  );
}