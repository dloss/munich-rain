# Regenradar München

Animierte Radarkarte: letzte ~2 Stunden Niederschlag plus Nowcast, zentriert
auf München. Daten von [RainViewer](https://www.rainviewer.com/), dunkle
Basiskarte von OpenStreetMap/CARTO. Läuft komplett im Browser — kein Backend,
kein API-Key.

## Auf GitHub Pages veröffentlichen

Deployment läuft automatisch per GitHub Actions (`.github/workflows/deploy.yml`)
bei jedem Push auf `main`.

1. Einmalig: **Settings → Pages → Build and deployment → Source: „GitHub Actions"**.
2. Auf `main` pushen — der Workflow baut und veröffentlicht die Seite.
3. Nach ein paar Minuten erreichbar unter `https://<name>.github.io/<repo>/`.

Lokal testen am besten über einen kleinen Server (nicht per Doppelklick, sonst
kann `fetch` blockiert sein):

```
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Bedienung

- **Play/Pause** spielt die Frames ab (letzte 2 h → Nowcast, dann von vorn).
- **Schieber** springt zu einem Zeitpunkt; der Zeitstempel oben zeigt „Radar"
  (Vergangenheit) bzw. „Vorhersage" (Nowcast).
- Aktualisiert sich alle 5 Minuten und beim Zurückwechseln zum Tab.

## Anpassen

Oben im `<script>`:

- `CENTER` / `ZOOM` — Kartenmittelpunkt und Startzoom.
- `COLOR` — RainViewer-Farbschema (IDs siehe rainviewer.com/api/color-schemes.html).
- `OPTIONS` — `"{smooth}_{snow}"`, z. B. `"1_1"` (geglättet, Schnee farbig).
- `OPACITY`, `STEP_MS` — Deckkraft und Abspielgeschwindigkeit.

## Grenzen

- RainViewer-Tiles gehen nur bis Zoomstufe 7 — beim starken Reinzoomen wird
  das Radar pixelig (für Stadt-/Regionsansicht kein Problem).
- Kostenloser Dienst ohne Verfügbarkeitsgarantie; Attribution „Weather data by
  RainViewer" ist Pflicht und in der Karte bereits eingebaut.
