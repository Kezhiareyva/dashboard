import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Select,
  MenuItem,
  FormControl,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SidebarLayout from './SidebarLayout';
import { useNavigate } from 'react-router-dom';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    // Keamanan Frontend: Hanya SUPERADMIN dan ADMIN yang bisa melihat
    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN') {
      navigate('/dashboard', { replace: true });
      return;
    }
    fetchUsers();
  }, [navigate, user.role]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setError('Gagal mengambil data pengguna.');
      }
    } catch (error) {
      console.error("Gagal mengambil data user:", error);
      setError('Terjadi kesalahan jaringan.');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(import.meta.env.VITE_API_URL + `/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        fetchUsers();
      } else {
        alert("Gagal mengubah role");
      }
    } catch (error) {
      console.error("Gagal mengubah role:", error);
    }
  };

  const handleDeleteClick = (u) => {
    setUserToDelete(u);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(import.meta.env.VITE_API_URL + `/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchUsers();
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      } else {
        alert("Gagal menghapus user");
      }
    } catch (error) {
      console.error("Gagal menghapus user:", error);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN') return null;

  return (
    <SidebarLayout title="Manajemen Pengguna">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" fontWeight={700} gutterBottom color="text.primary">
            Kelola Pengguna
          </Typography>
          <Typography color="text.secondary">
            Ubah peran pengguna menjadi Admin atau Viewer. Anda juga dapat menghapus akun yang tidak diperlukan.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Table>
            <TableHead sx={{ backgroundColor: 'action.hover' }}>
              <TableRow>
                <TableCell><b>ID</b></TableCell>
                <TableCell><b>Nama</b></TableCell>
                <TableCell><b>Email</b></TableCell>
                <TableCell><b>Role</b></TableCell>
                <TableCell align="center"><b>Aksi</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.nama}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    {user.role === 'SUPERADMIN' ? (
                      <FormControl size="small">
                        <Select
                          value={u.role || 'VIEWER'}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          sx={{ minWidth: 120, borderRadius: 2 }}
                        >
                          <MenuItem value="ADMIN">ADMIN</MenuItem>
                          <MenuItem value="VIEWER">VIEWER</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Chip label={u.role || 'VIEWER'} size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Button 
                      variant="outlined" 
                      color="error" 
                      size="small" 
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteClick(u)}
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      Hapus
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && !error && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Belum ada pengguna di database.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
      
      <Dialog open={deleteDialogOpen} onClose={cancelDelete}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin menghapus akun milik <b>{userToDelete?.nama}</b> ({userToDelete?.email})? Aksi ini tidak dapat dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="inherit" sx={{ fontWeight: 'bold' }}>Batal</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disableElevation sx={{ borderRadius: 2, fontWeight: 'bold' }}>Hapus</Button>
        </DialogActions>
      </Dialog>
    </SidebarLayout>
  );
}
