# Matratzen Quartett – Product Requirement Document (PRD)

**Version:** 1.0  
**Status:** Implementation  
**Stack:** React · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion · Supabase · PostgreSQL

---

## 1. Produktvision

"Matratzen Quartett" ist ein Community-basiertes Multiplayer-Sammelkarten- und Quartettspiel. Spieler fotografieren auf der Straße gefundene Matratzen, laden diese als Karten hoch, sammeln sie in Booster-Packs, handeln sie miteinander und treten in Quartett-Kämpfen gegeneinander an. Das Elo-Rating-System sorgt für fairen Wettbewerb.

---

## 2. Systemarchitektur

```
┌─────────────────────────────────────────┐
│              Frontend (React)            │
│  Vite · TypeScript · Tailwind · shadcn   │
│  Framer Motion · Zustand · React Query   │
└──────────────┬──────────────────────────┘
               │ HTTPS / WebSocket
┌──────────────▼──────────────────────────┐
│           Supabase Backend               │
│  ┌──────────────┐  ┌──────────────────┐  │
│  │  PostgreSQL   │  │  Supabase Auth   │  │
│  │  + RLS        │  │  (Email/OAuth)   │  │
│  └──────────────┘  └──────────────────┘  │
│  ┌──────────────┐  ┌──────────────────┐  │
│  │  Realtime    │  │  Storage         │  │
│  │  (WebSocket) │  │  (Card Images)   │  │
│  └──────────────┘  └──────────────────┘  │
│  ┌──────────────┐                        │
│  │  Edge Fns    │  (Booster/ELO Logic)   │
│  └──────────────┘                        │
└─────────────────────────────────────────┘
```

---

## 3. Datenbankmodell

### Kernentitäten

| Tabelle | Beschreibung |
|---|---|
| `profiles` | Erweiterte User-Profile (Level, XP, Elo, Coins) |
| `cards` | Matratzen-Karten (Bild, Stats, Seltenheit, Standort) |
| `user_cards` | Verbindung User ↔ Karte (Sammlung) |
| `booster_packs` | Konfigurierbare Booster-Pack-Typen |
| `booster_openings` | Audit-Log jeder Booster-Öffnung |
| `trade_offers` | Handelsangebote zwischen Spielern |
| `trade_offer_cards` | Karten innerhalb eines Handelsangebots |
| `achievements` | Definierte Erfolge |
| `user_achievements` | Freigeschaltete Erfolge pro User |
| `battles` | Quartett-Kämpfe zwischen Spielern |
| `battle_rounds` | Einzelne Runden eines Kampfes |
| `notifications` | In-App Benachrichtigungen |
| `moderation_reports` | Community-Meldungen |
| `push_subscriptions` | Web Push API Endpunkte |

### Enums
- `rarity`: common, uncommon, rare, epic, legendary
- `card_condition`: mint, excellent, good, fair, poor
- `trade_status`: pending, accepted, declined, cancelled, expired
- `battle_status`: pending, active, finished
- `report_status`: pending, resolved, dismissed

---

## 4. API-Struktur (Supabase)

### Auth Endpoints
```
POST /auth/v1/signup          – Registrierung
POST /auth/v1/token           – Login
POST /auth/v1/logout          – Logout
GET  /auth/v1/user            – Aktueller User
```

### REST API (via Supabase PostgREST)
```
GET    /rest/v1/cards?is_approved=true     – Alle genehmigten Karten
POST   /rest/v1/cards                      – Neue Karte einreichen
PATCH  /rest/v1/cards?id=eq.{id}           – Karte aktualisieren

GET    /rest/v1/user_cards?user_id=eq.{uid} – Sammlung laden
GET    /rest/v1/booster_packs              – Verfügbare Packs

GET    /rest/v1/trade_offers               – Aktive Handelsangebote
POST   /rest/v1/trade_offers               – Neues Angebot
PATCH  /rest/v1/trade_offers?id=eq.{id}   – Angebot akzeptieren/ablehnen

GET    /rest/v1/leaderboard                – Ranglisten-View
GET    /rest/v1/achievements               – Alle Erfolge
GET    /rest/v1/user_achievements          – Freigeschaltete Erfolge

GET    /rest/v1/notifications?user_id=eq.{uid} – Benachrichtigungen
PATCH  /rest/v1/notifications?id=eq.{id}       – Als gelesen markieren
```

