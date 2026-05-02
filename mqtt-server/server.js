const mqtt = require("mqtt");
const WebSocket = require("ws");

// connect ke MQTT broker
// Use environment variable for Docker deployment, fallback to localhost for local dev
const mqttBroker = process.env.MQTT_BROKER || "mqtt://localhost:1883";
const mqttClient = mqtt.connect(mqttBroker);

// buat WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

mqttClient.on("connect", () => {
  console.log(`✅ MQTT connected to ${mqttBroker}`);
  mqttClient.subscribe("iot/pressure");
});

mqttClient.on("message", (topic, message) => {
  const payload = message.toString();
  console.log("📥 MQTT:", payload);

  // kirim ke semua client React
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
});

console.log("🌐 WebSocket running on ws://localhost:8080");
