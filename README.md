# 🛏️ Matratzen Quartett

Das einzig wahre Matratzen Quartett. Werde zum Matres Master.

Ein Community-basiertes Multiplayer-Sammelkarten- und Quartettspiel. Fotografiere auf der Straße gefundene Matratzen, sammle virtuelle Karten, handle mit anderen Spielern und kämpfe in Elo-gewerteten Quartett-Duellen!

---

## 🚀 Tech Stack

| Bereich | Technologie |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| State | Zustand + TanStack Query |
| Routing | React Router DOM v7 |

---

## ✨ Features

- **🃏 Karten-Sammlung** – Über 5 Seltenheitsstufen (Common bis Legendary) mit einzigartigen VFX
- **📦 Booster-Opening** – Cineastische Öffnungs-Animation mit 3D-Karten-Flip und Partikel-Effekten
- **🤝 Kartenhandel** – Marktplatz + direktes Tauschsystem zwischen Spielern
- **🏆 Elo-Rangliste** – Verschiedene Ranglisten (Elo, Sammlung, Siege)
- **🎯 Achievements** – 20+ Erfolge in 6 Kategorien
- **🛡️ Admin-Panel** – Karten-Review, Community-Reports, User-Management
- **🔔 Push-Benachrichtigungen** – Echtzeit-Updates für Trades, Kämpfe, Achievements
- **🌙 Dark Mode** – Gaming-Look, Mobile First

---

## 🏃 Schnellstart

```bash
# Dependencies installieren
npm install

# Entwicklungs-Server starten
npm run dev

# Build
npm run build
```

### Umgebungsvariablen

Kopiere `.env.example` nach `.env` und trage deine Supabase-Credentials ein:

```
VITE_SUPABASE_URL=https://dein-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key
```

### Datenbank einrichten

Führe die Migration im Supabase SQL-Editor aus:

```bash
# Datei: supabase/migrations/001_initial_schema.sql
```

---

## 📁 Projektstruktur

```
src/
├── components/
│   ├── ui/           # shadcn/ui Basis-Komponenten
│   ├── layout/       # Navbar, BottomNav, Layout
│   ├── cards/        # CardDisplay (mit Rarity-VFX)
│   ├── booster/      # BoosterOpening (Flip-Animation)
│   └── trading/      # Trading-Komponenten
├── pages/
│   ├── HomePage.tsx
│   ├── AuthPage.tsx
│   ├── BoosterPage.tsx
│   ├── CollectionPage.tsx
│   ├── TradingPage.tsx
│   ├── LeaderboardPage.tsx
│   ├── ProfilePage.tsx
│   ├── NotificationsPage.tsx
│   └── AdminPage.tsx
├── hooks/
│   ├── use-auth.ts
│   └── use-toast.ts
├── store/
│   ├── auth-store.ts   # Zustand Auth Store
│   └── app-store.ts    # Globaler App State
├── lib/
│   ├── supabase.ts     # Supabase Client
│   └── utils.ts        # Helper-Funktionen (cn, Elo, etc.)
└── types/
    ├── index.ts         # Domain-Typen
    └── database.ts      # Supabase DB-Typen
supabase/
└── migrations/
    └── 001_initial_schema.sql
PRD.md                   # Vollständiges Product Requirement Document
```

---

## 🗄️ Datenbankschema

Vollständige Dokumentation: **[PRD.md](./PRD.md)**

Kernentitäten:
- `profiles` – User-Profile mit Level, XP, Elo, Coins
- `cards` – Matratzen-Karten mit 5 Stats (Flauschigkeit, Patina, Größe, Auffindbarkeit, Prestige)
- `user_cards` – Sammlungs-Junction-Tabelle
- `booster_packs` – Konfigurierbare Pack-Typen mit Seltenheitsgewichtung
- `trade_offers` – Handelsangebote (inkl. Münz-Komponente)
- `battles` – Elo-gewertete Quartett-Kämpfe
- `achievements` – 20+ vordefinierte Erfolge
- `notifications` – In-App + Push-Benachrichtigungen

---

## 🎨 Seltenheits-VFX

| Seltenheit | Farbe | Effekt |
|---|---|---|
| Gewöhnlich | Grau | Dezenter Border |
| Ungewöhnlich | Grün | Grüner Glow |
| Selten | Blau | Blauer Glow + Shimmer |
| Episch | Lila | Lila Glow + Gradient |
| Legendär | Gold | Pulsierender Glow + Partikel |

---

## 📊 Skalierung

| Nutzer | Infrastruktur |
|---|---|
| 100 | Supabase Free + Vercel |
| 1.000 | Supabase Pro + Connection Pooling |
| 10.000 | Supabase Team + Read Replicas + Redis |
| 100.000 | Supabase Enterprise + Sharding + CDN |

---

## 📄 Dokumentation

Vollständiges PRD mit allen Spezifikationen: **[PRD.md](./PRD.md)**

Enthält: Systemarchitektur, Datenbankschema, API-Endpunkte, Komponenten-Hierarchie, User Flows, Booster-System, Achievement-System, Elo-Rangliste, Handelssystem, Moderationssystem, Sicherheitskonzept, Anti-Cheat, Skalierungsstrategie.
