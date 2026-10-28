import * as T from "three";
import type { GuildCard } from "../protocol.js";

// Original procedural miniatures: no external models, textures or fonts required.
export function material(color: T.ColorRepresentation, metalness = 0, roughness = .8): T.MeshStandardMaterial {
  return new T.MeshStandardMaterial({ color, metalness, roughness, flatShading: true });
}
export function mesh(parent: T.Object3D, geometry: T.BufferGeometry, mat: T.Material, x = 0, y = 0, z = 0): T.Mesh {
  const part = new T.Mesh(geometry, mat);
  part.position.set(x, y, z); part.castShadow = true; part.receiveShadow = true;
  parent.add(part); return part;
}
export function box(parent: T.Object3D, mat: T.Material, x: number, y: number, z: number, w: number, h: number, d: number): T.Mesh {
  return mesh(parent, new T.BoxGeometry(w, h, d), mat, x, y, z);
}
export function orb(parent: T.Object3D, mat: T.Material, x: number, y: number, z: number, radius: number, sx = 1, sy = 1, sz = 1): T.Mesh {
  const part = mesh(parent, new T.IcosahedronGeometry(radius, 1), mat, x, y, z);
  part.scale.set(sx, sy, sz); return part;
}
export function cylinder(parent: T.Object3D, mat: T.Material, x: number, y: number, z: number, top: number, bottom: number, height: number, segments = 8): T.Mesh {
  return mesh(parent, new T.CylinderGeometry(top, bottom, height, segments), mat, x, y, z);
}
function cone(parent: T.Object3D, mat: T.Material, x: number, y: number, z: number, radius: number, height: number): T.Mesh {
  return mesh(parent, new T.ConeGeometry(radius, height, 7), mat, x, y, z);
}
function bone(parent: T.Object3D, mat: T.Material, a: number[], b: number[], radius: number): void {
  const start = new T.Vector3(...a as [number, number, number]);
  const end = new T.Vector3(...b as [number, number, number]);
  const part = cylinder(parent, mat, 0, 0, 0, radius * .85, radius, start.distanceTo(end));
  part.position.copy(start).add(end).multiplyScalar(.5);
  part.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), end.sub(start).normalize());
}

export interface Miniature { root: T.Group; head?: T.Group; arms: T.Group[]; jaw?: T.Group; floating: boolean; }

