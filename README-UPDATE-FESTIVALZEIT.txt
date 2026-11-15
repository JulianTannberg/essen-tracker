ESSEN-TRACKER · ERWEITERUNG FESTIVALZEIT (November 2026)

NEU
- Festivalzeit per schmalem Link auf „Heute“ und in „Einstellungen“ öffnen.
- Start/Pause/Fortsetzen/Beenden, auch bei geschlossener Seite über Zeitstempel.
- Tätigkeiten: Grafikdesign, Fotobox, App-Entwicklung, Tickets & Verkauf,
  Organisation, E-Mails & Kommunikation, Besprechungen, Sonstiges.
- Rückwirkende manuelle Zeiteinträge, Kennzeichnung „geschätzt“, Bearbeiten und Löschen.
- Tages-, Wochen-, Monats- und Gesamtstunden + Verteilung nach Tätigkeit.
- CSV-Export, separate Festival-JSON-Sicherung und Import.
- Datensicherung über Einstellungen > Daten enthält jetzt ebenfalls die Festivalzeit.
- Offline verfügbar (Service Worker v104).

DATENSCHUTZ UND HINWEISE
- Festivaldaten werden lokal unter sfoFestivalzeit.v1 gespeichert.
- Vorhandene Essens-/Gewichts-/Trinkdaten unter essenTracker.v01 bleiben unverändert.
- Keine Synchronisierung zwischen Handy/Surface/anderen Browsern.
- Aktive Timer werden beim Import nicht automatisch gestartet; fertige Einträge werden importiert.
- Bei Sessions über Mitternacht wird die ganze Dauer dem Startdatum zugeordnet.
- Nichts deinstallieren, keine Browserdaten löschen. Vorher JSON-Sicherung erstellen.

EINRICHTEN
- Gesamten ZIP-Inhalt auf derselben bisherigen Hosting-URL ersetzen bzw. ergänzen.
- Die Datei festivalzeit.html muss neben index.html liegen; festivalzeit.js ebenfalls.
- Nach Upload App gegebenenfalls neu laden; Service Worker aktualisiert Cache auf v104.
- Funktion lokal oder im Browser testen, bevor du echte Stunden erfasst.
