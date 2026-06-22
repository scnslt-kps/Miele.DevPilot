# Miele.DevPilot

Webbasierter POC zur Qualitaetspruefung von Requirements aus Excel-Dateien.

## Start

```bash
cp .env.example .env.local
npm start
```

Dann im Browser oeffnen:

```text
http://localhost:3000/Miele.DevPilot
```

## Workflow

1. Excel-, XLS- oder CSV-Datei hochladen.
2. Sheet, Header-Zeile, Requirement-Spalte und optional ID-Spalte waehlen.
3. Requirements analysieren.
4. Product Requirements pruefen und den vorgesehenen Windchill-Export vorbereiten. Die Windchill-Uebergabe ist noch nicht aktiviert.

## Begriffe

- `PR` steht fuer Product Requirement bzw. Product Requirements.
- `SR` steht fuer Software Requirement bzw. Software Requirements.

Die Prompt-Vorlage fuer die Ableitung von SR aus PR liegt in `software-requirements-prompt.md`.

Die OpenAI-Anfrage laeuft serverseitig ueber `.env.local`, damit der API-Key nicht im Browser landet.

## Offline-Test

Falls der API-Key noch kein Kontingent hat, kann die Excel-Strecke mit einem lokalen Mock getestet werden:

```bash
OPENAI_MOCK=true npm start
```

## GitLab

Das Projekt ist fuer GitLab vorbereitet. Echte Zugangsdaten gehoeren nicht ins Repository:

- `.env.local` bleibt lokal und wird durch `.gitignore` ausgeschlossen.
- `.env.example` wird versioniert und dient als Vorlage.
- `release/` wird nicht versioniert; das Installationspaket wird lokal oder durch GitLab CI erzeugt.

Lokaler Check:

```bash
npm run check
```

Installationspaket erzeugen:

```bash
npm run build:release
```

Erster Push zu GitLab:

```bash
git add .
git commit -m "Prepare Miele.DevPilot for GitLab"
git branch -M main
git remote add origin git@gitlab.com:GROUP/miele-devpilot.git
git push -u origin main
```

`GROUP/miele-devpilot` dabei durch den echten GitLab-Namespace ersetzen.

## Installation auf externem Server

Das Installationspaket wird als `release/Miele.DevPilot-server.tar.gz` bereitgestellt.
Die vollstaendige Anleitung liegt in `deploy/INSTALLATION.md`.

Kurzablauf auf dem Server:

```bash
sudo mkdir -p /opt/miele-devpilot
sudo tar -xzf /tmp/Miele.DevPilot-server.tar.gz -C /opt/miele-devpilot --strip-components=1
cd /opt/miele-devpilot
cp .env.example .env.local
nano .env.local
node server.mjs
```

Mit `BASE_PATH=/Miele.DevPilot` startet die App direkt unter
`http://SERVER-IP:3000/Miele.DevPilot`. Ueber Nginx ist sie ohne
sichtbaren Port unter `http://SERVER-IP/Miele.DevPilot` erreichbar.
