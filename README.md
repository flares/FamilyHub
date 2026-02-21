# 🏦 Dad's Finance Tracker

A fully offline Progressive Web App to track and manage retirement finances. All data stays on your device — no servers, no accounts, no cloud.

## Features

- 📊 **Dashboard** — Total net worth, liquid/illiquid breakdown, asset allocation chart
- 🏦 **Bank Accounts** — Store login details with masked passwords
- 🪪 **IDs & Cards** — All identification and cards with document scans
- 💰 **Fixed Deposits** — Track FDs with maturity dates, rates, and countdown
- 📈 **Mutual Funds** — Track holdings, gains, and SIPs
- 🏠 **Illiquid Assets** — Houses, land, commercial property
- 🎯 **Retirement Tracker** — Checklist for retirement benefits with progress tracking
- 📁 **Document Vault** — Upload and organize important documents
- 💾 **Backup/Restore** — Full ZIP backup or lightweight JSON export
- 🎭 **Demo Mode** — Show the app with fake data to protect privacy
- 📱 **PWA** — Install on phone, works fully offline

## Tech Stack

React · TypeScript · Vite · IndexedDB · Tailwind CSS · Recharts · JSZip

## How It Works

All data is stored in your browser's IndexedDB. Nothing is sent to any server. To move data between devices, use the backup/restore feature in Settings.

## Deployment (Zero CLI required)

Just push to `main` branch → GitHub Actions automatically installs dependencies, builds the app, and deploys to GitHub Pages.

Your app will be available at: `https://YOUR_USERNAME.github.io/dad-finance-tracker/`

## Local Development

```bash
npm install
npm run dev
```

## Setup on Phone

1. Open the URL in Chrome/Safari
2. Tap menu → "Add to Home Screen"
3. Open from home screen — works like a native app!

## Privacy

🔒 **Your data never leaves your device.** There is no server, no database, no analytics, no tracking. Everything is stored locally in your browser.

## License

Private — for personal family use only.
