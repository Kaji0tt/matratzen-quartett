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
- **📦 Booster-Opening** – Neon-Folienpacks mit Glitch-Übergang und einzeln zerspringenden Kartenhüllen
- **🤝 Kartenhandel** – Marktplatz + direktes Tauschsystem zwischen Spielern
- **🏆 Elo-Rangliste** – Verschiedene Ranglisten (Elo, Sammlung, Siege)
- **🎯 Achievements** – 20+ Erfolge in 6 Kategorien
- **🛡️ Admin-Panel** – Karten-Review, Community-Reports, User-Management
- **🔔 Push-Benachrichtigungen** – Echtzeit-Updates für Trades, Kämpfe, Achievements
- **🌙 Dark Mode** – Gaming-Look, Mobile First
- **Navigation** – Die Hauptbereiche sind über Home erreichbar. Auf allen Seiten und Unterseiten entfällt der Floating Footer samt reserviertem Leerraum; Safe-Area-Abstände bleiben erhalten.

Alle Unterseiten haben einen einheitlichen, vollständig runden Zurückknopf im violetten Neon-Design, fest unten links und mit Abstand zu den Safe Areas. Er führt direkt zu Home; Home selbst zeigt keinen Zurückknopf. Auf scrollbaren Seiten bleibt am Ende Platz für den Knopf. Die Booster-Ansicht misst ihren Platzbedarf und skaliert bei Bedarf proportional auf die verfügbare dynamische Viewport-Höhe, einschließlich Kartenaufdeckung und Abschlussaktionen. Der Zurückknopf bleibt dabei unskaliert und erreichbar; das horizontale Pack-/Kartenkarussell bleibt bedienbar.

Der Retrowave-Hintergrund der Booster-Bühne reicht auch bei verkleinerter Ansicht und auf breiten Bildschirmen bis zu beiden Bildschirmrändern; nur die Inhalte werden auf den verfügbaren Platz skaliert.

Das gemeinsame Karussell für Boosterpacks und erhaltene Karten nutzt ebenfalls die volle Bildschirmbreite, auch bei aktiver Höhenskalierung. Die mittige Snap-Position bleibt erhalten; seitliche Packs und Karten werden erst am Bildschirmrand statt am eingerückten Inhaltscontainer abgeschnitten.

---

Home priorisiert „Matratze einreichen“ und „Spielen“ in neonumrandeten CTA-Containern, ergänzt durch Sammlungsvorschau und Booster-Kachel. Lokale SVG-Artworks, violett-blaue Glow-Effekte und eine mobileoptimierte Anordnung setzen den Street-Art-/Gaming-Look um. Die dekorativen Karten sind Beispielillustrationen, keine Vorschau des persönlichen Kartenbesitzes; die angezeigte Kartenanzahl stammt aus dem Profil beziehungsweise lokalen Demo-Spielstand. Animationen respektieren die Einstellung für reduzierte Bewegung. Profil, Einstellungen, Benachrichtigungen, Handel, Rangliste, Demo-Shop und berechtigte Administration sind über „Profil & mehr“ erreichbar. Der Kontostand wird auf Home aus dem bestehenden Profil beziehungsweise lokalen Demo-Spielstand angezeigt und verlinkt den Demo-Münzen-Shop, nicht zusätzlich global im Footer. Die Booster-Seite verlinkt ebenfalls den bestehenden Demo-Münzen-Shop.

Alle bestehenden Routen bleiben erhalten. „Spielen“ führt weiterhin nach `/training` zu „Schnelles Spiel · ohne Einsatz“ und „Einsatzspiel · 50 Demo-Münzen“. Beide Modi verwenden einen simulierten Gegner; kompetitiver Multiplayer mit dauerhaftem Karteneinsatz ist weiterhin nicht implementiert. Kauf und Öffnung bleiben gemeinsam auf `/boosters`.

