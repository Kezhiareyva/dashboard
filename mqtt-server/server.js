require('dotenv').config();
const mqtt = require("mqtt");
const WebSocket = require("ws");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const http = require("http");
const express = require("express");
const cors = require("cors");

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(cors());
app.use(express.json());

// --- API AUTHENTICATION ---
app.post("/api/register", async (req, res) => {
  const { nama, email, password } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "Email sudah terdaftar!" });
    
    const newUser = await prisma.user.create({ data: { nama, email, password } });
    res.status(201).json({ message: "Registrasi berhasil!", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Error server", error: error.message });
  }
});

// --- MIDDLEWARE AUTENTIKASI JWT ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"
  
  if (!token) return res.status(401).json({ message: "Akses ditolak, token tidak ada!" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token tidak valid atau kedaluwarsa!" });
    req.user = user;
    next();
  });
};

// --- API UNTUK MENGAMBIL RIWAYAT DATA ---
app.get("/api/history", authenticateToken, async (req, res) => {
  try {
    // Mengambil 100 data terbaru, diurutkan dari yang paling baru
    const historyData = await prisma.altimeterData.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, 
      include: {
        esp: { select: { identitas: true } } // Sertakan nama alat/ESP
      }
    });
    res.status(200).json(historyData);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data riwayat", error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) return res.status(401).json({ message: "Kredensial salah!" });
    
    const { password: _, ...userData } = user;
    
    // Generate Token JWT yang berlaku selama 24 jam
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

    // Kirim token ke frontend beserta data user
    res.status(200).json({ message: "Login berhasil!", user: userData, token: token });
  } catch (error) {
    res.status(500).json({ message: "Error server", error: error.message });
  }
});

// --- API UNTUK MENGAMBIL DAFTAR ESP32 ---
app.get("/api/devices", async (req, res) => {
  try {
    const devices = await prisma.espDevice.findMany();
    res.status(200).json(devices);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data perangkat", error: error.message });
  }
});

// --- SETUP SERVER ---
const PORT = process.env.PORT;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

server.listen(PORT, () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);
});

// --- SETUP MQTT & LOGIKA PENYIMPANAN ---
const mqttBroker = process.env.MQTT_BROKER;
const mqttClient = mqtt.connect(mqttBroker);

mqttClient.on("connect", () => {
  console.log(`✅ MQTT connected to ${mqttBroker}`);
  mqttClient.subscribe("iot/pressure");
});

mqttClient.on("message", async (topic, message) => {
  if (topic === "iot/pressure") {
    const payload = message.toString();
    
    try {
      const data = JSON.parse(payload);

      // Ubah validasi untuk memastikan ESP mengirim identitas dan tekanan
      if (!data.identitas || !data.tekanan) {
        console.log("⚠️ Data ditolak: ESP tidak mengirimkan 'identitas' atau 'tekanan'");
        return; 
      }

      // Rumus konversi Barometrik: Tekanan (hPa) ke Ketinggian (mdpl)
      // Asumsi P0 (Tekanan di permukaan laut) adalah 1013.25 hPa
      const P0 = 1013.25;
      const kalkulasiKetinggian = 44330 * (1 - Math.pow((data.tekanan / P0), 0.1903));
      const ketinggianDibulatkan = parseFloat(kalkulasiKetinggian.toFixed(2));

      // 1. Catat/Update ESP yang mengirim data (Fungsi Heartbeat)
      const esp = await prisma.espDevice.upsert({
        where: { identitas: data.identitas },
        update: { terakhirAktif: new Date() },
        create: {
          identitas: data.identitas,
          namaAlat: "Alat Baru (" + data.identitas + ")",
          terakhirAktif: new Date()
        }
      });

      // 2. Simpan data tekanan dan ketinggian ke database
      await prisma.altimeterData.create({
        data: { 
          tekanan: data.tekanan,
          ketinggian: ketinggianDibulatkan, 
          espId: esp.id 
        }
      });
      
      console.log(`💾 Data dari ${esp.identitas}: Tekanan ${data.tekanan} hPa | Ketinggian ${ketinggianDibulatkan} mdpl`);

      // 3. Kirim data yang sudah lengkap ke Frontend via WebSocket
      const payloadToFrontend = JSON.stringify({
        identitas: data.identitas,
        tekanan: data.tekanan,
        ketinggian: ketinggianDibulatkan,
        waktu: new Date().toISOString()
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payloadToFrontend); 
        }
      });

    } catch (error) {
      console.error("⚠️ Gagal memproses data:", error.message);
    }
  }
});