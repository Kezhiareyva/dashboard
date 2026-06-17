import React, { useState, useEffect, useRef } from "react";
import {
  Card, CardContent, Typography, Grid, Container, Box, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button
} from "@mui/material";
import SwapVertIcon from '@mui/icons-material/SwapVert';
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

export default function VerticalSpeed() {
  const [tabValue, setTabValue] = useState(0);

  const [vSpeed, setVSpeed] = useState(() => {
    const saved = localStorage.getItem("currentVSpeed");
    return saved ? Number(saved) : 0;
  });

  const [speedHistory, setSpeedHistory] = useState(() => {
    const saved = localStorage.getItem("vSpeedHistory");
    return saved ? JSON.parse(saved) : [];
  });

  const [dataRiwayat, setDataRiwayat] = useState([]);
  const prevDataRef = useRef(null);

  // Rumus Konversi Tekanan -> Altitude (ft) dari ESP Code
  const calculateAltitudeFt = (p) => {
    if (!p || p <= 0) return 0;
    return (1 - Math.pow(p / 1013.25, 0.190284)) * 145366.45;
  };

  // Kalkulasi VSI (ft/min)
  const calculateVSpeed = (currentAlt, prevAlt, dtSeconds) => {
    if (dtSeconds <= 0) return 0;
    const vsi_fps = (currentAlt - prevAlt) / dtSeconds;
    return parseFloat((vsi_fps * 60).toFixed(2));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    localStorage.setItem("vSpeedHistory", JSON.stringify(speedHistory));
    localStorage.setItem("currentVSpeed", vSpeed);
  }, [speedHistory, vSpeed]);

  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.tekanan !== undefined) {
        const currentAlt = calculateAltitudeFt(data.tekanan);
        const currentTime = new Date();
        
        let currentVSpeed = 0;
        if (prevDataRef.current) {
          const dtSeconds = (currentTime - prevDataRef.current.time) / 1000;
          currentVSpeed = calculateVSpeed(currentAlt, prevDataRef.current.alt, dtSeconds);
          
          // Filter EMA sederhana untuk menstabilkan lonjakan VSI
          const alpha_vsi = 0.15;
          currentVSpeed = (alpha_vsi * currentVSpeed) + ((1.0 - alpha_vsi) * vSpeed);
          currentVSpeed = parseFloat(currentVSpeed.toFixed(2));
        }
        
        prevDataRef.current = { alt: currentAlt, time: currentTime };
        setVSpeed(currentVSpeed);
        
        setSpeedHistory((prev) => [
          ...prev.slice(-19),
          { time: currentTime.toLocaleTimeString(), vSpeed: currentVSpeed },
        ]);
      }
    };

    return () => ws.close();
  }, [vSpeed]);

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
          
          // Proses array riwayat (karena urutannya descending: terbaru di index 0)
          const processedHistory = data.map((row, index) => {
            let vsi = 0;
            // Gunakan baris berikutnya (data lebih lama) untuk hitung selisih
            if (index < data.length - 1) {
              const olderRow = data[index + 1];
              const currentAlt = calculateAltitudeFt(row.tekanan);
              const olderAlt = calculateAltitudeFt(olderRow.tekanan);
              const dtSeconds = (new Date(row.createdAt) - new Date(olderRow.createdAt)) / 1000;
              vsi = calculateVSpeed(currentAlt, olderAlt, dtSeconds);
            }
            return { ...row, vSpeed: vsi };
          });
          
          setDataRiwayat(processedHistory);
          
          if (processedHistory && processedHistory.length > 0) {
            const recentData = processedHistory.slice(0, 20).reverse().map(item => ({
              time: new Date(item.createdAt).toLocaleTimeString(),
              vSpeed: item.vSpeed
            }));
            setSpeedHistory(recentData);
            setVSpeed(processedHistory[0].vSpeed);
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data history:", error);
      }
    };

    fetchHistory();
  }, []);

  const handleExportCSV = () => {
    if (dataRiwayat.length === 0) return alert("Tidak ada data untuk diekspor");
    let csvContent = "ID,Identitas Alat,Altitude (ft),Vertical Speed (ft/min),Waktu Pencatatan\n";
    dataRiwayat.forEach(row => {
      const waktu = new Date(row.createdAt).toLocaleString();
      const altitudeFt = calculateAltitudeFt(row.tekanan).toFixed(2);
      csvContent += `${row.id},${row.esp?.identitas || '-'},${altitudeFt},${row.vSpeed},"${waktu}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Riwayat_VerticalSpeed_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SidebarLayout title="Vertical Speed">
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <Box mb={2}>
          <Typography variant="h4" fontWeight={700} gutterBottom color="text.primary">
            Vertical Speed Monitoring
          </Typography>
          <Typography color="text.secondary">
            Pantauan Kecepatan Vertikal (Rate of Climb/Descent) secara Real-Time.
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="vertical speed tabs">
            <Tab label="Grafik & Realtime" sx={{ fontWeight: 'bold' }} />
            <Tab label="Tabel Riwayat" sx={{ fontWeight: 'bold' }} />
          </Tabs>
        </Box>

        {/* TAB 1: GRAFIK & REALTIME */}
        <CustomTabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box mb={4}>
                <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary" sx={{ mb: 2 }}>
                  Kecepatan Vertikal Saat Ini
                </Typography>
                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid #e0e0e0`, backgroundColor: 'background.paper', mb: 3 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between">
                      <Box>
                        <Typography color="text.secondary" gutterBottom>Vertical Speed (VSI)</Typography>
                        <Typography variant="h4" fontWeight={700} color={vSpeed > 0 ? "success.main" : vSpeed < 0 ? "error.main" : "primary"}>
                          {vSpeed > 0 ? `+${vSpeed}` : vSpeed} <Typography component="span" variant="h6" color="text.secondary">ft/min</Typography>
                        </Typography>
                      </Box>
                      <SwapVertIcon color="action" sx={{ fontSize: 48, opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>

                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid #e0e0e0`, backgroundColor: 'background.paper' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }} color="text.primary">
                      Grafik Fluktuasi Vertical Speed
                    </Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={speedHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                        <XAxis dataKey="time" tick={{ fill: "#9e9e9e", fontSize: 12 }} />
                        <YAxis domain={['auto', 'auto']} tick={{ fill: "#9e9e9e", fontSize: 12 }} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="vSpeed"
                          stroke="#0288d1"
                          strokeWidth={4}
                          fill="#0288d1"
                          fillOpacity={0.1}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </CustomTabPanel>

        {/* TAB 2: TABEL RIWAYAT */}
        <CustomTabPanel value={tabValue} index={1}>
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

          <Paper elevation={0} sx={{ width: '100%', p: { xs: 1, sm: 3 }, borderRadius: 3, border: `1px solid #e0e0e0`, backgroundColor: 'background.paper' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>No</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Perangkat</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Vertical Speed (ft/min)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Waktu Pencatatan</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataRiwayat.length > 0 ? (
                    dataRiwayat.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{row.esp?.identitas || 'Tidak diketahui'}</TableCell>
                        <TableCell sx={{ color: row.vSpeed > 0 ? 'success.main' : row.vSpeed < 0 ? 'error.main' : 'inherit' }}>
                          {row.vSpeed > 0 ? `+${row.vSpeed}` : row.vSpeed}
                        </TableCell>
                        <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>Tidak ada data riwayat.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </CustomTabPanel>
      </Container>
    </SidebarLayout>
  );
}
