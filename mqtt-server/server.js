require('dotenv').config();
const mqtt = require("mqtt");
const WebSocket = require("ws");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const http = require("http");

// Inisialisasi Prisma Client untuk PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

const PORT = process.env.PORT;
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Halo! API dan WebSocket Altimeter berjalan dengan lancar!");
});

const wss = new WebSocket.Server({ server });
console.log(`🚀 Server HTTP & WebSocket running on port ${PORT}`);
// ==========================================
// 1. SETUP MQTT BROKER
// ==========================================
// Menggunakan HiveMQ untuk tes lokal, atau Environment Variable jika di Docker nanti
const mqttBroker = process.env.MQTT_BROKER;
const mqttClient = mqtt.connect(mqttBroker);


// ==========================================
// 3. LOGIKA PENERIMAAN & PENYIMPANAN DATA
// ==========================================
mqttClient.on("connect", () => {
  console.log(`✅ MQTT connected to ${mqttBroker}`);
  // Menggunakan topik sesuai dengan kode bawaanmu
  mqttClient.subscribe("iot/pressure");
});

mqttClient.on("error", (error) => {
  console.error("❌ Gagal Konek MQTT:", error.message);
});

mqttClient.on("offline", () => {
  console.log("⚠️ MQTT Offline / Sedang mencoba menyambung ulang...");
});

mqttClient.on("message", async (topic, message) => {
  if (topic === "iot/pressure") {
    const payload = message.toString();
    console.log("📥 MQTT Message Diterima:", payload);

    // --- A. SIMPAN KE DATABASE POSTGRESQL (VIA PRISMA) ---
    try {
      // Mengubah string JSON dari ESP32 menjadi objek JavaScript
      // Pastikan ESP32 mengirim data dalam bentuk JSON, contoh: {"ketinggian": 1240.5}
      const data = JSON.parse(payload);

      // Cek apakah database masih kosong. Jika ya, buat "User Bayangan"
      let userDummy = await prisma.user.findFirst();
      if (!userDummy) {
        userDummy = await prisma.user.create({
          data: {
            nama: "Sistem ESP32",
            email: "esp32@testing.local",
            password: "rahasia"
          }
        });
        console.log("👤 User dummy otomatis dibuat dengan ID:", userDummy.id);
      }

      // Simpan data tekanan/ketinggian ke tabel AltimeterData
      await prisma.altimeterData.create({
        data: {
          ketinggian: data.ketinggian,
          userId: userDummy.id 
        }
      });
      console.log(`💾 Data tersimpan ke database: ${data.ketinggian} mdpl`);

    } catch (error) {
      console.error("⚠️ Gagal menyimpan ke database (Pastikan payload berupa JSON):", error.message);
    }

    // --- B. KIRIM KE FRONTEND REACT (VIA WEBSOCKET) ---
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // Mengirim data mentah langsung ke React agar dashboard langsung update
        client.send(payload); 
      }
    });
  }
});