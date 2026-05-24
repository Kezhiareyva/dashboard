require('dotenv').config();
const mqtt = require("mqtt");
const WebSocket = require("ws");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const http = require("http");
const express = require("express");
const cors = require("cors");

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

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) return res.status(401).json({ message: "Kredensial salah!" });
    
    const { password: _, ...userData } = user;
    res.status(200).json({ message: "Login berhasil!", user: userData });
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

      if (!data.identitas) {
        console.log("⚠️ Data ditolak: ESP tidak mengirimkan 'identitas'");
        return; 
      }

      // 1. Catat/Update ESP yang mengirim data (Fungsi Heartbeat)
      const esp = await prisma.espDevice.upsert({
        where: { identitas: data.identitas },
        update: { terakhirAktif: new Date() }, // Update waktu online
        create: {
          identitas: data.identitas,
          namaAlat: "Alat Baru (" + data.identitas + ")",
          terakhirAktif: new Date()
        }
      });

      // 2. Simpan data sensornya
      await prisma.altimeterData.create({
        data: { ketinggian: data.ketinggian, espId: esp.id }
      });
      
      console.log(`💾 Data dari ${esp.identitas}: ${data.ketinggian} mdpl`);

    } catch (error) {
      console.error("⚠️ Gagal memproses data:", error.message);
    }

    // Kirim data ke Frontend
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload); 
      }
    });
  }
});