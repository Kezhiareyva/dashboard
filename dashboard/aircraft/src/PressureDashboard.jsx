import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Container,
  Box,
  Chip,
} from "@mui/material";
import SpeedIcon from "@mui/icons-material/Speed";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AltimeterDashboard() {
  // Menggunakan key 'ketinggian' agar selaras dengan database PostgreSQL
  const [ketinggian, setKetinggian] = useState(() => {
    const saved = localStorage.getItem("currentKetinggian");
    return saved ? Number(saved) : 0;
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("ketinggianHistory");
    return saved ? JSON.parse(saved) : [];
  });

  // SIMPAN SETIAP UPDATE KE LOCAL STORAGE
  useEffect(() => {
    localStorage.setItem("ketinggianHistory", JSON.stringify(history));
    localStorage.setItem("currentKetinggian", ketinggian);
  }, [history, ketinggian]);

  // KONEKSI WEBSOCKET KE BACKEND NODE.JS
  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Memastikan data yang masuk memiliki properti 'ketinggian'
      if (data.ketinggian !== undefined) {
        setKetinggian(data.ketinggian);
        setHistory((prev) => [
          ...prev.slice(-19), // Menyimpan 20 data terakhir
          { time: new Date().toLocaleTimeString(), value: data.ketinggian },
        ]);
      }
    };

    return () => ws.close();
  }, []);

  const getStatus = () => {
    // Ambang batas disesuaikan dengan elevasi geografis rata-rata area Bojongsoang/Bandung
    if (ketinggian < 650) return { label: "Rendah", color: "info" };
    if (ketinggian > 750) return { label: "Tinggi", color: "error" };
    return { label: "Normal", color: "success" };
  };

  const status = getStatus();

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f4f6f8", py: 6, width: "100vw", overflowX: "hidden" }}>
      <Container maxWidth="lg">
        {/* HEADER */}
        <Box mb={4}>
          <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: "#000" }}>
            Dashboard Monitoring Altimeter
          </Typography>
          <Typography color="text.secondary">
            Monitoring Ketinggian (Elevasi)
          </Typography>
        </Box>

        {/* INFO CARDS */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary">
                      Ketinggian Saat Ini
                    </Typography>
                    <Typography variant="h4" fontWeight={600}>
                      {ketinggian} mdpl
                    </Typography>
                  </Box>
                  <SpeedIcon color="action" sx={{ fontSize: 48 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary">Status</Typography>
                    <Chip
                      label={status.label}
                      color={status.color}
                      sx={{ mt: 1, fontSize: 16, px: 1.5 }}
                    />
                  </Box>
                  <TrendingUpIcon color="action" sx={{ fontSize: 48 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography color="text.secondary">Ambang Normal</Typography>
                <Typography variant="h5" fontWeight={600} mt={1}>
                  650 – 750 mdpl
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* CHART */}
        <Card elevation={3} sx={{ borderRadius: 3, mt: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Grafik Ketinggian
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={history}>
                <XAxis dataKey="time" />
                {/* Domain Y-Axis disesuaikan agar grafik terlihat berfluktuasi dengan jelas di kisaran normal */}
                <YAxis domain={[600, 800]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#1976d2"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* FOOTER */}
        <Box mt={4} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            © 2025 – Kezhia
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}