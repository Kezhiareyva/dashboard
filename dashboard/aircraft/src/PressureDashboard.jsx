import { Snackbar, Alert, IconButton, useTheme } from "@mui/material";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { ThemeModeContext } from './App'; // Import context yang dibuat di App.jsx
import { useContext } from 'react';
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Container,
  Box,
  Chip,
  AppBar,
  Toolbar,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from "@mui/material";
import SpeedIcon from "@mui/icons-material/Speed";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SensorsIcon from "@mui/icons-material/Sensors";
import LogoutIcon from "@mui/icons-material/Logout";
import RouterIcon from '@mui/icons-material/Router';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

export default function PressureDashboard() {
  const navigate = useNavigate();

  const [ketinggian, setKetinggian] = useState(() => {
    const saved = localStorage.getItem("currentKetinggian");
    return saved ? Number(saved) : 0;
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("ketinggianHistory");
    return saved ? JSON.parse(saved) : [];
  });

  // STATE BARU: Untuk menyimpan daftar perangkat ESP32
  const [devices, setDevices] = useState([]);

  // ... state sebelumnya (ketinggian, history, devices) ...
  
  // State untuk Notifikasi (Visual Alert)
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");

  // Hook untuk tema
  const theme = useTheme();
  const colorMode = useContext(ThemeModeContext);

  useEffect(() => {
    localStorage.setItem("ketinggianHistory", JSON.stringify(history));
    localStorage.setItem("currentKetinggian", ketinggian);
  }, [history, ketinggian]);

  // WEBSOCKET: Menerima data realtime
  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.tekanan !== undefined) { // Menggunakan data tekanan hasil Prioritas 1
        setKetinggian(data.ketinggian);
        setHistory((prev) => [
          ...prev.slice(-19),
          { time: new Date().toLocaleTimeString(), value: data.tekanan }, // Menampilkan tekanan di grafik
        ]);

        // Cek ambang batas untuk memicu notifikasi
        if (data.tekanan < 980) {
          setAlertMessage(`Peringatan! Tekanan sangat rendah: ${data.tekanan} hPa`);
          setAlertSeverity("warning");
          setOpenAlert(true);
        } else if (data.tekanan > 1030) {
          setAlertMessage(`Peringatan! Tekanan sangat tinggi: ${data.tekanan} hPa`);
          setAlertSeverity("error");
          setOpenAlert(true);
        }
      }
    };

    return () => ws.close();
  }, []);

  // Fungsi untuk menutup notifikasi
  const handleCloseAlert = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpenAlert(false);
  };

  // FETCH DEVICES: Mengambil data alat dan status heartbeat setiap 10 detik
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + "/api/devices");
        if (res.ok) {
          const data = await res.json();
          setDevices(data);
        }
      } catch (error) {
        console.error("Gagal mengambil data perangkat:", error);
      }
    };

    fetchDevices(); // Panggil saat pertama kali dimuat
    const interval = setInterval(fetchDevices, 10000); // Ulangi setiap 10 detik

    return () => clearInterval(interval);
  }, []);

  const getStatus = () => {
    if (ketinggian < 650) return { label: "Rendah", color: "info" };
    if (ketinggian > 750) return { label: "Tinggi", color: "error" };
    return { label: "Normal", color: "success" };
  };

  // LOGIKA STATUS ONLINE/OFFLINE
  const getDeviceStatus = (lastActive) => {
    const sekarang = new Date();
    const waktuAktif = new Date(lastActive);
    const selisihDetik = (sekarang - waktuAktif) / 1000;

    // Jika ESP32 tidak mengirim data lebih dari 60 detik, anggap Offline
    if (selisihDetik < 60) {
      return <Chip label="Online" color="success" size="small" sx={{ fontWeight: "bold" }} />;
    } else {
      return <Chip label="Offline" color="error" size="small" sx={{ fontWeight: "bold" }} />;
    }
  };

  const handleLogout = () => {
    // Hapus data user dari local storage saat logout
    localStorage.removeItem("user");
    navigate("/");
  };

  const status = getStatus();

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f4f6f8", width: "100vw", overflowX: "hidden" }}>
      
      {/* NAVBAR */}
      <AppBar position="sticky" elevation={1} sx={{ backgroundColor: "#ffffff", color: "#333" }}>
        <Toolbar>
          <SensorsIcon sx={{ color: "#1976d2", mr: 2, fontSize: 32 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Altimeter Monitor
          </Typography>
          {/* Tombol Dark / Light Mode */}
          <IconButton sx={{ ml: 1, mr: 2 }} onClick={colorMode.toggleColorMode} color="inherit">
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <Button 
            color="primary" 
            variant="text" 
            onClick={() => navigate('/history')}
            sx={{ mr: 2, textTransform: "none", fontWeight: 600 }}
          >
            Riwayat Data
          </Button>
          <Button 
            color="primary" 
            variant="text" 
            onClick={() => navigate('/profile')}
            sx={{ mr: 2, textTransform: "none", fontWeight: 600 }}
          >
            Profil Saya
          </Button>
          <Button 
            color="error" 
            variant="outlined" 
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Keluar
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box mb={4}>
          <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: "#000" }}>
            Dashboard Monitoring
          </Typography>
          <Typography color="text.secondary">
            Pantauan Ketinggian (Elevasi) Sistem secara *Real-Time*
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* KOLOM KIRI: Informasi Utama & Grafik */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e0e0e0", height: "100%" }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between">
                      <Box>
                        <Typography color="text.secondary" gutterBottom>Ketinggian Saat Ini</Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ color: "#1976d2" }}>
                          {ketinggian} mdpl
                        </Typography>
                      </Box>
                      <SpeedIcon color="action" sx={{ fontSize: 48, opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e0e0e0", height: "100%" }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between">
                      <Box>
                        <Typography color="text.secondary" gutterBottom>Status Tekanan</Typography>
                        <Chip
                          label={status.label}
                          color={status.color}
                          sx={{ mt: 0.5, fontSize: 16, px: 2, fontWeight: 600, borderRadius: 2 }}
                        />
                      </Box>
                      <TrendingUpIcon color="action" sx={{ fontSize: 48, opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* CHART */}
            <Card elevation={0} sx={{ borderRadius: 3, mt: 3, border: "1px solid #e0e0e0" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
                  Grafik Fluktuasi Ketinggian
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="colorKetinggian" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1976d2" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="time" tick={{ fill: "#888", fontSize: 12 }} tickMargin={10} />
                    <YAxis domain={[600, 800]} tick={{ fill: "#888", fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#1976d2"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorKetinggian)"
                      dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#1976d2" }}
                      activeDot={{ r: 8, fill: "#1976d2", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* KOLOM KANAN: Daftar Perangkat (Heartbeat) */}
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e0e0e0", height: "100%" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Perangkat Terhubung
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Status perangkat diperbarui setiap 10 detik.
                </Typography>
                
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                  {devices.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
                      Belum ada perangkat yang terdeteksi.
                    </Typography>
                  ) : (
                    devices.map((device, index) => (
                      <React.Fragment key={device.id}>
                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <RouterIcon color={getDeviceStatus(device.terakhirAktif).props.color === 'success' ? 'primary' : 'disabled'} />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography fontWeight="bold">{device.identitas}</Typography>
                                {getDeviceStatus(device.terakhirAktif)}
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.primary">
                                  {device.namaAlat}
                                </Typography>
                                <br />
                                Terakhir aktif: {new Date(device.terakhirAktif).toLocaleTimeString()}
                              </>
                            }
                          />
                        </ListItem>
                        {index !== devices.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    ))
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* FOOTER */}
        <Box mt={6} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            © 2026 – Kezhia
          </Typography>
        </Box>
      </Container>
      {/* Visual Alert (Notifikasi Snackbar) */}
      <Snackbar 
        open={openAlert} 
        autoHideDuration={5000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseAlert} severity={alertSeverity} sx={{ width: '100%', fontWeight: 'bold' }} variant="filled">
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}