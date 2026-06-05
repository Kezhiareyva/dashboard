import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SidebarLayout from './SidebarLayout';

export default function History() {
  const [dataRiwayat, setDataRiwayat] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Silakan login terlebih dahulu!");
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(import.meta.env.VITE_API_URL + '/api/history', {
          headers: {
            'Authorization': `Bearer ${token}` // Kirim token ke backend
          }
        });

        if (response.ok) {
          const data = await response.json();
          setDataRiwayat(data);
        } else if (response.status === 401 || response.status === 403) {
          alert("Sesi Anda telah habis. Silakan login kembali.");
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (error) {
        console.error("Gagal mengambil riwayat:", error);
      }
    };

    fetchHistory();
  }, [navigate]);

  // Fungsi untuk Export CSV
  const handleExportCSV = () => {
    if (dataRiwayat.length === 0) return alert("Tidak ada data untuk diekspor");

    // Header CSV
    let csvContent = "ID,Identitas Alat,Tekanan (hPa),Ketinggian (mdpl),Waktu Pencatatan\n";
    
    // Isi data CSV
    dataRiwayat.forEach(row => {
      const waktu = new Date(row.createdAt).toLocaleString();
      csvContent += `${row.id},${row.esp?.identitas || '-'},${row.tekanan},${row.ketinggian},"${waktu}"\n`;
    });

    // Proses Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Riwayat_Altimeter_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SidebarLayout title="Riwayat Data Sensor">
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<DownloadIcon />} 
            onClick={handleExportCSV}
            disableElevation
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Export CSV
          </Button>
        </Box>

        <Paper elevation={0} sx={{ width: '100%', p: { xs: 1, sm: 3 }, borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, backgroundColor: 'background.paper' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>No</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Perangkat</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tekanan (hPa)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ketinggian (mdpl)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Waktu Pencatatan</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataRiwayat.length > 0 ? (
                  dataRiwayat.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{row.esp?.identitas || 'Tidak diketahui'}</TableCell>
                      <TableCell>{row.tekanan}</TableCell>
                      <TableCell>{row.ketinggian}</TableCell>
                      <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>Tidak ada data riwayat.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </SidebarLayout>
  );
}