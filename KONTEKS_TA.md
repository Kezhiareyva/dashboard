# Konteks Project Tugas Akhir (TA) - Altimeter Monitor (IoT Dashboard)

Dokumen ini berisi rangkuman lengkap mengenai arsitektur, teknologi, dan fitur dari proyek Tugas Akhir Anda yang bernama **Altimeter Monitor**.

## 1. Deskripsi Umum Proyek
Proyek ini merupakan sebuah sistem **Internet of Things (IoT)** yang difungsikan untuk memantau data **ketinggian (Elevasi) dan tekanan udara** secara *real-time*. Sistem ini menerima data dari perangkat keras (seperti ESP32 yang dilengkapi sensor tekanan/altimeter) yang mengirimkan pembacaannya melalui protokol **MQTT**. Data tersebut kemudian diolah, disimpan, dan ditampilkan pada sebuah **Dashboard Web** interaktif yang dibangun menggunakan React.

## 2. Arsitektur Sistem
Sistem ini menggunakan arsitektur *microservices* sederhana yang diorkestrasi menggunakan Docker Compose. Terdapat 3 komponen utama yang berjalan saling berkesinambungan:

1. **Message Broker (Mosquitto MQTT):**
   - Berfungsi sebagai "penerima" dan "pengirim" pesan (pub/sub).
   - Menerima data sensor yang di-*publish* oleh perangkat IoT (ESP32).

2. **Backend Server / WebSocket Bridge (`mqtt-server`):**
   - Merupakan server Node.js (Express.js) yang terhubung ke broker MQTT dan bertindak sebagai *bridge*.
   - Menerima data dari broker MQTT, lalu menyebarkannya (*broadcast*) ke web frontend (Dashboard) secara instan melalui **WebSocket**.
   - Terhubung dengan database **PostgreSQL** (menggunakan Prisma ORM) untuk menyimpan data riwayat, manajemen pengguna, dan status *heartbeat* perangkat (waktu terakhir perangkat aktif).

3. **Frontend Dashboard (`dashboard/aircraft`):**
   - Merupakan antarmuka pengguna berbasis web (SPA - Single Page Application).
   - Menampilkan angka elevasi terkini, grafik historis (fluktuasi ketinggian), dan status nyala/mati dari alat (Online/Offline).

## 3. Fitur-Fitur Utama (Dashboard)
Berdasarkan implementasi kode pada `PressureDashboard.jsx` dan komponen lainnya:

- **Pemantauan *Real-Time*:** Menggunakan WebSocket untuk menerima data tekanan/ketinggian secara instan tanpa perlu memuat ulang halaman (*refresh*).
- **Grafik Fluktuasi Elevasi:** Visualisasi data ketinggian menggunakan *AreaChart* (Recharts) yang otomatis ter-update setiap ada data baru.
- **Sistem Peringatan Dini (Alerts):** Muncul pop-up notifikasi otomatis (Snackbar) dengan indikator warna (Kuning/Merah) jika tekanan jatuh di bawah batas minimum (< 980 hPa) atau melampaui batas maksimum (> 1030 hPa).
- **Pemantauan Status Perangkat (*Device Heartbeat*):** Menampilkan daftar perangkat ESP32 beserta indikator status "Online" atau "Offline" berdasarkan riwayat ping (apabila tidak ada kabar selama > 60 detik akan dilabeli Offline). Data di-refresh menggunakan REST API setiap 10 detik.
- **Dukungan Mode Gelap/Terang (*Dark/Light Mode*):** Menggunakan *Theme Context* dari Material-UI (MUI) sehingga tampilan dashboard bisa disesuaikan dengan preferensi pengguna.
- **Manajemen Akun:** Fitur Registrasi, Login, dan Profil (sistem autentikasi menggunakan JWT di sisi backend).

## 4. Teknologi yang Digunakan (Tech Stack)

### 🖥️ Frontend (Dashboard)
- **Framework & Build Tool:** React 19, Vite.
- **UI Component Library:** Material-UI (MUI) v7, Lucide-React.
- **Data Visualization:** Recharts (untuk grafik area interaktif).
- **Styling Tambahan:** TailwindCSS, Emotion.
- **Routing:** React Router DOM.

### ⚙️ Backend (MQTT-Server)
- **Runtime & Framework:** Node.js, Express.js.
- **Real-time Communication:** `ws` (WebSocket) dan `mqtt.js`.
- **Database & ORM:** PostgreSQL (v16) dan Prisma ORM.
- **Security:** JSON Web Token (JWT) untuk autentikasi, CORS.

### 🐳 Infrastruktur & Deployment
- **Containerization:** Docker & Docker Compose.
- **MQTT Broker:** Eclipse Mosquitto (v2).
- **Database Management:** pgAdmin4 (untuk GUI manajemen PostgreSQL).
- **Web Server (Production):** NGINX (dalam konfigurasi frontend multi-stage build).

## 5. Alur Data (Data Flow) Singkat
1. **Sensor (ESP32)** membaca tekanan atmosfer dan mengkalkulasi ketinggian.
2. **ESP32** mem-*publish* data berformat JSON ke topik tertentu di **Mosquitto MQTT Broker**.
3. **Backend (`mqtt-server`)** yang telah me-*subscribe* topik tersebut menerima JSON, memvalidasi, menyimpan ke database PostgreSQL, lalu mengirimkan *event* ke semua client yang terkoneksi melalui **WebSocket**.
4. **Frontend (React)** menerima *event* WebSocket tersebut, lalu secara dinamis memperbarui *State* React. Grafik dan angka ketinggian langsung bergerak seketika di layar pengguna.