Sammlung und Training übernehmen die Graffiti-Header, dunklen Neonflächen und violett-cyanfarbenen Akzente von Home und Boosters. Das gemeinsame Street-Art-Kartendesign wird in Booster-Drops, Sammlung, Kartendetails und Trainingshand wiederverwendet. Die Sammlung zeigt Besitzstatus und Fortschritt; Suche und ausklappbare Filter stehen oberhalb des responsiven Kartenrasters. Filterzahlen berücksichtigen auch lokale Karten. Kartendetails öffnen als tastaturbedienbarer Dialog. Training bietet auswählbare Modus-Kacheln, tägliche Demo-Belohnung, Spielregeln und passend gestaltete Runden- und Ergebnisansichten. Beide Seiten verlinken zurück zu Home; Demo-Hinweise, Spielregeln und lokale Speicherung bleiben erhalten. Neue Effekte respektieren reduzierte Bewegung.

Der Booster-Header übernimmt den Home-Aufbau: „Frisch von der Straße“ steht einzeilig in der weiß-violetten Aerosoldier-Graffiti-Schrift mit Krone über die gesamte verfügbare Headerbreite. Beide Seiten verwenden dieselbe responsive Breitenmessung, auch nach dem Laden der Schrift. Unter dem Titel steht „Neue Ware“; rechts darunter zeigt das Guthaben den Link zum Demo-Münzen-Shop. Darunter sind ausschließlich die Boosterpacks sichtbar: äußere und innere Rahmen, separate Beschriftungen, Navigation, Hinweise und Drop-Details entfallen. Preis und Kartenzahl stehen direkt auf der Pack-Folie; Bedienhinweise und Drop-Gewichte bleiben für Screenreader verfügbar.

Die Booster-Bühne führt vom ausgewählten Neon-Folienpack direkt zu verdeckten Karten an derselben Stelle. Vier Packs mit unveränderten Preisen, Kartenzahlen und Drop-Gewichten werden im horizontalen Snap-Karussell angezeigt. Auswahl ist auch durch Antippen eines seitlichen Packs oder per Pfeiltasten möglich; Pos1/Ende springen zum ersten/letzten Pack. Das aktive Pack wird durch erneutes Antippen oder Herunterziehen (mindestens 72 px bei weniger als 45 px seitlicher Abweichung) geöffnet. Erst beim Öffnen werden Demo-Münzen abgebucht. Beim Öffnen versinkt das aktive Pack, während die übrigen Packs in Glitch-Segmenten verschwinden. Die zusätzliche radiale Explosion am Schlitz entfällt; Rasterimpulse, Sonnen-/Skyline-Impuls und das kurze Hochschießen der Schlitzstrahlen bleiben erhalten. Die erhaltenen Karten erscheinen zunächst mit der Rückseite im identischen Karussell mit derselben Position, Größe, Abständen und Scroll-/Einrastlogik wie die Packs. Ein seitlicher Tap wählt die Karte aus; erneutes Antippen der mittigen Karte oder Aktivieren per Tastatur deckt nur diese Karte auf. Statt einer Drehung springt die Hülle wie zuvor in zwölf versetzten Glitch-Splittern mit cyan-/pinkfarbenen Kanten und einer Scanlinie auseinander; die Karte poppt darunter innerhalb von 700 ms auf. Bei reduzierter Bewegung erscheint sie sofort ohne Splitter. Aufgedeckte Karten bleiben beim Weiterblättern sichtbar und spielen den Effekt nicht erneut ab; Fortschritt und Abschlussaktionen erscheinen unter beziehungsweise über dem Karussell. Das Street-Art-Kartendesign zeigt Seltenheit, Fundort und alle fünf Quartettwerte; Karten ohne eigenes Foto verwenden ausdrücklich markierte lokale Demo-Art. Karten werden bereits beim Kauf über den bestehenden Demo-Store dauerhaft lokal gespeichert, auch wenn die Seite vor dem Aufdecken verlassen wird. Fehlendes Guthaben wird explizit gemeldet; der Demo-Shop bleibt über das Guthaben im Header erreichbar. Effekte respektieren `prefers-reduced-motion`; Timer werden beim Verlassen bereinigt.

