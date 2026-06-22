# Miele.DevPilot auf einem externen Server installieren

Diese Anleitung beschreibt die Installation des Pakets `Miele.DevPilot-server.tar.gz` auf einem Linux-Server. Die App startet als Node.js-Webserver und ist danach im Browser erreichbar.

## Voraussetzungen

- Linux-Server mit SSH-Zugang
- Node.js 20 oder neuer
- Ein OpenAI API-Key
- Optional: Domain und Nginx als Reverse Proxy

## 1. Paket auf den Server kopieren

Lokal im Projekt liegt das fertige Archiv unter `release/Miele.DevPilot-server.tar.gz`.

```bash
scp release/Miele.DevPilot-server.tar.gz user@SERVER:/tmp/
```

Auf dem Server:

```bash
sudo mkdir -p /opt/miele-devpilot
sudo tar -xzf /tmp/Miele.DevPilot-server.tar.gz -C /opt/miele-devpilot --strip-components=1
sudo chown -R $USER:$USER /opt/miele-devpilot
cd /opt/miele-devpilot
```

## 2. Konfiguration anlegen

```bash
cp .env.example .env.local
nano .env.local
```

Mindestens diesen Wert setzen:

```text
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-5.5
OPENAI_MOCK=false
PORT=3000
BASE_PATH=/Miele.DevPilot
```

Für einen reinen Funktionstest ohne OpenAI-Aufruf kann temporär `OPENAI_MOCK=true` gesetzt werden.

## 3. Anwendung starten

Direktstart:

```bash
node server.mjs
```

Die Anwendung läuft dann auf dem Server unter:

```text
http://SERVER-IP:3000/Miele.DevPilot
```

Im Browser also zum Beispiel `http://203.0.113.10:3000/Miele.DevPilot` öffnen. Wenn die Installation lokal auf dem Server getestet wird, ist die Adresse `http://localhost:3000/Miele.DevPilot`.

## 4. Dauerhaft mit systemd betreiben

Service-Datei installieren:

```bash
sudo cp deploy/systemd/miele-devpilot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now miele-devpilot
```

Status prüfen:

```bash
systemctl status miele-devpilot
journalctl -u miele-devpilot -f
```

## 5. Browser-Zugriff ohne Port über Nginx

Wenn die App ohne sichtbaren Port unter `http://SERVER-IP/Miele.DevPilot` erreichbar sein soll, kann Nginx als Reverse Proxy verwendet werden.

```bash
sudo cp deploy/nginx/miele-devpilot.conf /etc/nginx/sites-available/miele-devpilot.conf
sudo ln -s /etc/nginx/sites-available/miele-devpilot.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

In `miele-devpilot.conf` vorher `SERVER-IP` durch die echte Server-IP oder eine Domain ersetzen. Bei einer Default-Site kann auch `_` als `server_name` verwendet werden.

Danach startet Miele.DevPilot im Browser unter:

```text
http://SERVER-IP/Miele.DevPilot
```

Mit TLS/HTTPS kann danach zum Beispiel Certbot verwendet werden.

## Aktualisierung

Neue Version kopieren, entpacken und Service neu starten:

```bash
sudo systemctl stop miele-devpilot
sudo tar -xzf /tmp/Miele.DevPilot-server.tar.gz -C /opt/miele-devpilot --strip-components=1
sudo systemctl start miele-devpilot
```

Die bestehende Datei `.env.local` nicht überschreiben.

## Fehlersuche

- `OPENAI_API_KEY is not configured on the server.`: `.env.local` fehlt oder enthält keinen API-Key.
- Browser zeigt nichts unter `http://SERVER-IP/Miele.DevPilot`: Nginx-Konfiguration mit `sudo nginx -t` prüfen und sicherstellen, dass `BASE_PATH=/Miele.DevPilot` gesetzt ist.
- Direkter Test ohne Nginx: `http://SERVER-IP:3000/Miele.DevPilot` öffnen und TCP-Port `3000` in Firewall/Security Group erlauben.
- Analyse schlägt fehl: `journalctl -u miele-devpilot -f` prüfen und OpenAI-Key/Kontingent kontrollieren.
