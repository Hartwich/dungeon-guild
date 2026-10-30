# Dungeon-Gilde

Ein eigenständiges Fantasy-Kartenspiel für drei bis sechs Personen. Öffnet Türen, kämpft gemeinsam oder allein, rüstet eure Figuren aus und versucht, Stufe 10 durch einen Monsterkampf zu erreichen.

The game uses original card names, wording and presentation. Its server owns every draw, combat result, level and reward. The shared screen shows the table; each phone shows only its owner's hand and legal actions.

Der Controller zeigt angelegte Gegenstände nach Körperplatz und einen separaten Rucksack. Nur angelegte Ausrüstung erhöht die Stärke. Wenn ein Platz belegt ist, wandert ersetzte Ausrüstung beim Anlegen in den Rucksack; die Vorschau nennt die betroffenen Gegenstände.

Alle Personen dürfen ihre Kampftricks auf die Gruppe oder das Monster spielen, ohne dadurch selbst mitzukämpfen. „Kämpfen“ eröffnet eine Entscheidung ohne Zeitlimit: Alle verbundenen, lebenden Personen spielen weiter Karten oder wählen „Nichts unternehmen“. Eine neue Karte oder eine Ausrüstungsänderung eines Kämpfers setzt die Bestätigungen zurück; veraltete Bestätigungen werden serverseitig abgewiesen. Erst wenn alle bestätigt haben, werden Stärke und Ergebnis ausgewertet. Bei einer Niederlage würfeln Hauptfigur und angenommene Hilfe getrennt zur Flucht.

Echte Mithilfe braucht eine Anfrage der hauptkämpfenden Person, ein freiwilliges Angebot und ausdrückliche Annahme. Genau eine Hilfsperson darf ihre Kampfkraft einbringen. Der angebotene Anteil an den Schatzkarten kann vor der Annahme geändert werden; dann müssen Angebote erneut abgegeben werden. Kartenhilfe ist dagegen für alle auf beiden Seiten erlaubt und verleiht keinen automatischen Beuteanspruch.

Hausregeln gegenüber dem klassischen Munchkin: Alle dürfen auch außerhalb ihres Zuges und im Kampf Ausrüstung anlegen, verstauen, neue Gegenstände spielen, verkaufen und Stufenkarten nutzen. Das Setup bietet „Hilfe auch bei gewinnendem Kampf“; standardmäßig aus. Klasse/Herkunft ausspielen bleibt auf den eigenen Zug beschränkt. Stufe 10 erfordert weiterhin einen Monstersieg. Das Spiel verwendet eigene Karten und vereinfachte Klassen/Herkunftsboni; es bildet nicht sämtliche Sonderfähigkeiten oder Erweiterungen ab.

Es gibt kein Goldkonto: Goldzahlen auf Gegenständen sind Verkaufswerte. Direkt aus Hand, Körper oder Rucksack mehrere Gegenstände auswählen; je volle 1.000 Verkaufswert gibt es eine Stufe bis maximal 9. Restwert verfällt und wird nicht angespart. Der Rucksack hält offen ausliegende Reserve ohne Stärkebonus und ohne Beitrag zum Handkartenlimit. Zum Verkaufen muss nichts vorher abgelegt werden. Monster haben getrennte Felder für Erfahrungsstufen und Schatzkarten, keinen Goldwert.

Nach einer friedlichen Tür zieht „Raum plündern“ eine zusätzliche verdeckte Türkarte. Alternativ kann ein Monster aus der Hand bekämpft werden. Nach einem Monsterkampf entfällt Raumplündern. Optionales Setup „Schnellspiel“ (standardmäßig aus): Zu Beginn jedes Zuges eine zusätzliche verdeckte Türkarte; Raumplündern zieht stattdessen eine Schatzkarte.

Regelabgleich: [klassische offizielle Regeln](https://munchkin.game/site-munchkin/assets/files/1317/munchkin_deluxe_rules_18thp.pdf), [offizielle FAQ zu Kampf und Hilfe](https://www.munchkin.game/gameplay/faq/). Das Goldkonto der zweiten Edition wird nicht verwendet. Flüche von der offenen Tür treffen sofort die ziehende Person; aus der Hand dürfen sie jederzeit auf eine gewählte Zielperson gespielt werden. Verlorener Rucksack entfernt alle nicht angelegten Gegenstände; Helm-, Rüstungs- und Schuhflüche entfernen nur den jeweils angelegten Gegenstand. Ohne passendes Zielobjekt bleibt der Fluch wirkungslos.

Auf dem Host steht ein echtes Three.js-Dungeon-Diorama mit gemauertem Tor, beweglichen Holztüren, Fackeln und Schatten. Alle 14 Monster haben eigene prozedurale 3D-Figuren im facettierten Miniaturenstil; auch andere Türkarten erhalten passende 3D-Symbole. Das Monster tritt beim Öffnen aus dem Tor und bewegt sich dezent. Über ihm stehen Name und Lvl., darunter Kampfkraft, Fluchtwurf und Schatzanzahl; Erfahrungsstufen werden als Belohnung bezeichnet. Rechts stehen eine oder zwei passende 3D-Charakterfiguren mit eigener Kampfkraft und Gruppensumme. Die Figuren zeigen ihre angelegten Körperplätze. Der Türton kombiniert Riegel, Scharnierknarzen und Holzanschlag. Ohne WebGL bleibt die illustrierte Tür als Rückfallansicht erhalten. Reduzierte Bewegung wird berücksichtigt; die Szene wird beim Verlassen vollständig freigegeben.

„Am Tisch“ zeigt die zuletzt gespielten Karten sowie Fluchtwürfe mit Würfelanimation, Ergebnis, Folgen und unterschiedlichen Erfolg-/Fehlschlagtönen. Diese Ereignisse bleiben beim Zugwechsel sichtbar.

From the platform root, run `npm run games:sync-local`, then `npm run typecheck` and `npm run build`.

Die Oberfläche zeigt Werte, Karten und notwendige Entscheidungen. Ereignis-Erzählungen, erklärende Dauerhinweise und der dekorative Host-Footer entfallen. Charaktere stehen im Kampfbereich nur mit Namen; ihre Stufe bleibt in der Spielerübersicht. Ausführliche Regeln sind am Host einklappbar.
