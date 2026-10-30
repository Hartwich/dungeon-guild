import * as T from "three";
import type { GuildPublicPlayer } from "../protocol.js";
import { box, cylinder, material, mesh, orb } from "./miniatures.js";

/** Player-colored tabletop figures with visible equipment at its actual body slots. */
export function createAdventurer(player: GuildPublicPlayer): T.Group {
  const root = new T.Group();
  const cloth = material(player.color), dark = material(new T.Color(player.color).multiplyScalar(.38));
  const skin = material("#d5b494"), leather = material("#493629"), steel = material("#9ba7a5", .65, .42), gold = material("#c69b51", .65, .35), ink = material("#25222a");
  const gear = player.equipment.filter((card) => card.equipped !== false);
  cylinder(root, dark, 0, .06, 0, .63, .65, .12, 12);
  cylinder(root, gold, 0, .13, 0, .61, .61, .025, 12);
  const cloak = mesh(root, new T.CylinderGeometry(.3, .49, 1.2, 8, 1, true, Math.PI / 2, Math.PI), dark, 0, 1.15, -.07);
  cloak.rotation.x = -.08;
  cylinder(root, gear.some((c) => c.slot === "body") ? steel : cloth, 0, 1.22, 0, .31, .4, .85).scale.z = .75;
  cylinder(root, leather, 0, .9, 0, .4, .4, .1).scale.z = .76;
  box(root, gold, 0, .9, .3, .13, .12, .05);
  for (const sign of [-1, 1]) {
    cylinder(root, dark, sign * .21, .57, 0, .12, .13, .6);
    box(root, gear.some((c) => c.slot === "feet") ? steel : leather, sign * .21, .29, .08, .28, .25, .4);
    orb(root, cloth, sign * .35, 1.52, 0, .17);
    const arm = cylinder(root, cloth, sign * .45, 1.22, .02, .105, .12, .6); arm.rotation.z = sign * .2;
    orb(root, skin, sign * .51, .91, .09, .12);
  }
  cylinder(root, skin, 0, 1.76, 0, .1, .12, .18);
  orb(root, skin, 0, 2, 0, .29, .93, 1.2, .88);
  orb(root, leather, 0, 2.17, -.04, .28, 1, .65, .95);
  for (const sign of [-1, 1]) {
    orb(root, ink, sign * .1, 2.04, .24, .035, 1, .9, .45);
    box(root, leather, sign * .1, 2.11, .24, .12, .025, .025);
  }
  orb(root, skin, 0, 1.99, .27, .055, .8, 1, 1.2);
  if (gear.some((c) => c.slot === "head")) {
    orb(root, steel, 0, 2.21, -.03, .33, 1, .65, 1);
    box(root, gold, 0, 2.24, .285, .06, .24, .025);
  } else if (player.classCard?.id === "door-class-0") {
    const hat = mesh(root, new T.ConeGeometry(.35, .62, 8), cloth, 0, 2.46, 0); hat.rotation.z = -.14;
  }
  const hands = gear.filter((c) => c.slot === "hands");
  hands.forEach((card, i) => {
    const sign = i === 0 ? 1 : -1;
    if (card.id.startsWith("treasure-item-11-")) {
      const shield = cylinder(root, steel, sign * .6, 1, .18, .34, .34, .08, 6); shield.rotation.x = Math.PI / 2;
      box(root, gold, sign * .6, 1, .24, .04, .45, .04);
    } else {
      cylinder(root, leather, sign * .54, 1.1, .09, .04, .04, .46);
      box(root, steel, sign * .54, 1.69, .09, card.twoHand ? .16 : .1, card.twoHand ? .95 : .7, .055);
      box(root, gold, sign * .54, 1.31, .09, .35, .07, .09);
    }
  });
  if (gear.some((c) => c.slot === "other")) orb(root, gold, 0, 1.47, .29, .085);
  return root;
}
