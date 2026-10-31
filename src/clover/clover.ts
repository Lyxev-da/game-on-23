// @ts-nocheck
/**
 * Pixel-art 3D four-leaf clover renderer.
 *
 * Every clover shares the same bevel, shine and solid extrusion treatment as
 * the original green clover, but each rarity now has its OWN leaf silhouette
 * (round, pointed, spiky, blocky, gem-cut, scalloped, chamfered, serrated...)
 * plus its own palette ramp and surface pattern. Everything is drawn on
 * integer cells, so there is no smoothing or blur.
 * A real image at `src/assets/clover.(png|webp|jpg|jpeg)` replaces the common one.
 */

const supplied = Object.values(
  import.meta.glob<string>("./assets/clover.{png,webp,jpg,jpeg}", {
    eager: true,
    query: "?url",
    import: "default",
  }),
)[0];

export type CloverPaint = { hue: number; rainbow?: boolean };

type HSL = [number, number, number];
type Role =
  | "slit" | "shine" | "rim" | "right" | "down" | "ul" | "ur" | "dl" | "dr"
  | "innerLit" | "innerShadow" | "face";

type Cell = {
  x: number; y: number;
  dx: number; dy: number;
  u: number; v: number;
  d: number;
  q: number;
  role: Role;
  interior: boolean;
  gloss: boolean;
  base: HSL;
};
type CellColor = string | HSL | undefined;

/** Tests a leaf-local pixel (u, v >= 0): does this leaf include it? */
type LeafShape = (u: number, v: number) => boolean;

type Style = {
  hue: number;
  rainbow?: boolean;
  hueShift?: number;
  sat?: number;
  lightAdd?: number;
  face?: [number, number];
  faceSat?: [number, number];
  roles?: Partial<Record<Role, HSL>>;
  side?: [HSL, HSL];
  /** This rarity's own leaf silhouette. Falls back to the original clover. */
  shape?: LeafShape;
  cell?: (c: Cell) => CellColor;
};

const GRID = 23;
const CENTER = 11;
const DEPTH_X = 2.4;
const DEPTH_Y = 3.1;
const OUTLINE = 1.05;
const QUAD_HUES = [335, 48, 188, 268];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const shade = (c: HSL, dl: number): HSL => [c[0], c[1], clamp(c[2] + dl, 3, 98)];
const css = (c: string | HSL) =>
  typeof c === "string"
    ? c
    : `hsl(${((c[0] % 360) + 360) % 360},${clamp(c[1], 0, 100).toFixed(1)}%,${clamp(c[2], 0, 100).toFixed(1)}%)`;

const hash = (x: number, y: number) => {
  let h = Math.imul(x + 101, 374761393) ^ Math.imul(y + 211, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
};

/** [saturation, lightness] for each shading role, tuned from the original green clover. */
const ROLES: Record<Exclude<Role, "face">, [number, number]> = {
  shine: [100, 94], rim: [100, 80], right: [87, 67], down: [77, 37],
  ul: [92, 73], ur: [80, 62], dl: [72, 43], dr: [76, 37],
  innerLit: [88, 67], innerShadow: [72, 46], slit: [89, 25],
};

/* ------------------------------------------------------------------ */
/*  Leaf silhouettes — one per rarity                                  */
/*  Each is a superellipse variant, a cut, or a scallop on the edge.   */
/* ------------------------------------------------------------------ */

const BASE_LEAF: LeafShape = (u, v) => u ** 3 + v ** 3 <= 11.4 ** 3;

const LEAVES: Record<string, LeafShape> = {
  // Mint: a perfectly round, chunky leaf.
  mint: (u, v) => u * u + v * v <= 11.9 ** 2,
  // Frost: sharpened into a diamond point along the leaf diagonal.
  frost: (u, v) => u + v <= 13.4,
  // Void: serrated spiky edge, every third boundary pixel removed.
  void: (u, v) => {
    if (u + v <= 4) return true;
    if (u > 10.5 || v > 10.5) return false;
    const along = u + v;
    const off = Math.abs(u - v);
    return along < 18 && off <= (along < 9 ? 6 : along < 13 ? 8 : along < 16 ? 4 : 1);
  },
  // Gold: a regal blocky leaf with softly rounded corners.
  gold: (u, v) => u <= 9.8 && v <= 9.8 && u * v <= 46,
  // Ruby: a chamfered gem octagon.
  ruby: (u, v) => u <= 9.6 && v <= 9.6 && u + v <= 15.2,
  // Seraph: scalloped feather edges, like layered plumage.
  seraph: (u, v) => BASE_LEAF(u, v) && (Math.hypot(u, v) <= 8.6 || (u + v) % 2 === 0),
  // Nebula: a broad, soft, slightly squarer-than-round leaf.
  nebula: (u, v) => u ** 2.6 + v ** 2.6 <= 12 ** 2.6,
  // Eclipse: the far corner is sliced off, like a bitten moon.
  eclipse: (u, v) => BASE_LEAF(u, v) && !(u > 7.4 && v > 7.4),
  // Aurora: a serrated, wave-swept leaf edge.
  aurora: (u, v) => BASE_LEAF(u, v) && (u + v <= 14.6 || (u + v) % 4 < 2),
  // Singularity: a stretched leaf, pulled by gravity.
  singularity: (u, v) => u * u + (v * 1.22) ** 2 <= 11.9 ** 2,
  // Prism: a pointed diamond-cut leaf.
  prism: (u, v) => u + v <= 15.2 && u <= 10.2 && v <= 10.2,
};

function inLeafWith(x: number, y: number, lobe: LeafShape) {
  if (x < 0 || y < 0 || x >= GRID || y >= GRID) return false;
  const u = Math.abs(x - CENTER);
  const v = Math.abs(y - CENTER);
  if (!lobe(u, v)) return false;
  if (u === 0 && v >= 8) return false;
  if (u <= 1 && v >= 10) return false;
  if (v === 0 && u >= 8) return false;
  if (v <= 1 && u >= 10) return false;
  return true;
}

function isSlitWith(x: number, y: number, lobe: LeafShape) {
  if (!inLeafWith(x, y, lobe)) return false;
  const u = Math.abs(x - CENTER);
  const v = Math.abs(y - CENTER);
  return (u === 0 && v >= 3 && v <= 7) || (v === 0 && u >= 3 && u <= 7);
}

function roleOf(x: number, y: number, lobe: LeafShape): Role {
  if (isSlitWith(x, y, lobe)) return "slit";
  const empty = (ax: number, ay: number) => !inLeafWith(ax, ay, lobe) || isSlitWith(ax, ay, lobe);
  const up = empty(x, y - 1);
  const left = empty(x - 1, y);
  if (up && left) return "shine";
  if (up || left) return "rim";
  if (empty(x + 1, y)) return "right";
  if (empty(x, y + 1)) return "down";
  if (empty(x - 1, y - 1)) return "ul";
  if (empty(x + 1, y - 1)) return "ur";
  if (empty(x - 1, y + 1)) return "dl";
  if (empty(x + 1, y + 1)) return "dr";
  if (empty(x - 2, y) || empty(x, y - 2)) return "innerLit";
  if (empty(x + 2, y) || empty(x, y + 2)) return "innerShadow";
  return "face";
}

type StaticCell = Omit<Cell, "base">;
type CellSet = {
  cells: StaticCell[];
  paths: Map<string, { outline: Path2D; quads: Path2D[] }>;
};

function buildCells(lobe: LeafShape): StaticCell[] {
  const cells: StaticCell[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!inLeafWith(x, y, lobe)) continue;
      const role = roleOf(x, y, lobe);
      const empty = (ax: number, ay: number) => !inLeafWith(ax, ay, lobe) || isSlitWith(ax, ay, lobe);
      const dx = x - CENTER;
      const dy = y - CENTER;
      cells.push({
        x, y, dx, dy,
        u: Math.abs(dx), v: Math.abs(dy),
        d: Math.hypot(dx, dy),
        q: (x < CENTER ? 0 : 1) + (y < CENTER ? 0 : 2),
        role,
        interior: role === "face" || role === "innerLit" || role === "innerShadow",
        gloss: role !== "slit" && empty(x, y - 1) && !empty(x - 1, y),
      });
    }
  }
  return cells;
}

const cellSets = new WeakMap<LeafShape, CellSet>();

function cellSetFor(style: Style): CellSet {
  const lobe = style.shape ?? BASE_LEAF;
  let set = cellSets.get(lobe);
  if (!set) {
    set = { cells: buildCells(lobe), paths: new Map() };
    cellSets.set(lobe, set);
  }
  return set;
}

function pathsFor(set: CellSet, S: number, pad: number) {
  const key = `${S}:${pad}`;
  let paths = set.paths.get(key);
  if (!paths) {
    const outline = new Path2D();
    const quads = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
    for (const c of set.cells) {
      outline.rect(c.x * S - pad, c.y * S - pad, S + pad * 2, S + pad * 2);
      quads[c.q].rect(c.x * S, c.y * S, S, S);
    }
    paths = { outline, quads };
    set.paths.set(key, paths);
  }
  return paths;
}

function baseColor(style: Style, c: StaticCell): HSL {
  const override = style.roles?.[c.role];
  if (override) return override;
  const hue = style.rainbow ? QUAD_HUES[c.q] : style.hue;
  let s: number;
  let l: number;
  if (c.role === "face") {
    const t = (c.x + c.y) / ((GRID - 1) * 2);
    const fs = style.faceSat ?? [86, 79];
    const fl = style.face ?? [58, 42];
    s = lerp(fs[0], fs[1], t);
    l = lerp(fl[0], fl[1], t);
  } else {
    [s, l] = ROLES[c.role];
    l = clamp(l + (style.lightAdd ?? 0), 4, 99);
  }
  s = clamp(s * (style.sat ?? 1), 0, 100);
  return [hue + (style.hueShift ?? 0) * ((l - 55) / 45), s, l];
}

/* ------------------------------------------------------------------ */
/*  Per-tier surface patterns                                          */
/* ------------------------------------------------------------------ */

const nebulaField = (x: number, y: number) =>
  Math.sin(x * 0.62 + 1.1) + Math.cos(y * 0.55) + Math.sin((x + y) * 0.37);

const COSMIC_STARS: Array<[number, number]> = [[5, 4], [17, 5], [4, 16], [18, 17]];
const AURORA: HSL[] = [
  [158, 78, 50], [154, 88, 56], [168, 90, 64], [190, 92, 62],
  [212, 92, 66], [250, 86, 70], [282, 82, 68],
];

