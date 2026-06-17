import React, { useState, useEffect } from "react";
import {
  Card, CardContent, Typography, Grid, Container, Box, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button
} from "@mui/material";
import SpeedIcon from "@mui/icons-material/Speed";
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

export default function Airspeed() {
  const [tabValue, setTabValue] = useState(0);

  const [knots, setKnots] = useState(() => {
    const saved = localStorage.getItem("currentKnots");
    return saved ? Number(saved) : 0;
  });

  const [speedHistory, setSpeedHistory] = useState(() => {
    const saved = localStorage.getItem("speedHistory");
    return saved ? JSON.parse(saved) : [];
  });

  const [dataRiwayat, setDataRiwayat] = useState([]);

  // Rumus Inversi dari: targetPressure = 921.4025 + (0.0566 * knots) + (0.0021 * pow(knots, 2))
  const calculateKnots = (p) => {
    const a = 0.0021;
    const b = 0.0566;
    const c = 921.4025 - p;
    const D = (b * b) - (4 * a * c);
    
    if (D < 0) return 0;
    
    let k = (-b + Math.sqrt(D)) / (2 * a);
    return k > 0 ? parseFloat(k.toFixed(2)) : 0;
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    localStorage.setItem("speedHistory", JSON.stringify(speedHistory));
    localStorage.setItem("currentKnots", knots);
  }, [speedHistory, knots]);

  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.tekanan !== undefined) {
        const currentKnots = calculateKnots(data.tekanan);
        setKnots(currentKnots);
        
        setSpeedHistory((prev) => [
          ...prev.slice(-19),
          { time: new Date().toLocaleTimeString(), speed: currentKnots },
        ]);
      }
    };

    return () => ws.close();
  }, []);

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
          setDataRiwayat(data);
          
          if (data && data.length > 0) {
            const recentData = data.slice(0, 20).reverse().map(item => ({
              time: new Date(item.createdAt).toLocaleTimeString(),
              speed: calculateKnots(item.tekanan)
            }));
            setSpeedHistory(recentData);
            setKnots(calculateKnots(data[0].tekanan));
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
    let csvContent = "ID,Identitas Alat,Tekanan Referensi (mbar),Kecepatan (knots),Waktu Pencatatan\n";
    dataRiwayat.forEach(row => {
      const waktu = new Date(row.createdAt).toLocaleString();
      const knotsValue = calculateKnots(row.tekanan);
      csvContent += `${row.id},${row.esp?.identitas || '-'},${row.tekanan},${knotsValue},"${waktu}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Riwayat_Airspeed_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SidebarLayout title="Airspeed">
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <Box mb={2}>
          <Typography variant="h4" fontWeight={700} gutterBottom color="text.primary">
            Airspeed Monitoring
          </Typography>
          <Typography color="text.secondary">
            Pantauan Kecepatan Udara secara Real-Time berdasarkan data tekanan ADTS.
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="airspeed tabs">
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
                  Kecepatan Udara Saat Ini
                </Typography>
                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid #e0e0e0`, backgroundColor: 'background.paper', mb: 3 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between">
                      <Box>
                        <Typography color="text.secondary" gutterBottom>Airspeed</Typography>
                        <Typography variant="h4" fontWeight={700} color="primary">
                          {knots} <Typography component="span" variant="h6" color="text.secondary">knots</Typography>
                        </Typography>
                      </Box>
                      <SpeedIcon color="action" sx={{ fontSize: 48, opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>

                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid #e0e0e0`, backgroundColor: 'background.paper' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }} color="text.primary">
                      Grafik Fluktuasi Kecepatan Udara
                    </Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={speedHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                        <XAxis dataKey="time" tick={{ fill: "#9e9e9e", fontSize: 12 }} />
                        <YAxis domain={['auto', 'auto']} tick={{ fill: "#9e9e9e", fontSize: 12 }} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="speed"
                          stroke="#d32f2f"
                          strokeWidth={4}
                          fill="#d32f2f"
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
                    <TableCell sx={{ fontWeight: 'bold' }}>Kecepatan (knots)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Waktu Pencatatan</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataRiwayat.length > 0 ? (
                    dataRiwayat.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{row.esp?.identitas || 'Tidak diketahui'}</TableCell>
                        <TableCell>{calculateKnots(row.tekanan)}</TableCell>
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
