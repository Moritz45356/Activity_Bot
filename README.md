# 🎯 Aktivitätssystem Bot

Ein moderner Discord-Bot mit Activity-Check, Message-Tracking und Abmeldungssystem – designed mit Discord Components V2.

## ✨ Features

- **Activity Check** – Automatische Aktivitätschecks in einstellbarem Intervall. Wer nicht reagiert bekommt eine DM.
- **Message Tracker** – Zählt Nachrichten pro User und Channel serverübergreifend
- **Abmeldungssystem** – User melden sich ab, Admins bestätigen/lehnen ab, User werden per DM benachrichtigt
- **Components V2** – Modernes Design ohne Seitenstreifen (accent_color Container)
- **Multi-Server** – Jeder Discord-Server ist vollständig unabhängig (SQLite pro Server)

## 🚀 Setup

```bash
# 1. Dependencies installieren
npm install

# 2. .env.example zu .env kopieren und ausfüllen
cp .env.example .env

# 3. Slash Commands global registrieren
npm run deploy

# 4. Bot starten
npm start
```

### .env Datei
```env
TOKEN=dein_bot_token
CLIENT_ID=deine_client_id
```

## 📋 Commands

| Command | Beschreibung | Berechtigung |
|---|---|---|
| `/setup` | Bot einrichten (Rollen, Channels, Intervall) | Administrator |
| `/help` | Alle Commands anzeigen | Jeder |
| `/config view` | Aktuelle Einstellungen | Admin-Rolle |
| `/config set` | Einstellung ändern | Admin-Rolle |
| `/activity-check now` | Sofortigen Check starten | Admin-Rolle |
| `/activity-check history` | Vergangene Checks | Admin-Rolle |
| `/activity-stats server` | Server Top-15 Aktivität | Admin-Rolle |
| `/activity-stats user` | Stats eines Users | Admin-Rolle |
| `/abmelden` | Sich abmelden (von/bis/grund) | Jeder |
| `/absences list` | Genehmigte Abmeldungen | Admin-Rolle |
| `/absences pending` | Ausstehende Abmeldungen | Admin-Rolle |

## 🏗️ Projektstruktur

```
src/
├── index.js              # Bot-Entry
├── deploy-commands.js    # Commands registrieren
├── database/
│   └── db.js             # Sequelize Models
├── commands/
│   ├── setup.js
│   ├── help.js
│   ├── config.js
│   ├── abmelden.js
│   ├── absences.js
│   ├── activity-check.js
│   └── activity-stats.js
├── events/
│   ├── interactionCreate.js
│   └── messageCreate.js
├── systems/
│   ├── activityScheduler.js
│   └── absenceSystem.js
└── utils/
    ├── embeds.js
    └── permissions.js
```

## 📦 Abhängigkeiten

- [discord.js](https://discord.js.org/) v14
- [Sequelize](https://sequelize.org/) + SQLite3
- dotenv
