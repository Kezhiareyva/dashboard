# Setup dengan Nginx Proxy Manager

Panduan konfigurasi aplikasi dengan Nginx Proxy Manager (NPM) untuk akses production dengan domain dan SSL.

## 📋 Services yang Perlu di-Setup

Setelah menjalankan `docker-compose up -d`, Anda akan punya 3 services:

| Service | Container | Port Internal | Port Exposed |
|---------|-----------|---------------|--------------|
| Frontend | frontend | 80 | 3000 |
| WebSocket | mqtt-server | 8080 | 8080 |
| MQTT Broker | mosquitto | 1883, 9001 | 1883, 9001 |

## 🌐 Konfigurasi Nginx Proxy Manager

### 1. Proxy Host untuk Frontend (Dashboard)

Di Nginx Proxy Manager, buat **Proxy Host** baru:

**Details Tab:**
- **Domain Names**: `dashboard.yourdomain.com` (atau sesuai domain Anda)
- **Scheme**: `http`
- **Forward Hostname/IP**: `localhost` (atau IP server Docker)
- **Forward Port**: `3000`
- **Cache Assets**: ✅ (centang)
- **Block Common Exploits**: ✅ (centang)
- **Websockets Support**: ✅ (centang - penting untuk WebSocket connection)

**SSL Tab:**
- **SSL Certificate**: Pilih certificate atau buat baru (Let's Encrypt)
- **Force SSL**: ✅ (centang)
- **HTTP/2 Support**: ✅ (centang)
- **HSTS Enabled**: ✅ (centang)

**Custom Nginx Configuration (Optional):**
```nginx
# Increase timeouts for WebSocket
proxy_read_timeout 3600s;
proxy_send_timeout 3600s;

# Additional headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
```

### 2. Stream untuk WebSocket (Opsional)

Jika WebSocket menggunakan port terpisah, Anda bisa setup **Stream**:

**Streams Tab:**
- **Incoming Port**: `8080`
- **Forward Host**: `localhost`
- **Forward Port**: `8080`
- **TCP Forwarding**: ✅

Atau bisa juga menggunakan subdomain:

**Proxy Host untuk WebSocket:**
- **Domain Names**: `ws.yourdomain.com`
- **Scheme**: `http`
- **Forward Hostname/IP**: `localhost`
- **Forward Port**: `8080`
- **Websockets Support**: ✅ (WAJIB centang)

### 3. MQTT Broker (Jika Perlu Akses Eksternal)

Untuk MQTT broker, biasanya tidak perlu di-proxy karena menggunakan protokol MQTT, bukan HTTP.

Jika perlu akses eksternal:
- Pastikan port 1883 dibuka di firewall
- Atau gunakan MQTT over WebSocket di port 9001 (bisa di-proxy seperti WebSocket di atas)

## 🔧 Update Konfigurasi Frontend

Jika frontend Anda perlu connect ke WebSocket, update URL WebSocket di aplikasi React:

**Development:**
```javascript
const WS_URL = 'ws://localhost:8080';
```

**Production dengan Nginx Proxy Manager:**
```javascript
// Jika menggunakan subdomain
const WS_URL = 'wss://ws.yourdomain.com';

// Atau jika via proxy path
const WS_URL = `wss://${window.location.host}/ws`;
```

## 📝 Contoh Lengkap: Setup dengan Domain

Misalnya domain Anda: `iotdashboard.com`

### Konfigurasi NPM:

**1. Frontend Dashboard:**
- Domain: `iotdashboard.com` atau `app.iotdashboard.com`
- Forward to: `localhost:3000`
- SSL: Let's Encrypt

**2. WebSocket Server:**
- Domain: `ws.iotdashboard.com`
- Forward to: `localhost:8080`
- SSL: Let's Encrypt
- **WAJIB**: Centang "Websockets Support"

**3. MQTT Browser Client (opsional):**
- Domain: `mqtt.iotdashboard.com`
- Forward to: `localhost:9001`
- SSL: Let's Encrypt
- Websockets Support: ✅

### Update environment di docker-compose.yml (optional):

```yaml
frontend:
  environment:
    - VITE_WS_URL=wss://ws.iotdashboard.com
```

## 🚀 Testing

Setelah setup NPM:

1. **Test Frontend:**
   - Buka `https://iotdashboard.com`
   - Pastikan halaman load dengan benar
   - Check console browser untuk error

2. **Test WebSocket:**
   - Buka Developer Tools > Network > WS
   - Pastikan connection ke WebSocket berhasil
   - Status code harus 101 (Switching Protocols)

3. **Test MQTT:**
   ```bash
   # Dari server Docker
   docker exec mosquitto mosquitto_pub -t iot/pressure -m "test"
   ```
   - Data harus muncul di dashboard

## 🐛 Troubleshooting

**WebSocket connection failed (502 Bad Gateway):**
- ✅ Pastikan "Websockets Support" di-centang di NPM
- ✅ Check timeout settings (tambah `proxy_read_timeout` di custom config)
- ✅ Pastikan container mqtt-server running: `docker ps`

**Frontend tidak bisa load assets:**
- ✅ Pastikan "Cache Assets" di-centang
- ✅ Check apakah container frontend healthy: `docker logs frontend`

**SSL/TLS errors:**
- ✅ Pastikan certificate valid
- ✅ Force SSL harus dicentang
- ✅ Check mixed content warning di browser console

## 📱 Mobile/External Access

Jika ingin akses dari luar (mobile, remote):

1. **Port Forwarding di Router:**
   - Forward port 80, 443 ke server NPM

2. **Dynamic DNS (jika IP publik berubah):**
   - Gunakan service seperti DuckDNS, No-IP, atau Cloudflare

3. **Firewall:**
   - Buka port 80, 443 untuk HTTP/HTTPS
   - **JANGAN** buka port 1883 (MQTT) kecuali perlu akses eksternal
   - Jika perlu MQTT eksternal, gunakan authentication di mosquitto.conf

## 🔐 Security Best Practices

> [!CAUTION]
> Untuk production:
> - ✅ Aktifkan SSL/TLS di semua proxy hosts
> - ✅ Enable MQTT authentication (edit `mosquitto.conf`)
> - ✅ Gunakan strong passwords
> - ✅ Batasi akses dengan firewall rules
> - ✅ Regular update Docker images
> - ✅ Monitor logs: `docker-compose logs -f`