Der abschließende Lichtausstoß dauert 560 ms: Die Strahlspitzen schießen zuerst nach oben, danach lösen sich die Schweife vom Schlitz und holen die Spitzen ein. Die Strahlen bewegen sich weiter nach oben, werden schmaler und transparent, statt zum Schlitz zurückzuschrumpfen. Die responsiven Strahllängen und der gemeinsame Auftakt mit Sonne und Skyline bleiben erhalten.

Das Karussell scrollt normal horizontal mit nativem Einrasten, ohne Kreisbewegung oder Neigung. Horizontales Wischen wird nicht durch die Herunterzieh-Geste blockiert. Größere Abstände zwischen den Pack-Slots schaffen auch auf Mobilgeräten mehr Luft.

An der mittigen Snap-Position liegt ein transparentes Overlay in exakt derselben responsiven Größe wie die Pack-Folie. Sein Glow-Rahmen pulsiert über die Deckkraft und übernimmt die Farbe des ausgewählten Packs. Beim horizontalen Wischen, Nachlaufen und automatischen Einrasten bleibt er ausgeblendet, bis das Pack mittig zur Ruhe kommt; dies gilt auch bei Auswahl per Antippen oder Tastatur. Beim Herunterziehen folgt er der Pack-Folie ohne Verzögerung und verliert proportional zur Versenktiefe an Intensität; an der Grid-Linie wird er wie die Folie abgeschnitten. Abgebrochene Gesten setzen Position und Intensität zurück, beim Öffnen versinkt der Rahmen mit dem Pack. Das Overlay fängt keine Eingaben ab; bei reduzierter Bewegung bleibt sein Puls statisch.

Die Booster-Auswahl steht vor einer aus dem bereitgestellten Retrowave-Wallpaper inspirierten CSS-/SVG-Szene mit gestreifter Sonne, Skyline und leuchtendem Perspektivraster. Der Horizont liegt im unteren Drittel des aktiven Packs; 64 px unter dem Pack liegt eine leuchtende Linie, exakt so breit wie die Pack-Folie. Linie, Lichtschein und Raster verwenden dieselbe violette CSS-Farbe. Die SVG-Rastertiefe wird aus derselben Geometrie berechnet, sodass die Linie genau auf der horizontalen Rasterlinie bei 214 von 400 SVG-Einheiten liegt. Aus dem Schlitz strahlt ausschließlich ein weicher Glow nach oben: Er verwendet denselben nahezu weißen Kern und rosa-violetten Saum wie die Linie, ohne zusätzliche Lichtblasen oder Lichtfläche unterhalb des Schlitzes. Der Glow startet direkt an der Linie mit voller Leuchtkraft, läuft nach oben transparent aus und wächst beim Herunterziehen bis zur vollständigen Versenktiefe weiter. Dabei wird nur seine Transformation verändert, ohne React-Neurendern bei jeder Zeigerbewegung. Die Pack-Folie wird an der Linie geometrisch abgeschnitten, nicht lediglich ausgeblendet. Ab der bestehenden Öffnungsschwelle versinkt sie vollständig im Boden, bevor die verdeckten Karten erscheinen; abgebrochene Gesten setzen den Glow ohne Kauf zurück. Antippen und Tastaturbedienung bleiben erhalten. Auf kleinen Displays folgen Horizont und Linie derselben responsiven Pack-Geometrie; reduzierte Bewegung deaktiviert die Animationen.

Der Retrowave-Glow staffelt einen schmalen, nahezu weißen Leuchtkern, einen engen farbigen Saum und einen breiteren, transparenten Bloom. Am ausgewählten Pack bleiben Kern und Bloom separate Rahmenebenen, damit Folie, Preis und Beschriftung nicht überblendet werden. Bodenlinie und Raster erhalten ebenfalls helle Kerne; der lokale Bloom der Schlitzlinie ist auf die Oberseite begrenzt. Die Sonne kombiniert einen aufgehellten Orange-Rosa-Verlauf mit einem hellen Rand, engem farbigem Saum und breitem Bloom um ihre gesamte gestreifte Silhouette. Die Streifenmaske liegt auf einer inneren Ebene; die drei statischen Drop-Shadows auf dem Elternelement strahlen dadurch auch jenseits der Maske. Der separate radiale Halo bleibt erhalten. Vier zeitversetzte Lichtimpulse laufen auf bestehenden Rasterstrahlen vom Vordergrund zum Horizont, werden dabei kürzer und blenden in der Ferne aus. Die Sonne flackert sanft und unregelmäßig über ihre Deckkraft; sechs dezente Sterne und vier unabhängig beleuchtete Fenstergruppen beleben den Hintergrund. Die Effekte sind rein dekorativ, fangen keine Eingaben ab und verwenden CSS-/SVG-Animationen ohne zusätzliche JavaScript-Animationsschleifen oder animierte Blur-Filter. Bei reduzierter Bewegung bleiben Sonne, Sterne und Fenster statisch; die laufenden Impulse entfallen.

