import React, { useEffect, useState } from "react";
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

  // Altimeter Data (Real)
  const [ketinggian, setKetinggian] = useState(() => {
    const saved = localStorage.getItem("currentKetinggian");
    return saved ? Number(saved) : 0;
  });

  const [tekanan, setTekanan] = useState(() => {
    const saved = localStorage.getItem("currentTekanan");
    return saved ? Number(saved) : 0;
  });

  // Websocket for real Altimeter data
  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.tekanan !== undefined && data.ketinggian !== undefined) {
        setKetinggian(data.ketinggian);
        setTekanan(data.tekanan);
        localStorage.setItem("currentKetinggian", data.ketinggian);
        localStorage.setItem("currentTekanan", data.tekanan);
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
                  0 <Typography component="span" variant="h5" color="text.secondary">knots</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: Tidak ada data
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
                <Typography variant="h3" fontWeight={700} color="primary" sx={{ mb: 1 }}>
                  0 <Typography component="span" variant="h5" color="text.secondary">ft/min</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: Tidak ada data
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      </Container>
    </SidebarLayout>
  );
}