### Edge Functions
```
POST /functions/v1/open-booster    – Booster öffnen (serverseitige Logik)
POST /functions/v1/accept-trade    – Handel abschließen (atomarer Tausch)
POST /functions/v1/battle-result   – Kampfergebnis & Elo-Update
POST /functions/v1/push-notify     – Web Push senden
```

### Realtime Subscriptions
```
SUBSCRIBE battles:player1_id=eq.{uid}     – Kampf-Updates
SUBSCRIBE trade_offers:receiver_id=eq.{uid} – Neue Handelsangebote
SUBSCRIBE notifications:user_id=eq.{uid}  – Echtzeit-Benachrichtigungen
```

---

## 5. Frontend-Seitenstruktur

```
/ (Home)                 – Landing Page, Feature-Übersicht
/auth                    – Login / Registrierung
/boosters                – Booster-Shop + Öffnungs-Sequenz
/collection              – Eigene Karten-Sammlung (Filter, Sortierung)
/trading                 – Marktplatz + Handelsangebote
/leaderboard             – Elo-Rangliste (Tabs: Elo / Sammlung / Siege)
/profile                 – Profil, Achievements, Stats, Einstellungen
/notifications           – Benachrichtigungs-Feed
/admin                   – Admin-Panel (Cards, Reports, Users, Settings)
/cards/:id               – Karten-Detailseite
/profile/:username       – Öffentliches Profil anderer Spieler
```

---

## 6. Komponenten-Hierarchie (React)

```
App
├── BrowserRouter
│   └── QueryClientProvider
│       └── Routes
│           └── Layout
│               ├── Navbar
│               │   ├── NavLogo
│               │   ├── NavLinks
│               │   └── UserMenu (Coins, Notifications, Profile, Admin)
│               ├── Outlet (Pages)
│               │   ├── HomePage
│               │   ├── AuthPage
│               │   ├── BoosterPage
│               │   │   └── BoosterOpening
│               │   │       ├── BoosterCard (Flip Animation)
│               │   │       └── RevealParticles (VFX)
│               │   ├── CollectionPage
│               │   │   ├── CardGrid
│               │   │   │   └── CardDisplay (×n)
│               │   │   └── CardDetailModal
│               │   ├── TradingPage
│               │   │   ├── MarketplaceGrid
│               │   │   ├── TradeOfferList
│               │   │   └── CreateTradeDialog
│               │   ├── LeaderboardPage
│               │   │   ├── PodiumTop3
│               │   │   └── LeaderboardTable
│               │   ├── ProfilePage
│               │   │   ├── ProfileHeader (XP Bar)
│               │   │   ├── StatsGrid
│               │   │   └── AchievementGrid
│               │   ├── NotificationsPage
│               │   └── AdminPage
│               │       ├── AdminOverview
│               │       ├── CardModeration
│               │       ├── ReportList
│               │       └── UserManagement
│               ├── BottomNav (Mobile)
│               └── Toaster
```

---

## 7. User Flows

### Flow 1: Neuer User
1. Landing Page → "Jetzt starten" → `/auth`
2. Registrierung (Username, E-Mail, Passwort)
3. E-Mail-Bestätigung
4. Weiterleitung Home → 500 Startmünzen erhalten
5. Tutorial: Ersten Booster öffnen

### Flow 2: Booster öffnen
1. `/boosters` → Pack auswählen
2. Münzen-Check → "Pack öffnen" CTA
3. Animation: Pack fliegt auf, explodiert
4. 5 Karten face-down angezeigt
5. Spieler tippt jede Karte an → 3D-Flip-Animation
6. Rarity VFX (Partikel für epic/legendary)
7. Karten in Sammlung übernommen

### Flow 3: Kartenhandel
1. Marktplatz durchsuchen
2. Karte auswählen → "Kaufen" oder "Tausch anbieten"
3. Tausch: eigene Karten + optional Münzen anbieten
4. Empfänger erhält Benachrichtigung
5. Empfänger: Annehmen/Ablehnen
6. Bei Annahme: atomarer Kartentausch in DB

### Flow 4: Quartett-Kampf
1. Gegner herausfordern oder Matchmaking
2. Beide Spieler wählen Deck (5 Karten)
3. Runde: Aktueller Spieler wählt Stat
4. Karten vergleichen → Gewinner nimmt beide Karten
5. Spiel endet wenn ein Spieler keine Karten mehr hat
6. Elo-Rating aktualisiert (±10-30 Punkte)

