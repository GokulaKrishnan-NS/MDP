#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>

const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

Servo myServo;
int servoPin = 13;

void setup() {
  Serial.begin(115200);

  myServo.attach(servoPin);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("Connected to WiFi");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin("http://192.168.1.2:5000/command");

    int httpResponseCode = http.GET();

    if (httpResponseCode == 200) {
      String payload = http.getString();
      Serial.println(payload);

      if (payload.indexOf("true") != -1) {
        Serial.println("Dispensing Medicine...");
        dispenseMedicine();
      }
    }

    http.end();
  }

  delay(3000);
}

void dispenseMedicine() {
  myServo.write(90);
  delay(1000);
  myServo.write(0);
}