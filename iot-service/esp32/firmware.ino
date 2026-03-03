#include <WiFi.h>
#include <HTTPClient.h>
#include <Servo.h>
#include <WebServer.h>

// ======= CONFIGURATION =======
const char* WIFI_SSID = "OPPO K13 5G 6063";        // set your SSID
const char* WIFI_PASSWORD = "geiw5726"; // set your Wi‑Fi password

// point to the backend API (adjust hostname/IP/port as needed)
const char* SERVER_BASE = "http://10.252.41.227:3000/api/iot";

// servo pin (GPIO18) and motion timings
const int SERVO_PIN = 5;
const int SERVO_OPEN_ANGLE = 90;
const int SERVO_CLOSED_ANGLE = 0;
const int SERVO_MOVE_DELAY_MS = 800; // hold 90° for 800ms

WiFiClient wifiClient;
HTTPClient http;
Servo trayServo;
WebServer server(80);

unsigned long lastPollTime = 0;
const unsigned long POLL_INTERVAL_MS = 5000;

// helper to (re)connect Wi-Fi
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(500);
    Serial.print('.');
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi connection failed");
  }
}

// poll backend for command
bool checkForCommand() {
  bool dispense = false;

  if (WiFi.status() != WL_CONNECTED) return false;
  http.begin(wifiClient, String(SERVER_BASE) + "/command");
  int code = http.GET();
  if (code == 200) {
    String body = http.getString();
    dispense = body.indexOf("\"dispense\":true") >= 0;
  }
  http.end();
  return dispense;
}

// confirm command back to backend
void postConfirm() {
  if (WiFi.status() != WL_CONNECTED) return;
  http.begin(wifiClient, String(SERVER_BASE) + "/confirm");
  http.POST("{}"); // empty JSON body
  http.end();
}

void rotateServo() {
  trayServo.write(SERVO_CLOSED_ANGLE);
  delay(200);
  trayServo.write(SERVO_OPEN_ANGLE);
  delay(SERVO_MOVE_DELAY_MS);
  trayServo.write(SERVO_CLOSED_ANGLE);
}

void handleDispense() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");

  if (server.method() == HTTP_OPTIONS) {
    server.send(200);
    return;
  }

  Serial.println("Dispense request received");
  rotateServo();
  server.send(200, "text/plain", "OK");
}

void handleHealth() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");

  if (server.method() == HTTP_OPTIONS) {
    server.send(200);
    return;
  }

  server.send(200, "text/plain", "OK");
}

void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(204);
}

void setup() {
  Serial.begin(115200);
  trayServo.attach(SERVO_PIN);
  connectWiFi();

  server.on("/dispense", HTTP_POST, handleDispense);
  server.on("/health", HTTP_GET, handleHealth);
  server.on("/dispense", HTTP_OPTIONS, handleOptions);
  server.on("/health", HTTP_OPTIONS, handleOptions);
  
  server.begin();
}

void loop() {
  static bool alreadyHandled = false;

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  server.handleClient();

  if (millis() - lastPollTime >= POLL_INTERVAL_MS) {
    lastPollTime = millis();
    bool hasCmd = checkForCommand();
    if (hasCmd && !alreadyHandled) {
      Serial.println("Command received, rotating servo");
      rotateServo();
      postConfirm();
      alreadyHandled = true;
      // debounce small delay
      delay(1000);
    }

    // reset local flag once backend clears the command
    if (!hasCmd) {
      alreadyHandled = false;
    }
  }
}