### Flow 5: Karte einreichen
1. Foto hochladen
2. Metadaten eingeben (Name, Standort, Zustand)
3. Zur Moderation eingereicht
4. Moderator genehmigt/lehnt ab
5. Push-Benachrichtigung an Einreicher

---

## 8. Booster-System

### Seltenheitsgewichtung (Standard Pack)
| Seltenheit | Wahrscheinlichkeit | Elo-Wert |
|---|---|---|
| Gewöhnlich | 60% | 1× |
| Ungewöhnlich | 25% | 3× |
| Selten | 10% | 8× |
| Episch | 4% | 20× |
| Legendär | 1% | 50× |

### Booster-Typen
| Name | Preis | Karten | Besonderheit |
|---|---|---|---|
| Standard Pack | 100 🪙 | 5 | Basis-Wahrscheinlichkeiten |
| Premium Pack | 250 🪙 | 5 | 2× erhöhte Rare-Chance |
| Mega Pack | 400 🪙 | 10 | Garantiert ≥1 Rare |
| Legendary Pack | 1000 🪙 | 5 | Garantiert ≥1 Epic/Legendary |

### Münzquellen
- Täglich: +50 🪙
- Karte einreichen (genehmigt): +200 🪙
- Kampf gewonnen: +30-50 🪙
- Achievement freigeschaltet: Variable Belohnung
- Erstes Login des Tages Streak: Bonus

---

## 9. Achievement-System

### Kategorien
- **Sammlung**: Karten sammeln, Seltenheiten finden
- **Handel**: Trades abschließen
- **Kämpfe**: Siege, Elo-Meilensteine
- **Erkundung**: Karten aus verschiedenen Städten
- **Beitrag**: Karten einreichen und genehmigt bekommen
- **Sozial**: Freunde einladen, Community-Aktionen

### Beispiel-Achievements (20 vordefiniert)
| Key | Name | Anforderung | Belohnung |
|---|---|---|---|
| first_card | Erste Karte | 1 Karte | 100 XP, 50 🪙 |
| collector_100 | Matratzen-Experte | 100 Karten | 1000 XP, 500 🪙 |
| legendary_card | Legendär | 1 Legendary-Karte | 500 XP, 250 🪙 |
| winner_50 | Champion | 50 Siege | 1000 XP, 500 🪙 |
| elo_2000 | Grandmaster | 2000 Elo | 2500 XP, 1000 🪙 |
| cities_20 | Weltreisender | 20 Städte | 1000 XP, 500 🪙 |

---

## 10. Ranglisten-System (Elo-Rating)

### Elo-Formel
```
K = 32 (Standard) / 16 (Grandmaster)
E_A = 1 / (1 + 10^((R_B - R_A) / 400))
R_A_new = R_A + K × (S_A - E_A)
```

### Elo-Ränge
| Elo | Rang | Icon |
|---|---|---|
| 0-999 | Anfänger | 🌱 |
| 1000-1199 | Lehrling | 🥉 |
| 1200-1399 | Sammler | 🥈 |
| 1400-1599 | Experte | 🥇 |
| 1600-1799 | Meister | 💎 |
| 1800-1999 | Großmeister | 🏆 |
| 2000+ | Matres Master | 👑 |

### Ranglisten-Typen
1. **Elo-Rangliste** (primär)
2. **Sammlungs-Rangliste** (Anzahl Karten)
3. **Siege-Rangliste** (absolute Siege)
4. **Wöchentliche Rangliste** (Reset Montag)

---

## 11. Kartenhandel-System

### Marktplatz
- Spieler stellen Karten zum Verkauf (Münzpreis)
- Direktkauf ohne Interaktion mit Verkäufer
- Filterfunktionen: Seltenheit, Stadt, Stat-Werte

### Tauschbörse
- Spieler initiiert Tausch (Karten + optionale Münzen beider Seiten)
- Empfänger erhält Push-Benachrichtigung
- 7 Tage Verfallszeit
- Atomare Transaktion (Supabase Edge Function)

### Anti-Betrug
- Karten während aktivem Trade gesperrt
- Münz-Transaktion server-side validiert
- Rate Limiting: max 20 Trade-Angebote/Tag
- Audit-Log aller Transaktionen

---

## 12. Community-Moderationssystem

