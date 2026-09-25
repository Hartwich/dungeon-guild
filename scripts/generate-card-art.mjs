import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const glyphs = {
  monster: [
    '<path fill="#b87840" d="M42 58 55 41h40l13 17v48l-13 11H55l-13-11z"/><path fill="#f0ce8c" d="m48 84 8-7 8 7 8-7 8 7 8-7 8 7v14H48z"/><path fill="#261e18" d="M55 67h10v8H55zm32 0h10v8H87z"/>',
    '<path fill="#789057" d="m56 63-23-21 7 34 12 7 1 31h48l1-31 12-7 7-34-23 21z"/><path fill="#e6cc92" d="M53 76q27-19 54 0v21H53z"/><circle fill="#25221b" cx="69" cy="84" r="4"/><circle fill="#25221b" cx="91" cy="84" r="4"/><path fill="#7b5935" d="M60 104h36v7H60z"/>',
    '<path fill="#71918a" d="M42 95q2-38 37-39 39 0 40 39l-15 23H57z"/><path fill="#e4d6ad" d="M52 80q28-15 58 0v17H52z"/><circle fill="#241f1a" cx="68" cy="84" r="4"/><circle fill="#241f1a" cx="93" cy="84" r="4"/><path fill="none" stroke="#35291e" stroke-width="5" d="M72 99q10 8 20 0"/><path fill="#c79d59" d="m103 45 7-14 7 17z"/>',
    '<path fill="#bb8748" d="M49 67q27-27 55 0l-7 53H56z"/><path fill="none" stroke="#e3ca90" stroke-width="7" d="M57 68Q33 48 45 34q3 23 19 20m25 14q24-20 12-34-3 23-19 20"/><path fill="#f3dda9" d="M58 78q10-10 20 0 10-10 20 0l-4 25H62z"/><circle fill="#2b2018" cx="69" cy="85" r="3"/><circle fill="#2b2018" cx="88" cy="85" r="3"/>',
    '<path fill="#78827e" d="m79 42 34 17 12 35-23 31H55L33 96l12-37z"/><path fill="#303332" d="M53 82q26-17 52 0v13q-26-13-52 0z"/><path fill="none" stroke="#d9d1b9" stroke-width="5" d="M68 69q10 12 20 0m-21 42h25"/>',
    '<g fill="#e8dfc9"><circle cx="52" cy="73" r="20"/><circle cx="108" cy="73" r="20"/><circle cx="80" cy="47" r="17"/></g><g fill="#29231d"><circle cx="46" cy="72" r="3"/><circle cx="58" cy="72" r="3"/><circle cx="102" cy="72" r="3"/><circle cx="114" cy="72" r="3"/><circle cx="76" cy="45" r="3"/><circle cx="84" cy="45" r="3"/></g><path fill="none" stroke="#574936" stroke-width="5" d="M47 86v9m11-9v9m44-9v9m11-9v9"/>',
    '<path fill="#554a44" d="M46 82q0-44 35-46 38 2 38 46l-12 39H58z"/><path fill="#d8c18d" d="m61 86 19-19 23 19v24H61z"/><path fill="#82613c" d="M67 91h25v17H67z"/><path fill="none" stroke="#eee0bd" stroke-width="4" d="M73 97h13m-13 6h13"/>',
    '<path fill="#a58b65" d="m46 62 18-20h33l19 20-8 56H53z"/><path fill="#d9c18e" d="M60 65h42l-4 29H64z"/><path fill="#28231b" d="M67 75h8v9h-8zm21 0h8v9h-8z"/><path fill="none" stroke="#7d6040" stroke-width="6" d="M81 40V20m-7 7 7-8 7 8"/>',
    '<path fill="#e5c66b" d="m43 113 16-69 22-16 22 16 16 69-38-12z"/><path fill="#f4e6bd" d="M70 35q10-12 21 0l-4 14H74z"/><circle fill="#94783b" cx="69" cy="72" r="5"/><circle fill="#94783b" cx="96" cy="72" r="5"/><path fill="#9d5239" d="M77 86h20l-10 15z"/>',
    '<path fill="#493d4c" d="M36 117q7-56 42-72l20-21 7 26 18 20-11 47z"/><path fill="#d8c293" d="M61 76q22-16 43 0l-6 24H68z"/><path fill="#241e24" d="M58 48 46 27l31 6 2 11z"/><circle fill="#c5a35d" cx="73" cy="84" r="4"/><circle fill="#c5a35d" cx="91" cy="84" r="4"/>',
    '<path fill="#775b3d" d="m29 105 26-63 24 22 24-22 26 63-41 21z"/><path fill="#bf8050" d="M64 75q16-20 32 0l-4 42H68z"/><path fill="#e5d39d" d="M72 75h8v6h-8zm14 0h8v6h-8z"/><path fill="none" stroke="#e9bd74" stroke-width="6" d="m57 53-9-18m77 18 9-18"/>',
    '<path fill="#807f74" d="M49 55q7-29 31-27 27 0 34 27l16 30-19 6-6 29H55l-6-29-19-6z"/><path fill="#282520" d="M58 74q22-20 45 0v15q-22-10-45 0z"/><path fill="#c4bca7" d="m53 103 27-8 27 8-6 18H59z"/>',
    '<path fill="#594535" d="M43 34h74v88H43z"/><path fill="#9a7045" d="M51 42h58v72H51z"/><path fill="#2b2119" d="M60 65h13v10H60zm31 0h13v10H91z"/><path fill="#e2c17c" d="M78 79h8v8h-8z"/><path fill="none" stroke="#30271d" stroke-width="6" d="M78 95q7-8 14 0"/>',
    '<circle fill="#dfc37d" cx="80" cy="80" r="50"/><path fill="#342832" d="M64 39q43 5 34 47-8 37-45 39 18-14 11-32-8-23 0-54z"/><circle fill="#f8df9b" cx="72" cy="70" r="5"/><path fill="none" stroke="#453342" stroke-width="6" d="M96 104q14-4 18 3"/>'
  ],
  item: [
    '<path fill="#bd985d" d="M54 42h52l8 22-10 9v45H56V73l-10-9z"/><path fill="none" stroke="#3b2b1e" stroke-width="6" d="M54 64h52m-42 13h32"/>',
    '<path fill="#89735c" d="M52 40h56l11 22-11 11v43H52V73L41 62z"/><path fill="none" stroke="#d7bc84" stroke-width="7" d="M61 48v27m37-27v27M63 86h34m-34 13h34"/>',
    '<path fill="#d7be8b" d="m45 56 31 14-18 54-24-7 16-43z"/><path fill="#739080" d="m83 70 31-14-5 18 16 43-24 7z"/><path fill="none" stroke="#433528" stroke-width="5" d="M54 81h17m15 0h17"/>',
    '<path fill="#d5d0c0" d="m49 105 48-67 11 8-48 68z"/><path fill="#916c46" d="m93 37 13-17 19 13-15 17z"/><path fill="none" stroke="#473522" stroke-width="7" d="m49 105-9 13m20-16 9 7"/>',
    '<path fill="#dfb66e" d="M44 60q24-19 42 2l-18 23-9 33-19-12 13-24z"/><path fill="#d7b577" d="M85 62q27-18 44 7l-16 20-17-1-11-14z"/><path fill="none" stroke="#4c3524" stroke-width="6" d="m56 91 17 8m30-32 14 7"/>',
    '<path fill="#956c41" d="m77 29 8 8-7 56-9 20-7-5 8-19z"/><path fill="#dbbd7b" d="m57 104 22-6 12 8-3 9-29 5z"/><path fill="none" stroke="#4a3523" stroke-width="5" d="m70 51 10 1"/>',
    '<path fill="#986944" d="M51 55q9-25 29-16 19 3 25 26v46H49z"/><path fill="#ddb764" d="M62 59q18-18 36 0l-9 20H68z"/><path fill="#38291c" d="M65 68h7v7h-7zm17 0h7v7h-7z"/><path fill="none" stroke="#ead59f" stroke-width="4" d="M66 96q13 12 27 0"/>',
    '<circle fill="#e4c87f" cx="80" cy="80" r="31"/><path fill="#5b4730" d="M80 50v60m-30-30h60m-51-21 42 42m0-42-42 42"/><circle fill="none" stroke="#e4c87f" stroke-width="6" cx="80" cy="80" r="47"/>',
    '<path fill="#d3bc80" d="M47 26h24l17 20-9 75-14 5-16-31z"/><path fill="#a97a44" d="m83 45 28-19 4 10-20 20 9 60-13 10-18-40z"/><circle fill="#f0d99e" cx="65" cy="53" r="5"/>',
    '<path fill="#5e4f43" d="M46 43q33 20 68 0v67q-34-4-68 0z"/><path fill="#d9c28d" d="M54 54q25 13 51 0v45q-27-7-51 0z"/><path fill="none" stroke="#342b22" stroke-width="6" d="M46 43v67m68-67v67"/>',
    '<path fill="#9d784e" d="m46 71 30-42 14 10-19 35 24 28-10 19-40-33z"/><path fill="#d5b87d" d="m76 29 24 2 12 15-20 2z"/><path fill="none" stroke="#3b2b1e" stroke-width="5" d="M45 78h20m38 19 16 12"/>',
    '<path fill="#b98e57" d="m80 24 11 36 38 3-30 23 10 37-29-22-31 22 12-37-31-23 39-3z"/><circle fill="#e9d8ac" cx="80" cy="79" r="15"/>'
  ],
  curse: [
    '<path fill="#8d5550" d="M45 111q-8-40 13-59l22-20 22 20q21 20 13 59H45z"/><path fill="none" stroke="#e2c18b" stroke-width="6" d="m57 82 18 20 31-38"/><path fill="#2b2020" d="M58 65h12v8H58zm32 0h12v8H90z"/>',
    '<path fill="#7c514b" d="M49 42h62l-9 20 12 48H46l12-48z"/><path fill="none" stroke="#e3c58e" stroke-width="5" d="m54 48 17 16-14 20 27 17 22-21-11-16 12-16"/><path fill="#29221d" d="m70 69 9 8 9-8 8 8 8-8v18H70z"/>',
    '<path fill="#8d6c50" d="M45 62q35-28 70 0v54H45z"/><path fill="none" stroke="#c1a779" stroke-width="6" d="m54 82 18 20 34-39m-52 8 51 28"/><path fill="#372b24" d="M57 64h12v8H57zm34 0h12v8H91z"/>',
    '<path fill="#786253" d="M50 42h60v75H50z"/><path fill="#d9c89f" d="m60 54 19 8 20-8-8 15 8 12-20-5-19 5 8-12z"/><path fill="none" stroke="#4c3530" stroke-width="5" d="M80 81v26m-18-10 18 10 18-10"/>',
    '<path fill="#6b514e" d="M42 81q38-56 76 0v36H42z"/><path fill="none" stroke="#dfbc7e" stroke-width="6" d="m55 70 16 20m18-20 16 20m-43 10 39 0"/><circle fill="#342529" cx="80" cy="51" r="15"/>',
    '<path fill="#8e674b" d="M49 45h62v73H49z"/><path fill="none" stroke="#ddbf85" stroke-width="6" d="M60 57q20 20 40 0M60 76q20 20 40 0m-40 19q20 20 40 0"/><path fill="#392b23" d="m73 33 7-12 7 12"/>'
  ],
  class: [
    '<path fill="#738b6c" d="M46 115q4-45 34-57 30 12 34 57z"/><path fill="#dfc997" d="M62 64q18-22 36 0l-5 26H67z"/><path fill="#343126" d="M63 41q16-25 34 0l-5 10H68z"/><path fill="none" stroke="#dcc18a" stroke-width="5" d="m106 69 15 46"/>',
    '<path fill="#708c96" d="M46 117 51 72l29-25 28 25 6 45z"/><path fill="#dfc999" d="M65 63q15-18 30 0v26H65z"/><path fill="none" stroke="#e6d7b4" stroke-width="5" d="M80 47V18m-9 8 9-9 9 9"/>',
    '<path fill="#a77946" d="M45 117q5-42 35-54 30 12 35 54z"/><path fill="#dbc897" d="M63 63q17-22 34 0v29H63z"/><path fill="none" stroke="#4b3624" stroke-width="7" d="m58 62 22-18 22 18"/><circle fill="#e9ca7e" cx="80" cy="36" r="9"/>',
    '<path fill="#715d7b" d="M45 116q5-44 35-55 30 11 35 55z"/><path fill="#dec99b" d="M63 63q17-22 34 0v27H63z"/><path fill="none" stroke="#e5c782" stroke-width="5" d="M80 19v34m-13-17h26m-22-11 18 23m0-23L71 47"/>'
  ],
  race: [
    '<path fill="#b38e5a" d="M47 116q5-50 33-57 31 8 36 57z"/><circle fill="#dec89a" cx="80" cy="53" r="26"/><path fill="#382b20" d="M54 49q6-28 26-27 24 3 27 27-25-15-53 0z"/>',
    '<path fill="#62785c" d="M45 116q9-51 35-58 28 7 35 58z"/><path fill="#d8c18f" d="M58 43 48 22l24 16 8-12 8 12 24-16-10 22q7 34-22 44Q49 78 58 43z"/><path fill="#2f2a21" d="M65 61h8v7h-8zm20 0h8v7h-8z"/>',
    '<path fill="#8a6d52" d="M41 116q7-48 39-58 32 10 39 58z"/><path fill="#cbb58d" d="M58 50q22-33 44 0v39H58z"/><path fill="none" stroke="#eee0bd" stroke-width="5" d="M48 39h18m46 0H94M80 20v23"/>',
    '<path fill="#687e91" d="M46 116q7-49 34-59 30 10 36 59z"/><path fill="#e2d0a8" d="M58 53q22-24 44 0v35q-21 20-44 0z"/><path fill="none" stroke="#d6c58f" stroke-width="5" d="m58 40-16-20m80 20 16-20m-58 7 16-15 16 15"/>'
  ],
  level: [
    '<path fill="#d5bb7d" d="M53 34h54v85H53z"/><path fill="#f1e3bf" d="M61 43h38v65H61z"/><path fill="none" stroke="#76552f" stroke-width="5" d="m70 77 9 9 17-24m-25 34h19"/>',
    '<path fill="#d3b679" d="m80 22 13 36 39 2-30 25 10 38-32-22-32 22 11-38-31-25 39-2z"/><circle fill="#f4e5b7" cx="80" cy="78" r="18"/>',
    '<path fill="#bea067" d="M43 53q37-34 74 0v61q-36-22-74 0z"/><path fill="#f1e4bf" d="M52 57q28-18 56 0v45q-28-17-56 0z"/><path fill="none" stroke="#715332" stroke-width="4" d="M80 58v43m-18-31h13m10 0h13"/>',
    '<path fill="#d9c18d" d="M60 35h40l8 12v72H52V47z"/><path fill="#9d7245" d="M67 58h27v34H67z"/><path fill="#f1deae" d="m80 62 6 11 12 2-9 8 2 12-11-6-11 6 2-12-9-8 12-2z"/>'
  ],
  boost: [
    '<path fill="#ce8156" d="M35 96q10-34 33-18 15 15 27-4 24-19 40 9l-9 35H45z"/><path fill="none" stroke="#f1d08c" stroke-width="6" d="M54 72 43 57m57 14 9-20m-48 61h48"/>',
    '<path fill="#c5a45b" d="M50 45q29-32 59 0l-8 74H58z"/><path fill="#ead294" d="M56 52q22-18 46 0l-4 48H61z"/><path fill="none" stroke="#806136" stroke-width="5" d="M70 65h20m-20 13h20m-20 13h15"/>',
    '<path fill="#78906a" d="M80 24q48 43 0 94Q32 67 80 24z"/><path fill="none" stroke="#e3d197" stroke-width="6" d="m51 78 19 16 39-42"/>',
    '<path fill="#b7784f" d="m45 47 22-14 12 22-21 15z"/><path fill="#e1c18a" d="m80 68 40 17-13 27-40-18z"/><path fill="none" stroke="#453020" stroke-width="6" d="m65 70 19 8m-27 4 17 8"/>',
    '<path fill="#d5bc83" d="M54 35h52v84H54z"/><path fill="none" stroke="#59412c" stroke-width="6" d="M65 50h30m-30 15h30m-30 15h30m-30 15h20"/><path fill="#b97645" d="m40 59 13-8v29l-13-8zm80-16 13 13-13 13z"/>',
    '<path fill="#687f86" d="M48 47q32-36 64 0l-6 68H54z"/><path fill="none" stroke="#edcf8a" stroke-width="6" d="m57 79 15 14 33-37m-26-14v-19"/>'
  ]
};

