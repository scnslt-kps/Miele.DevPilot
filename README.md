# Miele.DevPilot

Webbasierter POC zur Qualitaetspruefung von Requirements aus Excel-Dateien.

## Start

```bash
cp .env.example .env.local
npm install
npx prisma migrate dev
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
- `E2E TestCases` steht fuer End-to-End Test Cases, die aus Software Requirements abgeleitet werden.

Die Prompt-Vorlage fuer die Ableitung von SR aus PR liegt in `software-requirements-prompt.md`.

Die OpenAI-Anfrage laeuft serverseitig ueber `.env.local`, damit der API-Key nicht im Browser landet.
Die Projektoberflaeche zeigt unter `Info > Projektkosten` serverseitig
gespeicherte OpenAI-Nutzung pro Projekt. Erfasst werden nur technische
Usage- und Abrechnungsdaten, keine Prompt- oder Antwortinhalte.

Modellpreise werden zentral auf dem Server gepflegt. Bevor neue OpenAI-Modelle
verwendet werden, sollte `.env.local` um eine Preisdefinition mit eindeutigem
Preisstand erweitert werden:

```bash
OPENAI_PRICING_VERSION="prices-YYYY-MM-DD"
OPENAI_MODEL_PRICING_JSON='{"MODELNAME":{"inputUsdPer1m":0,"cachedInputUsdPer1m":0,"outputUsdPer1m":0,"version":"prices-YYYY-MM-DD"}}'
```

Alternativ gelten die bestehenden Einzelwerte
`OPENAI_INPUT_USD_PER_1M_TOKENS`, `OPENAI_CACHED_INPUT_USD_PER_1M_TOKENS` und
`OPENAI_OUTPUT_USD_PER_1M_TOKENS` fuer `OPENAI_MODEL`. Unbekannte Modelle
werden mit Tokenverbrauch gespeichert, aber als `price_unavailable`
gekennzeichnet. Historische Datensaetze behalten die berechneten Kosten und
den gespeicherten Preisstand.

## Persistenz

Miele.DevPilot speichert Benutzer und Projekte in PostgreSQL ueber Prisma. Die
lokale Entwicklungsdatenbank wird ueber `DATABASE_URL` konfiguriert:

```bash
DATABASE_URL="postgresql://miele_devpilot:devpassword@localhost:5432/miele_devpilot?schema=public"
```

Schema und Migrationen liegen unter `prisma/`. Nach Aenderungen am Datenmodell:

```bash
npx prisma migrate dev
npx prisma generate
```

Beim ersten Start importiert der Server vorhandene Benutzer aus
`data/users.json`, falls die Datenbank noch keine Benutzer enthaelt. Danach ist
PostgreSQL die fuehrende Speicherung.

## Benutzerverwaltung

Miele.DevPilot nutzt eine PostgreSQL-basierte Benutzerverwaltung mit
Passwort-Login. Lege in `.env.local` mindestens einen Start-Admin fest:

```bash
ADMIN_NAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin-DevPilot-2026!
```

Beim Serverstart wird dieser Benutzer in PostgreSQL angelegt bzw. auf die
Rolle `admin` gesetzt. Die Anmeldung ist mit Name oder E-Mail-Adresse plus
Passwort moeglich. Angemeldete Admins koennen die Benutzerverwaltung in der App
ueber `Admin > Benutzerverwaltung` oeffnen und weitere Namen, E-Mail-Adressen,
Passwoerter, Rollen und Aktiv-Status pflegen.

Von Admins neu angelegte Benutzer erhalten ein initiales Passwort. Bei der
ersten Anmeldung muessen sie ein eigenes neues Passwort setzen und bestaetigen,
bevor die App weiter genutzt werden kann.

Das initiale Passwort ist nur fuer die Erstinstallation gedacht und sollte nach
der ersten Anmeldung geaendert werden.

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