### Meldesystem
- Karten melden (Fake, unangemessen, Duplikat, Urheberrecht)
- User melden (Spam, Beleidigung, Betrug)
- Freitextfeld für Beschreibung

### Moderations-Workflow
1. Meldung eingeht → Status: `pending`
2. Moderator prüft → `resolved` oder `dismissed`
3. Bei Verstoß: Karte deaktiviert / User verwarnt oder gesperrt
4. Automatische Eskalation: 5+ Meldungen → automatisch an Admin

### Karten-Review
- Alle eingereichten Karten sind `is_approved=false`
- Moderator prüft: Bild echt? Matratze erkennbar? Kein unangemessener Inhalt?
- Genehmigung/Ablehnung mit optionalem Kommentar

### Admin-Panel
- Übersicht: Nutzer, Karten, Reports, Trades (Live-Stats)
- Karten-Review-Queue
- User-Management (Ban, Mod-Rechte, Coin-Anpassung)
- Booster-Konfiguration
- Wartungsmodus

---

## 13. Push-Benachrichtigungen

### Technologie
- Web Push API (VAPID)
- Service Worker (Background Sync)
- Supabase Edge Functions als Push-Server

### Benachrichtigungs-Typen
| Typ | Trigger |
|---|---|
| trade_offer | Neues Handelsangebot erhalten |
| trade_accepted | Eigenes Angebot angenommen |
| trade_declined | Eigenes Angebot abgelehnt |
| achievement_unlocked | Neuer Erfolg freigeschaltet |
| level_up | Level-Aufstieg |
| card_approved | Eingereichte Karte genehmigt |
| card_rejected | Eingereichte Karte abgelehnt |
| battle_challenge | Kampf-Herausforderung |
| battle_result | Kampf-Ergebnis |

### Opt-in Flow
1. User klickt "Benachrichtigungen aktivieren"
2. Browser-Berechtigungsanfrage
3. Subscription-Endpoint in `push_subscriptions` gespeichert
4. Supabase Edge Function sendet bei Trigger

---

## 14. Sicherheitskonzept

### Authentifizierung
- Supabase Auth (JWT-basiert)
- E-Mail-Bestätigung Pflicht
- Passwort-Mindestlänge: 8 Zeichen
- Auto-Refresh Tokens

### Datenbankschutz (Row Level Security)
- Alle Tabellen mit RLS aktiviert
- Profile: Public Read, nur eigener Write
- Karten: Approved = Public, Unapproved nur Fotograf/Admin
- Sammlung: Nur eigene Karten sichtbar (+ Trade-listed)
- Trades: Nur Sender + Empfänger sichtbar

### API-Schutz
- Anon Key nur für public data
- Service Role Key ausschließlich in Edge Functions
- Rate Limiting via Supabase (1000 req/min)
- Input-Validierung auf DB-Ebene (CHECK constraints)

### Anti-Cheat (Client/Server)
- Booster-Öffnung ausschließlich server-side (Edge Function)
- Münz-Transaktionen atomic (ACID)
- Trade-Validierung server-side
- Elo-Berechnung server-side
- Duplicate Card Submissions: md5-Hash der Bilder

---

## 15. Anti-Cheat-Konzept

### Maßnahmen
1. **Server-Side Logic**: Booster, Elo, Trades ausschließlich in Edge Functions
2. **Rate Limiting**: Max. Anfragen pro Minute pro User
3. **Image Hashing**: Doppelte Karten-Einreichungen werden erkannt
4. **Anomalie-Erkennung**: Ungewöhnliche Coin-Gewinne werden geflaggt
5. **Bot-Schutz**: Captcha bei Registrierung, Account-Alter Pflicht für Trades
6. **Audit Logs**: Alle kritischen Aktionen geloggt
7. **Trade Lock**: Karten in aktiven Trades sind gesperrt
8. **Input Sanitization**: Alle User-Inputs werden validiert und escaped

---

## 16. Skalierungsstrategie

### 100 Nutzer (MVP)
- Supabase Free Tier
- Basis-Caching via React Query (5 min stale time)
- Alle Features auf einer DB-Instanz
- Vercel/Netlify für Frontend-Hosting

### 1.000 Nutzer
- Supabase Pro ($25/mo)
- Connection Pooling (PgBouncer aktiviert)
- Image Optimization (WebP-Konvertierung beim Upload)
- CDN für statische Assets
- Rate Limiting verschärft

