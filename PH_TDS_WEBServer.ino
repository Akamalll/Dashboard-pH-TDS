#include <WiFi.h>           // Untuk ESP32
// #include <ESP8266WiFi.h> // Jika menggunakan ESP8266
#include <PubSubClient.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>
#include <ArduinoJson.h>
#include <AsyncTCP.h>

// Konfigurasi WiFi
const char* ssid = "S21";  
const char* password = "p12345678q";  

// Konfigurasi MQTT
const char* mqtt_server = "broker.emqx.io";
const int mqtt_port = 1883;
const char* client_id = "ESP32_Client";

// Inisialisasi WiFi, MQTT Client, dan Web Server
WiFiClient espClient;
PubSubClient client(espClient);
AsyncWebServer server(80);

// Konfigurasi Sensor
#define PH_PIN 34  // GPIO34 untuk ESP32, gunakan A0 untuk ESP8266
#define TDS_PIN 35 // GPIO35 untuk ESP32, gunakan A0 untuk ESP8266 (jika tidak ada pH sensor)
#define VREF 3.3   // Tegangan referensi (3.3V untuk ESP32, 5V untuk beberapa sensor)
#define TdsFactor 0.5  // Faktor kalibrasi TDS

// Variabel global untuk menyimpan nilai sensor
float lastPH = 0;
float lastTDS = 0;
unsigned long lastMsg = 0;
const long interval = 5000; // Interval pengiriman data (5 detik)

// HTML untuk halaman web
const char index_html[] PROGMEM = R"rawliteral(
<!DOCTYPE HTML>
<html>
<head>
    <title>Monitoring pH & TDS</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial; text-align: center; margin: 0px auto; padding-top: 30px; }
        .card { background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 10px; display: inline-block; }
        .value { font-size: 24px; font-weight: bold; }
    </style>
</head>
<body>
    <h2>Monitoring pH & TDS</h2>
    <div class="card">
        <h3>pH</h3>
        <div class="value" id="phValue">--</div>
    </div>
    <div class="card">
        <h3>TDS (ppm)</h3>
        <div class="value" id="tdsValue">--</div>
    </div>
    <script>
        function updateValues() {
            fetch('/values')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('phValue').innerHTML = data.ph;
                    document.getElementById('tdsValue').innerHTML = data.tds;
                });
        }
        setInterval(updateValues, 1000);
    </script>
</body>
</html>
)rawliteral";

// Fungsi untuk membuat JSON message
String createMessage(const char* topic, float value, const char* unit) {
  StaticJsonDocument<200> doc;
  doc["value"] = value;
  doc["unit"] = unit;
  doc["timestamp"] = millis();
  doc["deviceId"] = client_id;
  
  String output;
  serializeJson(doc, output);
  return output;
}

// Callback untuk menerima pesan MQTT
void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  // Parse JSON message
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.println("Error parsing JSON");
    return;
  }
  
  // Handle different topics
  if (String(topic) == "control/calibration") {
    // Handle calibration
    float phCalibration = doc["ph"] | 0.0;
    float tdsCalibration = doc["tds"] | 0.0;
    // Implementasi kalibrasi
  }
  else if (String(topic) == "control/settings") {
    // Handle settings
    // Implementasi pengaturan
  }
}

// Fungsi koneksi ke WiFi
void setup_wifi() {
    Serial.print("Menghubungkan ke WiFi: ");
    Serial.println(ssid);
    WiFi.begin(ssid, password);
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi Terhubung!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
}

// Fungsi koneksi ke MQTT Broker
void reconnect() {
    while (!client.connected()) {
        Serial.print("Menghubungkan ke MQTT...");
        if (client.connect(client_id)) {
            Serial.println("Terhubung!");
            // Subscribe ke topik-topik yang diperlukan
            client.subscribe("control/calibration");
            client.subscribe("control/settings");
            
            // Kirim status koneksi
            String statusMsg = createMessage("connection/status", 1, "connected");
            client.publish("connection/status", statusMsg.c_str());
        } else {
            Serial.print("Gagal, kode: ");
            Serial.print(client.state());
            Serial.println(" Coba lagi dalam 5 detik...");
            delay(5000);
        }
    }
}

// Fungsi membaca sensor pH
float bacaPH() {
    int adcValue = analogRead(PH_PIN);
    float volt = (adcValue / 4095.0) * VREF;  // Untuk ESP32 (gunakan 1024.0 untuk ESP8266)
    float ph = (3.5 * volt) + 0.2; // Rumus kalibrasi (sesuaikan dengan datasheet)
    return ph;
}

// Fungsi membaca sensor TDS
float bacaTDS() {
    int adcValue = analogRead(TDS_PIN);
    float volt = (adcValue / 4095.0) * VREF;
    float tds = (volt / TdsFactor) * 1000; // Konversi ke ppm
    return tds;
}

// Setup awal
void setup() {
    Serial.begin(115200);
    
    // Inisialisasi SPIFFS
    if(!SPIFFS.begin(true)){
        Serial.println("SPIFFS Mount Failed");
        return;
    }
    
    setup_wifi();
    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(callback);

    // Konfigurasi CORS
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, POST, PUT");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Content-Type");

    // Konfigurasi web server
    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
        request->send_P(200, "text/html", index_html);
    });

    server.on("/values", HTTP_GET, [](AsyncWebServerRequest *request){
        float currentPH = bacaPH();
        float currentTDS = bacaTDS();
        
        StaticJsonDocument<200> doc;
        doc["ph"] = currentPH;
        doc["tds"] = currentTDS;
        doc["timestamp"] = millis();
        
        String response;
        serializeJson(doc, response);
        
        request->send(200, "application/json", response);
        
        // Update nilai global
        lastPH = currentPH;
        lastTDS = currentTDS;
    });

    server.begin();
}

// Loop utama
void loop() {
    if (!client.connected()) {
        reconnect();
    }
    client.loop();

    unsigned long now = millis();
    if (now - lastMsg > interval) {
        lastMsg = now;
        
        // Baca nilai sensor
        lastPH = bacaPH();
        lastTDS = bacaTDS();
        
        // Kirim data ke MQTT
        String phMsg = createMessage("sensor/ph", lastPH, "pH");
        String tdsMsg = createMessage("sensor/tds", lastTDS, "ppm");
        
        client.publish("sensor/ph", phMsg.c_str());
        client.publish("sensor/tds", tdsMsg.c_str());
        
        // Kirim status perangkat
        String deviceStatus = createMessage("device/status", 1, "active");
        client.publish("device/status", deviceStatus.c_str());
        
        Serial.print("pH: ");
        Serial.print(lastPH);
        Serial.print(" | TDS: ");
        Serial.println(lastTDS);
    }
}
