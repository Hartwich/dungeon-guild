import * as T from "three";
import type { DungeonGuildPublicState } from "../protocol.js";
import { box, createMiniature, cylinder, disposeObjects, material, mesh, orb, type Miniature } from "./miniatures.js";
import { createAdventurer } from "./adventurers.js";

/** A persistent host-only diorama. Gameplay and outcomes remain server-authoritative. */
export class DungeonScene {
  readonly element = document.createElement("div");
  private readonly scene = new T.Scene();
  private readonly camera = new T.PerspectiveCamera(37, 1, .1, 40);
  private readonly renderer: T.WebGLRenderer;
  private readonly observer: ResizeObserver;
  private readonly left = new T.Group();
  private readonly right = new T.Group();
  private readonly flames: T.Mesh[] = [];
  private readonly torchLights: T.PointLight[] = [];
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  private figure: Miniature | undefined;
  private modelKey = "";
  private revealKey = -1;
  private open = false;
  private openedAt = -Infinity;
  private appearedAt = -Infinity;
  private pulseAt = -Infinity;
  private playId: string | undefined;
  private lastFrame = 0;
  private disposed = false;
  private ready = true;
  private width = 0;
  private height = 0;
  private needsRender = true;
  private party = new T.Group();
  private partyKey = "";

  constructor(private readonly mode: "dungeon" | "party" = "dungeon") {
    this.element.className = "dg-three-stage";
    this.element.setAttribute("role", "img");
    this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.setClearColor(0x191c1e, 0);
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    this.element.append(this.renderer.domElement);
    this.scene.fog = new T.Fog("#282728", 12, 25);
    this.scene.add(new T.HemisphereLight("#bdd0d6", "#4e3424", 2));
    const sun = new T.DirectionalLight("#ffe1ac", 3.5);
    sun.position.set(-3, 7, 6); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 6, bottom: -4, near: .1, far: 20 });
    sun.shadow.normalBias = .035; this.scene.add(sun);
    const rim = new T.DirectionalLight("#95b9d3", 2.4); rim.position.set(3, 4, -4); this.scene.add(rim);
    if (mode === "dungeon") this.buildDungeon();
    else this.scene.add(this.party);
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(this.element);
    this.renderer.domElement.addEventListener("webglcontextlost", this.onContextLost);
    this.renderer.domElement.addEventListener("webglcontextrestored", this.onContextRestored);
    this.reducedMotion.addEventListener("change", this.onMotionChange);
    this.renderer.setAnimationLoop(this.frame);
  }

  private buildDungeon(): void {
    const stone = [material("#626968"), material("#70716a"), material("#555e60"), material("#7a7970")];
    const edge = material("#41494b"), brass = material("#b18a4b", .7, .4), wood = material("#754c30"), darkWood = material("#4b3325");
    const floor = cylinder(this.scene, edge, 0, -.23, .2, 3.7, 3.9, .38, 12);
    floor.receiveShadow = true;
    cylinder(this.scene, brass, 0, -.41, .2, 3.76, 3.8, .055, 12);
    // Staggered masonry and worn flagstones form a tangible tabletop miniature.
    for (let row = -2; row <= 3; row++) for (let col = -3; col <= 3; col++) {
      const x = col * .9 + (row % 2) * .24, z = row * .85;
      if (Math.hypot(x, z - .2) > 3.25) continue;
      box(this.scene, stone[Math.abs(col * 3 + row) % 4], x, -.015, z, .86, .12, .81);
    }
    // The opening is 2.6 units wide. Both doors rotate around their real hinges.
    for (const sign of [-1, 1]) {
      for (let row = 0; row < 6; row++) for (let col = 0; col < 2; col++) {
        const block = box(this.scene, stone[(row + col) % 4], sign * (1.6 + col * .52), .28 + row * .52, -.62, .48, .49, .65);
        block.rotation.z = sign * .012 * (row % 2);
      }
      box(this.scene, edge, sign * 1.4, 1.5, -.51, .18, 3.05, .86);
      box(this.scene, stone[1], sign * 1.6, .12, -.5, .72, .2, 1);
      box(this.scene, stone[1], sign * 1.6, 3.03, -.6, .68, .18, .83);
      const leaf = sign < 0 ? this.left : this.right;
      leaf.position.set(sign * 1.3, 0, -.15); this.scene.add(leaf);
      const center = -sign * .65;
      for (let plank = 0; plank < 5; plank++) box(leaf, plank % 2 ? wood : darkWood, -sign * (.14 + plank * .25), 1.44, 0, .24, 2.8, .16);
      for (const y of [.42, 2.43]) {
        box(leaf, brass, center, y, .11, 1.22, .12, .08);
        for (const x of [.18, .6, 1.08]) orb(leaf, brass, -sign * x, y, .17, .035);
        cylinder(leaf, edge, -sign * .04, y, .04, .08, .08, .24);
      }
      const ring = mesh(leaf, new T.TorusGeometry(.105, .025, 6, 16), brass, -sign * 1.05, 1.37, .18);
      ring.castShadow = true; box(leaf, edge, -sign * 1.05, 1.51, .12, .15, .2, .05);
      // Torch brackets and modeled flames; only two local lights.
      box(this.scene, brass, sign * 2.08, 1.6, -.17, .12, .46, .15).rotation.x = -.35;
      cylinder(this.scene, darkWood, sign * 2.08, 1.84, -.04, .07, .09, .52);
      cylinder(this.scene, brass, sign * 2.08, 2.08, -.04, .14, .08, .17);
      const flame = orb(this.scene, new T.MeshBasicMaterial({ color: "#ffc878" }), sign * 2.08, 2.29, -.04, .15, .75, 1.8, .75);
      this.flames.push(flame);
      const light = new T.PointLight("#ffac58", 7, 5, 2); light.position.copy(flame.position); this.scene.add(light); this.torchLights.push(light);
    }
    box(this.scene, stone[1], 0, 3.21, -.6, 3.42, .3, .76);
    for (let i = -2; i <= 2; i++) box(this.scene, stone[(i + 4) % 4], i * .56, 3.47, -.62, .53, .22, .7);
    const crest = mesh(this.scene, new T.OctahedronGeometry(.2), brass, 0, 3.22, -.15); crest.scale.z = .4;
    // Receding corridor makes the reveal read as depth, rather than a flat card.
    const darkness = material("#242e34");
    box(this.scene, darkness, 0, 1.7, -2.6, 2.6, 3.4, .2);
    for (const x of [-1.36, 1.36]) box(this.scene, edge, x, 1.45, -1.6, .18, 2.9, 2.1);
    for (let i = 0; i < 5; i++) {
      const rubble = box(this.scene, stone[i % 4], (i % 2 ? -1 : 1) * (2.5 + (i % 3) * .12), .1, .15 + i * .24, .28, .24, .3);
      rubble.rotation.set(.08 * i, .43 * i, .1);
    }
    const dust = new Float32Array(32 * 3);
    for (let i = 0; i < 32; i++) dust.set([Math.sin(i * 8.3) * 2.6, .3 + (i % 13) * .23, Math.cos(i * 4.7) * 1.2], i * 3);
    const geometry = new T.BufferGeometry(); geometry.setAttribute("position", new T.BufferAttribute(dust, 3));
    this.scene.add(new T.Points(geometry, new T.PointsMaterial({ color: "#dfbb7c", size: .025, transparent: true, opacity: .45 })));
  }

  update(state: DungeonGuildPublicState, en: boolean): void {
    this.needsRender = true;
    const card = state.currentMonster ?? (state.revealedDoorCard?.kind === "monster" ? null : state.revealedDoorCard);
    const now = performance.now();
    if (this.mode === "party") {
      const fighters = state.players.filter((p) => p.id === state.activePlayerId || p.id === state.helperId);
      const key = JSON.stringify(fighters.map((player) => ({ id: player.id, color: player.color, equipment: player.equipment, classCard: player.classCard, raceCard: player.raceCard })));
      if (key !== this.partyKey) {
        disposeObjects(this.party); this.party.clear();
        fighters.forEach((player, i) => {
          const figure = createAdventurer(player);
          figure.position.x = fighters.length === 1 ? 0 : (i === 0 ? -.78 : .78);
          figure.rotation.y = i === 0 ? -.12 : .12; this.party.add(figure);
        });
        this.partyKey = key;
      }
      this.element.setAttribute("aria-label", (en ? "Fighting characters: " : "Kämpfende Charaktere: ") + fighters.map((p) => p.name).join(", "));
      this.resize(); return;
    }
    const nextKey = card?.id ?? "";
    const reveal = this.revealKey >= 0 && this.revealKey !== state.doorRevealNumber && Boolean(state.revealedDoorCard);
    const initial = this.revealKey < 0;
    this.revealKey = state.doorRevealNumber;
    this.open = Boolean(card);
    if (reveal) this.openedAt = now;
    if (initial) this.openedAt = -Infinity;
    if (this.modelKey !== nextKey) {
      if (this.figure) { this.scene.remove(this.figure.root); disposeObjects(this.figure.root); }
      this.figure = card ? createMiniature(card) : undefined;
      if (this.figure) this.scene.add(this.figure.root);
      this.modelKey = nextKey;
      this.appearedAt = initial ? -Infinity : now;
    }
    const play = state.tablePlays?.at(-1);
    if (!initial && play && play.id !== this.playId && state.currentMonster) this.pulseAt = now;
    this.playId = play?.id;
    this.element.setAttribute("aria-label", en
      ? `3D dungeon: ${card ? card.title : "closed wooden door"}`
      : `3D-Dungeon: ${card ? card.title : "geschlossene Holztür"}`);
    this.resize();
  }

  private resize(): void {
    const w = this.element.clientWidth, h = this.element.clientHeight;
    if (!w || !h || (w === this.width && h === this.height)) return;
    this.width = w; this.height = h;
    this.needsRender = true;
    this.renderer.setSize(w, h); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  private frame = (now: number): void => {
    if (this.disposed || !this.ready || !this.element.isConnected || document.hidden) return;
    // Decorative scene runs at 30fps; idle reduced-motion scenes only redraw on updates/resizes.
    if (now - this.lastFrame < 32) return;
    const still = this.reducedMotion.matches;
    if (still && !this.needsRender) return;
    this.needsRender = false;
    this.lastFrame = now;
    const time = still ? 0 : now / 1000;
    const progress = still ? 1 : T.MathUtils.clamp((now - this.openedAt) / 1150, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const angle = this.open ? eased * 1.86 : 0;
    this.left.rotation.y = -angle; this.right.rotation.y = angle;
    const distance = Math.max(1, .92 / this.camera.aspect);
    this.camera.position.set(.38 + Math.sin(time * .24) * .15, this.mode === "party" ? 2.5 : 3.7, (this.mode === "party" ? 6.4 : 9.6) * distance);
    this.camera.lookAt(0, this.mode === "party" ? 1.3 : 1.5, -.1);
    this.party.rotation.y = Math.sin(time * .5) * .04;
    this.flames.forEach((flame, i) => {
      flame.scale.y = 1.8 + Math.sin(time * 8 + i * 2) * .18;
      this.torchLights[i].intensity = 7 + Math.sin(time * 6.3 + i) * .65;
    });
    const figure = this.figure;
    if (figure) {
      const arrival = still ? 1 : T.MathUtils.clamp((now - this.appearedAt - (this.openedAt === this.appearedAt ? 300 : 0)) / 800, 0, 1);
      const grow = 1 - Math.pow(1 - arrival, 3);
      figure.root.visible = !this.open || progress > .32;
      figure.root.position.y = Number(figure.root.userData.floorY) + (figure.floating ? .12 + Math.sin(time * 1.8) * .07 : Math.sin(time * 1.7) * .012);
      figure.root.position.z = -.9 + grow * 1.65;
      const pulse = still ? 0 : Math.max(0, 1 - (now - this.pulseAt) / 600);
      figure.root.rotation.y = Math.sin(time * .8) * .065 + Math.sin(pulse * Math.PI * 3) * pulse * .08;
      if (figure.head) { figure.head.rotation.z = Math.sin(time * 1.2) * .025; figure.head.rotation.y = Math.sin(time * .65) * .1; }
      figure.arms.forEach((arm, i) => arm.rotation.x = Math.sin(time * 1.6 + i * 1.4) * .04 - pulse * .12);
      if (figure.jaw) figure.jaw.rotation.x = -.27 + Math.sin(time * 1.5) * .08 - pulse * .14;
    }
    this.renderer.render(this.scene, this.camera);
  };

  private onContextLost = (event: Event): void => {
    event.preventDefault(); this.ready = false;
    this.element.hidden = true;
    this.element.parentElement?.classList.remove("has-three");
  };
  private onContextRestored = (): void => {
    this.ready = true; this.element.hidden = false;
    this.needsRender = true;
    this.element.parentElement?.classList.add("has-three");
  };
  private onMotionChange = (): void => { this.needsRender = true; };

  dispose(): void {
    this.disposed = true; this.renderer.setAnimationLoop(null); this.observer.disconnect();
    this.renderer.domElement.removeEventListener("webglcontextlost", this.onContextLost);
    this.renderer.domElement.removeEventListener("webglcontextrestored", this.onContextRestored);
    this.reducedMotion.removeEventListener("change", this.onMotionChange);
    disposeObjects(this.scene);
    this.scene.traverse((node) => { if (node instanceof T.DirectionalLight || node instanceof T.PointLight) node.shadow.dispose(); });
    this.renderer.dispose(); this.renderer.forceContextLoss(); this.element.remove();
  }
}

export function createDungeonScene(mode: "dungeon" | "party" = "dungeon"): DungeonScene | null {
  try { return new DungeonScene(mode); }
  catch { return null; } // Existing illustrated door remains usable without WebGL.
}
