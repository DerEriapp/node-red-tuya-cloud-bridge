# Tuya Cloud Bridge for NodeRed



Tuya Cloud Bridge ist ein Node-RED Node zum Steuern und Abfragen von Tuya-Geräten über die offizielle Tuya Cloud API.

Mit diesem Node kannst du nahezu alle Tuya-kompatiblen Geräte über die Cloud ansprechen – sei es ein Lichtschalter, Thermostat, Zwischenstecker oder Sensor.
## Features

- Tuya Gerät daten senden (JSON)
- Statusinformationen abrufen
- Beliebige Tuya Cloud API-Endpunkte ansprechen
- Automatische Gerätesuche nach erfolgreicher Konfiguration
## Installation

Über den Node-RED Palettenmanager

Öffne Node-RED

Klicke auf das Menü (☰) → Palettenverwaltung

Suche nach tuya-cloud-bridge

Klicke auf Installieren

Alternativ via NPM

```bash
    cd ~/.node-red
    npm install node-red-contrib-tuya-cloud-bridge
```
    
## Einrichtung 

1. Registriere dich unter: https://platform.tuya.com

2. Gehe zu Cloud → Project Management und erstelle ein neues Projekt

3. Öffne das Projekt → Gehe zu Authorization → Cloud Authorization→ Füge deine App hinzu (z. B. „Smart Life“)

4. Im Reiter Overview findest du folgende Zugangsdaten:
- Client ID
- Client Secret
- User ID (UID)

📌 Hinweis: Falls du Gateways wie z. B. Zigbee einsetzt, stelle sicher, dass diese auf DP Instruction Mode eingestellt sind – sonst könnten sie keine Befehle empfangen.
## Tuya Device Node

Dies ist der zentrale Node zur Kommunikation mit einem einzelnen Tuya-Gerät über die Cloud.

Konfiguration:

Tuya Region / API-URL (automatisch auswählbar)

Client ID

Client Secret

User ID (UID)

Nach der Eingabe werden automatisch alle verfügbaren Geräte geladen. Du kannst dann das gewünschte Gerät auswählen.
## Tuya Device Node verwendung

Statusabfrage über einen LEEREN Inject-Node

Gerätebefehl senden

```bash
msg.method = "POST";
msg.sign_url = "/v1.0/devices/{{device_id}}/commands";
msg.body = {
  "commands": [
    {
      "code": "mode",
      "value": "eco"
    }
  ]
};
```
Es können Platzhalter in sign_url verwendet werden:
```bash
{{device_id}}, {{device_name}}, {{client_id}}, {{user_id}}, {{access_token}}
```

Weitere Befehle und Parameter findest du hier [Tuya Cloud API Doku – Device Control](https://developer.tuya.com/en/docs/cloud/3ac29198c9?id=Kag2ybepz3arq)

Output des Nodes
```bash
  msg.topic: "device-info"
  msg.success: true/false
  msg.payload: { /* Rückgabe der Tuya Cloud API */ }
  msg._msgid: "msgid"
```


## Beispiel-Flows

Beispiel-Flows sind im Node integriert und können über die Import-Funktion in Node-RED verwendet werden.
## Support

Pull Requests, Feature-Ideen oder Issues sind herzlich willkommen!