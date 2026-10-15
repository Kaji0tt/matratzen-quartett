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
- **Floating Footer** – Vier beschriftete Hauptbereiche: Home (House), Spielen (Swords), Kollektion (Playing Cards) und Booster (Package Open). Glas-Look, innerer Glow und Gradient-Ränder bleiben erhalten; der aktive Bereich wird violett hervorgehoben. Safe-Area-Abstände und reservierter Platz unter dem Inhalt verhindern, dass der Footer die letzten Inhalte verdeckt; Dialoge liegen darüber.

---

Home priorisiert „Matratze einreichen“ und „Spielen“ in neonumrandeten CTA-Containern, ergänzt durch Sammlungsvorschau und Booster-Kachel. Lokale SVG-Artworks, violett-blaue Glow-Effekte und eine mobileoptimierte Anordnung setzen den Street-Art-/Gaming-Look um. Die dekorativen Karten sind Beispielillustrationen, keine Vorschau des persönlichen Kartenbesitzes; die angezeigte Kartenanzahl stammt aus dem Profil beziehungsweise lokalen Demo-Spielstand. Animationen respektieren die Einstellung für reduzierte Bewegung. Profil, Einstellungen, Benachrichtigungen, Handel, Rangliste, Demo-Shop und berechtigte Administration sind über „Profil & mehr“ erreichbar. Der Kontostand wird auf Home aus dem bestehenden Profil beziehungsweise lokalen Demo-Spielstand angezeigt und verlinkt den Demo-Münzen-Shop, nicht zusätzlich global im Footer. Die Booster-Seite verlinkt ebenfalls den bestehenden Demo-Münzen-Shop.

Alle bestehenden Routen bleiben erhalten. „Spielen“ führt weiterhin nach `/training` zu „Schnelles Spiel · ohne Einsatz“ und „Einsatzspiel · 50 Demo-Münzen“. Beide Modi verwenden einen simulierten Gegner; kompetitiver Multiplayer mit dauerhaftem Karteneinsatz ist weiterhin nicht implementiert. Kauf und Öffnung bleiben gemeinsam auf `/boosters`; Filter und Kartendetails auf `/collection` bleiben unverändert.

Der Home-Header zeigt ein schräges, einzeiliges Aerosoldier-Logo in Weiß/Violett mit Krone über die gesamte Headerbreite. Darunter steht links „Mattress matters“ in kleinerer Impact-Schrift mit derselben Schräglage; Profilmenü und Münzguthaben nutzen rechts den Freiraum unter dem ansteigenden Titel. Der Header ist kompakt gehalten; der Profilbereich liegt bei Überlappungen vor dem Titel. Auf schmalen Displays entfällt der Profiltext zugunsten des Avatars; auf größeren Displays erscheint der bestehende Profilname. Der Header scrollt normal mit dem Inhalt. Schlussphrase, unterer Demo-Hinweis und zusätzliche Profilstatistiken entfallen. Die Aktionsflächen verzichten auf Beschreibungstexte: Einreichen ist die primäre Aktion, Training die sekundäre; auf breiten Displays stehen beide nebeneinander. Sammlung und Booster bilden eine ruhigere zweite Ebene mit zusätzlichem Abstand nach oben. Der Booster hat keinen separaten Titel: Das vergrößerte Pack ragt oben über den Rahmen, bleibt mindestens 20 px von den vorherigen Kacheln entfernt und wird unten exakt am CTA abgeschnitten. Nur der Einreichen-Container erhält einen umlaufenden CSS-Neonrand; bei reduzierter Bewegung bleibt dieser statisch. Kurze Displays dürfen zugunsten lesbarer Inhalte scrollen. **Lizenzhinweis:** Aerosoldier ist in der bereitgestellten Version nur für persönliche Nutzung freigegeben; siehe [Nutzungsbedingungen](./public/fonts/aerosoldier/READ_BEFORE_ANY_USE.txt).

Auf mobilen Displays sind die äußeren Header-Abstände reduziert und der Profilbereich nach oben versetzt, damit Home bei 414 × 803 px ohne Scrollen und ohne Überdeckung durch die Navigation passt. Kürzere Displays bleiben scrollbar; Inhalte werden nicht abgeschnitten.