Die Retrowave-Szene trägt eine deutlich sichtbare, monochrome Filmkörnung mit erhöhtem Kontrast und 24 Prozent Deckkraft. Sie liegt ausschließlich über dem Hintergrund, nicht über Packs, Karten oder Bedienelementen. Unregelmäßige Texturversätze wechseln per CSS etwa 17-mal pro Sekunde in harten Schritten und erzeugen krisselndes Filmrauschen ohne fließende Schiebebewegung oder Helligkeitsblitze. Dafür ist keine JavaScript-Animationsschleife nötig; bei reduzierter Bewegung bleibt die Körnung statisch.

Der Home-Header zeigt ein schräges, einzeiliges Aerosoldier-Logo in Weiß/Violett mit Krone über die gesamte Headerbreite. Darunter steht links „Mattress matters“ in kleinerer Impact-Schrift mit derselben Schräglage; Profilmenü und Münzguthaben nutzen rechts den Freiraum unter dem ansteigenden Titel. Der Header ist kompakt gehalten; der Profilbereich liegt bei Überlappungen vor dem Titel. Auf schmalen Displays entfällt der Profiltext zugunsten des Avatars; auf größeren Displays erscheint der bestehende Profilname. Der Header scrollt normal mit dem Inhalt. Schlussphrase, unterer Demo-Hinweis und zusätzliche Profilstatistiken entfallen. Die Aktionsflächen verzichten auf Beschreibungstexte: Einreichen ist die primäre Aktion, Training die sekundäre; auf breiten Displays stehen beide nebeneinander. Sammlung und Booster bilden eine ruhigere zweite Ebene mit zusätzlichem Abstand nach oben. Der Booster hat keinen separaten Titel: Das vergrößerte Pack ragt oben über den Rahmen, bleibt mindestens 20 px von den vorherigen Kacheln entfernt und wird unten exakt am CTA abgeschnitten. Nur der Einreichen-Container erhält einen umlaufenden CSS-Neonrand; bei reduzierter Bewegung bleibt dieser statisch. Kurze Displays dürfen zugunsten lesbarer Inhalte scrollen. **Lizenzhinweis:** Aerosoldier ist in der bereitgestellten Version nur für persönliche Nutzung freigegeben; siehe [Nutzungsbedingungen](./public/fonts/aerosoldier/READ_BEFORE_ANY_USE.txt).

Die Sammlung verwendet wie der Booster eine bildbetonte Komposition mit einem größeren dekorativen Kartenfächer und einem unteren CTA „Sammlung ansehen“. Zusätzliche Überschrift und Kartenzähler entfallen auf Home; die Sammlung selbst bleibt unverändert erreichbar.

Auf mobilen Displays sind die äußeren Header-Abstände reduziert und der Profilbereich nach oben versetzt, damit Home bei 414 × 803 px ohne Scrollen passt. Kürzere Displays bleiben scrollbar; Inhalte werden nicht abgeschnitten.

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

### Registrierung mit eigener E-Mail-Adresse

