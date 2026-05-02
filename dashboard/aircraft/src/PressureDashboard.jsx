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

export default function PressureDashboard() {
  const [pressure, setPressure] = useState(() => {
  const saved = localStorage.getItem("currentPressure");
  return saved ? Number(saved) : 0;
});

const [history, setHistory] = useState(() => {
  const saved = localStorage.getItem("pressureHistory");
  return saved ? JSON.parse(saved) : [];
});

  // SIMPAN SETIAP UPDATE
  useEffect(() => {
    localStorage.setItem("pressureHistory", JSON.stringify(history));
    localStorage.setItem("currentPressure", pressure);
  }, [history, pressure]);

  useEffect(() => {
  const ws = new WebSocket("ws://localhost:8080");

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    setPressure(data.pressure);
    setHistory(prev => [
      ...prev.slice(-19),
      { time: new Date().toLocaleTimeString(), value: data.pressure }
    ]);
  };

  return () => ws.close();
}, []);


  const getStatus = () => {
    if (pressure < 980) return { label: "Rendah", color: "info" };
    if (pressure > 1030) return { label: "Tinggi", color: "error" };
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
            Monitoring Tekanan Udara
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
                      Tekanan Saat Ini
                    </Typography>
                    <Typography variant="h4" fontWeight={600}>
                      {pressure} hPa
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
                  980 – 1030 hPa
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* CHART */}
        <Card elevation={3} sx={{ borderRadius: 3, mt: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Grafik Tekanan Udara
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={history}>
                <XAxis dataKey="time" />
                <YAxis domain={[950, 1050]} />
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