Der Training-Container flackert wie ein defektes Neonschild: unterschiedlich schnelle Fades wechseln mit abrupten Aussetzern und Wiederzündungen, ohne umlaufendes Licht. Bei reduzierter Bewegung bleibt auch dieser Effekt statisch.

Die Wortmarke passt ihre Schriftgröße an die gesamte verfügbare Headerbreite an, inklusive Schräglage. Änderungen der Viewportbreite und nachgeladene Fonts lösen eine neue Messung aus. Krone und Titel teilen dieselbe Rotation.

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

Kopiere `.env.example` nach `.env.local` und trage die Projekt-URL und den öffentlichen Publishable Key ein:

```
VITE_SUPABASE_URL=https://dein-projekt.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_dein-key
```

Der bisherige `VITE_SUPABASE_ANON_KEY` bleibt als Fallback unterstützt. Ein gesetzter Publishable Key hat Vorrang. Alle `VITE_*`-Variablen gelangen ins Frontend: Secret Keys, Datenbankpasswörter und persönliche Access Tokens gehören niemals hierhin. `.env.local` bleibt lokal und wird nicht eingecheckt.

### Supabase-Verwaltungszugriff in VS Code

Zielprojekt: `kzibwksmlfoxosmkuhuk`. Die App-Anmeldung ist unabhängig vom Verwaltungszugriff.

**MCP (OAuth):** Die projektgebundene Verbindung steht in [`.mcp.json`](./.mcp.json). Diese Workspace-Root-Konfiguration wird von aktuellen VS-Code-/Copilot-Harness-Sitzungen direkt unterstützt. In VS Code über `Strg+Umschalt+P` → `MCP: List Servers` den Server `supabase` starten, dem Server vertrauen und die angebotene Browser-Anmeldung abschließen. Dabei das Supabase-Konto und die Organisation mit Zugriff auf das Zielprojekt wählen. Falls die Serverliste die neue Datei noch nicht erkennt, `Developer: Reload Window` ausführen und erneut starten. Anschließend im Chat die Supabase-Tools aktivieren und bei Bedarf eine neue Sitzung öffnen. Die Konfiguration erlaubt Schreibzugriffe, entfernt aber keine Tool-Bestätigungen und erweitert nicht die Rechte des angemeldeten Kontos.

**CLI (separate Anmeldung):** Supabase CLI muss installiert sein. Die [VS-Code-Aufgaben](./.vscode/tasks.json) verwenden das separate Profil `matratzen-quartett`, damit ein vorhandener Standard-Login für andere Projekte unverändert bleibt:

1. `Strg+Umschalt+P` → `Tasks: Run Task` → `Supabase: Login`. Im fokussierten Terminal den Dialog starten, im Browser mit dem passenden Konto anmelden und einen gegebenenfalls angezeigten Bestätigungscode ausschließlich im Terminal eingeben.
2. `Supabase: Link project` ausführen. Falls ein Datenbankpasswort abgefragt wird, ausschließlich lokal im Terminal eingeben.
3. `Supabase: List migrations` und `Supabase: Preview migrations` ausführen. Erst nach Abgleich mit dem bestehenden Remote-Schema und der Migrationshistorie `Supabase: Deploy migrations` verwenden.

Die Aufgaben leeren `SUPABASE_ACCESS_TOKEN` nur in ihrem eigenen Prozess, damit ein geerbter Token für ein anderes Konto nicht die persönliche Anmeldung übersteuert. Die globale Umgebung bleibt unverändert. Für manuelle CLI-Aufrufe ebenfalls `--profile matratzen-quartett` angeben und sicherstellen, dass kein fremder `SUPABASE_ACCESS_TOKEN` gesetzt ist. CLI- und MCP-Anmeldung sind getrennt; keine Zugangsdaten in die MCP-Datei oder den Chat kopieren. Zum Ändern geschützter Projekteinstellungen benötigt das Konto entsprechende Administratorrechte; eine Developer-Rolle deckt nicht alle Einstellungen ab.

