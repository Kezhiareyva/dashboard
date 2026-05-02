# Docker Deployment untuk CobaReact

Setup Docker lengkap untuk aplikasi IoT dashboard dengan MQTT broker, WebSocket server, dan React frontend.

## 📋 Arsitektur

Aplikasi ini terdiri dari 3 services:

1. **mosquitto** - MQTT broker (Eclipse Mosquitto)
2. **mqtt-server** - WebSocket bridge yang menghubungkan MQTT ke frontend
3. **frontend** - React dashboard (Vite + Material-UI)

## 🚀 Quick Start

### Prerequisites
- Docker Desktop terinstall
- Docker Compose v3.8+

### Menjalankan Aplikasi

1. **Build dan start semua services:**
   ```bash
   docker-compose up --build
   ```

2. **Atau jalankan di background:**
   ```bash
   docker-compose up -d --build
   ```

3. **Akses aplikasi:**
   - Frontend: http://localhost:3000
   - WebSocket: ws://localhost:8080
   - MQTT Broker: mqtt://localhost:1883
   
   > **Note**: Jika menggunakan Nginx Proxy Manager, lihat [NGINX_PROXY_MANAGER.md](file:///z:/CobaReact/NGINX_PROXY_MANAGER.md) untuk setup dengan domain dan SSL.

### Mengelola Services

**Lihat status containers:**
```bash
docker-compose ps
```

**Lihat logs:**
```bash
# Semua services
docker-compose logs

# Service tertentu
docker-compose logs frontend
docker-compose logs mqtt-server
docker-compose logs mosquitto

# Follow logs (real-time)
docker-compose logs -f
```

**Stop services:**
```bash
docker-compose down
```

**Stop dan hapus volumes (reset data MQTT):**
```bash
docker-compose down -v
```

**Rebuild specific service:**
```bash
docker-compose up --build frontend
```

## 🧪 Testing MQTT

Untuk mengirim test message ke MQTT broker:

**Menggunakan mosquitto_pub (jika terinstall):**
```bash
mosquitto_pub -h localhost -t iot/pressure -m '{"value": 42, "timestamp": 1234567890}'
```

**Menggunakan Docker:**
```bash
docker exec mosquitto mosquitto_pub -t iot/pressure -m '{"value": 42, "timestamp": 1234567890}'
```

Message akan diterima oleh mqtt-server dan dikirim ke frontend melalui WebSocket.

## 📁 Struktur File

```
CobaReact/
├── docker-compose.yml          # Orchestration semua services
├── mosquitto.conf              # Konfigurasi MQTT broker
├── mqtt-server/
│   ├── Dockerfile              # Container untuk WebSocket bridge
│   ├── .dockerignore
│   ├── server.js
│   └── package.json
└── dashboard/aircraft/
    ├── Dockerfile              # Multi-stage build untuk React
    ├── .dockerignore
    ├── nginx.conf              # Nginx config untuk serving SPA
    └── src/
```

## 🔧 Konfigurasi

### Environment Variables

Anda bisa mengubah konfigurasi dengan environment variables di `docker-compose.yml`:

- `MQTT_BROKER`: URL MQTT broker (default: mqtt://mosquitto:1883)

### Ports

Default ports:
- Frontend: 3000 (internal: 80)
- WebSocket: 8080  
- MQTT: 1883
- MQTT WebSocket: 9001

**Catatan**: Port 3000 dipilih agar kompatibel dengan Nginx Proxy Manager. Jika tidak pakai NPM dan ingin langsung port 80, ubah di `docker-compose.yml` dari `3000:80` menjadi `80:80`.

### Persistence

Data MQTT broker disimpan di Docker volumes:
- `mosquitto_data` - Persistent messages
- `mosquitto_log` - Logs

## 🛠️ Development vs Production

File Docker ini sudah dioptimasi untuk production:
- ✅ Multi-stage builds untuk image size minimal
- ✅ Non-root users untuk security
- ✅ Health checks
- ✅ Auto-restart policies
- ✅ Gzip compression di Nginx
- ✅ Static asset caching

## 🐛 Troubleshooting

**Frontend tidak bisa connect ke WebSocket:**
- Pastikan mqtt-server running: `docker-compose ps`
- Check logs: `docker-compose logs mqtt-server`
- Verify port 8080 tidak digunakan aplikasi lain

**MQTT connection failed:**
- Check mosquitto logs: `docker-compose logs mosquitto`
- Pastikan port 1883 tidak digunakan aplikasi lain
- Verify mosquitto.conf syntax

**Container terus restart:**
- Lihat logs untuk error: `docker-compose logs <service-name>`
- Check health status: `docker inspect <container-name>`

## 📦 Production Deployment

Untuk deploy ke production server:

1. **Copy semua files ke server**
2. **Set environment variables sesuai kebutuhan**
3. **Run dengan detached mode:**
   ```bash
   docker-compose up -d --build
   ```

4. **Setup reverse proxy (optional)** untuk SSL/TLS menggunakan Nginx atau Caddy

5. **Monitor logs:**
   ```bash
   docker-compose logs -f
   ```

## 🔐 Security Notes

> [!WARNING]
> Konfigurasi default menggunakan `allow_anonymous true` di MQTT broker untuk kemudahan development. 
> Untuk production, sebaiknya:
> - Enable authentication di mosquitto.conf
> - Gunakan SSL/TLS certificates
> - Setup firewall rules
> - Gunakan secrets management untuk credentials