const entries = [];
const monsters = [
  "Mimic mit Fernweh", "Kobold-Buchhalter", "Sumpfpoet", "Gewitterziege", "Schlafender Golem",
  "Drei freche Skelette", "Archivarin der Tiefe", "Krötenritter", "Käsekönig", "Nebelhexe",
  "Der sehr alte Drache", "Steinbeißer", "Schrank des Schreckens", "Mondfresser"
];
monsters.forEach((title, group) => {
  for (let copy = 0; copy < (group < 4 ? 2 : 1); copy += 1) entries.push({ id: "door-monster-" + group + "-" + copy, title, kind: "monster", index: group });
});
["Stolperfluch", "Verhexter Helm", "Rostige Rüstung", "Falsche Wegbeschreibung", "Kalte Füße", "Verlorener Rucksack"].forEach((title, i) => entries.push({ id: "door-curse-" + i, title, kind: "curse", index: i }));
["Zauberin", "Waldläufer", "Erfinderin", "Bardin"].forEach((title, i) => entries.push({ id: "door-class-" + i, title, kind: "class", index: i }));
["Menschling", "Waldvolk", "Bergvolk", "Wolkenkind"].forEach((title, i) => entries.push({ id: "door-race-" + i, title, kind: "race", index: i }));
for (let i = 0; i < 4; i += 1) entries.push({ id: "door-level-" + i, title: "Erfahrungsfunke " + (i + 1), kind: "level", index: i });
[
  "Deckelhelm", "Kesselpanzer", "Siebenmeilen-Socken", "Mondspalter", "Krabbenklaue", "Zauberstab der Umwege",
  "Taschendrache", "Glücksamulet", "Riesenschlüssel", "Tarnumhang", "Trampelstiefel", "Kronleuchter-Schild"
].forEach((title, i) => {
  for (let copy = 0; copy < 2; copy += 1) entries.push({ id: "treasure-item-" + i + "-" + copy, title, kind: "item", index: i });
});
["Konfettiorkan", "Riesenrübe", "Wackelpuddingkanone", "Tausendjährige Socke", "Mutmachmarmelade", "Klebeschleim"].forEach((title, i) => entries.push({ id: "treasure-boost-" + i, title, kind: "boost", index: i }));
for (let i = 0; i < 4; i += 1) entries.push({ id: "treasure-level-" + i, title: "Abenteurer-Urkunde " + (i + 1), kind: "level", index: i });