const BASE_STYLES: Record<string, Style> = {
  // The original clover, unchanged.
  common: { hue: 131 },

  // The common clover's exact geometry, with a diamond-blue material only.
  cloverGem: {
    hue: 192,
    face: [67, 43], faceSat: [100, 98],
    side: [[203, 96, 43], [220, 96, 18]],
    roles: {
      shine: [184, 100, 99], rim: [184, 100, 85],
      right: [197, 98, 55], down: [213, 96, 31],
      ul: [184, 100, 80], ur: [190, 100, 62],
      dl: [202, 98, 43], dr: [215, 96, 29],
      innerLit: [187, 100, 72], innerShadow: [207, 98, 38],
      slit: [216, 94, 20],
    },
    cell: (c) => {
      if (!c.interior) return;
      const glint = Math.abs(c.x - 6) + Math.abs(c.y - 5);
      if (glint <= 1) return "#ffffff";
      if (glint === 2 && (c.x === 6 || c.y === 5)) return "#d9fcff";
      if (c.x === 17 && c.y === 15) return "#ffffff";

      // Flat triangular reflections stay inside the existing leaf pixels.
      if (c.role !== "face") return;
      const x = c.x - (c.dx < 0 ? 5 : 17);
      const y = c.y - (c.dy < 0 ? 5 : 17);
      const lower = c.dy > 0;
      if (y < -Math.abs(x)) return lower ? "#27d5ed" : "#8cf5fc";
      if (x < -Math.abs(y)) return lower ? "#13bce3" : "#4ce9f4";
      if (x > Math.abs(y)) return lower ? "#0867bb" : "#0bc5e5";
      return lower ? "#0957a9" : "#099fda";
    },
  },

  // Mint: round leaf, cool ramp, grooved leaf veins and dewdrops.
  uncommon: {
    hue: 163, hueShift: 18, sat: 0.95, lightAdd: 3, shape: LEAVES.mint,
    side: [[165, 62, 42], [172, 78, 17]],
    cell: (c) => {
      if (!c.interior) return;
      if (c.u === c.v && c.u >= 3 && c.u <= 9) return "#e2fff5";
      if (Math.abs(c.u - c.v) === 1 && c.u + c.v >= 6 && c.u + c.v <= 18) return shade(c.base, -13);
      if ((c.u === 8 && c.v === 4) || (c.u === 4 && c.v === 8)) return "#ffffff";
      if (
        (c.u === 9 && c.v === 4) || (c.u === 8 && c.v === 5) ||
        (c.u === 5 && c.v === 8) || (c.u === 4 && c.v === 9)
      ) return "#8cf0dc";
    },
  },

  // Frost: pointed leaf, icy ramp, a pixel snowflake in every leaf.
  rare: {
    hue: 200, hueShift: 14, sat: 0.9, lightAdd: 7, shape: LEAVES.frost,
    face: [70, 52], faceSat: [80, 85],
    roles: { shine: [190, 100, 98], rim: [192, 95, 90] },
    side: [[205, 70, 50], [214, 85, 26]],
    cell: (c) => {
      if (!c.interior) return;
      const du = c.u - 6;
      const dv = c.v - 6;
      if (Math.abs(du) <= 2 && Math.abs(dv) <= 2 && (du === 0 || dv === 0 || Math.abs(du) === Math.abs(dv))) {
        return du === 0 && dv === 0 ? "#ffffff" : "#e4fbff";
      }
      const h = hash(c.x, c.y);
      if (h % 17 === 0) return "#ffffff";
      if (h % 7 === 0) return shade(c.base, 7);
    },
  },

  // Void: spiky leaf, dark violet leaves, a black vortex core and star glints.
  epic: {
    hue: 272, hueShift: -8, sat: 0.9, lightAdd: -10, shape: LEAVES.void,
    face: [44, 26], faceSat: [70, 75],
    roles: { shine: [285, 100, 92], rim: [280, 100, 78] },
    side: [[272, 55, 26], [270, 70, 9]],
    cell: (c) => {
      if (c.role === "slit") return;
      const s = c.u + c.v;
      if (s <= 1) return "#07020f";
      if (s === 2) return "#1d0840";
      if (s === 3) return "#a35bf0";
      if (!c.interior) return;
      const du = c.u - 7;
      const dv = c.v - 7;
      if (du === 0 && dv === 0) return "#ffffff";
      if (Math.abs(du) + Math.abs(dv) === 1) return "#e6ccff";
      const h = hash(c.x, c.y);
      if (h % 23 === 0) return "#ffffff";
      if (h % 9 === 0) return shade(c.base, 9);
    },
  },

  // Gold: blocky royal leaf, ruby center, bright ring and polka studs.
  legendary: {
    hue: 44, hueShift: 20, sat: 1, lightAdd: 1, shape: LEAVES.gold,
    face: [60, 45],
    roles: { shine: [52, 100, 96], rim: [50, 100, 82] },
    side: [[40, 85, 46], [30, 90, 22]],
    cell: (c) => {
      if (c.role === "slit") return;
      const s = c.u + c.v;
      if (s <= 2) {
        const t = c.dx + c.dy;
        return t < 0 ? "#ffa3ae" : t === 0 ? "#f0344a" : "#9d1027";
      }
      if (s === 3) return "#fff4b0";
      if (c.interior && c.u % 4 === 2 && c.v % 4 === 2) return "#fff8cf";
      if (c.interior && c.u % 4 === 3 && c.v % 4 === 3) return shade(c.base, -11);
    },
  },

  // Ruby: chamfered gem leaf, every leaf split into light and dark facets.
  mythic: {
    hue: 349, hueShift: 16, sat: 0.95, lightAdd: -5, shape: LEAVES.ruby,
    face: [50, 32], faceSat: [90, 85],
    roles: { shine: [350, 100, 94], rim: [352, 100, 80] },
    side: [[348, 72, 38], [340, 85, 14]],
    cell: (c) => {
      if (c.role === "slit") return;
      const s = c.u + c.v;
      if (s <= 2) {
        const t = c.dx + c.dy;
        return t < 0 ? "#fff0f4" : t === 0 ? "#ffc4d1" : "#ff7c96";
      }
      if (s === 3) return "#ffd6df";
      if (!c.interior) return;
      if (c.u === c.v) return "#ffc2d0";
      if (hash(c.x, c.y) % 31 === 0) return "#ffb067";
      return c.u > c.v ? shade(c.base, 9) : shade(c.base, -10);
    },
  },

  // Seraph: scalloped feather leaf, ivory with a golden halo ring.
  divine: {
    hue: 40, hueShift: 14, sat: 0.55, lightAdd: 20, shape: LEAVES.seraph,
    face: [90, 76], faceSat: [65, 60],
    roles: {
      shine: [48, 100, 99], rim: [46, 95, 94], right: [40, 70, 84], down: [34, 78, 56],
      ul: [44, 80, 92], ur: [40, 70, 86], dl: [36, 72, 66], dr: [34, 78, 56],
      innerLit: [44, 85, 92], innerShadow: [38, 70, 70], slit: [32, 75, 40],
    },
    side: [[38, 60, 64], [34, 72, 38]],
    cell: (c) => {
      if (c.role === "slit") return;
      if (c.d < 1.7) return "#fffef4";
      if (c.d < 2.8) return "#f3c75a";
      if (c.d >= 5.3 && c.d < 6.7) return c.dx + c.dy < 0 ? "#ffe9a3" : "#e3a529";
      if (c.interior && hash(c.x, c.y) % 19 === 0) return "#ffffff";
    },
  },

  // Nebula: extra-large soft leaf, deep space, dithered clouds and stars.
  cosmic: {
    hue: 232, hueShift: -12, sat: 0.85, lightAdd: -14, shape: LEAVES.nebula,
    face: [34, 20], faceSat: [70, 75],
    roles: { shine: [215, 100, 90], rim: [222, 95, 78] },
    side: [[232, 55, 22], [232, 68, 8]],
    cell: (c) => {
      if (!c.interior) return;
      for (const [sx, sy] of COSMIC_STARS) {
        const dist = Math.abs(c.x - sx) + Math.abs(c.y - sy);
        if (dist === 0) return "#ffffff";
        if (dist === 1) return "#c9dcff";
      }
      const n = nebulaField(c.x, c.y);
      if (n > 1.5) return "#d46de6";
      if (n > 0.95) return (c.x + c.y) & 1 ? "#8a52dd" : "#6a3fc9";
      if (n < -1.6) return "#0c1346";
      const h = hash(c.x, c.y);
      if (h % 11 === 0) return "#ffffff";
      if (h % 17 === 1) return "#9fc0ff";
    },
  },

  // Eclipse: bitten leaf corner, near-black leaves, glowing violet rim.
  eclipse: {
    hue: 288, hueShift: 6, sat: 0.9, shape: LEAVES.eclipse,
    face: [16, 9], faceSat: [60, 55],
    roles: {
      shine: [305, 100, 90], rim: [300, 100, 70], right: [292, 90, 44], down: [285, 75, 22],
      ul: [300, 95, 62], ur: [295, 85, 48], dl: [288, 80, 34], dr: [285, 75, 24],
      innerLit: [296, 90, 36], innerShadow: [282, 65, 13], slit: [280, 70, 6],
    },
    side: [[290, 60, 22], [288, 70, 7]],
    cell: (c) => {
      if (c.role === "slit") return;
      if (c.d < 3.2) return "#04010a";
      if (c.d < 4.5) return c.dx + c.dy < 0 ? "#ffe3ff" : "#d95bff";
      if (c.d < 5.4) return "#6b2596";
      if (!c.interior) return;
      const h = hash(c.x, c.y);
      if (h % 17 === 0) return "#c15bf0";
      if (h % 41 === 3) return "#ffffff";
    },
  },

  // Aurora: serrated wave-swept leaf with northern-light bands.
  aurora: {
    hue: 168, hueShift: 22, sat: 0.95, lightAdd: 2, shape: LEAVES.aurora,
    roles: { shine: [150, 100, 95], rim: [160, 95, 84] },
    side: [[178, 72, 34], [205, 82, 13]],
    cell: (c) => {
      if (c.role === "slit" || !c.interior) return;
      const t = clamp((c.y * 0.8 + Math.sin(c.x * 0.5) * 2.4 + c.x * 0.3) / 24, 0, 0.999);
      const scaled = t * AURORA.length;
      const idx = Math.floor(scaled);
      const frac = scaled - idx;
      const band = frac > 0.62 && (c.x + c.y) & 1 ? AURORA[Math.min(idx + 1, AURORA.length - 1)] : AURORA[idx];
      if (hash(c.x, c.y) % 15 === 0) return "#f4fffb";
      return shade(band, c.role === "innerLit" ? 8 : c.role === "innerShadow" ? -12 : 0);
    },
  },

  // Singularity: stretched leaf, a black hole and a tilted accretion disc.
  singularity: {
    hue: 262, hueShift: 8, sat: 0.9, shape: LEAVES.singularity,
    face: [12, 7], faceSat: [55, 50],
    roles: {
      shine: [275, 100, 90], rim: [270, 95, 72], right: [264, 85, 40], down: [258, 70, 20],
      ul: [272, 92, 60], ur: [266, 82, 44], dl: [260, 75, 30], dr: [258, 70, 22],
      innerLit: [268, 85, 32], innerShadow: [256, 60, 12], slit: [255, 60, 4],
    },
    side: [[262, 55, 18], [258, 65, 5]],
    cell: (c) => {
      if (c.role === "slit") return;
      if (c.d < 2.8) return "#000000";
      const rx = c.dx * 0.906 - c.dy * 0.423;
      const ry = c.dx * 0.423 + c.dy * 0.906;
      const e = (rx / 10.4) ** 2 + (ry / 2.5) ** 2;
      if (e <= 1 && e >= 0.2) {
        if (e < 0.42) return "#ffffff";
        const t = (rx + 10) / 20;
        return t < 0.28 ? "#fff3ff" : t < 0.5 ? "#e2bcff" : t < 0.75 ? "#a96cf4" : "#6d33c6";
      }
      if (c.interior && hash(c.x, c.y) % 21 === 0) return "#bba6ff";
    },
  },

  // Prism: pointed diamond-cut leaf, four gem colors and a white prism core.
  prismatic: {
    hue: 0, rainbow: true, sat: 1, lightAdd: 2, shape: LEAVES.prism,
    cell: (c) => {
      if (c.role === "slit") return;
      const s = c.u + c.v;
      if (s <= 2) return "#ffffff";
      if (s === 3) return ["#ff9ac8", "#ffe58f", "#8defff", "#b8a6ff"][c.q];
      if (!c.interior) return;
      if (c.u === c.v) return "#ffffff";
      if (hash(c.x, c.y) % 13 === 0) return "#ffffff";
      return c.u > c.v ? shade(c.base, 9) : shade(c.base, -9);
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Crystal pass                                                       */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Twelve more rarities: their own silhouettes, palettes and patterns */
/* ------------------------------------------------------------------ */

const LEAVES_EXTRA: Record<string, LeafShape> = {
  // Solar: four flared plus-shaped leaves, like sun flares.
  solar: (u, v) => BASE_LEAF(u, v) && (u <= 5.6 || v <= 5.6 || u + v <= 8.5),
  // Moonlit: a round crescent bitten from the outer corner of every leaf.
  moonlit: (u, v) => BASE_LEAF(u, v) && (u - 11) ** 2 + (v - 11) ** 2 > 25,
  // Tidal: an outer edge that rolls in waves.
  tidal: (u, v) => u ** 3 + v ** 3 <= 11.4 ** 3 && v <= 9.6 + 1.4 * Math.sin(u * 1.1),
  // Inferno: a stepped, flame-tongued outline.
  inferno: (u, v) => BASE_LEAF(u, v) && u + v <= 13.5 - (Math.floor(v / 3) % 2) * 2,
  // Glacier: a hollow ring of ice with an open heart.
  glacier: (u, v) => BASE_LEAF(u, v) && u * u + v * v >= 18,
  // Sakura: petals that bulge diagonally, like five-petal blossoms.
  sakura: (u, v) => u + v <= 3 || ((u - 5.8) ** 2 + (v - 5.8) ** 2 <= 25 && !(u >= 8 && v >= 8)),
  // Thunder: a sharp diamond cut.
  thunder: (u, v) => u + v <= 12.6 && u <= 10.5 && v <= 10.5,
  // Verdant: a teardrop leaf that narrows toward the stem.
  verdant: (u, v) => u + v <= 3 || ((u + v - 10.5) / 9.7) ** 2 + ((u - v) / 8.1) ** 2 <= 1,
  // Obsidian: a squared gem with clipped corners.
  obsidian: (u, v) => u <= 10.2 && v <= 10.2 && !(u >= 8.5 && v >= 8.5),
  // Celestial: a four-point star leaf whose tips reach for the sky.
  celestial: (u, v) => u * v <= 9 + 0.5 * (u + v) && u <= 10.4 && v <= 10.4,
  // Chrono: gear-toothed edges, teeth every 30 degrees.
  chrono: (u, v) => {
    const teeth = Math.floor((Math.atan2(v, u) * 6) / Math.PI) % 2;
    return u * u + v * v <= (9 + teeth * 1.5) ** 2;
  },
  // Infinite: a broad squircle, the most complete leaf of all.
  infinite: (u, v) => u ** 5 + v ** 5 <= 11.2 ** 5,
};

const STYLES_EXTRA: Record<string, Style> = {
  solar: {
    hue: 38, hueShift: 14, sat: 1.05, lightAdd: 4, shape: LEAVES_EXTRA.solar,
    face: [66, 52], faceSat: [96, 90],
    roles: { shine: [54, 100, 97], rim: [48, 100, 84] },
    side: [[34, 92, 50], [22, 95, 24]],
    cell: (c) => {
      if (c.role === "slit") return;
      if (c.d < 2) return "#fffbe0";
      if (c.interior && (c.u + c.v) % 4 === 0) return "#ffe066";
      if (c.interior && c.u === c.v) return "#ff9f1a";
    },
  },
  moonlit: {
    hue: 222, hueShift: -10, sat: 0.35, lightAdd: 6, shape: LEAVES_EXTRA.moonlit,
    face: [88, 74], faceSat: [28, 22],
    roles: { shine: [220, 40, 99], rim: [222, 30, 92] },
    side: [[220, 22, 56], [226, 30, 22]],
    cell: (c) => {
      if (!c.interior) return;
      const h = hash(c.x, c.y);
      if (h % 7 === 0 && c.d > 4) return shade(c.base, -14);
      if (c.d < 2.5) return "#ffffff";
      if (h % 19 === 0) return "#ffffff";
    },
  },
  tidal: {
    hue: 192, hueShift: 10, sat: 0.95, lightAdd: 2, shape: LEAVES_EXTRA.tidal,
    side: [[196, 70, 46], [206, 85, 18]],
    cell: (c) => {
      if (!c.interior) return;
      if ((c.x + (c.y >> 1)) % 4 === 0) return "#c9fbff";
      if (hash(c.x, c.y) % 23 === 0) return "#ffffff";
      if (c.y > 14 && (c.x + c.y) % 3 === 0) return shade(c.base, -12);
    },
  },
  inferno: {
    hue: 16, hueShift: -6, sat: 1.05, lightAdd: 2, shape: LEAVES_EXTRA.inferno,
    face: [60, 42], faceSat: [100, 90],
    roles: { shine: [48, 100, 92], rim: [40, 100, 78] },
    side: [[18, 90, 42], [8, 90, 16]],
    cell: (c) => {
      if (c.role === "slit") return;
      if (c.y <= 7 && c.interior && hash(c.x, c.y) % 2 === 0) return "#ffe98a";
      if (c.y >= 15) return "#c0351c";
      if (c.interior && c.u === c.v && c.d > 3) return "#ffb13d";
    },
  },
  glacier: {
    hue: 205, hueShift: 10, sat: 0.85, lightAdd: 8, shape: LEAVES_EXTRA.glacier,
    face: [72, 56], faceSat: [72, 70],
    roles: { shine: [200, 100, 98], rim: [200, 90, 90] },
    side: [[210, 62, 52], [222, 70, 22]],
    cell: (c) => {
      if (!c.interior) return;
      if ((c.x * c.y) % 11 === 0 || (c.x - c.y) % 13 === 0) return "#eafcff";
      if (hash(c.x, c.y) % 9 === 0) return shade(c.base, 6);
    },
  },
  sakura: {
    hue: 330, hueShift: 8, sat: 0.9, lightAdd: 8, shape: LEAVES_EXTRA.sakura,
    face: [78, 62], faceSat: [70, 60],
    roles: { shine: [330, 100, 97], rim: [330, 90, 88] },
    side: [[334, 62, 58], [330, 60, 26]],
    cell: (c) => {
      if (c.role === "slit") return;
      if (c.interior && c.u === c.v) return "#fff0f6";
      if (c.interior && hash(c.x, c.y) % 13 === 0) return "#ff9ac8";
    },
  },
  thunder: {
    hue: 56, hueShift: 6, sat: 1.05, lightAdd: 4, shape: LEAVES_EXTRA.thunder,
    face: [70, 56], faceSat: [100, 95],
    roles: { shine: [60, 100, 98], rim: [56, 100, 86] },
    side: [[50, 95, 46], [40, 90, 20]],
    cell: (c) => {
      if (c.role === "slit") return;
      if (c.interior && (c.x * 2 + c.y) % 9 === 0) return "#fffbe0";
      if (c.interior && (c.x * 2 + c.y) % 9 === 1) return "#fff36b";
    },
  },
  verdant: {
    hue: 118, hueShift: 14, sat: 0.9, lightAdd: 2, shape: LEAVES_EXTRA.verdant,
    side: [[124, 60, 40], [130, 70, 16]],
    cell: (c) => {
      if (!c.interior) return;
      if (Math.abs(c.u - c.v) === 2 && c.u + c.v > 5) return "#b8ff9a";
      if (c.u === c.v && c.u > 3) return shade(c.base, 10);
    },
  },
  obsidian: {
    hue: 268, hueShift: -8, sat: 0.7, lightAdd: -22, shape: LEAVES_EXTRA.obsidian,
    face: [30, 16], faceSat: [60, 55],
    roles: { shine: [270, 80, 74], rim: [268, 70, 56] },
    side: [[262, 40, 20], [262, 50, 5]],
    cell: (c) => {
      if (c.role === "slit" || !c.interior) return;
      if (c.u > c.v) return shade(c.base, 7);
      if (hash(c.x, c.y) % 19 === 0) return "#d8c4ff";
    },
  },
  celestial: {
    hue: 236, hueShift: 6, sat: 0.9, lightAdd: -6, shape: LEAVES_EXTRA.celestial,
    face: [46, 26], faceSat: [70, 70],
    roles: { shine: [230, 100, 92], rim: [232, 95, 80] },
    side: [[236, 50, 34], [240, 60, 12]],
    cell: (c) => {
      if (!c.interior) return;
      if (c.d < 1.5) return "#ffffff";
      const h = hash(c.x, c.y);
      if (h % 9 === 0) return "#ffffff";
      if (h % 13 === 1) return "#9fb8ff";
    },
  },
  chrono: {
    hue: 34, hueShift: 10, sat: 0.8, lightAdd: 0, shape: LEAVES_EXTRA.chrono,
    face: [58, 40], faceSat: [70, 60],
    roles: { shine: [40, 90, 96], rim: [38, 80, 80] },
    side: [[30, 60, 40], [26, 60, 14]],
    cell: (c) => {
      if (c.role === "slit") return;
      if (c.d > 4.2 && c.d < 4.9) return "#fff1cf";
      if (c.d < 1.8) return "#5a3a10";
      if (c.interior && (c.u + c.v) % 5 === 0) return shade(c.base, -10);
    },
  },
  infinite: {
    hue: 290, hueShift: 16, sat: 1, lightAdd: 6, shape: LEAVES_EXTRA.infinite,
    face: [70, 50], faceSat: [95, 90],
    roles: { shine: [50, 100, 97], rim: [46, 100, 84] },
    side: [[300, 80, 48], [330, 85, 20]],
    cell: (c) => {
      if (c.role === "slit" || !c.interior) return;
      // lemniscate of Bernoulli: a figure-eight traced across every leaf
      const f = (c.dx * c.dx + c.dy * c.dy) ** 2 - 16 * (c.dx * c.dx - c.dy * c.dy);
      if (Math.abs(f) < 40) return "#ffffff";
    },
  },
};

/* Leaf-local helpers. Every leaf is mirrored into u,v >= 0, so these motifs stay
   perfectly symmetric. (5.5, 5.5) sits on the midrib, roughly mid-leaf. */
const leafR = (c: StaticCell, cu = 5.5, cv = 5.5) => Math.hypot(c.u - cu, c.v - cv);
const diamond = (c: StaticCell, cu: number, cv: number) => Math.abs(c.u - cu) + Math.abs(c.v - cv);
/** Sign-aware "upper-left of a motif" test, so highlights always face the global light. */
const litSide = (c: StaticCell, cu: number, cv: number) =>
  Math.sign(c.dx) * (c.u - cu) + Math.sign(c.dy) * (c.v - cv) < 0;

/** Leaf-local contours retain the four-leaf hub but no longer share one outer stamp. */
function sculpt(points: Array<[number, number]>): LeafShape {
  return (u, v) => {
    if (u + v <= 3) return true;
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i], [xj, yj] = points[j];
      if ((yi > v) !== (yj > v) && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
}

const SCULPTED_LEAVES: Record<string, LeafShape> = {
  dewdrop: sculpt([[0, 0], [4, 1], [8, 2], [11.5, 5], [10, 9], [6, 11.5], [2, 8], [1, 4]]),
  copper: (u, v) => (u + v <= 4 || (u <= 10.5 && v <= 10.5 && u + v <= 17 && u + v >= 5)) && !((u - 6) ** 2 + (v - 6) ** 2 < 3),
  honey: sculpt([[0, 0], [5, 0], [10.5, 3], [10.5, 8], [7, 11], [3, 10.5], [0, 5]]),
  lotus: (u, v) => u + v <= 3 || ((u + v - 11) / 9.5) ** 2 + ((u - v) / 5.5) ** 2 <= 1,
  amethyst: (u, v) => u + v <= 3 || (u <= 10.5 && v <= 10.5 && u + v <= 16 && u + v >= 4 && !((u - 6) ** 2 + (v - 6) ** 2 < 3.5)),
  venom: sculpt([[0, 0], [5, 0], [5, 2], [9, 2], [8, 4], [11, 5], [8, 7], [9, 10], [6, 9], [4, 11], [3, 8], [1, 6]]),
  tempest: sculpt([[0, 0], [6, 0], [11, 2], [8, 4], [11, 5], [9, 8], [5, 11], [6, 7], [3, 9], [1, 5]]),
  bloodmoon: (u, v) => u + v <= 3 || ((u - 5.8) / 5.3) ** 2 + ((v - 5.8) / 5.3) ** 2 <= 1,
  starfall: sculpt([[0, 0], [5, 1], [10, 0], [8, 4], [11, 7], [7, 7], [6, 11], [3, 8], [3, 5], [0, 5]]),
  moss: (u, v) => u + v <= 3 || (u - 5) ** 2 + (v - 5) ** 2 <= 23 || (u - 8) ** 2 + (v - 3) ** 2 <= 6 || (u - 3) ** 2 + (v - 8) ** 2 <= 6,
  marigold: (u, v) => u + v <= 3 || (u - 5.5) ** 2 + (v - 5.5) ** 2 <= 20 || (u - 9) ** 2 + (v - 5) ** 2 <= 6 || (u - 5) ** 2 + (v - 9) ** 2 <= 6,
  coral: (u, v) => u + v <= 4 || (Math.abs(u - v) <= 1.5 && u + v <= 18) || (u >= 3 && u <= 5 && v >= 3 && v <= 10) || (v >= 4 && v <= 6 && u >= 3 && u <= 11),
  sapphire: sculpt([[0, 0], [6, 0], [10.5, 4], [10.5, 8.5], [7, 11], [3, 9], [1, 6]]),
  phantom: sculpt([[0, 0], [5, 0], [9, 2], [11, 6], [10, 9], [8, 7], [7, 11], [5, 8], [3, 10], [2, 6]]),
  rift: (() => {
    const plate = sculpt([[0, 0], [5, 0], [7, 2], [11, 3], [8, 5], [11, 7], [9, 8], [7, 11], [5, 8], [3, 11], [2, 7], [0, 5]]);
    return (u, v) => plate(u, v) && !(Math.abs(u - v - (v > 5 ? 1 : -1)) < 1.2 && u + v > 8);
  })(),
  stormglass: sculpt([[0, 0], [5, 1], [10, 2], [9, 5], [11, 7], [8, 10], [5, 9], [3, 11], [1, 6]]),
  crownfire: sculpt([[0, 0], [5, 1], [6, 4], [10, 1], [9, 6], [11, 6], [8, 10], [6, 9], [5, 11], [2, 6]]),
  eventide: sculpt([[0, 0], [4, 0], [4, 2], [8, 2], [11, 5], [11, 8], [8, 11], [5, 11], [2, 8], [2, 4], [0, 4]]),
  firefly: (u, v) => u + v <= 3 || ((u - 4.7) / 3.7) ** 2 + ((v - 5.6) / 5.8) ** 2 <= 1,
  fern: (u, v) => {
    const along = u + v;
    if (along <= 4) return true;
    if (along > 20) return false;
    const widths = [2, 4, 2, 6, 4, 7, 3, 6, 4, 5, 2, 4, 2, 3, 1, 2, 0];
    return Math.abs(u - v) <= widths[Math.floor(along - 4)];
  },
  sunstone: sculpt([[0, 0], [5, 0], [9, 2], [11, 6], [9, 10], [6, 11], [2, 9], [0, 5]]),
  bellflower: sculpt([[0, 0], [4, 1], [5, 3], [8, 3], [10, 5], [11, 8], [9, 10], [7, 9], [6, 11], [5, 9], [3, 9], [3, 6], [1, 4]]),
  garnet: (u, v) => u + v <= 3 || ((u + v - 11.5) / 9.7) ** 2 + ((u - v) / 4.4) ** 2 <= 1,
  mirage: sculpt([[0, 0], [5, 0], [9, 2], [11, 5], [8, 5], [10, 8], [6, 11], [3, 9], [4, 6], [1, 5]]),
  paradox: (u, v) => u + v <= 3 || (u >= 2 && u <= 10 && v >= 2 && v <= 10 && !(u >= 5 && u <= 7 && v >= 5 && v <= 7)),
  wildfire: (u, v) => u + v <= 3 || (u + v <= 17 && (u - 5.6) ** 2 + (v - 5.6) ** 2 <= 29 && !((u - 8) ** 2 + (v - 4) ** 2 < 6)),
  archangel: sculpt([[0, 0], [4, 1], [8, 1], [10, 3], [7, 5], [10, 5], [8, 7], [10, 7], [7, 10], [5, 8], [3, 10], [1, 6]]),
  null: (u, v) => u + v <= 2 || (((u - 5.3) ** 2 + (v - 5.3) ** 2 <= 28) && ((u - 5.3) ** 2 + (v - 5.3) ** 2 >= 11) && !(u === 9 && v <= 5)),
};

const STYLES_NEW: Record<string, Style> = {
  // Clear aqua leaves, each holding one glassy dewdrop on the midrib.
  dewdrop: {
    hue: 176, hueShift: 14, lightAdd: 4, shape: SCULPTED_LEAVES.dewdrop,
    face: [74, 50], faceSat: [62, 74],
    roles: { shine: [168, 70, 98], rim: [172, 72, 88], slit: [190, 70, 24] },
    side: [[182, 62, 44], [198, 70, 18]],
    cell: (c) => {
      if (c.d < 1.4) return "#f2fffb";
      if (!c.interior) return;
      const r = leafR(c, 6.5, 6.5);
      if (r <= 2.6) {
        if (r > 1.9) return "#218d9c";
        return litSide(c, 6.5, 6.5) ? "#ffffff" : r < 1 ? "#b4fff6" : "#5ed5e5";
      }
      if (c.u === c.v && c.u < 5) return "#c9f5d7";
      if ((c.u === 3 && c.v === 8) || (c.u === 8 && c.v === 3)) return "#effff7";

    },
  },
  // Polished copper plate with an engraved diamond, rivets and a clean patina rim.
  copper: {
    hue: 22, hueShift: 12, shape: SCULPTED_LEAVES.copper,
    face: [62, 40], faceSat: [72, 80],
    roles: { shine: [30, 92, 94], rim: [26, 86, 74], slit: [12, 64, 18] },
    side: [[20, 74, 40], [10, 66, 15]],
    cell: (c) => {
      if (c.d < 1.4) return "#bff3dd";
      if (!c.interior) return;
      const r = leafR(c, 6, 6);
      if (r < 3.2) return litSide(c, 6, 6) ? "#ffd6a6" : "#7f432c";
      if (c.u + c.v >= 14) return "#448c7e";
      if ((c.u === 8 && c.v === 3) || (c.u === 3 && c.v === 8)) return "#fff0d4";
      if (c.u === 3 || c.v === 3) return "#c87548";

    },
  },
  // Gold honeycomb: crisp amber cell walls with a lit bead in every cell.
  honey: {
    hue: 40, hueShift: 12, lightAdd: 4, shape: SCULPTED_LEAVES.honey,
    face: [66, 50], faceSat: [98, 100],
    roles: { shine: [50, 100, 97], rim: [45, 100, 82], slit: [24, 92, 26] },
    side: [[34, 96, 46], [22, 92, 20]],
    cell: (c) => {
      if (c.role === "slit") return;
      if (c.d < 1.6) return "#fff7d9";
      if (!c.interior) return;
      const row = Math.floor(c.v / 3);
      const lx = (c.u + (row % 2) * 2) % 4;
      const ly = c.v % 3;
      if (lx === 0 || ly === 0) return "#b8670f";
      if (lx === 1 && ly === 1) return "#fff2b3";
      if (lx === 3 && ly === 2) return "#e8930f";
    },
  },
  // Layered pink petals with white tips around a glowing jade heart.
  lotus: {
    hue: 326, hueShift: 18, lightAdd: 4, shape: SCULPTED_LEAVES.lotus,
    face: [80, 60], faceSat: [70, 82],
    roles: { shine: [330, 90, 98], rim: [326, 88, 88], slit: [160, 60, 24] },
    side: [[326, 66, 54], [312, 66, 24]],
    cell: (c) => {
      if (c.d < 1.2) return "#e4fff0";
      if (c.d < 2.5) return "#3fbf95";
      if (c.role === "slit" || !c.interior) return;
      if (c.u + c.v >= 12.5) return "#fff0f7";
      if (c.u === c.v) return "#fff4fa";
      const m = Math.max(c.u, c.v);
      if (m === 4 || m === 7) return "#d4579b";
      if (m === 5 || m === 8) return "#ffc6e1";
    },
  },
  // A split geode: dark crust, bright faceted crystal core.
  amethyst: {
    hue: 268, hueShift: -14, shape: SCULPTED_LEAVES.amethyst,
    face: [64, 42], faceSat: [76, 84],
    roles: { shine: [262, 96, 98], rim: [266, 90, 84], slit: [274, 74, 18] },
    side: [[266, 66, 44], [276, 74, 18]],
    cell: (c) => {
      if (c.d < 1.4) return "#f6efff";
      if (!c.interior) return;
      const r = leafR(c, 6, 6);
      if (r < 3) return c.u > c.v ? "#eadfff" : "#7e49c4";
      if (r < 4.5) return (c.u + c.v) % 3 === 0 ? "#dcc2ff" : "#a576e9";
      if (c.u + c.v >= 13) return "#412451";
      if (c.u > c.v && c.u < 5) return "#c2a0f8";

    },
  },
  // Near-black leaves with glowing toxic veins and two acid drops.
  venom: {
    hue: 112, hueShift: -18, lightAdd: -22,
    shape: SCULPTED_LEAVES.venom,
    face: [26, 12], faceSat: [52, 62],
    roles: { shine: [82, 100, 86], rim: [90, 90, 56], slit: [100, 82, 8] },
    side: [[104, 62, 22], [126, 66, 6]],
    cell: (c) => {
      if (c.d < 1.6) return "#efffb8";
      if (c.role === "slit" || !c.interior) return;
      if (c.u === c.v) return "#d6ff5c";
      if (Math.abs(c.u - c.v) === 1 && c.d > 2.5) return "#3e6b1c";
      const along = c.u + c.v;
      if ((along === 7 || along === 11) && Math.abs(c.u - c.v) <= 4) return "#9fe63c";
      if ((c.u === 9 && c.v === 4) || (c.u === 4 && c.v === 9)) return "#f0ffad";
      if ((c.u === 9 && c.v === 5) || (c.u === 5 && c.v === 9)) return "#6bb02a";
    },
  },
  // Storm-blue leaves split by a white lightning zigzag and wind curls.
  tempest: {
    hue: 212, hueShift: 12, shape: SCULPTED_LEAVES.tempest,
    face: [56, 30], faceSat: [64, 76],
    roles: { shine: [188, 94, 98], rim: [196, 88, 84], slit: [224, 76, 20] },
    side: [[212, 64, 38], [228, 68, 13]],
    cell: (c) => {
      if (c.d < 1.6) return "#ffffff";
      if (c.role === "slit" || !c.interior) return;
      if (c.u + c.v >= 13) return "#284a8a";
      const along = Math.floor((c.u + c.v) / 2);
      const zig = along < 2 ? 0 : along % 2 ? 1 : -1;
      const off = c.u - c.v - zig;
      if (off === 0 && along >= 1) return "#fffbd0";
      if (Math.abs(off) === 1 && along >= 2) return "#8fe8ff";
      if (Math.abs(leafR(c, 6, 6) - 3.6) < 0.5 && c.u < c.v - 1) return "#c4e6ff";
    },
  },
  // Wine-dark leaves, each holding a scarlet crescent moon in a faint halo.
  bloodmoon: {
    hue: 350, hueShift: -14, lightAdd: -16, shape: SCULPTED_LEAVES.bloodmoon,
    face: [32, 14], faceSat: [72, 76],
    roles: { shine: [346, 100, 86], rim: [350, 90, 64], slit: [338, 72, 7] },
    side: [[350, 74, 28], [330, 68, 7]],
    cell: (c) => {
      if (c.d < 1.5) return "#ffc2cb";
      if (c.role === "slit" || !c.interior) return;
      const r = leafR(c, 5.8, 5.8);
      if (r < 3.1) {
        if (leafR(c, 6.9, 4.7) < 2.5) return "#22070f";
        return litSide(c, 5.8, 5.8) ? "#ffd5cc" : r > 2.3 ? "#c8283f" : "#ff5a6e";
      }
      if (r >= 3.7 && r < 4.4) return "#6e1229";
      if ((c.u === 10 && c.v === 2) || (c.u === 2 && c.v === 10)) return "#ffe1e5";
    },
  },
  // The finest of all: ivory and gold, a gold filigree inlay, a sapphire in every leaf.
  empyrean: {
    hue: 45, hueShift: 8, lightAdd: 6, shape: (u, v) => u ** 4.2 + v ** 4.2 <= 11.2 ** 4.2,
    face: [94, 78], faceSat: [52, 62],
    roles: { shine: [48, 100, 99], rim: [44, 96, 78], slit: [36, 78, 26], innerLit: [44, 92, 64], innerShadow: [38, 80, 46] },
    side: [[40, 84, 50], [28, 80, 22]],
    cell: (c) => {
      if (c.d < 1.7) return "#ffffff";
      if (c.d >= 3.3 && c.d < 4.1) return "#f6d27a";
      if (c.role === "slit" || !c.interior) return;
      const k = diamond(c, 6.5, 6.5);
      if (k <= 2) {
        if (k === 2) return "#f4c24e";
        if (k === 0) return "#3c8fe6";
        return litSide(c, 6.5, 6.5) ? "#c4f1ff" : "#1f4f9f";
      }
      if (c.u === c.v && c.u < 5) return "#fffbe8";
      if ((c.u === 9 && c.v === 3) || (c.u === 3 && c.v === 9)) return "#fff6d6";
    },
  },
  // Starfall: midnight-blue leaves crossed by a falling-star streak.
  starfall: {
    hue: 246, hueShift: 8, shape: SCULPTED_LEAVES.starfall,
    face: [43, 28], faceSat: [76, 86],
    roles: { shine: [236, 90, 98], rim: [231, 85, 82], slit: [248, 70, 17] },
    side: [[242, 58, 38], [258, 64, 12]],
    cell: (c) => {
      if (c.d < 1.4) return "#ffffff";
      if (c.role === "slit" || !c.interior) return;
      if (Math.abs(c.u - c.v) <= 1 && c.u + c.v > 4) return c.u + c.v > 12 ? "#d8d2ff" : "#9bafff";
      if (c.u + c.v === 9 || c.u + c.v === 14) return "#e8e3ff";
      if ((c.u === 3 && c.v === 8) || (c.u === 8 && c.v === 3)) return "#ffedbd";
      if (c.u + c.v > 12) return "#303d83";
    },
  },
  // Moss: velvet fern-green with distinct cushions and bright spores.
  moss: {
    hue: 137, hueShift: 13, shape: SCULPTED_LEAVES.moss,
    face: [48, 29], faceSat: [56, 69],
    roles: { shine: [92, 76, 91], rim: [106, 61, 70], slit: [127, 62, 16] },
    side: [[122, 47, 31], [135, 55, 12]],
    cell: (c) => {
      if (c.d < 1.4) return "#f0ffc9";
      if (c.role === "slit" || !c.interior) return;
      if (leafR(c, 4.5, 7.5) < 2.1 || leafR(c, 7.4, 4.2) < 2.1 || leafR(c, 7.6, 8.5) < 2.1)
        return c.u + c.v > 11 ? "#527b39" : litSide(c, 6, 6) ? "#b9e67c" : "#83b94d";
      if ((c.u + c.v) % 5 === 0) return "#4e7539";
      if ((c.u === 3 && c.v === 5) || (c.u === 8 && c.v === 3)) return "#fff3a6";
    },
  },
  // Marigold: saffron rosette with clean orange petal seams.
  marigold: {
    hue: 37, hueShift: 10, shape: SCULPTED_LEAVES.marigold,
    face: [70, 48], faceSat: [94, 100],
    roles: { shine: [50, 100, 98], rim: [40, 100, 80], slit: [21, 92, 24] },
    side: [[32, 94, 45], [20, 90, 19]],
    cell: (c) => {
      if (c.d < 1.3) return "#8f481e";
      if (!c.interior) return;
      const r = leafR(c, 5.5, 5.5);
      if (r < 1.6) return "#df731e";
      if (Math.abs(c.u - c.v) <= 1 || c.u === 5 || c.v === 5) return "#fff0a5";
      if (r > 3.3) return "#e48a1e";
      return litSide(c, 5.5, 5.5) ? "#ffd35b" : "#f3a22c";

    },
  },
  // Coral: branching reef fans beneath a warm peach rim.
  coral: {
    hue: 9, hueShift: 14, shape: SCULPTED_LEAVES.coral,
    face: [62, 39], faceSat: [83, 94],
    roles: { shine: [18, 100, 95], rim: [9, 94, 78], slit: [355, 66, 22] },
    side: [[5, 77, 41], [350, 68, 17]],
    cell: (c) => {
      if (c.d < 1.5) return "#ffd5bd";
      if (c.role === "slit") return "#892c44";
      if (!c.interior) return;
      if (c.u === c.v) return "#ffe4c8";
      if (c.u === 4 || c.v === 5) return litSide(c, 5, 5) ? "#ffd3ba" : "#d76d69";
      if ((c.u === 4 && c.v === 8) || (c.u === 9 && c.v === 5)) return "#fff4dd";

    },
  },
  // Sapphire: hard-cut royal-blue facets with a white specular edge.
  sapphire: {
    hue: 216, hueShift: -5, shape: SCULPTED_LEAVES.sapphire,
    face: [53, 28], faceSat: [89, 95],
    roles: { shine: [202, 100, 98], rim: [213, 91, 85], slit: [224, 79, 16] },
    side: [[214, 80, 48], [228, 86, 20]],
    cell: (c) => {
      if (c.d < 1.4) return "#bee8ff";
      if (!c.interior) return;
      const k = diamond(c, 6, 6);
      if (k === 4) return "#12377a";
      if (k === 3) return "#9fe4ff";
      if (k < 3) return litSide(c, 6, 6) ? "#c3f4ff" : c.u > c.v ? "#3b8fff" : "#2453b6";
      if (c.u + c.v >= 13) return "#163c85";
      if (c.u === 3 && c.v === 5) return "#ffffff";

    },
  },
  // Phantom: cool lavender afterimage bands and a soft ghosted midrib.
  phantom: {
    hue: 274, hueShift: -7, lightAdd: 3, shape: SCULPTED_LEAVES.phantom,
    face: [84, 68], faceSat: [30, 40],
    roles: { shine: [273, 75, 98], rim: [274, 65, 85], slit: [278, 58, 25] },
    side: [[270, 54, 47], [283, 61, 19]],
    cell: (c) => {
      if (c.d < 1.3) return "#d6bdff";
      if (!c.interior) return;
      if ((c.u === 4 || c.u === 7) && c.v === 5) return "#4c3b6d";
      if ((c.u === 4 || c.u === 7) && c.v === 6) return "#746895";
      if (c.u === 6 && c.v === 7) return "#6d5a8d";
      if (c.v >= 8) return "#b5a3d7";
      return litSide(c, 6, 6) ? "#f4eaff" : "#d6c6e7";

    },
  },
  // Rift: a dark teal shell opened by a stepped light fault.
  rift: {
    hue: 192, hueShift: -13, lightAdd: -8, shape: SCULPTED_LEAVES.rift,
    face: [35, 17], faceSat: [60, 71],
    roles: { shine: [183, 100, 92], rim: [191, 94, 68], slit: [196, 90, 17] },
    side: [[190, 74, 31], [204, 78, 9]],
    cell: (c) => {
      if (c.d < 1.4) return "#cbfff5";
      if (c.role === "innerLit") return "#8affdf";
      if (c.role === "innerShadow") return "#2c6682";
      if (!c.interior) return;
      if (c.u + c.v > 12) return "#173653";
      if (c.u - c.v > 2) return "#276a80";
      if (c.u + c.v === 8) return "#5299a9";

    },
  },
  // Stormglass: translucent aqua plates split by silver fracture seams.
  stormglass: {
    hue: 200, hueShift: 8, lightAdd: 10, shape: SCULPTED_LEAVES.stormglass,
    face: [83, 66], faceSat: [50, 68],
    roles: { shine: [193, 100, 99], rim: [197, 91, 91], slit: [212, 72, 27] },
    side: [[200, 64, 51], [214, 70, 19]],
    cell: (c) => {
      if (c.d < 1.5) return "#ffffff";
      if (!c.interior) return;
      if (c.u + c.v === 11) return "#528fa5";
      if (c.u === 4 && c.v >= 4 && c.v <= 8) return "#ffffff";
      if (c.u === 7 && c.v >= 3 && c.v <= 6) return "#dffffc";
      if (c.u > c.v + 2) return "#80bacf";
      if (c.u < c.v - 2) return "#c2f7ed";

    },
  },
  // Crownfire: white-gold flame tongues over a deep ember core.
  crownfire: {
    hue: 15, hueShift: -7, shape: SCULPTED_LEAVES.crownfire,
    face: [32, 19], faceSat: [50, 67],
    roles: { shine: [49, 100, 99], rim: [35, 100, 77], slit: [4, 90, 19] },
    side: [[323, 54, 27], [338, 70, 11]],
    cell: (c) => {
      if (c.d < 1.5) return "#ffecb6";
      if (!c.interior) return;
      if (c.v === 7 && c.u >= 3 && c.u <= 8) return "#f5bb41";
      if (c.v >= 4 && c.v < 7 && (c.u === 3 || c.u === 5 || c.u === 8)) return "#fff4c5";
      if (c.v === 8 && c.u >= 4 && c.u <= 7) return "#a8432e";
      if (c.u + c.v > 12) return "#e78f29";
      return "#45233a";

    },
  },
  // Eventide: layered violet dusk, a coral horizon, and the first stars.
  eventide: {
    hue: 277, hueShift: -4, shape: SCULPTED_LEAVES.eventide,
    face: [55, 32], faceSat: [63, 76],
    roles: { shine: [280, 84, 96], rim: [284, 76, 80], slit: [263, 62, 19] },
    side: [[280, 64, 42], [292, 72, 16]],
    cell: (c) => {
      if (c.d < 1.4) return "#ffedc5";
      if (!c.interior) return;
      if ((c.x === 5 && c.y === 5) || (c.x === 17 && c.y === 5) || (c.x === 8 && c.y === 3)) return "#fff7df";
      if (c.y < 7) return "#303b73";
      if (c.y < 10) return "#6a529d";
      if (c.y === 10 || c.y === 11) return "#ffbf9d";
      if (c.y < 15) return "#ce78a7";
      if (c.y === 16 && c.x % 3 !== 0) return "#f8b6c4";
      return "#725c98";

    },
  },
  firefly: {
    hue: 92, hueShift: 12, shape: SCULPTED_LEAVES.firefly,
    face: [36, 22], faceSat: [43, 59],
    roles: { shine: [78, 100, 97], rim: [83, 91, 79], slit: [118, 66, 18] },
    side: [[92, 66, 41], [111, 64, 17]],
    cell: (c) => {
      if (c.d < 1.4) return "#f8f6c5";
      if (!c.interior) return;
      const lamp = ((c.u - 5) / 1.8) ** 2 + ((c.v - 7) / 2.8) ** 2;
      if (lamp < 1) return c.v < 6 ? "#ffffdc" : c.v === 7 ? "#e8ee6d" : "#9cba39";
      if (c.u === 5 && c.v < 5) return "#bcba65";
      if (c.u >= 7) return "#334f33";
      return "#59793c";

    },
  },
  fern: {
    hue: 146, hueShift: 12, shape: SCULPTED_LEAVES.fern,
    face: [53, 32], faceSat: [65, 77],
    roles: { shine: [133, 75, 92], rim: [139, 67, 75], slit: [150, 68, 15] },
    side: [[137, 55, 34], [149, 60, 13]],
    cell: (c) => {
      if (c.d < 1.2) return "#e0efbb";
      if (c.role === "slit") return "#214c43";
      if (c.u === c.v) return "#e6e8a3";
      if (!c.interior) return;
      if (c.u > c.v) return (c.u + c.v) % 4 < 2 ? "#56b48d" : "#2e7d66";
      return (c.u + c.v) % 4 < 2 ? "#9bd78a" : "#559b6c";

    },
  },
  sunstone: {
    hue: 29, hueShift: 8, shape: SCULPTED_LEAVES.sunstone,
    face: [69, 46], faceSat: [82, 91],
    roles: { shine: [39, 100, 98], rim: [31, 92, 83], slit: [20, 82, 25] },
    side: [[27, 86, 47], [17, 75, 20]],
    cell: (c) => {
      if (c.d < 1.3) return "#ffc277";
      if (!c.interior) return;
      const r = leafR(c, 6, 6);
      if (r < 1.5) return "#fff8d5";
      if (r < 2.7) return "#f7aa42";
      if ((c.u === 6 || c.v === 6) && r < 4.2) return "#ffe39a";
      if (r < 3.7) return "#a15b35";
      if (c.u + c.v > 13) return "#a96340";
      return "#d58e61";

    },
  },
  bellflower: {
    hue: 290, hueShift: -7, shape: SCULPTED_LEAVES.bellflower,
    face: [63, 45], faceSat: [62, 76],
    roles: { shine: [286, 78, 97], rim: [288, 68, 82], slit: [279, 60, 22] },
    side: [[286, 58, 44], [298, 62, 18]],
    cell: (c) => {
      if (c.d < 1.4) return "#a7dfba";
      if (!c.interior) return;
      if (c.v === 8 && (c.u === 4 || c.u === 6 || c.u === 8)) return "#ffe6a1";
      if (c.v >= 8) return "#ddd5f3";
      if (c.u === 4 || c.u === 7) return "#9982d0";
      return c.u < 5 ? "#d9bff5" : "#b09adb";

    },
  },
  garnet: {
    hue: 344, hueShift: -8, shape: SCULPTED_LEAVES.garnet,
    face: [53, 28], faceSat: [78, 86],
    roles: { shine: [348, 100, 94], rim: [37, 70, 66], slit: [344, 75, 17] },
    side: [[346, 75, 42], [332, 76, 16]],
    cell: (c) => {
      if (c.d < 1.4) return "#ffd5a0";
      if (!c.interior) return;
      const jewel = ((c.u + c.v - 12) / 5.5) ** 2 + ((c.u - c.v) / 2.7) ** 2;
      if (jewel > 1) return "#602536";
      if (jewel > .6) return "#bc8e55";
      if (litSide(c, 6, 6)) return c.u === c.v ? "#ffb4bc" : "#cf485c";
      return c.u > c.v ? "#8f173d" : "#ac294d";

    },
  },
  mirage: {
    hue: 185, hueShift: 4, lightAdd: 6, shape: SCULPTED_LEAVES.mirage,
    face: [75, 56], faceSat: [48, 62],
    roles: { shine: [175, 65, 98], rim: [183, 59, 86], slit: [194, 64, 23] },
    side: [[183, 50, 44], [202, 58, 17]],
    cell: (c) => {
      if (c.d < 1.4) return "#fff9df";
      if (!c.interior) return;
      const horizon = Math.round(10 + Math.sin(c.x * .52) * 1.2);
      if (Math.abs(c.y - horizon) < 1) return "#fff4c7";
      if (c.y < horizon) return c.y % 4 === 0 ? "#a9dfd4" : "#64aead";
      if (c.y === horizon + 3) return "#a78062";
      return c.y % 4 < 2 ? "#e5bd86" : "#d49b71";

    },
  },
  paradox: {
    hue: 321, hueShift: 0, shape: SCULPTED_LEAVES.paradox,
    face: [53, 34], faceSat: [72, 80],
    roles: { shine: [184, 100, 96], rim: [312, 90, 80], slit: [265, 70, 14] },
    side: [[188, 72, 43], [290, 70, 17]],
    cell: (c) => {
      if (c.d < 1.4) return "#ffffff";
      if (c.role === "slit") return "#6859a0";
      if (!c.interior) return;
      const cyan = c.q === 0 || c.q === 3;
      if (c.u <= 4 || c.v >= 8) return cyan ? "#9befe1" : "#e7a6d8";
      if (c.v <= 4 || c.u >= 8) return cyan ? "#438caa" : "#984b92";
      return cyan ? "#d2fff3" : "#ffd3f3";

    },
  },
  wildfire: {
    hue: 11, hueShift: -4, shape: SCULPTED_LEAVES.wildfire,
    face: [45, 24], faceSat: [96, 100],
    roles: { shine: [45, 100, 97], rim: [24, 100, 74], slit: [3, 92, 11] },
    side: [[12, 92, 34], [3, 90, 10]],
    cell: (c) => {
      if (c.d < 1.4) return "#ffc776";
      if (!c.interior) return;
      const ring = leafR(c, 6, 6);
      if (ring < 1.8) return "#362029";
      if (ring < 3.2) return c.u < c.v ? "#ffdd83" : "#e97c2c";
      if (c.u + c.v > 12) return "#6d2833";
      if (c.u === 4 || c.v === 8) return "#f7b74b";
      return "#d3513b";

    },
  },
  archangel: {
    hue: 204, hueShift: 3, lightAdd: 10, shape: SCULPTED_LEAVES.archangel,
    face: [86, 70], faceSat: [32, 44],
    roles: { shine: [47, 86, 99], rim: [199, 62, 91], slit: [211, 50, 27] },
    side: [[202, 42, 55], [219, 51, 26]],
    cell: (c) => {
      if (c.d < 1.4) return "#8bc5e9";
      if (!c.interior) return;
      if (c.u === c.v && c.u < 5) return "#d8b66e";
      if (c.u + c.v === 8 || c.u + c.v === 13) return "#7299bd";
      if (Math.abs(c.u - c.v) === 2) return "#fff9df";
      return litSide(c, 6, 6) ? "#f4fcff" : "#bbdbe8";

    },
  },
  null: {
    hue: 273, hueShift: -8, lightAdd: -28, shape: SCULPTED_LEAVES.null,
    face: [13, 5], faceSat: [32, 42],
    roles: { shine: [284, 76, 65], rim: [278, 32, 46], slit: [277, 80, 8] },
    side: [[268, 55, 20], [291, 58, 5]],
    cell: (c) => {
      if (c.d < 1.4) return "#f9edff";
      if (c.role === "slit") return "#12101d";
      if (!c.interior) return;
      if ((c.u === 3 && c.v === 7) || (c.u === 7 && c.v === 3)) return "#ac95c9";
      return "#17111f";

    },
  },
};

const STYLES: Record<string, Style> = { ...BASE_STYLES, ...STYLES_EXTRA, ...STYLES_NEW };

const CRYSTAL_SIDE: [HSL, HSL] = [[196, 70, 70], [222, 60, 30]];

function crystalFacet(c: StaticCell): CellColor {
  if (c.role === "slit") return "#dff8ff";
  if (c.role === "shine") return "#ffffff";
  if (c.role === "rim") return "#f1fdff";
  if (c.interior && c.u === c.v) return "#ffffff";
  if (c.interior && Math.abs(c.u - c.v) === 4 && c.u + c.v <= 18) return "#eafbff";
  if (c.interior && c.u === 7 && c.v === 7) return "#ffffff";
  return undefined;
}

function crystallize(ctx: CanvasRenderingContext2D, S: number, cells: StaticCell[]) {
  for (const c of cells) {
    const t = (c.x + c.y) / ((GRID - 1) * 2);
    const facet = crystalFacet(c);
    if (facet) {
      ctx.fillStyle = css(facet);
      ctx.globalAlpha = c.role === "slit" ? 0.85 : 0.92;
      ctx.fillRect(c.x * S, c.y * S, S, S);
      ctx.globalAlpha = 1;
      continue;
    }
    const light = lerp(0.52, 0.22, t);
    ctx.globalAlpha = light;
    ctx.fillStyle = t < 0.5 ? "#c9f4ff" : "#4f8fe8";
    ctx.fillRect(c.x * S, c.y * S, S, S);
    if ((c.x + c.y) % 4 === 0) {
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(c.x * S, c.y * S, S, S);
    }
    ctx.globalAlpha = 1;
  }
  for (const c of cells) {
    const d = c.x + c.y;
    if ((d >= 9 && d <= 11) || d === 14) {
      ctx.globalAlpha = d === 14 ? 0.28 : 0.5;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(c.x * S, c.y * S, S, S);
    }
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ */
/*  Cursed pass                                                        */
/*  Lacquered black-violet body, crimson veins down every leaf, a      */
/*  glowing heart and red seam-light. Painted opaque over the tier.    */
/* ------------------------------------------------------------------ */

const CURSED_SIDE: [HSL, HSL] = [[346, 72, 30], [300, 55, 5]];

function cursedColor(c: StaticCell): string {
  // glowing heart where the four leaves meet
  if (c.u === 0 && c.v === 0) return "#ffe1e8";
  if (c.u + c.v <= 1) return "#ff5c7c";
  if (c.u <= 1 && c.v <= 1) return "#e8204a";
  if (c.role === "slit") return "#ff2d55";
  if (c.role === "shine") return "#ffc2cf";
  if (c.role === "rim") return c.x + c.y < GRID ? "#ff4d6d" : "#a3123a";
  if (c.role === "ul" || c.role === "ur") return "#6e1a40";
  if (c.role === "dl" || c.role === "dr" || c.role === "right" || c.role === "down") return "#1b0613";
  if (c.interior) {
    // midrib vein down the centre of each leaf, with two side veins
    if (c.u === c.v) return c.u <= 4 ? "#ff3d63" : "#c01844";
    if (Math.abs(c.u - c.v) === 3 && c.u + c.v >= 7 && c.u + c.v <= 15) return "#7d0f30";
  }
  if (c.role === "innerLit") return "#4b1234";
  if (c.role === "innerShadow") return "#0f030a";
  // lacquer: deep violet top-left falling to near-black bottom-right
  const t = (c.x + c.y) / ((GRID - 1) * 2);
  const r = Math.round(lerp(0x3a, 0x0d, t));
  const g = Math.round(lerp(0x10, 0x03, t));
  const b = Math.round(lerp(0x30, 0x0b, t));
  return `rgb(${r}, ${g}, ${b})`;
}

function curse(ctx: CanvasRenderingContext2D, S: number, cells: StaticCell[]) {
  for (const c of cells) {
    ctx.fillStyle = cursedColor(c);
    ctx.fillRect(c.x * S, c.y * S, S, S);
  }
  // one clean lacquer sheen across the upper-left of every leaf
  ctx.fillStyle = "#ffffff";
  for (const c of cells) {
    const d = c.x + c.y;
    if (c.interior && c.u !== c.v && (d === 7 || d === 8)) {
      ctx.globalAlpha = d === 7 ? 0.2 : 0.11;
      ctx.fillRect(c.x * S, c.y * S, S, S);
    }
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ */
/*  Glitched pass                                                      */
/*  The tier's own art is re-lit as a holographic duotone (luminance    */
/*  mapped to an indigo -> cyan -> white ramp), so every silhouette and */
/*  engraving still reads. CRT scanlines, magenta edge-light, sparse     */
/*  dead pixels, clean tear slices and RGB fringes do the rest.         */
/* ------------------------------------------------------------------ */

const GLITCHED_SIDE: [HSL, HSL] = [[266, 70, 34], [300, 78, 12]];
const GLITCH_RAMP: Array<[number, [number, number, number]]> = [
  [0, [16, 10, 46]], [0.22, [52, 24, 122]], [0.42, [40, 92, 220]],
  [0.62, [44, 210, 240]], [0.82, [168, 255, 244]], [1, [255, 255, 255]],
];

function rampColor(t: number): string {
  const x = clamp(t, 0, 1);
  for (let i = 1; i < GLITCH_RAMP.length; i++) {
    const [p1, c1] = GLITCH_RAMP[i];
    if (x <= p1) {
      const [p0, c0] = GLITCH_RAMP[i - 1];
      const f = (x - p0) / (p1 - p0);
      return `rgb(${Math.round(lerp(c0[0], c1[0], f))},${Math.round(lerp(c0[1], c1[1], f))},${Math.round(lerp(c0[2], c1[2], f))})`;
    }
  }
  return "#ffffff";
}

function glitch(ctx: CanvasRenderingContext2D, S: number, cells: StaticCell[], ox: number, oy: number) {
  const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
  const width = ctx.canvas.width;
  const half = Math.floor(S / 2);
  const lumOf = (c: StaticCell) => {
    const i = ((oy + c.y * S + half) * width + ox + c.x * S + half) * 4;
    return (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
  };
  // Normalise each tier's own brightness range, so pale and dark clovers glitch equally vividly.
  let lo = 1, hi = 0;
  for (const c of cells) if (c.interior) { const l = lumOf(c); lo = Math.min(lo, l); hi = Math.max(hi, l); }
  const span = Math.max(0.12, hi - lo);
  for (const c of cells) {
    const lum = clamp((lumOf(c) - lo) / span, 0, 1);
    let color: string;
    if (c.d < 1.4) color = "#ffffff";
    else if (c.role === "shine") color = "#f2ffff";
    else if (c.role === "rim") color = "#8ffcff";
    // Lower-right edges catch a magenta key light: a built-in RGB split.
    else if (c.role === "right" || c.role === "down" || c.role === "dr") color = "#ff4fd8";
    else if (c.role === "slit") color = "#2a1a6e";
    else color = rampColor(0.14 + lum * 0.74);
    ctx.fillStyle = color;
    ctx.fillRect(c.x * S, c.y * S, S, S);
    if (!c.interior || c.d < 1.4) continue;
    const h = hash(c.x * 7 + 3, c.y * 5 + 11);
    if (h % 29 === 0) {
      ctx.fillStyle = "#ff5ce1";
      ctx.fillRect(c.x * S, c.y * S, S, S);
    } else if (h % 41 === 7) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(c.x * S, c.y * S, S, S);
    }
  }
  // CRT scanlines: a thin dark line under every other row of the face.
  const line = Math.max(1, Math.round(S / 4));
  ctx.fillStyle = "rgba(8, 4, 30, 0.34)";
  for (const c of cells) {
    if (c.y % 2 === 1 && c.role !== "shine") ctx.fillRect(c.x * S, c.y * S + S - line, S, line);
  }
}

function tinted(source: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = source.width; out.height = source.height;
  const c = out.getContext("2d")!;
  c.drawImage(source, 0, 0);
  c.globalCompositeOperation = "source-in";
  c.fillStyle = color;
  c.fillRect(0, 0, out.width, out.height);
  return out;
}

/** Two thin tear slices plus cyan/magenta fringes behind the whole sprite. */
function glitchFinish(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, S: number, oy: number) {
  const copy = document.createElement("canvas");
  copy.width = canvas.width; copy.height = canvas.height;
  copy.getContext("2d")!.drawImage(canvas, 0, 0);
  const shift = Math.round(S * 0.75);
  for (const [row, dir, tint] of [[7, 1, "rgba(255, 79, 216, 0.38)"], [15, -1, "rgba(60, 236, 255, 0.38)"]] as const) {
    const y = oy + row * S, h = S;
    ctx.clearRect(0, y, canvas.width, h);
    ctx.drawImage(copy, 0, y, canvas.width, h, dir * shift, y, canvas.width, h);
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = tint;
    ctx.fillRect(0, y, canvas.width, h);
    ctx.restore();
  }
  const sliced = document.createElement("canvas");
  sliced.width = canvas.width; sliced.height = canvas.height;
  sliced.getContext("2d")!.drawImage(canvas, 0, 0);
  const off = Math.max(2, Math.round(S * 0.6));
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  ctx.globalAlpha = 0.9;
  ctx.drawImage(tinted(sliced, "#2ee8ff"), -off, 0);
  ctx.drawImage(tinted(sliced, "#ff3fd6"), off, 0);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/*  Empyrean wings — stepped, feathered, gold/ivory, mirrored            */
/* ------------------------------------------------------------------ */

const EMPYREAN_WING_ROWS: Array<[number, number, number]> = [
  [2, 14, 15], [3, 11, 16], [4, 9, 16], [5, 7, 16], [6, 6, 15],
  [7, 5, 15], [8, 4, 14], [9, 4, 13], [10, 4, 13], [11, 4, 13],
  [12, 4, 14], [13, 5, 15], [14, 6, 15], [15, 7, 16], [16, 9, 16],
  [17, 11, 15], [18, 14, 14],
];

function drawEmpyreanWings(ctx: CanvasRenderingContext2D, S: number, ox: number, oy: number) {
  const pixels: Array<{ x: number; y: number; color: string }> = [];
  for (const [y, first, last] of EMPYREAN_WING_ROWS) {
    for (let offset = first; offset <= last; offset++) {
      for (const sign of [-1, 1] as const) {
        const x = CENTER + offset * sign;
        const feather = (offset + Math.floor(y / 3)) % 6;
        const color = offset <= first + 1
          ? (feather === 0 ? "#fff9e6" : "#d7b65e")
          : offset >= last - 1
            ? (feather === 2 ? "#aee7ed" : "#fffdf1")
            : feather === 0 ? "#fffdf0"
              : feather === 1 ? "#f2d894"
                : feather === 3 ? "#c5eaf0"
                  : feather === 5 ? "#fff6d7" : "#d8bb70";
        pixels.push({ x, y, color });
      }
    }
  }

  // One clean dark contour, followed by separate feather highlights.
  ctx.fillStyle = "#493718";
  for (const { x, y } of pixels) ctx.fillRect(ox + x * S - 1, oy + y * S - 1, S + 2, S + 2);
  for (const { x, y, color } of pixels) {
    ctx.fillStyle = color;
    ctx.fillRect(ox + x * S, oy + y * S, S, S);
  }

  // Long stepped quills fan from the buried shoulder out to the wing tips.
  const quills: Array<[number, number]> = [[15, 3], [16, 5], [16, 7], [15, 9], [15, 13], [16, 15], [16, 17], [15, 19]];
  const drawQuill = (side: -1 | 1, tipOffset: number, tipY: number, color: string, nudge = 0) => {
    const x0 = CENTER + side * 5;
    const x1 = CENTER + side * tipOffset;
    const count = Math.max(Math.abs(x1 - x0), Math.abs(tipY - 11)) * 3;
    ctx.fillStyle = color;
    for (let i = 0; i <= count; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / count) + nudge;
      const y = Math.round(11 + ((tipY - 11) * i) / count);
      ctx.fillRect(ox + x * S, oy + y * S, Math.max(1, S >> 1), Math.max(1, S >> 1));
    }
  };
  for (const [tipOffset, tipY] of quills) {
    for (const side of [-1, 1] as const) {
      drawQuill(side, tipOffset, tipY, "#9b752f", side === 1 ? 1 : 0);
      drawQuill(side, tipOffset, tipY, "#fff8df");
    }
  }

  // Pinprick stars outside each wingtip, visible even on an index-card sprite.
  ctx.fillStyle = "#ffffff";
  for (const [x, y] of [[-4, 5], [-5, 11], [-4, 16], [26, 5], [27, 11], [26, 16]] as Array<[number, number]>) {
    ctx.fillRect(ox + x * S, oy + y * S, Math.max(1, S >> 1), S);
    if (S >= 6) ctx.fillRect(ox + x * S - Math.max(1, S >> 2), oy + y * S + Math.floor(S / 4), S, Math.max(1, S >> 1));
  }
}

/* ------------------------------------------------------------------ */
/*  Renderer                                                           */
/* ------------------------------------------------------------------ */

function renderClover(key: string, S: number): HTMLCanvasElement {
  const crystal = key.endsWith(":crystal");
  const cursed = key.endsWith(":cursed");
  const glitched = key.endsWith(":glitched");
  const tierKey = crystal ? key.slice(0, -":crystal".length) : cursed ? key.slice(0, -":cursed".length) : glitched ? key.slice(0, -":glitched".length) : key;
  const style = STYLES[tierKey] ?? STYLES.common;
  const { cells } = cellSetFor(style);
  const dxPx = DEPTH_X * S;
  const dyPx = DEPTH_Y * S;
  const extraX = Math.ceil(dxPx);
  const extraY = Math.ceil(dyPx);
  const steps = Math.max(8, Math.ceil(Math.max(dxPx, dyPx)));
  const pad = Math.ceil(OUTLINE * S);
  const wingPad = tierKey === "empyrean" ? 6 * S : 0;
  const w = GRID * S + extraX + pad * 2 + wingPad * 2;
  const h = GRID * S + extraY + pad * 2;
  const size = Math.max(w, h) + 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  const ox = Math.round((size - w) / 2) + pad + extraX + wingPad;
  const oy = Math.round((size - h) / 2) + pad;
  const { outline, quads } = pathsFor(cellSetFor(style), S, pad);
  const at = (f: number) =>
    ctx.setTransform(1, 0, 0, 1, ox - Math.round(f * dxPx), oy + Math.round(f * dyPx));

  // Wings sit behind the intact clover silhouette and its 3D extrusion.
  if (tierKey === "empyrean") drawEmpyreanWings(ctx, S, ox, oy);

  // 1. one continuous black outline around face + extrusion
  ctx.fillStyle = "#040704";
  for (let k = 0; k <= steps; k++) {
    at(k / steps);
    ctx.fill(outline);
  }

  // 2. solid extrusion, far to near, shaded smoothly
  for (let k = steps; k >= 1; k--) {
    const f = k / steps;
    at(f);
    for (let q = 0; q < 4; q++) {
      const hue = style.rainbow ? QUAD_HUES[q] : style.hue;
      const near = crystal ? CRYSTAL_SIDE[0] : cursed ? CURSED_SIDE[0] : glitched ? GLITCHED_SIDE[0] : style.side?.[0] ?? [hue, 72, 52];
      const far = crystal ? CRYSTAL_SIDE[1] : cursed ? CURSED_SIDE[1] : glitched ? GLITCHED_SIDE[1] : style.side?.[1] ?? [hue, 88, 20];
      ctx.fillStyle = css([lerp(near[0], far[0], f), lerp(near[1], far[1], f), lerp(near[2], far[2], f)]);
      ctx.fill(quads[q]);
    }
  }

  // 3. front face: palette ramp, then the tier's own pixel pattern
  ctx.setTransform(1, 0, 0, 1, ox, oy);
  const gloss = Math.max(1, Math.round(S * 0.4) - 1);
  for (const sc of cells) {
    const cell: Cell = { ...sc, base: baseColor(style, sc) };
    const custom = style.cell?.(cell);
    ctx.fillStyle = css(custom ?? cell.base);
    ctx.fillRect(sc.x * S, sc.y * S, S, S);
    if (sc.gloss) {
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(sc.x * S, sc.y * S, S, gloss);
    }
  }

  // 4. crystal variant: glass tint, facets and highlight over the tier art
  if (crystal) crystallize(ctx, S, cells);
  // 5. cursed variant: replaces the face entirely
  if (cursed) curse(ctx, S, cells);
  if (glitched) glitch(ctx, S, cells, ox, oy);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (glitched) glitchFinish(canvas, ctx, S, oy);
  return canvas;
}

const canvases = new Map<string, HTMLCanvasElement>();
const urls = new Map<string, string>();

export function getCloverCanvas(key: string, _paint?: CloverPaint, detail = 8): HTMLCanvasElement {
  const cacheKey = `${key}:${detail}`;
  let sprite = canvases.get(cacheKey);
  if (!sprite) {
    sprite = renderClover(key, detail);
    canvases.set(cacheKey, sprite);
  }
  return sprite;
}

export function getCloverUrl(key: string, paint?: CloverPaint, detail = 8): string {
  if (supplied && key === "common") return supplied;
  const cacheKey = `${key}:${detail}`;
  let url = urls.get(cacheKey);
  if (!url) {
    url = getCloverCanvas(key, paint, detail).toDataURL("image/png");
    urls.set(cacheKey, url);
  }
  return url;
}

/** Pre-render sprites one per timer tick so the first rare reveal never stalls. */
export function warmCloverSprites(tiers: Array<{ id: string; hue: number; rainbow?: boolean }>, crystals = false, cursed = false, glitched = false): () => void {
  let stopped = false;
  let i = 0;
  let timer = 0;
  const keys = [...tiers.map((t) => t.id), ...(crystals ? tiers.map((t) => `${t.id}:crystal`) : []), ...(cursed ? tiers.map((t) => `${t.id}:cursed`) : []), ...(glitched ? tiers.map((t) => `${t.id}:glitched`) : [])];
  const next = () => {
    if (stopped || i >= keys.length) return;
    getCloverUrl(keys[i++], undefined, 8);
    timer = window.setTimeout(next, 70);
  };
  timer = window.setTimeout(next, 180);
  return () => {
    stopped = true;
    window.clearTimeout(timer);
  };
}