`Supabase: Deploy Edge Function` fragt den Namen einer vorhandenen Funktion unter `supabase/functions` ab und verwendet serverseitiges Bundling ohne Docker. Aktuell enthält das Repository noch keine Edge Functions; die Aufgabe ist für deren spätere Implementierung vorbereitet. Funktions-Secrets werden separat über Supabase verwaltet, nicht im Frontend.

Die generierte [CLI-Konfiguration](./supabase/config.toml) ist zunächst für lokale Entwicklung eingerichtet (Auth-URLs auf Port 5173, kein nicht vorhandenes Seed-Skript). Sie wurde **nicht** auf das gehostete Projekt übertragen. `supabase config push` nicht ungeprüft ausführen: Lokale Standardwerte sollen bestehende Remote-Einstellungen nicht überschreiben. Produktionseinstellungen, kostenpflichtige Änderungen und CI/CD benötigen einen separaten Abgleich; es wurde kein automatischer Deployment-Trigger eingerichtet.

Dokumentation: [Supabase MCP](https://supabase.com/docs/guides/ai-tools/mcp), [VS Code MCP](https://code.visualstudio.com/docs/agent-customization/mcp-servers).

### Datenbank einrichten

Die SQL-Migrationen stehen in `supabase/migrations/` in numerischer Reihenfolge. Für ein bereits bestehendes Projekt zuerst die Remote-Historie und das Schema abgleichen; bereits manuell ausgeführte SQL-Dateien nicht erneut ausführen. Migrationen nicht ungeprüft auf ein gemeinsam genutztes oder produktives Projekt anwenden:

```bash
# supabase/migrations/001_initial_schema.sql
# supabase/migrations/002_storage.sql
# supabase/migrations/003_update_card_stats.sql
# supabase/migrations/004_secure_game_economy.sql
```

### Lokaler Demo-Modus

Die Trainingsseite, Demo-Booster, lokale Karteneinreichungen und der Shop-Sandbox-Ablauf funktionieren ohne Authentifizierung und speichern ihren Spielstand unter `matratzen-quartett-demo-game-v1` im Browser. Diese Daten sind keine Supabase-Kontodaten. Das Trainingsduell nutzt einen simulierten Gegner; die Sandbox führt keine Zahlung aus und genehmigte Testvorgänge schreiben keine Münzen gut. Lokal eingereichte Bilder werden im Browser auf 640 Pixel Kantenlänge komprimiert und gemeinsam mit der Demo-Karte gespeichert.

Die produktive Authentifizierung und Fotoeinreichung verwenden weiterhin Supabase. Migration 004 ergänzt serverseitig geschützte `claim_daily_reward`- und `open_booster`-RPCs, schützt Profilfortschritt und Sammlungsbesitz vor direkter Client-Manipulation und macht Booster-Anfragen idempotent. Die RPCs müssen erst nach Prüfung und Anwendung auf der Zielumgebung an die produktive UI angebunden werden; bis dahin werden produktive Coins und Karten nicht über die lokalen Demo-Seiten verändert. KI-Kartengenerierung, echter Multiplayer, echte Zahlungen und serverseitige Analytics sind nicht eingerichtet. Es gibt ein Web-App-Manifest, aber keinen Offline-Service-Worker.

Demo-Analytics verwenden das Schema `{ name, at, properties? }`, wobei `properties` nur String-, Zahlen- und Boolean-Werte enthält. Erfasst werden Uploadstart/-abschluss/-fehler, Kartengenerierung und -ansicht, Sammlungsaufruf, Boosteröffnung, Spielstart/-abschluss/-abbruch, Shop-/Sandbox-Aktionen und tägliche Demo-Belohnungen. Die letzten 500 Ereignisse bleiben nur lokal im Browser; sie werden weder an Supabase gesendet noch für Nutzerprofile zusammengeführt. Eine autorisierte, aggregierte Analytics-Schnittstelle für KI-Auswertungen ist noch nicht vorhanden.

---

## 📁 Projektstruktur

```
src/
├── components/
│   ├── ui/           # shadcn/ui Basis-Komponenten
│   ├── layout/       # Floating Navbar und Layout
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