const tones = {
  monster: ["#b76648", "#d49c60"], curse: ["#765464", "#c98066"], class: ["#557d86", "#d3ae68"],
  race: ["#647c5b", "#d7b775"], item: ["#8a734d", "#d9ba79"], boost: ["#9d6845", "#dfb45f"], level: ["#6c8190", "#e1c77f"]
};
const palettes = [
  ["#b76545", "#e2b66a"], ["#547d75", "#d9c27f"], ["#685d82", "#d9a46b"], ["#6e814f", "#e4ca83"]
];

function svgFor(entry) {
  const paletteIndex = (entry.index + entry.id.length) % palettes.length;
  const colors = palettes[paletteIndex];
  const icon = glyphs[entry.kind][entry.index % glyphs[entry.kind].length];
  const specks = Array.from({ length: 11 }, (_, i) => {
    const x = 22 + ((i * 47 + entry.index * 19) % 116);
    const y = 18 + ((i * 31 + entry.id.length * 7) % 124);
    const radius = i % 4 === 0 ? 2 : 1;
    return '<circle cx="' + x + '" cy="' + y + '" r="' + radius + '" fill="#f7e7c2" opacity=".48"/>';
  }).join("");
  const halo = tones[entry.kind][0];
  return '<?xml version="1.0" encoding="UTF-8"?>'
    + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 150" role="img" aria-label="' + entry.title.replaceAll("&", "&amp;").replaceAll("<", "&lt;") + '">'
    + '<defs><radialGradient id="g" cx=".48" cy=".38" r=".78"><stop stop-color="' + colors[0] + '"/><stop offset="1" stop-color="#201d1a"/></radialGradient><linearGradient id="r" x2=".9" y2="1"><stop stop-color="' + colors[1] + '"/><stop offset="1" stop-color="' + halo + '"/></linearGradient><filter id="s" x="-.3" y="-.3" width="1.6" height="1.7"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#090807" flood-opacity=".6"/></filter></defs>'
    + '<rect x="18" y="12" width="124" height="126" rx="20" fill="url(#g)"/><rect x="24" y="18" width="112" height="114" rx="17" fill="none" stroke="url(#r)" stroke-width="1.5" opacity=".85"/>'
    + '<circle cx="80" cy="75" r="52" fill="' + halo + '" opacity=".13"/><circle cx="80" cy="75" r="42" fill="none" stroke="' + colors[1] + '" stroke-width="1" opacity=".4"/>'
    + specks + '<g filter="url(#s)" stroke="#241c17" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">' + icon + '</g>'
    + '<path d="M43 130h74" stroke="' + colors[1] + '" opacity=".5" stroke-width="2"/>'
    + '</svg>';
}

for (const surface of ["controller", "host"]) {
  const target = path.join(root, "public", surface, "dungeon-guild", "cards");
  await mkdir(target, { recursive: true });
  for (const entry of entries) await writeFile(path.join(target, entry.id + ".svg"), svgFor(entry), "utf8");
}

console.log("Generated " + entries.length + " original card illustrations for host and controller.");
