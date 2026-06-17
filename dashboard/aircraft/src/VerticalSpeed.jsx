import React, { useState } from "react";
import {
  Card, CardContent, Typography, Grid, Container, Box, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from "@mui/material";
import SwapVertIcon from '@mui/icons-material/SwapVert';
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

  // Dummy data
  const dummyHistory = [
    { time: "10:00:00", vSpeed: 0 },
    { time: "10:00:10", vSpeed: 0 },
    { time: "10:00:20", vSpeed: 0 },
    { time: "10:00:30", vSpeed: 0 },
    { time: "10:00:40", vSpeed: 0 },
  ];

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <SidebarLayout title="Vertical Speed">
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <Box mb={2}>
          <Typography variant="h4" fontWeight={700} gutterBottom color="text.primary">
            Vertical Speed Monitoring
          </Typography>
          <Typography color="text.secondary">
            Pantauan Kecepatan Vertikal secara Real-Time. (Sistem belum terintegrasi).
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
                        <Typography color="text.secondary" gutterBottom>Vertical Speed</Typography>
                        <Typography variant="h4" fontWeight={700} color="primary">
                          0 <Typography component="span" variant="h6" color="text.secondary">ft/min</Typography>
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
                      <AreaChart data={dummyHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                        <XAxis dataKey="time" tick={{ fill: "#9e9e9e", fontSize: 12 }} />
                        <YAxis domain={['auto', 'auto']} tick={{ fill: "#9e9e9e", fontSize: 12 }} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="vSpeed"
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
          <Paper elevation={0} sx={{ width: '100%', p: { xs: 1, sm: 3 }, borderRadius: 3, border: `1px solid #e0e0e0`, backgroundColor: 'background.paper' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>No</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Perangkat</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Kecepatan Vertikal (ft/min)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Waktu Pencatatan</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>Tidak ada data riwayat.</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </CustomTabPanel>
      </Container>
    </SidebarLayout>
  );
}
