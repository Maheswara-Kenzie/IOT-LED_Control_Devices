#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

// Ganti dengan WiFi Anda (harus 2.4 GHz)
const char* WIFI_SSID = "Kaleng Krupuk";
const char* WIFI_PASS = "42786091TLL";

struct Led {
  const char* nama;
  uint8_t pin;
  bool nyala;
};

Led leds[] = {
  {"merah",  D1, false},  // GPIO5
  {"kuning", D2, false},  // GPIO4
  {"hijau",  D5, false},  // GPIO14
};
const int JUMLAH_LED = sizeof(leds) / sizeof(leds[0]);

ESP8266WebServer server(80);

void sendCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Cache-Control", "no-store");
}

void setLed(int i, bool nyala) {
  leds[i].nyala = nyala;
  digitalWrite(leds[i].pin, nyala ? HIGH : LOW);
}

String statusJson() {
  String json = "{";
  for (int i = 0; i < JUMLAH_LED; i++) {
    if (i > 0) json += ",";
    json += "\"";
    json += leds[i].nama;
    json += "\":";
    json += leds[i].nyala ? "true" : "false";
  }
  json += "}";
  return json;
}

void sendStatus() {
  sendCors();
  server.send(200, "application/json", statusJson());
}

void sendError(int code, const char* pesan) {
  sendCors();
  String json = "{\"error\":\"";
  json += pesan;
  json += "\"}";
  server.send(code, "application/json", json);
}

// GET /status
void handleStatus() {
  sendStatus();
}

// GET /set?led=merah&state=1
void handleSet() {
  if (!server.hasArg("led") || !server.hasArg("state")) {
    sendError(400, "parameter led dan state wajib ada");
    return;
  }
  String nama = server.arg("led");
  bool nyala = server.arg("state") == "1";
  for (int i = 0; i < JUMLAH_LED; i++) {
    if (nama == leds[i].nama) {
      setLed(i, nyala);
      sendStatus();
      return;
    }
  }
  sendError(404, "led tidak dikenal");
}

// GET /all?state=1
void handleAll() {
  if (!server.hasArg("state")) {
    sendError(400, "parameter state wajib ada");
    return;
  }
  bool nyala = server.arg("state") == "1";
  for (int i = 0; i < JUMLAH_LED; i++) setLed(i, nyala);
  sendStatus();
}

// GET /  -> halaman info yang menampilkan alamat IP perangkat
void handleRoot() {
  String ip = WiFi.localIP().toString();
  String html = "<!DOCTYPE html><html lang=\"id\"><head><meta charset=\"UTF-8\">";
  html += "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">";
  html += "<title>ESP8266 LED Control</title></head>";
  html += "<body style=\"font-family:sans-serif;text-align:center;padding:40px\">";
  html += "<h2>ESP8266 LED Control</h2>";
  html += "<p>Alamat IP perangkat ini:</p>";
  html += "<h1>" + ip + "</h1>";
  html += "<p>Masukkan alamat IP ini di website dashboard.</p>";
  html += "<p>Status LED: " + statusJson() + "</p>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

void handleNotFound() {
  if (server.method() == HTTP_OPTIONS) {
    sendCors();
    server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "*");
    server.sendHeader("Access-Control-Allow-Private-Network", "true");
    server.send(204);
    return;
  }
  sendError(404, "tidak ditemukan");
}

void setup() {
  Serial.begin(9600);
  delay(100);

  for (int i = 0; i < JUMLAH_LED; i++) {
    pinMode(leds[i].pin, OUTPUT);
    digitalWrite(leds[i].pin, LOW);
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("\nMenyambung ke WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("================================");
  Serial.println("WiFi terhubung!");
  Serial.print("Alamat IP ESP8266 : ");
  Serial.println(WiFi.localIP());
  Serial.print("Buka di browser   : http://");
  Serial.println(WiFi.localIP());
  Serial.println("================================");

  server.on("/", HTTP_GET, handleRoot);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/set", HTTP_GET, handleSet);
  server.on("/all", HTTP_GET, handleAll);
  server.onNotFound(handleNotFound);
  server.begin();
  Serial.println("Server siap.");
}

unsigned long terakhirCetakIp = 0;

void loop() {
  server.handleClient();

  // Cetak IP ulang tiap 10 detik, supaya tetap terlihat
  // walaupun Serial Monitor dibuka belakangan
  if (millis() - terakhirCetakIp >= 10000) {
    terakhirCetakIp = millis();
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("IP ESP8266: ");
      Serial.println(WiFi.localIP());
    } else {
      Serial.println("WiFi terputus, mencoba menyambung ulang...");
    }
  }
}
