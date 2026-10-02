# Dungeon-Gilde

Ein eigenständiges Fantasy-Kartenspiel für drei bis sechs Personen. Öffnet Türen, kämpft gemeinsam oder allein, rüstet eure Figuren aus und versucht, Stufe 10 durch einen Monsterkampf zu erreichen.

The game uses original card names, wording and presentation. Its server owns every draw, combat result, level and reward. The shared screen shows the table; each phone shows only its owner's hand and legal actions.

Der Controller zeigt angelegte Gegenstände nach Körperplatz und einen separaten Rucksack. Nur angelegte Ausrüstung erhöht die Stärke. Wenn ein Platz belegt ist, wandert ersetzte Ausrüstung beim Anlegen in den Rucksack; die Vorschau nennt die betroffenen Gegenstände.

Alle Personen dürfen ihre Kampftricks auf die Gruppe oder das Monster spielen. Nach „Sieg beanspruchen“ bleiben sechs Sekunden zum Eingreifen. Eine weitere Karte startet diese Frist erneut; reicht die Stärke nicht mehr, wird der Sieganspruch aufgehoben. Spielbare Kampftricks leuchten in der Hand auf.

Auf dem Host öffnet sich die Tür mit einer räumlichen Bewegung. „Am Tisch“ zeigt die zuletzt gespielten Karten sowie Fluchtwürfe mit Würfelanimation, Ergebnis, Folgen und unterschiedlichen Erfolg-/Fehlschlagtönen. Diese Ereignisse bleiben beim Zugwechsel sichtbar.

From the platform root, run `npm run games:sync-local`, then `npm run typecheck` and `npm run build`.
