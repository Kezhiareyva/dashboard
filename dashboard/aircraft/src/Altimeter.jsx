import { Snackbar, Alert, useTheme } from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  Card, CardContent, Typography, Grid, Container, Box, Chip, List, ListItem, ListItemText, ListItemIcon, Divider, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import SpeedIcon from "@mui/icons-material/Speed";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SensorsIcon from "@mui/icons-material/Sensors";
import RouterIcon from '@mui/icons-material/Router';
import DownloadIcon from '@mui/icons-material/Download';
import SidebarLayout from './SidebarLayout';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Altimeter() {
  const [tabValue, setTabValue] = useState(0);

  const [ketinggian, setKetinggian] = useState(() => {
    const saved = localStorage.getItem("currentKetinggian");
    return saved ? Number(saved) : 0;
  });

  const [tekanan, setTekanan] = useState(() => {
    const saved = localStorage.getItem("currentTekanan");
    return saved ? Number(saved) : 0;
  });

  const [sensorHistory, setSensorHistory] = useState(() => {
    const saved = localStorage.getItem("sensorHistory");
    return saved ? JSON.parse(saved) : [];
  });

  const [devices, setDevices] = useState([]);

  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");

  // State for History Table
  const [dataRiwayat, setDataRiwayat] = useState([]);

  // State untuk Grafik Jangka Panjang
  const [chartRange, setChartRange] = useState("1d");
  const [aggregatedHistory, setAggregatedHistory] = useState([]);

  const theme = useTheme();

  // Ref untuk membatasi pemutaran suara agar tidak berisik berulang-ulang
  const lastSoundPlayed = React.useRef(0);

  const playAlertSound = () => {
    const now = Date.now();
    // Putar suara maksimal 1 kali setiap 3 detik
    if (now - lastSoundPlayed.current < 3000) return;
    lastSoundPlayed.current = now;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Nada A5

      // Volume dibuat cukup rendah agar tidak terlalu mengagetkan (0.05)
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error("Gagal memutar suara peringatan:", e);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    localStorage.setItem("sensorHistory", JSON.stringify(sensorHistory));
    localStorage.setItem("currentKetinggian", ketinggian);
    localStorage.setItem("currentTekanan", tekanan);
  }, [sensorHistory, ketinggian, tekanan]);

  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL);
    let lastChartUpdate = 0;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.tekanan !== undefined && data.ketinggian !== undefined) {
        // Angka teks diupdate seketika (real-time millisecond)
        setKetinggian(data.ketinggian);
        setTekanan(data.tekanan);

        // Grafik diupdate maksimal 1 kali tiap 1 detik (1000ms) agar browser tidak hang
        const now = Date.now();
        if (now - lastChartUpdate >= 1000) {
          setSensorHistory((prev) => [
            ...prev.slice(-19),
            { time: new Date().toLocaleTimeString(), tekanan: data.tekanan, ketinggian: data.ketinggian },
          ]);
          lastChartUpdate = now;
        }

        let isAlert = false;

        if (data.tekanan < 980) {
          setAlertMessage(`Peringatan! Tekanan sangat rendah: ${data.tekanan} mbar`);
          setAlertSeverity("warning");
          setOpenAlert(true);
          isAlert = true;
        } else if (data.tekanan > 1030) {
          setAlertMessage(`Peringatan! Tekanan sangat tinggi: ${data.tekanan} mbar`);
          setAlertSeverity("error");
          setOpenAlert(true);
          isAlert = true;
        }

        // Cek ketinggian juga
        if (data.ketinggian < -146 || data.ketinggian > 281) {
          isAlert = true;
        }

        if (isAlert) {
          playAlertSound();
        }
      }
    };

    return () => ws.close();
  }, []);

  const handleCloseAlert = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpenAlert(false);
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(import.meta.env.VITE_API_URL + "/api/history", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setDataRiwayat(data); // for table

          if (data && data.length > 0) {
            const recentData = data.slice(0, 20).reverse().map(item => ({
              time: new Date(item.createdAt).toLocaleTimeString(),
              tekanan: item.tekanan,
              ketinggian: item.ketinggian
            }));
            setSensorHistory(recentData);
            setTekanan(data[0].tekanan);
            setKetinggian(data[0].ketinggian);
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data history dari database:", error);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    const fetchAggregatedData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/history/chart?range=${chartRange}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          // Format time untuk Recharts
          const formatted = data.map(item => ({
            time: new Date(item.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
            tekanan: parseFloat(item.tekanan),
            ketinggian: parseFloat(item.ketinggian)
          }));
          setAggregatedHistory(formatted);
        }
      } catch (error) {
        console.error("Gagal mengambil data agregasi:", error);
      }
    };

    fetchAggregatedData();
  }, [chartRange]);

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

    fetchDevices();
    const interval = setInterval(fetchDevices, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleExportCSV = () => {
    if (dataRiwayat.length === 0) return alert("Tidak ada data untuk diekspor");
    let csvContent = "ID,Identitas Alat,Tekanan (mbar),Ketinggian (mdpl),Ketinggian (ft),Waktu Pencatatan\n";
    dataRiwayat.forEach(row => {
      const waktu = new Date(row.createdAt).toLocaleString();
      csvContent += `${row.id},${row.esp?.identitas || '-'},${row.tekanan},${row.ketinggian},${Math.round((row.ketinggian * 3.28084) / 100) * 100},"${waktu}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Riwayat_Altimeter_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusKetinggian = () => {
    if (ketinggian < -146) return { label: "Rendah", color: "warning" };
    if (ketinggian > 281) return { label: "Tinggi", color: "error" };
    return { label: "Normal", color: "success" };
  };

  const getStatusTekanan = () => {
    if (tekanan < 980) return { label: "Rendah", color: "warning" };
    if (tekanan > 1030) return { label: "Tinggi", color: "error" };
    return { label: "Normal", color: "success" };
  };

  const getDeviceStatus = (lastActive) => {
    const sekarang = new Date();
    const waktuAktif = new Date(lastActive);
    const selisihDetik = (sekarang - waktuAktif) / 1000;
    if (selisihDetik < 60) {
      return <Chip label="Online" color="success" size="small" sx={{ fontWeight: "bold" }} />;
    } else {
      return <Chip label="Offline" color="error" size="small" sx={{ fontWeight: "bold" }} />;
    }
  };

  const statusKetinggian = getStatusKetinggian();
  const statusTekanan = getStatusTekanan();

  return (
    <SidebarLayout title="Altimeter">
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <Box mb={2}>
          <Typography variant="h4" fontWeight={700} gutterBottom color="text.primary">
            Altimeter Monitoring
          </Typography>
          <Typography color="text.secondary">
            Pantauan Ketinggian (Elevasi) dan Tekanan Sistem secara Real-Time serta riwayat datanya.
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="altimeter tabs">
            <Tab label="Grafik & Realtime" sx={{ fontWeight: 'bold' }} />
            <Tab label="Tabel Riwayat" sx={{ fontWeight: 'bold' }} />
          </Tabs>
        </Box>

        {/* TAB 1: GRAFIK & REALTIME */}
        <CustomTabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* KOLOM KIRI: Informasi Utama & Grafik */}
            <Grid item xs={12} md={7}>
              {/* BAGIAN KETINGGIAN */}
              <Box mb={4}>
                <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary" sx={{ mb: 2 }}>
                  Pemantauan Ketinggian
                </Typography>
                <Grid container spacing={3} mb={3}>
                  <Grid item xs={12} sm={6}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: "100%", backgroundColor: 'background.paper' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between">
                          <Box>
                            <Typography color="text.secondary" gutterBottom>Ketinggian Saat Ini</Typography>
                            <Typography variant="h4" fontWeight={700} color="primary">
                              {ketinggian} mdpl <Typography component="span" variant="h6" color="text.secondary">({Math.round((ketinggian * 3.28084) / 100) * 100} ft)</Typography>
                            </Typography>
                          </Box>
                          <SpeedIcon color="action" sx={{ fontSize: 48, opacity: 0.7 }} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: "100%", backgroundColor: 'background.paper' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between">
                          <Box>
                            <Typography color="text.secondary" gutterBottom>Status Ketinggian</Typography>
                            <Box sx={{ mb: 1 }}>
                              <Chip
                                label={statusKetinggian.label}
                                color={statusKetinggian.color}
                                sx={{ mt: 0.5, fontSize: 16, px: 2, fontWeight: 600, borderRadius: 2 }}
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Batas: Rendah (&lt; -146) | Normal | Tinggi (&gt; 281)
                            </Typography>
                          </Box>
                          <TrendingUpIcon color="action" sx={{ fontSize: 48, opacity: 0.7 }} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, backgroundColor: 'background.paper' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }} color="text.primary">
                      Grafik Fluktuasi Ketinggian
                    </Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={sensorHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <defs>
                          <linearGradient id="colorKetinggian" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                        <XAxis dataKey="time" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} tickMargin={10} />
                        <YAxis domain={['auto', 'auto']} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }} />
                        <Area
                          type="monotone"
                          dataKey="ketinggian"
                          stroke={theme.palette.primary.main}
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#colorKetinggian)"
                          dot={{ r: 4, strokeWidth: 2, fill: theme.palette.background.paper, stroke: theme.palette.primary.main }}
                          activeDot={{ r: 8, fill: theme.palette.primary.main, stroke: theme.palette.background.paper, strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Box>

              {/* BAGIAN TEKANAN */}
              <Box mb={4}>
                <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary" sx={{ mb: 2 }}>
                  Pemantauan Tekanan
                </Typography>
                <Grid container spacing={3} mb={3}>
                  <Grid item xs={12} sm={6}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: "100%", backgroundColor: 'background.paper' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between">
                          <Box>
                            <Typography color="text.secondary" gutterBottom>Tekanan Saat Ini</Typography>
                            <Typography variant="h4" fontWeight={700} color="primary">
                              {tekanan} mbar
                            </Typography>
                          </Box>
                          <SensorsIcon color="action" sx={{ fontSize: 48, opacity: 0.7 }} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: "100%", backgroundColor: 'background.paper' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between">
                          <Box>
                            <Typography color="text.secondary" gutterBottom>Status Tekanan</Typography>
                            <Box sx={{ mb: 1 }}>
                              <Chip
                                label={statusTekanan.label}
                                color={statusTekanan.color}
                                sx={{ mt: 0.5, fontSize: 16, px: 2, fontWeight: 600, borderRadius: 2 }}
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Batas: Rendah (&lt; 980) | Normal | Tinggi (&gt; 1030)
                            </Typography>
                          </Box>
                          <TrendingUpIcon color="action" sx={{ fontSize: 48, opacity: 0.7 }} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, backgroundColor: 'background.paper' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }} color="text.primary">
                      Grafik Fluktuasi Tekanan
                    </Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={sensorHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <defs>
                          <linearGradient id="colorTekanan" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                        <XAxis dataKey="time" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} tickMargin={10} />
                        <YAxis domain={['auto', 'auto']} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }} />
                        <Area
                          type="monotone"
                          dataKey="tekanan"
                          stroke={theme.palette.primary.main}
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#colorTekanan)"
                          dot={{ r: 4, strokeWidth: 2, fill: theme.palette.background.paper, stroke: theme.palette.primary.main }}
                          activeDot={{ r: 8, fill: theme.palette.primary.main, stroke: theme.palette.background.paper, strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Box>
            </Grid>

            {/* KOLOM KANAN: Daftar Perangkat (Heartbeat) */}
            <Grid item xs={12} md={5}>
              <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: "100%", backgroundColor: 'background.paper' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
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
                                  <Typography fontWeight="bold" color="text.primary">{device.identitas}</Typography>
                                  {getDeviceStatus(device.terakhirAktif)}
                                </Box>
                              }
                              secondary={
                                <>
                                  <Typography component="span" variant="body2" color="text.primary">
                                    {device.namaAlat}
                                  </Typography>
                                  <br />
                                  <Typography component="span" variant="body2" color="text.secondary">
                                    Terakhir aktif: {new Date(device.terakhirAktif).toLocaleTimeString()}
                                  </Typography>
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
        </CustomTabPanel>

        {/* TAB 2: TABEL RIWAYAT & GRAFIK JANGKA PANJANG */}
        <CustomTabPanel value={tabValue} index={1}>

          {/* BAGIAN GRAFIK JANGKA PANJANG */}
          <Box mb={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600} color="text.primary">
                Grafik Tren Jangka Panjang
              </Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="range-select-label">Rentang Waktu</InputLabel>
                <Select
                  labelId="range-select-label"
                  value={chartRange}
                  label="Rentang Waktu"
                  onChange={(e) => setChartRange(e.target.value)}
                >
                  <MenuItem value="1d">1 Hari Terakhir</MenuItem>
                  <MenuItem value="7d">7 Hari Terakhir</MenuItem>
                  <MenuItem value="30d">30 Hari Terakhir</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, backgroundColor: 'background.paper' }}>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {aggregatedHistory.length > 0 ? (
                    <AreaChart data={aggregatedHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                      <XAxis dataKey="time" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} tickMargin={10} />
                      <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }} />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="tekanan"
                        stroke={theme.palette.primary.main}
                        fill={theme.palette.primary.light}
                        fillOpacity={0.3}
                        name="Tekanan (mbar)"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="ketinggian"
                        stroke={theme.palette.error.main}
                        fill={theme.palette.error.light}
                        fillOpacity={0.3}
                        name="Ketinggian (mdpl)"
                      />
                    </AreaChart>
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <Typography color="text.secondary">Tidak ada data untuk rentang waktu ini.</Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>

          {/* BAGIAN TABEL DATA */}
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600} color="text.primary">
              Tabel Data Riwayat (100 Terakhir)
            </Typography>
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

          <Paper elevation={0} sx={{ width: '100%', p: { xs: 1, sm: 3 }, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, backgroundColor: 'background.paper' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>No</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Perangkat</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Tekanan (mbar)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Ketinggian (mdpl / ft)</TableCell>
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
                        <TableCell>{row.ketinggian} / {Math.round((row.ketinggian * 3.28084) / 100) * 100}</TableCell>
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
        </CustomTabPanel>

        {/* FOOTER */}
        <Box mt={6} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            © 2026 – Kezhia
          </Typography>
        </Box>
      </Container>
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
    </SidebarLayout>
  );
}