export function createMiniature(card: GuildCard): Miniature {
  const root = new T.Group();
  const figure: Miniature = { root, arms: [], floating: false };
  const ink = material("#1b1822"), ivory = material("#eddbc0"), gold = material("#c79a4f", .65, .35);
  const wood = material("#6b422a"), iron = material("#657a7b", .6, .48), leather = material("#3f3030");
  const skin = material("#8baf71"), cloth = material("#5b6d76"), purple = material("#796185");
  function eyes(parent: T.Object3D, y: number, z: number, spread = .14, angry = false): void {
    for (const sign of [-1, 1]) {
      orb(parent, ivory, sign * spread, y, z, .075, 1, .65, .4);
      orb(parent, ink, sign * spread, y, z + .025, .034, .7, 1, .6);
      const brow = box(parent, leather, sign * spread, y + .1, z, .18, .04, .04);
      brow.rotation.z = sign * (angry ? .23 : -.12);
    }
  }
  function book(parent: T.Object3D, x: number, y: number, z: number, scale = 1): T.Group {
    const g = new T.Group(); g.position.set(x, y, z); g.scale.setScalar(scale); parent.add(g);
    box(g, material("#6e3f46"), 0, 0, 0, .6, .72, .14);
    box(g, ivory, .025, 0, .015, .51, .62, .13);
    box(g, gold, -.23, 0, .1, .07, .7, .04);
    box(g, gold, .08, 0, .1, .16, .18, .025); return g;
  }
  function humanoid(bodyMat: T.Material, headMat: T.Material, stout = false): T.Group {
    cylinder(root, bodyMat, 0, 1.05, 0, .36, .48, .94).scale.z = .75;
    cylinder(root, leather, 0, .76, 0, .45, .45, .11).scale.z = .78;
    box(root, gold, 0, .76, .35, .14, .13, .05);
    for (const sign of [-1, 1]) {
      bone(root, leather, [sign * .21, .7, 0], [sign * .25, .22, .04], .14);
      box(root, leather, sign * .25, .15, .13, .31, .22, .44);
      const arm = new T.Group(); arm.position.set(sign * .4, 1.4, 0); root.add(arm); figure.arms.push(arm);
      bone(arm, bodyMat, [0, 0, 0], [sign * .22, -.38, .09], .13);
      bone(arm, bodyMat, [sign * .22, -.38, .09], [sign * .16, -.5, .4], .1);
      orb(arm, headMat, sign * .16, -.5, .4, .12);
    }
    const head = new T.Group(); head.position.set(0, 1.9, .02); root.add(head); figure.head = head;
    orb(head, headMat, 0, 0, 0, .36, stout ? 1.3 : 1, 1.1, .85);
    orb(head, headMat, 0, -.03, .31, .1, 1, 1.2, 1.3);
    eyes(head, .07, .3, .15, true);
    box(head, ink, 0, -.18, .3, .19, .025, .04); return head;
  }
  const index = Number(card.id.match(/^door-monster-(\d+)-/)?.[1] ?? -1);
  if (card.kind !== "monster") {
    figure.floating = true;
    if (card.kind === "curse") {
      const skull = orb(root, ivory, 0, 1.25, 0, .5, 1, 1.2, .9);
      for (const sign of [-1, 1]) orb(skull, ink, sign * .31, .06, .78, .2);
      for (let i = -2; i <= 2; i++) box(root, ivory, i * .14, .8, .23, .11, .25, .2);
      const ring = mesh(root, new T.TorusGeometry(.85, .035, 6, 32), purple, 0, 1.25, 0); ring.rotation.x = .5;
    } else if (card.kind === "class" || card.kind === "race") {
      humanoid(cloth, material(card.kind === "race" ? "#bb9b7e" : "#d5b294"));
      const hat = cone(root, purple, 0, 2.45, 0, .44, .65); hat.rotation.z = -.13;
      cylinder(root, wood, -.8, 1.1, .18, .04, .05, 2.1);
      orb(root, gold, -.8, 2.2, .18, .15);
      figure.floating = false;
    } else {
      const spark = mesh(root, new T.OctahedronGeometry(.48), gold, 0, 1.2, 0); spark.scale.y = 1.5;
      for (const x of [-.75, .75]) orb(root, ivory, x, 1.3, 0, .09);
    }
  } else if (index === 0 || index === 12) {
    const wardrobe = index === 12, h = wardrobe ? 1.65 : .75, w = wardrobe ? 1.1 : 1.45;
    box(root, wood, 0, h / 2 + .18, 0, w, h, .85);
    for (const x of [-w / 2 + .07, w / 2 - .07]) {
      box(root, gold, x, h / 2 + .18, .445, .1, h, .06);
      box(root, wood, x, .1, .15, .17, .2, .5);
    }
    if (wardrobe) {
      for (const x of [-.26, .26]) box(root, material("#895735"), x, 1.03, .445, .43, 1.42, .05);
      for (const x of [-.12, .12]) orb(root, gold, x, 1.04, .51, .06);
    }
    const jaw = new T.Group(); jaw.position.set(0, h + .18, -.4); root.add(jaw); figure.jaw = jaw;
    box(jaw, wood, 0, .12, .4, w + .04, .23, .9);
    box(root, ink, 0, h + .14, .1, w - .15, .06, .65);
    for (let i = 0; i < 7; i++) {
      const tooth = cone(jaw, ivory, (i - 3) * w / 8, -.11, .76, .065, .22); tooth.rotation.z = Math.PI;
      cone(root, ivory, (i - 3) * w / 8, h + .25, .43, .06, .22);
    }
    eyes(jaw, .17, .87, .3, true);
    orb(root, material("#b2707c"), .1, h + .05, .66, .2, .7, .25, 1.6);
    if (!wardrobe) { book(root, -.8, .24, -.13, .55); cylinder(root, leather, .62, .3, -.26, .23, .23, .35); }
  } else if (index === 3) {
    const fur = material("#baad8e");
    orb(root, fur, 0, 1.02, -.12, .55, .9, .95, 1.6);
    for (const x of [-.28, .28]) for (const z of [-.52, .35]) {
      bone(root, fur, [x, .94, z], [x, .18, z + .08], .09);
      box(root, leather, x, .1, z + .1, .17, .17, .23);
    }
    const head = new T.Group(); head.position.set(0, 1.7, .48); root.add(head); figure.head = head;
    orb(head, fur, 0, 0, 0, .34, 1, 1.2, .85); eyes(head, .07, .28);
    orb(head, leather, 0, -.12, .34, .16, 1.25, .65, .6);
    for (const sign of [-1, 1]) {
      const horn = mesh(head, new T.TorusGeometry(.26, .075, 6, 12, Math.PI * 1.25), gold, sign * .25, .34, -.13); horn.rotation.y = sign * .45;
      orb(head, fur, sign * .4, .08, 0, .16, 1.7, .5, .6);
    }
    cone(head, ivory, 0, -.4, .16, .1, .35).rotation.z = Math.PI;
    for (const sign of [-1, 1]) {
      const lightning = new T.Group(); lightning.position.set(sign * .72, 1.6, 0); root.add(lightning);
      box(lightning, gold, 0, .12, 0, .07, .35, .07).rotation.z = -.4;
      box(lightning, gold, .06, -.11, 0, .07, .28, .07).rotation.z = -.4;
    }
  } else if (index === 4 || index === 11) {
    const rock = material(index === 4 ? "#83918b" : "#7f7775");
    orb(root, rock, 0, 1.14, 0, .69, 1, 1.1, .7);
    const head = new T.Group(); head.position.set(0, 1.96, .03); root.add(head); figure.head = head;
    orb(head, rock, 0, 0, 0, .43, 1, .85, .8);
    for (const sign of [-1, 1]) {
      box(head, ink, sign * .18, .03, .32, .2, .06, .035);
      box(head, gold, sign * .18, .03, .345, .12, .025, .015);
      orb(root, rock, sign * .34, .39, 0, .26, .9, 1.5, 1);
      const arm = new T.Group(); arm.position.set(sign * .65, 1.45, 0); root.add(arm); figure.arms.push(arm);
      orb(arm, rock, sign * .08, -.25, 0, .3, .9, 1.6, 1);
      orb(arm, rock, sign * .14, -.66, .13, .27);
    }
    box(root, gold, 0, 1.28, .46, .09, .48, .025).rotation.z = .5;
    box(head, ink, 0, -.18, .3, .33, .08, .04);
    if (index === 11) for (let i = -2; i <= 2; i++) cone(head, ivory, i * .07, -.15, .34, .04, .11);
  } else if (index === 5) {
    for (let i = -1; i <= 1; i++) {
      const skeleton = new T.Group(); skeleton.position.set(i * .63, 0, i === 0 ? .18 : -.18); skeleton.rotation.y = -i * .2; skeleton.scale.setScalar(i === 0 ? 1 : .85); root.add(skeleton);
      orb(skeleton, ivory, 0, 1.75, 0, .28, 1, 1.15, .85);
      for (const sign of [-1, 1]) {
        orb(skeleton, ink, sign * .1, 1.79, .22, .075, 1, 1.2, .4);
        bone(skeleton, ivory, [sign * .14, .65, 0], [sign * .23, .16, .08], .055);
        bone(skeleton, ivory, [sign * .24, 1.35, 0], [sign * .42, .92, .2], .045);
      }
      bone(skeleton, ivory, [0, .7, 0], [0, 1.48, 0], .065);
      for (let j = 0; j < 4; j++) {
        const rib = mesh(skeleton, new T.TorusGeometry(.21 - j * .018, .027, 5, 12, Math.PI * 1.5), ivory, 0, 1.32 - j * .13, 0); rib.rotation.x = Math.PI / 2;
      }
      box(skeleton, ivory, 0, .71, 0, .34, .12, .18);
      for (let j = -1; j <= 1; j++) box(skeleton, ivory, j * .095, 1.48, .18, .065, .12, .08);
    }
  } else if (index === 8) {
    const cheese = material("#e3b64f");
    cylinder(root, cheese, 0, .9, 0, .36, .58, 1.4, 7);
    orb(root, cheese, 0, 1.8, 0, .37); eyes(root, 1.86, .32);
    for (let i = 0; i < 6; i++) orb(root, material("#9a7130"), Math.sin(i * 2.1) * .28, .5 + i * .17, .37, .09, 1, .8, .2);
    cylinder(root, gold, 0, 2.13, 0, .32, .28, .15);
    for (let i = 0; i < 6; i++) cone(root, gold, Math.sin(i * Math.PI / 3) * .27, 2.32, Math.cos(i * Math.PI / 3) * .27, .08, .33);
    for (const sign of [-1, 1]) bone(root, cheese, [sign * .32, 1.34, 0], [sign * .7, 1.05, .2], .095);
    cylinder(root, gold, .72, 1.2, .2, .035, .04, 1.35); orb(root, gold, .72, 1.92, .2, .13);
  } else if (index === 10) {
    const scales = material("#7d9985"), wing = material("#5e7275"), horn = material("#c8b994");
    orb(root, scales, 0, .94, 0, .65, .9, 1.15, 1.1);
    orb(root, material("#b6ae87"), 0, .98, .42, .42, .85, 1.4, .45);
    for (const sign of [-1, 1]) {
      orb(root, scales, sign * .48, .28, .24, .24, 1.1, 1, 1.5);
      bone(root, scales, [sign * .4, 1.25, .1], [sign * .6, .66, .47], .13);
      const shape = new T.Shape(); shape.moveTo(0, 0); shape.lineTo(sign * .48, 1.1); shape.lineTo(sign * 1.18, .7); shape.lineTo(sign * .92, .05); shape.lineTo(sign * .38, .23); shape.closePath();
      const panel = mesh(root, new T.ExtrudeGeometry(shape, { depth: .045, bevelEnabled: false }), wing, sign * .3, 1.05, -.32); panel.rotation.y = sign * -.3;
      bone(root, horn, [sign * .3, 1.05, -.3], [sign * .78, 2.15, -.3], .045);
    }
    const head = new T.Group(); head.position.set(0, 1.99, .1); root.add(head); figure.head = head;
    orb(head, scales, 0, 0, 0, .37); orb(head, scales, 0, -.12, .32, .31, .85, .65, 1.25); eyes(head, .06, .3, .2);
    for (const sign of [-1, 1]) { const h = cone(head, horn, sign * .25, .35, -.13, .09, .5); h.rotation.z = -sign * .3; }
    const tail = mesh(root, new T.TorusGeometry(.64, .13, 6, 16, Math.PI * 1.3), scales, .48, .19, -.45); tail.rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++) cone(root, horn, 0, 1.42 - i * .26, -.5 - i * .05, .09, .25);
  } else if (index === 13) {
    figure.floating = true;
    const shadow = material("#4c455f");
    orb(root, shadow, 0, 1.1, 0, .69, .85, 1.35, .7);
    const head = new T.Group(); head.position.set(0, 1.96, .02); root.add(head); figure.head = head;
    orb(head, shadow, 0, 0, 0, .4);
    for (const sign of [-1, 1]) { cone(head, shadow, sign * .25, .43, -.05, .16, .5); orb(head, gold, sign * .16, .04, .35, .07); }
    const moon = material("#f1d99e", .15);
    orb(root, moon, .62, 1.2, .44, .36);
    for (const sign of [-1, 1]) bone(root, shadow, [sign * .4, 1.4, 0], [.62 + sign * .2, 1.1, .48], .12);
    for (let i = -2; i <= 2; i++) cone(root, shadow, i * .18, .39, 0, .15, .56).rotation.z = Math.PI;
  } else {
    const frog = index === 2 || index === 7, witch = index === 9, keeper = index === 6;
    const head = humanoid(witch || keeper ? purple : frog ? iron : cloth, frog ? material("#8ba184") : keeper ? material("#c3b59b") : skin, frog);
    if (index === 1) {
      for (const sign of [-1, 1]) {
        const ear = cone(head, skin, sign * .46, .07, -.02, .16, .48); ear.rotation.z = -sign * 1.1;
        mesh(head, new T.TorusGeometry(.13, .018, 5, 16), gold, sign * .15, .07, .33);
      }
      book(root, -.53, 1.03, .5, .8);
      box(root, gold, .49, .99, .5, .23, .3, .08);
      for (let i = 0; i < 3; i++) box(root, ink, .49, .91 + i * .08, .55, .14, .017, .01);
    } else if (index === 2) {
      book(root, -.52, .96, .5, .85);
      cone(head, cloth, 0, .47, 0, .41, .42).rotation.z = .15;
      for (const x of [-.38, .38]) orb(head, material("#6c8466"), x, .29, .03, .15);
    } else if (index === 7) {
      for (const x of [-.36, .36]) orb(head, skin, x, .25, .05, .18);
      const shield = cylinder(root, iron, -.72, 1.02, .34, .37, .37, .09, 6); shield.rotation.x = Math.PI / 2;
      box(root, gold, -.72, 1.02, .41, .045, .5, .05);
      box(root, gold, -.72, 1.11, .41, .35, .045, .05);
      box(root, ivory, .72, 1.51, .35, .1, .8, .05); box(root, gold, .72, 1.13, .35, .35, .07, .09);
    } else {
      const robe = cylinder(root, witch ? purple : cloth, 0, .63, -.02, .35, .58, 1.05, 9); robe.scale.z = .8;
      const hat = cone(head, witch ? purple : cloth, 0, .55, -.05, .45, .88); hat.rotation.z = -.14;
      cylinder(head, leather, 0, .23, 0, .49, .49, .06, 12);
      cylinder(root, wood, .8, 1.2, .11, .04, .05, 2.2);
      orb(root, material("#9bcec9", .25, .35), .8, 2.37, .11, .16);
      if (keeper) { book(root, -.53, 1.02, .5, .85); for (let i = 0; i < 3; i++) book(root, -.74 + i * .09, .2 + i * .15, -.1, .5); }
    }
  }
  // Normalize every silhouette to the same stage, including the broad dragon wings.
  const bounds = new T.Box3().setFromObject(root), size = bounds.getSize(new T.Vector3());
  const scale = Math.min(2.65 / size.y, 3.1 / size.x);
  root.scale.setScalar(scale); root.position.y = -.02 - bounds.min.y * scale;
  root.userData.floorY = root.position.y;
  return figure;
}

export function disposeObjects(root: T.Object3D): void {
  const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
  root.traverse((part) => {
    if (!(part instanceof T.Mesh || part instanceof T.Points)) return;
    geometries.add(part.geometry);
    for (const mat of Array.isArray(part.material) ? part.material : [part.material]) materials.add(mat);
  });
  geometries.forEach((geometry) => geometry.dispose()); materials.forEach((mat) => mat.dispose());
}
