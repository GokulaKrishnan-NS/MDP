#include <WiFi.h>
#include <HTTPClient.h>
#include <Servo.h>

// ======= CONFIGURATION =======
const char* WIFI_SSID = "YOUR_SSID";        // set your SSID
const char* WIFI_PASSWORD = "YOUR_PASSWORD"; // set your Wi‑Fi password

// point to the backend API (adjust hostname/IP/port as needed)
const char* SERVER_BASE = "http://192.168.1.100:3000/api/iot";

// servo pin (GPIO18) and motion timings
const int SERVO_PIN = 18;
const int SERVO_OPEN_ANGLE = 90;
const int SERVO_CLOSED_ANGLE = 0;
const int SERVO_MOVE_DELAY_MS = 800; // hold 90° for 800ms

WiFiClient wifiClient;
HTTPClient http;
Servo trayServo;

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

void setup() {
  Serial.begin(115200);
  trayServo.attach(SERVO_PIN);
  connectWiFi();
}

void loop() {
  static bool alreadyHandled = false;

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

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

  delay(5000); // polling interval
}