### 10.000 Nutzer
- Supabase Team ($599/mo)
- Read Replicas für Leaderboard/Karten-Queries
- Edge Caching für Karten-Listen (Redis/Upstash)
- Realtime-Verbindungen optimiert
- Lazy Loading für Karten-Bilder
- Pagination mit Cursor (statt Offset)

### 100.000 Nutzer
- Supabase Enterprise
- Horizontale Read-Replica-Skalierung
- Separate Microservices für Battle/Trade
- Event Queue (Supabase pg_net oder externe Queue)
- Regionale CDN-Distribution (Bilder nahe am User)
- Monitoring & Alerting (Sentry, Grafana)
- Database Sharding für user_cards (partitioniert nach user_id)
- Separate Analytics-DB (Read-Only Replica für Dashboards)

---

## 17. Implementierungsreihenfolge

### Phase 1 – Foundation (Woche 1-2)
- [x] Vite + React + TypeScript Setup
- [x] Tailwind CSS + shadcn/ui Konfiguration
- [x] Supabase Projekt einrichten
- [x] Datenbankschema (Migration 001)
- [x] Supabase Auth + Profil-Trigger
- [x] Basis-UI: Layout, Navbar, BottomNav
- [x] Auth-Seite (Login/Registrierung)

### Phase 2 – Core Features (Woche 3-4)
- [x] CardDisplay-Komponente mit Rarity-VFX
- [x] Booster-Opening-Sequenz mit Flip-Animation
- [x] Sammlungs-Seite (Grid, Filter, Sortierung)
- [x] Home-Seite mit Feature-Übersicht
- [ ] Karten-Einreichung (Upload + Metadaten)
- [ ] Supabase Storage für Bilder

### Phase 3 – Social Features (Woche 5-6)
- [x] Handels-System (Marktplatz + Angebote)
- [x] Leaderboard (Elo, Sammlung, Siege)
- [x] Achievement-System (UI + Tracking)
- [x] Profil-Seite (Stats, Achievements, Einstellungen)
- [x] Benachrichtigungs-Feed

### Phase 4 – Admin & Safety (Woche 7-8)
- [x] Admin-Panel (Übersicht, Karten-Review, Reports)
- [ ] Push-Benachrichtigungen (Service Worker)
- [ ] Moderations-Workflow vollständig
- [ ] Edge Functions: open-booster, accept-trade, battle-result
- [ ] Anti-Cheat-Maßnahmen implementieren

### Phase 5 – Polish (Woche 9-10)
- [ ] Battle-System (Quartett-Kämpfe)
- [ ] Öffentliche Profilseiten
- [ ] Karten-Detailseiten
- [ ] Performance-Optimierungen
- [ ] Mobile PWA-Manifest
- [ ] Testing (Unit + Integration)

---

## 18. UI/UX Design-Prinzipien

### Design System
- **Farbe**: Dunkles Hintergrundthema (background: hsl(222, 84%, 5%))
- **Typography**: System UI + Uppercase Gaming-Labels
- **Spacing**: 4-8-16-24-32px Raster
- **Border Radius**: 8-12-16px für Cards/Modals

### Seltenheits-VFX
| Seltenheit | Effekt |
|---|---|
| Gewöhnlich | Einfacher border, kein Glow |
| Ungewöhnlich | Grüner Glow (box-shadow) |
| Selten | Blauer Glow + leichter Shimmer |
| Episch | Lila Glow + Gradient-Overlay |
| Legendär | Goldener pulsierender Glow + Partikel-Animation |

### Animationen (Framer Motion)
- Page Transitions: fade + slide-up (200ms)
- Card Hover: scale(1.05) + translateY(-4px)
- Booster Opening: 3-Phasen (idle → opening → revealing)
- Card Flip: rotateY(180deg) mit preserve-3d
- Achievement Unlock: scale bounce + glow pulse
- Leaderboard Entries: staggered slide-in

---

## 19. Technische Schulden & Future Improvements

- [ ] PWA Service Worker für Offline-Support
- [ ] Battle System mit Realtime via Supabase
- [ ] i18n (Englisch, Französisch)
- [ ] Karten-Set-System (saisonale Editionen)
- [ ] Spectator-Mode für Kämpfe
- [ ] Card Crafting (Karten kombinieren)
- [ ] Gilden/Clubs Feature
- [ ] API für externe Entwickler
