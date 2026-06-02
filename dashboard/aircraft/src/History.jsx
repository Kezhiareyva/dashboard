import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button, AppBar, Toolbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';

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
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f4f6f8" }}>
      <AppBar position="sticky" elevation={1} sx={{ backgroundColor: "#ffffff", color: "#333" }}>
        <Toolbar>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ mr: 2, textTransform: "none" }}>
            Kembali
          </Button>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Riwayat Data Sensor
          </Typography>
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<DownloadIcon />} 
            onClick={handleExportCSV}
            disableElevation
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Export CSV
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0" }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f9fafb' }}>
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
                    <TableCell colSpan={5} align="center">Tidak ada data riwayat.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
}