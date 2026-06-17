import React, { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Container,
  Box,
  useTheme
} from "@mui/material";
import SpeedIcon from "@mui/icons-material/Speed";
import SensorsIcon from "@mui/icons-material/Sensors";
import SwapVertIcon from '@mui/icons-material/SwapVert';
import SidebarLayout from './SidebarLayout';

export default function MainDashboard() {
  const theme = useTheme();

  // States
  const [ketinggian, setKetinggian] = useState(() => {
    const saved = localStorage.getItem("currentKetinggian");
    return saved ? Number(saved) : 0;
  });

  const [tekanan, setTekanan] = useState(() => {
    const saved = localStorage.getItem("currentTekanan");
    return saved ? Number(saved) : 0;
  });

  const [knots, setKnots] = useState(() => {
    const saved = localStorage.getItem("currentKnots");
    return saved ? Number(saved) : 0;
  });

  const [vSpeed, setVSpeed] = useState(() => {
    const saved = localStorage.getItem("currentVSpeed");
    return saved ? Number(saved) : 0;
  });

  const prevDataRef = useRef(null);

  // Helper Functions
  const calculateKnots = (p) => {
    const a = 0.0021;
    const b = 0.0566;
    const c = 921.4025 - p;
    const D = (b * b) - (4 * a * c);
    if (D < 0) return 0;
    let k = (-b + Math.sqrt(D)) / (2 * a);
    return k > 0 ? parseFloat(k.toFixed(2)) : 0;
  };

  const calculateAltitudeFt = (p) => {
    if (!p || p <= 0) return 0;
    return (1 - Math.pow(p / 1013.25, 0.190284)) * 145366.45;
  };

  const calculateVSpeed = (currentAlt, prevAlt, dtSeconds) => {
    if (dtSeconds <= 0) return 0;
    const vsi_fps = (currentAlt - prevAlt) / dtSeconds;
    return parseFloat((vsi_fps * 60).toFixed(2));
  };

  // Websocket for real data
  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.tekanan !== undefined && data.ketinggian !== undefined) {
        setKetinggian(data.ketinggian);
        setTekanan(data.tekanan);

        // Calculate Airspeed
        const currentKnots = calculateKnots(data.tekanan);
        setKnots(currentKnots);

        // Calculate Vertical Speed
        const currentAlt = calculateAltitudeFt(data.tekanan);
        const currentTime = new Date();
        
        let currentVSpeed = 0;
        if (prevDataRef.current) {
          const dtSeconds = (currentTime - prevDataRef.current.time) / 1000;
          currentVSpeed = calculateVSpeed(currentAlt, prevDataRef.current.alt, dtSeconds);
          
          const alpha_vsi = 0.15;
          // Menggunakan state vSpeed lama bisa berisiko basi di dalam ws.onmessage, tapi cukup untuk perkiraan VSI
          currentVSpeed = (alpha_vsi * currentVSpeed) + ((1.0 - alpha_vsi) * (parseFloat(localStorage.getItem("currentVSpeed")) || 0));
          currentVSpeed = parseFloat(currentVSpeed.toFixed(2));
        }
        
        prevDataRef.current = { alt: currentAlt, time: currentTime };
        setVSpeed(currentVSpeed);

        // Save to Local Storage
        localStorage.setItem("currentKetinggian", data.ketinggian);
        localStorage.setItem("currentTekanan", data.tekanan);
        localStorage.setItem("currentKnots", currentKnots);
        localStorage.setItem("currentVSpeed", currentVSpeed);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <SidebarLayout title="Dashboard Utama">
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <Box mb={4}>
          <Typography variant="h4" fontWeight={700} gutterBottom color="text.primary">
            Sistem ADTS (Air Data Test Set)
          </Typography>
          <Typography color="text.secondary">
            Ringkasan pemantauan seluruh sistem penerbangan secara real-time.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Airspeed Summary */}
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: "100%", backgroundColor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.05, transform: 'rotate(15deg)' }}>
                <SpeedIcon sx={{ fontSize: 150 }} />
              </Box>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <SpeedIcon color="primary" sx={{ mr: 1, fontSize: 32 }} />
                  <Typography variant="h6" fontWeight={600} color="text.primary">
                    Airspeed
                  </Typography>
                </Box>
                <Typography color="text.secondary" gutterBottom>Kecepatan Udara Saat Ini</Typography>
                <Typography variant="h3" fontWeight={700} color="primary" sx={{ mb: 1 }}>
                  {knots} <Typography component="span" variant="h5" color="text.secondary">knots</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: Aktif (Real-time)
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Altimeter Summary */}
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: "100%", backgroundColor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.05, transform: 'rotate(15deg)' }}>
                <SensorsIcon sx={{ fontSize: 150 }} />
              </Box>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <SensorsIcon color="primary" sx={{ mr: 1, fontSize: 32 }} />
                  <Typography variant="h6" fontWeight={600} color="text.primary">
                    Altimeter
                  </Typography>
                </Box>
                <Typography color="text.secondary" gutterBottom>Ketinggian & Tekanan</Typography>
                <Typography variant="h3" fontWeight={700} color="primary" sx={{ mb: 1 }}>
                  {ketinggian} <Typography component="span" variant="h5" color="text.secondary">mdpl</Typography>
                </Typography>
                <Typography variant="h5" fontWeight={600} color="primary" sx={{ mb: 1 }}>
                  {tekanan} <Typography component="span" variant="body1" color="text.secondary">mbar</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: Aktif (Real-time)
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Vertical Speed Summary */}
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: "100%", backgroundColor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.05, transform: 'rotate(15deg)' }}>
                <SwapVertIcon sx={{ fontSize: 150 }} />
              </Box>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <SwapVertIcon color="primary" sx={{ mr: 1, fontSize: 32 }} />
                  <Typography variant="h6" fontWeight={600} color="text.primary">
                    Vertical Speed
                  </Typography>
                </Box>
                <Typography color="text.secondary" gutterBottom>Kecepatan Vertikal</Typography>
                <Typography variant="h3" fontWeight={700} color={vSpeed > 0 ? "success.main" : vSpeed < 0 ? "error.main" : "primary"} sx={{ mb: 1 }}>
                  {vSpeed > 0 ? `+${vSpeed}` : vSpeed} <Typography component="span" variant="h5" color="text.secondary">ft/min</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: Aktif (Real-time)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      </Container>
    </SidebarLayout>
  );
}
