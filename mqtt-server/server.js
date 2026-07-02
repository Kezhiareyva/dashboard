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
const bcrypt = require("bcryptjs");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(cors());
app.use(express.json());

// --- API AUTHENTICATION ---
app.post("/api/register", async (req, res) => {
  const { nama, email, password } = req.body;
  if (!nama || !email || !password) {
    return res.status(400).json({ message: "Nama, email, dan password wajib diisi!" });
  }
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "Email sudah terdaftar!" });

    // Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({ data: { nama, email, password: hashedPassword } });
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

const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ message: "Akses ditolak, hanya Super Admin yang diizinkan!" });
  }
  // Cegah token lama berlaku jika email SUPERADMIN diubah di .env
  if (req.user.email !== process.env.SUPERADMIN_EMAIL) {
    return res.status(403).json({ message: "Kredensial Super Admin telah usang!" });
  }
  next();
};

const requireAdminOrSuperAdmin = async (req, res, next) => {
  if (req.user.role === 'SUPERADMIN') return requireSuperAdmin(req, res, next);

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: "Akses ditolak, Anda tidak memiliki izin untuk halaman ini!" });
  }

  try {
    // Cek DB: Pastikan status ADMIN belum dicabut (mengatasi token JWT yang masih aktif)
    const userInDb = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!userInDb || userInDb.role !== 'ADMIN') {
      return res.status(403).json({ message: "Akses ditolak, status Admin Anda telah dicabut!" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Kesalahan saat memverifikasi sesi." });
  }
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

app.get("/api/history/chart", authenticateToken, async (req, res) => {
  try {
    const { range } = req.query; // '1d', '7d', '30d'
    
    let intervalString = '1 days';
    let truncUnit = 'minute';

    if (range === '7d') {
      intervalString = '7 days';
      truncUnit = 'hour';
    } else if (range === '30d') {
      intervalString = '30 days';
      truncUnit = 'day'; // Wait, maybe 12 hours or day
    }

    const query = `
      SELECT 
        date_trunc('${truncUnit}', "createdAt") as "time",
        AVG(tekanan) as "tekanan",
        AVG(ketinggian) as "ketinggian"
      FROM "AltimeterData"
      WHERE "createdAt" >= NOW() - INTERVAL '${intervalString}'
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    const chartData = await prisma.$queryRawUnsafe(query);

    const formattedData = chartData.map(row => ({
      time: row.time, // Object Date dari PostgreSQL
      tekanan: Number(row.tekanan).toFixed(2),
      ketinggian: Number(row.ketinggian).toFixed(2)
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    console.error("Gagal agregasi:", error);
    res.status(500).json({ message: "Gagal mengambil data grafik riwayat", error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email dan password wajib diisi!" });
  }
  try {
    // CEK SUPER ADMIN DARI .ENV
    // Aman dari eksploitasi nilai undefined jika variabel .env tidak diset
    if (
      process.env.SUPERADMIN_EMAIL &&
      process.env.SUPERADMIN_PASSWORD &&
      email === process.env.SUPERADMIN_EMAIL &&
      password === process.env.SUPERADMIN_PASSWORD
    ) {
      const token = jwt.sign({ id: 'superadmin', email, role: 'SUPERADMIN' }, JWT_SECRET, { expiresIn: '1d' });
      return res.status(200).json({
        message: "Login berhasil sebagai Super Admin!",
        user: { id: 0, nama: "Super Admin", email, role: "SUPERADMIN" },
        token
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Email tidak terdaftar!", field: "email" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password salah!", field: "password" });
    }

    const { password: _, ...userData } = user;

    // Generate Token JWT yang berlaku selama 24 jam dengan ROLE
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    // Kirim token ke frontend beserta data user
    res.status(200).json({ message: "Login berhasil!", user: userData, token: token });
  } catch (error) {
    res.status(500).json({ message: "Error server", error: error.message });
  }
});

app.put("/api/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ message: "Email dan password baru wajib diisi!" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password minimal 6 karakter!", field: "password" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Email tidak terdaftar!", field: "email" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    res.status(200).json({ message: "Password berhasil diubah!" });
  } catch (error) {
    res.status(500).json({ message: "Error server", error: error.message });
  }
});

// --- API UNTUK MANAJEMEN USER ---
app.get("/api/users", authenticateToken, requireAdminOrSuperAdmin, async (req, res) => {
  try {
    // Jika ADMIN, hanya ambil yang role VIEWER. Jika SUPERADMIN, ambil semua.
    const query = req.user.role === 'ADMIN' ? { where: { role: 'VIEWER' } } : {};

    const users = await prisma.user.findMany({
      ...query,
      select: { id: true, nama: true, email: true, role: true },
      orderBy: { id: 'asc' }
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil daftar user", error: error.message });
  }
});

app.put("/api/users/:id/role", authenticateToken, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    if (!['ADMIN', 'VIEWER'].includes(role)) {
      return res.status(400).json({ message: "Role tidak valid!" });
    }
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
      select: { id: true, nama: true, email: true, role: true }
    });
    res.status(200).json({ message: "Role berhasil diubah", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengubah role", error: error.message });
  }
});

app.delete("/api/users/:id", authenticateToken, requireAdminOrSuperAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // Keamanan Backend Tambahan: Jika ADMIN, pastikan target yang dihapus adalah VIEWER
    if (req.user.role === 'ADMIN') {
      const targetUser = await prisma.user.findUnique({ where: { id: Number(id) } });
      if (!targetUser) {
        return res.status(404).json({ message: "User tidak ditemukan" });
      }
      if (targetUser.role !== 'VIEWER') {
        return res.status(403).json({ message: "Admin hanya bisa menghapus pengguna dengan role VIEWER" });
      }
    }

    await prisma.user.delete({ where: { id: Number(id) } });
    res.status(200).json({ message: "User berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus user", error: error.message });
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

// Objek untuk menyimpan waktu terakhir penyimpanan DB per ESP
const lastDbUpdate = {};

mqttClient.on("connect", () => {
  console.log(`✅ MQTT connected to ${mqttBroker}`);
  mqttClient.subscribe("iot/pressure");
});

mqttClient.on("error", (err) => {
  console.error("❌ MQTT Connection Error:", err);
});

mqttClient.on("reconnect", () => {
  console.log("🔄 MQTT Reconnecting...");
});

mqttClient.on("offline", () => {
  console.log("⚠️ MQTT Offline");
});

mqttClient.on("message", async (topic, message) => {
  if (topic === "iot/pressure") {
    const payload = message.toString();

    try {
      const data = JSON.parse(payload);

      // Ubah validasi untuk memastikan ESP mengirim identitas, tekanan, dan ketinggian
      if (!data.identitas || data.tekanan === undefined || data.ketinggian === undefined) {
        console.log("⚠️ Data ditolak: ESP tidak mengirimkan 'identitas', 'tekanan', atau 'ketinggian'");
        return;
      }

      // Membatasi penyimpanan DB agar tidak memberatkan server (misal tiap 5 detik)
      const now = Date.now();
      const lastUpdate = lastDbUpdate[data.identitas] || 0;
      const shouldSaveToDb = (now - lastUpdate) >= 5000;

      if (shouldSaveToDb) {
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
            ketinggian: data.ketinggian,
            espId: esp.id
          }
        });

        console.log(`💾 Data disimpan ke DB dari ${esp.identitas}: Tekanan ${data.tekanan} hPa | Ketinggian ${data.ketinggian} mdpl`);
        lastDbUpdate[data.identitas] = now;
      }

      // 3. Kirim data yang sudah lengkap ke Frontend via WebSocket
      const payloadToFrontend = JSON.stringify({
        identitas: data.identitas,
        tekanan: data.tekanan,
        ketinggian: data.ketinggian,
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