Über das Profilmenü → „Registrieren“ oder direkt unter `/auth/register` können Nutzer einen Account mit Benutzername, eigener E-Mail-Adresse und Passwort erstellen. Registrierung und Anmeldung (`/auth`) öffnen als Modal über Home, nicht als separate Seite. Home bleibt beim Wechsel zwischen den Dialogen im Hintergrund erhalten. Der Dialog übernimmt Graffiti-Schrift, dunkle Neonflächen und violett-cyanfarbene Akzente der App. Auf kleinen oder niedrigen Displays scrollt der Inhalt innerhalb des Dialogs; Titel und Schließenknopf bleiben erreichbar. Escape, Schließenknopf und Klick auf den Hintergrund führen nach Home zurück. Fokus wird im Modal gehalten und nach dem Schließen zum Profilmenü zurückgegeben. Direkte Auth-Links und Bestätigungslinks bleiben unterstützt. Das Passwort wird zur Kontrolle zweimal eingegeben; Anmeldung und Registrierung sind gegenseitig verlinkt.

Das Profilmenü zeigt Gästen ausschließlich „Anmelden“ und „Registrieren“. Angemeldete Nutzer sehen stattdessen das normale Menü mit Profil, Benachrichtigungen, Handel, Rangliste und Demo-Shop sowie gegebenenfalls Administration. Maßgeblich ist die aktuelle Anmeldung, nicht ein lokal gespeichertes Profil.

Bei aktivierter E-Mail-Bestätigung zeigt die App nach dem Absenden eine Bestätigungsansicht mit erneutem Mailversand (60 Sekunden Wartezeit). Der Link in der E-Mail führt nach `/auth` zurück; Supabase übernimmt die Sitzung, anschließend wird das vorhandene Profil geladen. Abgelaufene Links und Auth-Fehler werden angezeigt. Bei ausgeschalteter Bestätigung meldet Supabase neue Nutzer direkt an; die App unterstützt auch diesen Fall. Bereits vorhandene Accounts werden in der Bestätigungsansicht bewusst nicht offengelegt.

**Gehostetes Supabase-Projekt:**

1. Unter **Authentication → Sign In / Providers → Email** E-Mail-Anmeldung und neue Registrierungen erlauben, E-Mail-Bestätigung aktiviert lassen.
2. Unter **Authentication → URL Configuration** die tatsächliche App-URL als Site URL und die exakte Rücksprungadresse `<App-URL>/auth` als Redirect URL hinterlegen. Für lokale Entwicklung beide Varianten `http://localhost:5173/auth` und `http://127.0.0.1:5173/auth` erlauben.
3. Unter **Authentication → Email → SMTP Settings** einen eigenen SMTP-Dienst mit verifiziertem Absender einrichten. Der Supabase-Standardversand ist auf Team-Adressen und derzeit zwei Mails pro Stunde beschränkt: Für beliebige private E-Mail-Adressen ist ein eigener SMTP-Dienst erforderlich. SMTP-Passwörter und persönliche Access Tokens niemals in `VITE_*`-Variablen oder im Repository ablegen.
4. Mit einer eigenen echten Adresse registrieren, die Bestätigung öffnen, das Profil prüfen und nach dem Abmelden erneut anmelden.

Die CLI verwaltet das Projekt; die Registrierung selbst läuft über `supabase.auth.signUp`, die Anmeldung über `signInWithPassword`, der erneute Versand über `resend`. Vor CLI-Konfigurationsänderungen immer `supabase config --help` und `supabase config push --help` prüfen. Die lokale Konfiguration nicht ungeprüft auf Produktion übertragen; für Remote-Auth-Einstellungen sind passende Verwaltungsrechte erforderlich.

**Lokal mit der Supabase CLI:** `supabase start --help` prüfen, dann `supabase start` ausführen und die lokalen URL-/Publishable-Key-Werte in `.env.local` verwenden. In der lokalen Konfiguration sind Registrierung und E-Mail-Bestätigung aktiv; Bestätigungsmails landen ausschließlich im lokalen Mail-Postfach unter `http://127.0.0.1:54324`. Der Link führt zurück zur App auf Port 5173. Das bestehende Datenbankschema einschließlich des Profil-Triggers muss in der jeweiligen Umgebung vorhanden sein; die Registrierung schreibt keine Profile mit erhöhten Client-Rechten.

Dokumentation: [E-Mail und Passwort](https://supabase.com/docs/guides/auth/passwords), [SMTP für beliebige Empfänger](https://supabase.com/docs/guides/auth/auth-smtp), [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

#### Bestätigungsmail im App-Design

Die fertige [HTML-Vorlage](./supabase/templates/confirmation.html) übernimmt den dunklen Neon-Look mit violetten und cyanfarbenen Akzenten und „Mattress matters“-Branding ohne Krone. Primäres Logo ist der [gesprayte Schriftzug als transparentes PNG](./public/art/matratzen-quartett-mail-logo.png), direkt aus der App-Schrift Aerosoldier exportiert: einzeilig, um 7 Grad geneigt, in Weiß und Violett. Die Grafik hat 1440 × 348 Pixel für eine maximale Anzeigegröße von 480 × 116 Pixeln und skaliert auf schmalen Displays proportional herunter. Eine kleinere echte Textüberschrift darunter bleibt auch bei blockierten Bildern sichtbar; die dekorative Grafik hat deshalb einen leeren Alternativtext. Die Mail benötigt keinen Webfont.

Der Projektinhaber hat die Nutzungserlaubnis für den Schriftzug bestätigt. Die beiliegende ursprüngliche Font-Lizenzdatei bleibt unverändert; den Nachweis der zusätzlichen Erlaubnis separat aufbewahren.

Der Inhalt startet ohne Eyebrow oder zusätzliche Überschrift direkt mit „Hinter diesem Klick warten nasse Nächte und süße Träume“. Der Bestätigungsbutton übernimmt den dunklen Verlauf, den violetten Neonrand, die Rundung und einen statischen Glow der Home-Container, ohne Animation. Tabellenlayout, Inline-Styles, Ersatzschriften, ein Vorschautext fürs Postfach und ein kopierbarer Ersatzlink halten die Mail auch ohne geladenes Logo bedienbar. Mailprogramme ohne Unterstützung für Verläufe, Schatten oder Rundungen zeigen einen dunklen Button mit violettem Rand; der Bestätigungslink funktioniert auch ohne diese Effekte.

Im gehosteten Projekt unter **Authentication → Email → Templates → Confirm sign up**:

1. Betreff auf `Dein Account wartet | Matratzen Quartett` setzen.
2. Den vollständigen Inhalt von `supabase/templates/confirmation.html` in den HTML-/Source-Editor der Vorlage kopieren und speichern.
3. `{{ .ConfirmationURL }}` und `{{ .SiteURL }}` unverändert lassen. Supabase setzt den sicheren Bestätigungslink und die konfigurierte App-Adresse ein; nicht durch eine feste URL ersetzen.
4. Die App inklusive `public/art/matratzen-quartett-mail-logo.png` deployen. Das Bild wird über `{{ .SiteURL }}/art/matratzen-quartett-mail-logo.png` geladen: Bei Site URL `https://matratzen.app` muss `https://matratzen.app/art/matratzen-quartett-mail-logo.png` öffentlich ohne Anmeldung erreichbar sein. Eine absolute Site URL ohne abschließenden Schrägstrich verwenden; keine relativen Bildpfade, lokalen Dateipfade oder Base64-Bilder in die Mail eintragen.
5. Mit einer eigenen Adresse eine echte Registrierung testen, jeweils mit aktivierten und blockierten Bildern. Vorschau und Mailclient können sich unterscheiden; den Bestätigungslink erst beim eigentlichen Funktionstest öffnen.

Für lokale CLI-Instanzen ist die Vorlage bereits unter `auth.email.template.confirmation` in der [Konfiguration](./supabase/config.toml) eingebunden. Die gehostete Vorlage wurde nicht verändert. Nicht die gesamte lokale Konfiguration auf Produktion übertragen, nur um diese Mailvorlage zu aktualisieren.

Bei Versand über Resend SMTP erstellt weiterhin **Supabase** den Inhalt; Resend liefert die fertige Mail aus. In Resend angelegte Templates werden nicht automatisch verwendet. Link-Tracking für Auth-Mails beim Versandanbieter deaktiviert lassen, damit einmalige Bestätigungslinks nicht umgeschrieben werden.

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
│   ├── layout/       # Gemeinsames Layout und Profilmenü
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
