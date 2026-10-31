// @ts-nocheck
/**
 * True pixel-art icons: 16x16 hand-drawn grids, a 1px black outline and a solid
 * two-tone extrusion down-left, exactly like the clover. Each sprite is 20x20
 * native pixels and is shown with image-rendering: pixelated at 20/40/60px.
 */

import { getCloverCanvas, getCloverUrl } from "../clover";

export type IconName =
  | "bag" | "book" | "auto" | "lock" | "gem" | "dice" | "coin" | "star"
  | "gear" | "sparkle" | "dial" | "film" | "soundOn" | "soundOff" | "speed" | "log"
  | "rebirth" | "crystal" | "offline" | "quest"
  | "die1" | "dice2" | "flame" | "slots" | "bolt" | "lens" | "eye" | "map" | "crown"
  | "sparkles" | "arrowUp" | "crystals" | "medal" | "moneyBag" | "chest"
  | "calendar" | "shine" | "cursed" | "glitched" | "forge"
  | "charmGem" | "charmCoin" | "charmStar" | "charmBolt" | "charmGear" | "charmDrop"
  | "charmRing" | "charmPouch" | "charmSpool" | "charmComet" | "charmRainbow" | "charmMoon"
  | "charmCrown" | "charmTrio" | "charmClock" | "charmTwin" | "charmBurst" | "charmSun" | "charmThorn" | "charmStatic"
  | "brewery" | "potionLuck" | "potionGold" | "potionShiny" | "potionCrit" | "potionFast" | "potionBag" | "potionGod" | "potionCursed" | "potionGlitched"
  | "luckyRoll" | "luckyPace" | "luckyPower"
  | "matCommon" | "matUncommon" | "matRare" | "matEpic" | "matLegendary" | "matMythic" | "matDivine" | "matCosmic" | "matSecret"
  | "matShiny" | "matCrystal" | "matCursed" | "matGlitched" | "boostCrystal" | "boostCursed" | "boostGlitched"
  | "cloverGem" | "gemStar" | "gemCoin" | "gemCluster" | "gemBolt" | "gemDie" | "gemDiamond"
  | "ticket" | "quests" | "cloverSack" | "cloverChest";

const PAL: Record<string, string> = {
  w: "#ffffff", l: "#e3eaef", g: "#a9b5bf", d: "#66737e", n: "#18222b",
  a: "#caffb2", G: "#4be866", M: "#22bd40", D: "#0e7b27",
  y: "#fff3a6", Y: "#ffcf3f", O: "#d08a16", B: "#855608",
  r: "#ffa9b7", R: "#ee4660", E: "#a51f39",
  p: "#ecd2ff", P: "#ac63ee", V: "#6531a6",
  c: "#c8f5ff", C: "#56c7f1", b: "#2b79be",
  f: "#ff7a2e", F: "#ffb13d", h: "#ffe98a", H: "#c0351c",
  i: "#eafcff", I: "#9fe6ff", J: "#5bb6f0", K: "#2e6fc7",
  s: "#ffc7dd", S: "#ff7fb0", T: "#ec2f8d", U: "#a80e5c",
  q: "#b8803a", Q: "#6e4614",
  k: "#4a1838", m: "#22071a", x: "#ff2d55", z: "#ffe1e8", e: "#8c1d47",
};

const SIDE = {
  green: ["#139a35", "#0a5f21"],
  gold: ["#c68412", "#7a4a08"],
  gray: ["#7b8892", "#3c4852"],
  purple: ["#7a3fc2", "#43207a"],
  cyan: ["#3b9fd0", "#1d5f8c"],
  fire: ["#c84a14", "#6f2208"],
  ice: ["#4d9fe0", "#245d9c"],
  pink: ["#a52866", "#571032"],
  cursed: ["#6a0d29", "#26040f"],
  gem: ["#1f6fbe", "#0e2f57"],
} as const;

const B = "................";

type IconDef = { rows: string[]; side: readonly [string, string] };

const ICONS: Record<string, IconDef> = {
  bag: {
    side: SIDE.green,
    rows: [
      ".....gggggg.....",
      "....lg....dg....",
      "....lg....dg....",
      "....lg....dg....",
      ".aaaaaaaaaaaaaa.",
      ".aGGGGGGGGGGGGM.",
      ".aGGGGGGGGGGGGM.",
      ".aGGGGwwGwwGGGM.",
      ".aGGGwwwwwwwGGM.",
      ".aGGGwwwnwwwGGM.",
      ".aGGGwwwwwwwGGM.",
      ".aGGGGwwGwwGGGM.",
      ".aGGGGGGGGGGGMM.",
      ".MMMMMMMMMMMMMM.",
      ".DDDDDDDDDDDDDD.",
      "..DDDDDDDDDDDD..",
    ],
  },
  book: {
    side: SIDE.purple,
    rows: [
      ".pppppppppppppp.",
      ".pVPPPPPPPPPPPV.",
      ".pVPPPPPPPPPPPV.",
      ".pVPPPGGPGGPPPV.",
      ".pVPPGGGGGGGPPV.",
      ".pVPPGGGDGGGPPV.",
      ".pVPPGGGGGGGPPV.",
      ".pVPPPGGPGGPPPV.",
      ".pVPPPPPPPPPPPV.",
      ".pVPPPPPPPPPPPV.",
      ".pVPPYYYYYYYPPV.",
      ".pVPPPPPPPPPPPV.",
      ".pVVVVVVVVVVVVV.",
      "..wwwwwwwwwwwwl.",
      "..llllllllllllg.",
      "...gggggggggggd.",
    ],
  },
  auto: {
    side: SIDE.green,
    rows: [
      B, B,
      "..aG.....aG.....",
      "..aGG....aGG....",
      "..aGGM...aGGM...",
      "..aGGGM..aGGGM..",
      "..aGGGGM.aGGGGM.",
      "..aGGGGM.aGGGGM.",
      "..aGGMMD.aGGMMD.",
      "..aGMMMD.aGMMMD.",
      "..aMMMD..aMMMD..",
      "..aMMD...aMMD...",
      "..aMD....aMD....",
      "..MD.....MD.....",
      B, B,
    ],
  },
  lock: {
    side: SIDE.gold,
    rows: [
      ".....llllll.....",
      "....ll....gg....",
      "....ll....gg....",
      "....ll....gg....",
      "....ll....gg....",
      "....ll....gg....",
      "..yyyyyyyyyyyy..",
      "..yYYYYYYYYYYO..",
      "..yYYYYYYYYYYO..",
      "..yYYYnnnnYYYO..",
      "..yYYYnnnnYYYO..",
      "..yYYYYnnYYYYO..",
      "..yYYYYnnYYYYO..",
      "..YYYYYYYYYYOO..",
      "..OOOOOOOOOOOO..",
      "..OOOOOOOOOOOO..",
    ],
  },
  gem: {
    side: SIDE.cyan,
    rows: [
      B, B, B,
      "....wwccccCC....",
      "...wwcccccCCC...",
      "..wwccccccCCCb..",
      ".wwcccccccCCCbb.",
      ".ccccccCCCCCCbb.",
      "..cccccCCCCCbb..",
      "...ccccCCCCbb...",
      "....cccCCCbb....",
      ".....ccCCbb.....",
      "......cCbb......",
      ".......Cb.......",
      B, B,
    ],
  },
  dice: {
    side: SIDE.gray,
    rows: [
      B,
      "..wwwwwwwwwwww..",
      ".wwwwwwwwwwwwwl.",
      ".wwnnwwwwwwnnwl.",
      ".wwnnwwwwwwnnwl.",
      ".wwwwwwwwwwwwwl.",
      ".wwwwwwwwwwwwwl.",
      ".wwwwwwnnwwwwwl.",
      ".wwwwwwnnwwwwwl.",
      ".wwwwwwwwwwwwwl.",
      ".wwwwwwwwwwwwwl.",
      ".wwnnwwwwwwnnwl.",
      ".wwnnwwwwwwnnwl.",
      ".lllllllllllllg.",
      "..gggggggggggg..",
      B,
    ],
  },
  coin: {
    side: SIDE.gold,
    rows: [
      B,
      ".....yyyYYY.....",
      "...yyYYYYYYOO...",
      "..yYYYYYYYYYYO..",
      ".yYYYYYYYYYYYYO.",
      ".yYYYYYBBYYYYYO.",
      ".yYYYYBBBBYYYYO.",
      ".yYYYBBBBBBYYYO.",
      ".yYYYBBBBBBYYYO.",
      ".yYYYYBBBBYYYYO.",
      ".yYYYYYBBYYYYYO.",
      ".YYYYYYYYYYYOOO.",
      "..YYYYYYYYOOOO..",
      "...YYYYYOOOOO...",
      ".....OOOOOO.....",
      B,
    ],
  },
  star: {
    side: SIDE.gold,
    rows: [
      B,
      ".......wO.......",
      ".......yO.......",
      "......yyOO......",
      "......yyOO......",
      ".yyyyyyyOOOOOOO.",
      "..yyyyyyOOOOOO..",
      "...yyyyyOOOOO...",
      "....yyyyOOOO....",
      "....yyyyOOOO....",
      "...yyyyyOOOOO...",
      "...yyyy..OOOO...",
      "..yyyy....OOOO..",
      "..yyy......OOO..",
      ".yyy........OOO.",
      B,
    ],
  },
  gear: {
    side: SIDE.gray,
    rows: [
      "......llgg......",
      "..ll..llgg..gd..",
      "...lllllgggdd...",
      "...lllllgggdd...",
      "..lllllggggddd..",
      "..lllllggggddd..",
      "llllllnnnngddddd",
      "llllllnnnngddddd",
      "llggggnnnndddddd",
      "llggggnnnndddddd",
      "..ggggdddddddd..",
      "..ggggdddddddd..",
      "...gggddddddd...",
      "...gddddddddd...",
      "..gd..dddd..dd..",
      "......dddd......",
    ],
  },
  sparkle: {
    side: SIDE.cyan,
    rows: [
      ".......wc.......",
      ".......wc.......",
      ".......wc.......",
      "......wwcc......",
      "......wwcc......",
      ".....wwwccc.....",
      "...wwwwwccccc...",
      ".wwwwwwwcccccCC.",
      ".wwwwwwwcccCCCC.",
      "...wwwwcccCCC...",
      ".....wwcCCC.....",
      "......wcCC......",
      "......wcCC......",
      ".......cC.......",
      ".......CC.......",
      ".......CC.......",
    ],
  },
  dial: {
    side: SIDE.green,
    rows: [
      B,
      ".....aaaGGG.....",
      "...aaGGGGGGMM...",
      "..aannnGGnnnMM..",
      ".aanGnnnnnnYnMM.",
      ".aannnnnnnYnnMM.",
      ".aaGnnnnnYnnnMM.",
      ".aannnnwwnnnGMM.",
      ".GGnnnnwwnnnnDD.",
      ".GGnnnnnnnnnnDD.",
      ".GGnGnnnnnnnnDD.",
      ".GGnnnnnnnnnnDD.",
      "..GGnnnnnnnnDD..",
      "...GGMMMMMMDD...",
      ".....GMMMDD.....",
      B,
    ],
  },
  film: {
    side: SIDE.gray,
    rows: [
      B, B,
      ".lllllllllllllg.",
      ".lnlnnnnnnnnlng.",
      ".lllnnannnnnlgg.",
      ".lnlnnaannnnlng.",
      ".lllnnaaannnlgg.",
      ".lnlnnaaaannlng.",
      ".lllnnaaaannlgg.",
      ".lnlnnaaannnlng.",
      ".lllnnaannnnlgg.",
      ".lnlnnannnnnlng.",
      ".lllnnnnnnnnlgg.",
      ".gggggggggggggd.",
      B, B,
    ],
  },
  soundOn: {
    side: SIDE.gray,
    rows: [
      B, B, B,
      ".......wl...G...",
      "......wll....G..",
      ".....wwll.G..G..",
      ".wwwwwwwl..G..G.",
      ".wwwwwwwl..G..G.",
      ".wwwwwwlg..G..G.",
      ".llllllgg..G..G.",
      ".....llgg.G..G..",
      "......lgg....G..",
      ".......gg...G...",
      B, B, B,
    ],
  },
  soundOff: {
    side: SIDE.gray,
    rows: [
      B, B, B,
      ".......wl.......",
      "......wll.......",
      ".....wwll.......",
      ".wwwwwwwl.R...R.",
      ".wwwwwwwl..R.R..",
      ".wwwwwwlg...R...",
      ".llllllgg..R.R..",
      ".....llgg.R...R.",
      "......lgg.......",
      ".......gg.......",
      B, B, B,
    ],
  },
  speed: {
    side: SIDE.gold,
    rows: [
      ".......wyYYO....",
      "......yyYYO.....",
      ".....yyYYO......",
      "....yyYYO.......",
      "...yyyyyyYYYYO..",
      ".......yyYYYO...",
      "......yyYYYO....",
      ".....yyYYYO.....",
      ".....yYYYO......",
      "....yYYYO.......",
      "....yYYO........",
      "...yYYO.........",
      "...yYO..........",
      "..yYO...........",
      "..YO............",
      B,
    ],
  },
  log: {
    side: SIDE.gray,
    rows: [
      B,
      "..wwwwwwwwwwww..",
      "..wwwwwwwwwwwl..",
      "..wwGGwdddddwl..",
      "..wwGGwdddddwl..",
      "..wwwwwwwwwwwl..",
      "..wwCCwdddddwl..",
      "..wwCCwdddddwl..",
      "..wwwwwwwwwwwl..",
      "..wwPPwdddddwl..",
      "..wwPPwdddddwl..",
      "..wwwwwwwwwwwl..",
      "..wwYYwdddddwl..",
      "..wwYYwdddddwl..",
      "..llllllllllgg..",
      B,
    ],
  },
  // classic circular "refresh / rebirth" arrows chasing clockwise:
  // the top arrow sweeps right and points down, the bottom arrow sweeps left and points up
  rebirth: {
    side: SIDE.pink,
    rows: [
      "................",
      ".......ws.......",
      "....wssSSsss....",
      "...sSSSTTSSSs...",
      "..sSSST..TSSSs..",
      ".........SSSSSss",
      "..........TSSTT.",
      "...S.......TST..",
      "..STS.......T...",
      ".STTTS..........",
      "STTTTTS.........",
      "..TTTTT..SSSST..",
      "...TTTTSSTTTU...",
      "....UUUTTUUU....",
      ".......UU.......",
      "................",
    ],
  },
  // a cut crystal shard with white facet lines
  crystal: {
    side: SIDE.ice,
    rows: [
      ".......ii.......",
      "......iiIi......",
      "......iIII......",
      ".....iiIIIJ.....",
      ".....iIIIJJ.....",
      "....iiIIIJJJ....",
      "....iIIiIJJJ....",
      "...iiIIiIJJJK...",
      "...iIIIiIJJJK...",
      "..iiIIIiIJJJKK..",
      "..iIIIIiIJJJKK..",
      "..iIIIIiIJJKKK..",
      "...IIIIiIJKKK...",
      "....IIIiJKKK....",
      ".....IIiKKK.....",
      "......IiKK......",
    ],
  },
  // A clean gold-rimmed clock: white face, tick marks, hands at 3 o'clock, red pivot.
  offline: {
    side: SIDE.gold,
    rows: [
      ".....yyyyyy.....",
      "...yyYYYYYYOO...",
      "..yYwwwdwwwwYO..",
      ".yYwwwwnwwwwwlO.",
      ".yYwwwwnwwwwwlO.",
      "yYwwwwwnwwwwwwlO",
      "yYwwwwwnwwwwwwlO",
      "yYdwwwwRnnnwwdlO",
      "yYwwwwwwwwwwwwlO",
      "yYwwwwwwwwwwwllO",
      ".yYwwwwwwwwwwlO.",
      ".yYwwwwwwwwwllO.",
      "..yYwwwdwwwllOO.",
      "...YYllllllOO...",
      ".....OOOOOO.....",
      B,
    ],
  },
  // A gold achievement badge with a bold white "!" quest mark.
  quest: {
    side: SIDE.gold,
    rows: [
      "......YYYY......",
      "....YYyyyyYY....",
      "...YyyGGGGyyY...",
      "..YyGGGGGGGGyY..",
      ".YyGGGGwwGGGGyY.",
      ".YGGGGGwwGGGGGY.",
      "YGGGGGGwwGGGGGGY",
      "YGGGGGGwwGGGGGGY",
      "YGGGGGGGGGGGGGGY",
      ".YGGGGGGGGGGGGY.",
      ".YyGGGGwwGGGGyY.",
      "..YyGGGGGGGGyY..",
      "...YyyGGGGyyY...",
      "....YYyyyyYY....",
      "......YYYY......",
      B,
    ],
  },
  /* ---------------------------------------------------------
     Forge + charms. Every sprite below is drawn from scratch on
     the shared 16x16 grid and is used nowhere else in the game.
     All charms hang from the same small loop, so the set reads
     as one cohesive collection of pendants.
     --------------------------------------------------------- */
  forge: {
    side: ["#5d7484", "#22323e"],
    rows: [
      "................", "................", "..........gggg..", ".........gllllg.",
      ".........gllllg.", "..........gggg..", "........qq......", ".......qq.......",
      "..h...qq....h...", "..llllllllllll..", "..lddddddddddl..", "...dddddddddd...",
      ".....dddddd.....", ".....dddddd.....", "...dddddddddd...", "..llllllllllll..",
    ],
  },
  charmGem: {
    side: SIDE.green,
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......",
      "....aaGGGGaa....", "...aGGGGGGGGa...", "..aGGGwwGGGGGa..", "..aGGGwwGGGGGa..",
      "..aGGGGGGGGGGa..", "..aGGGGGGGGGGa..", "..aMGGGGGGGGMa..", "..aMMGGGGGGMMa..",
      "...aMMMGGMMMa...", "....aMMMMMMa....", ".....aDDDDa.....", "......aDDa......", "................",
    ],
  },
  charmCoin: {
    side: SIDE.gold,
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......",
      "....yyYYYYyy....", "...yYYYYYYYYO...", "..yYYwwYYYYYYO..", "..yYYwwYYYYYYO..",
      "..yYYYYwwYYYYO..", "..yYYYwwwwYYYO..", "..yYYYYwwYYYYO..", "..yYYYYYYYYYYO..",
      "...OYYYYYYYYO...", "....OOYYYYOO....", ".....OOOOOO.....", "......BBBB......", "................",
    ],
  },
  charmStar: {
    side: SIDE.gold,
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......",
      ".......ww.......", ".......ww.......", "......ywwy......", ".....yywwyy.....",
      ".wwyyyywwyyyyww.", ".wwyyyywwyyyyww.", ".....yywwyy.....", "......ywwy......",
      ".......ww.......", "......YwwY......", "......YOOY......", ".......OO.......", "................",
    ],
  },
  charmBolt: {
    side: SIDE.fire,
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......",
      ".........ff.....", "........ffF.....", ".......ffFF.....", "......ffFFH.....",
      ".....ffFFhffff..", "....ffFFhhffff..", "....ffffhhFF....", "......ffhhFF....",
      ".....ffhhFF.....", "....ffhhFF......", "....fhHF........", "....fH..........", "................",
    ],
  },
  charmGear: {
    side: SIDE.gray,
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......",
      ".....g.gg.g.....", "....gg.gg.gg....", "...gggggggggg...", "..ggllllllllgg..",
      "gggllllllllllggg", "gggllllnnllllggg", "gggllllnnllllggg", "gggllllllllllggg",
      "..ggllllllllgg..", "...gggggggggg...", "....gg.gg.gg....", ".....g.gg.g.....", "................",
    ],
  },
  charmDrop: {
    side: SIDE.ice,
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......",
      ".......ii.......", "......iIIi......", ".....iIwwIi.....", "....iIIwwIIi....",
      "...iIIIwwIIIi...", "..iIIIIIIIIIJi..", "...iIIIIIIIJi...", "....iIIIIIJi....",
      ".....iIIIJi.....", "......iIJi......", ".......JJ.......", "................", "................",
    ],
  },
  charmRing: {
    side: SIDE.green,
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......",
      ".....aGGGGa.....", "...aaGGMMGGaa...", "..aGGMM..MMGGa..", "..aGM......MGa..",
      ".aGM........MGa.", ".aGM........MGa.", "..aGM......MGa..", "..aGGMM..MMGGa..",
      "...aaGGMMGGaa...", ".....aGGGGa.....", "......DDDD......", "................", "................",
    ],
  },
  charmPouch: {
    side: SIDE.green,
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......",
      "......dggd......", ".....d....d.....", "....aaaaaaaa....", "...aGGGGGGGGa...",
      "..aGGGGwwGGGGa..", "..aGGwwwwwwGGa..", "..aGGwwwwwwGGa..", "..aGGGGwwGGGGa..",
      "..aMGGGGGGGGMa..", "..aMMMMMMMMMMa..", "...DDDDDDDDDD...", "....DDDDDDDD....", "................",
    ],
  },
  charmSpool: {
    side: SIDE.pink,
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......",
      "..ssssssssssss..", "..sSSSSSSSSSSs..", "..ssssssssssss..", "....STTTTTTS....",
      "....STTwwTTS....", "....STTTTTTS....", "....STTTTTTS....", "....STTTTTTS....",
      "..ssssssssssss..", "..sSSSSSSSSSSs..", "..ssssssssssss..", "................", "................",
    ],
  },
  charmComet: {
    side: SIDE.gold,
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......",
      "..........wwww..", ".........wwwwww.", ".........wwwwww.", ".......yywwwwww.",
      "......yyywwwwww.", ".....yyyyywwww..", "....yyyYYyy.....", "...yyYYYyy......",
      "..yyYYOy........", ".yyYOO..........", "yyOO............", "yO..............", "................",
    ],
  },
  charmRainbow: {
    side: SIDE.purple,
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......",
      "....RRRRRRRR....", "..RRRRRRRRRRRR..", "..RRFFFFFFFFRR..", ".RRFFFFFFFFFFRR.",
      ".RRFFYYYYYYFFRR.", "RRFFYYGGGGYYFFRR", "RRFFYYGGGGYYFFRR", "RRFFYYCCCCYYFFRR",
      "RRFFYY....YYFFRR", "RRFF........FFRR", "RR............RR", "................", "................",
    ],
  },
  charmMoon: {
    side: SIDE.ice,
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......",
      ".....iIIIJ......", "....iIIIJ...w...", "...iIIIJ........", "..iIIIJ.........",
      "..iIIIJ.........", "..iIIIJ....w....", "..iIIIJ.........", "...iIIIJ........",
      "....iIIIJ..w....", ".....iIIIJ......", "......JJJ.......", "................", "................",
    ],
  },
  charmCrown: {
    side: SIDE.gold,
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......",
      "..y....y....y...", "..yy...yy...yy..", "..yY...yY...Yy..", "..yYY.YYY.YYYy..",
      "..yYYYYYYYYYYy..", "..yYYYwYYwYYYy..", "..yYYYYYYYYYYy..", "..yOYYYYYYYYOy..",
      "..yOOOOOOOOOOy..", "..yBBBBBBBBBBy..", "...BBBBBBBBBB...", "................", "................",
    ],
  },
  charmTrio: {
    side: SIDE.green,
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......",
      "......aGGa......", ".....aGGGGa.....", ".....aGGGGa.....", "......aMMa......",
      ".......MM.......", "................", "..aGGa.....aGGa.", ".aGGGGa...aGGGGa",
      ".aGGGGa...aGGGGa", "..aMMa.....aMMa.", "...MM.......MM..", "................", "................",
    ],
  },
  charmClock: {
    side: SIDE.gray,
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......",
      "......gggg......", "....ggllllgg....", "...gllwwwwllg...", "..gllwwwwwwllg..",
      "..glwwwnwwwwlg..", "..glwwwnwwwwlg..", "..glwwwnnnnwlg..", "..glwwwwwwwwlg..",
      "..gllwwwwwwllg..", "...gllwwwwllg...", "....ggllllgg....", "......gggg......", "................",
    ],
  },
  charmTwin: {
    side: SIDE.purple,
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......",
      ".....pPPPPp.....", "...pPPPPPPPPp...", "..pPPPp..pPPPp..", "..pPPp....pPPp..",
      ".pPPp......pPPp.", ".pPPp......pPPp.", ".pPVp......pPVp.", "..pVVp....pVVp..",
      "..pVVVp..pVVVp..", "...pVVVVVVVVp...", ".....pVVVVp.....", "................", "................",
    ],
  },
  charmBurst: {
    side: ["#b5293f", "#5e0f1e"],
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......",
      ".......RR.......", "....R..RR..R....", ".....R.RR.R.....", "..RR..RRRR..RR..",
      "...RRRRrrRRRR...", "...RRRrwwrRRR...", "...RRRRrrRRRR...", "..RR..RRRR..RR..",
      ".....R.RR.R.....", "....R..RR..R....", ".......RR.......", "................", "................",
    ],
  },
  charmSun: {
    side: SIDE.gold,
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......",
      ".......YY.......", "...Y...YY...Y...", "....Y.yyyy.Y....", ".....yYYYYy.....",
      ".YY.yYYwwYYy.YY.", ".YY.yYYwwYYy.YY.", ".....yYYYYy.....", "....Y.yyyy.Y....",
      "...Y...OO...Y...", ".......OO.......", "................", "................", "................",
    ],
  },
  // Brewery: new, original bottle drawings; not borrowed from the game or charm art.
  brewery: {
    side: SIDE.gold,
    rows: [
      "................", "...c............", "..c.c.....c.....", "...c.....c.c....",
      "......c...c.....", ".....c.c.c......", "....yyyyyyyy....", "...ylllllllly...",
      "..ylwwwwwwwlly..", "..ylwccccccwly..", "...ylCCCCCCly...", "....yCCCCCCy....",
      "....yCCCCCCy....", "....qQQQQQQq....", "...qQQ....QQq...", "................",
    ],
  },
  potionLuck: {
    side: SIDE.green,
    rows: [
      "................", "......qqqq......", ".....qQQQQq.....", ".....qQQQQq.....",
      "......llll......", "......lwwl......", ".....laaaal.....", "....laGGGGal....",
      "...laGGGGGGal...", "...laGGGGGGal...", "..laGGwGwwGGal..", "..laGGGGGGGGal..",
      "..laMGGGGGGMal..", "...aMMGGGMMMa...", "....aMMMMMMa....", ".....DDDDDD.....",
    ],
  },
  potionGold: {
    side: SIDE.gold,
    rows: [
      "................", "......qqqq......", "......qQQq......", "......qQQq......",
      "......llll......", "......lwwl......", ".....yyyyyy.....", "....yYYYYYYO....",
      "...yYYYYYYYYO...", "..yYYwwYYYYYYO..", "..yYYwwYYYYYYO..", "..yYYYYwwYYYYO..",
      "...yYYYYYYYYO...", "....YYYYYYYY....", ".....OOOOOO.....", "......BBBB......",
    ],
  },
  potionShiny: {
    side: SIDE.cyan,
    rows: [
      "................", "......qqqq......", ".....qQQQQq.....", "......llll......",
      ".......ww.......", ".......ww.......", ".....cccCCc.....", "....cCCCwwCc....",
      "...cCCwwwwCCc...", "...cCCwwwwCCc...", "..cCCCwwwwCCCc..", "..cCCCwwwCCCbc..",
      "..cCCCCCCCCbbc..", "...cCCCCCCbbc...", "....cccccccc....", ".....bbbbbb.....",
    ],
  },
  potionCrit: {
    side: SIDE.fire,
    rows: [
      "................", "......qqqq......", ".....qQQQQq.....", ".....qQQQQq.....",
      "......dddd......", "......dwwd......", "......fFFf......", ".....fFFFFf.....",
      "....fFFhhFFf....", "...fFFhwwhFFf...", "..fFFFhwwhFFFf..", "..fFFFFhhFFFFf..",
      "...fFFFFFFFFf...", "....fHFFFFHf....", ".....HHHHHH.....", "......HHHH......",
    ],
  },
  potionFast: {
    side: SIDE.green,
    rows: [
      "................", "......qqqq......", ".....qQQQQq.....", "......llll......",
      ".......ww.......", "......aww.......", ".....aGGwwa.....", "....aGGGGGMa....",
      "...aGGGwwwMMa...", "..aGGwwwwGGMMa..", "..aGwwGGwwGGMa..", "..aGGGGwwGGMMa..",
      "..aMGGGGGGGMMa..", "...aMMMMMMMMa...", "....aMMMMMMa....", ".....DDDDDD.....",
    ],
  },
  potionBag: {
    side: SIDE.purple,
    rows: [
      "................", "......qqqq......", ".....qQQQQq.....", ".....qQQQQq.....",
      "......llll......", "......lwwl......", "......pppp......", "....ppPPPPpp....",
      "...pPPPPPPPPp...", "..pPPPPPPPPPPp..", "..pPPwwPPPwwPp..", "..pPPwwPPPwwPp..",
      "..pPPPPPPPPPPp..", "...pVVPPPPVVp...", "....pVVVVVVp....", ".....VVVVVV.....",
    ],
  },
  potionGod: {
    side: SIDE.pink,
    rows: [
      "................", "......qqqq......", ".....qQQQQq.....", ".....qQQQQq.....",
      ".....yyyyyy.....", "....ywwwwwwy....", "...ppPPPPPPpp...", "..pPPPPwwPPPPp..",
      "..pPPwPwwPwPPp..", "..pPPPPwwPPPPp..", "..pPPPPPPPPPPp..", "...pPPPPPPPPp...",
      "....pPPPPPPp....", ".....pVVVVp.....", "......VVVV......", "................",
    ],
  },
  // Dedicated pixel art for cursed, glitched and the lucky-roll workshop.
  charmThorn: {
    side: SIDE.cursed,
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......", "....x..RR..x....",
      "...xR.RRRR.Rx...", "..xRRRRRRRRRRx..", "..RRRzzRRzzRRR..", ".xRRRzmRRmzRRRx.",
      ".xRRRzmRRmzRRRx.", "..xRRRRRRRRRRx..", "...xRRRxxRRRx...", "....xRRxxRRx....",
      ".....xRRRRx.....", "....x..RR..x....", ".......RR.......", "................",
    ],
  },
  charmStatic: {
    side: ["#247d8c", "#33204f"],
    rows: [
      "......gwwg......", ".....gw..wg.....", "......gwwg......", ".....ccSS.......",
      "....ccCCSS......", "...ccCCCCSS.....", "..cCCwwnCCSS....", "..cCCwnnCTTSS...",
      "..cCCnnnCCTSS...", "..cCCCnnCCTSS...", "..cCCCCCCTTSS...", "...cCCnnTTSS....",
      "....CCCTTSS.....", ".....CCTTS......", "......CCSS......", ".......SS.......",
    ],
  },
  potionCursed: {
    side: SIDE.cursed,
    rows: [
      "................", "......qqqq......", ".....qQQQQq.....", ".....qQQQQq.....",
      "......lggl......", "......lggl......", ".....xzzzzx.....", "....xRRRRRRx....",
      "...xRRRmmRRRx...", "..xRRRzmmzRRRx..", "..xRRRzmmzRRRx..", "..xRRRRRRRRRRx..",
      "...xRRRxxRRRx...", "....xRRRRRRx....", ".....xEEEEx.....", "......xxxx......",
    ],
  },
  potionGlitched: {
    side: ["#247d8c", "#33204f"],
    rows: [
      "................", "......qqqq......", ".....qQQQQq.....", ".....qQQQQq.....",
      "......lggl......", "......lggl......", ".....ccSScc.....", "....cCCCCCTs....",
      "...cCCwwnCTTs...", "..cCCwwnCCTTTs..", "..cCCnnCCTTTTs..", "..cCCnCCCCCTTs..",
      "...cCCCCCCTTs...", "....cCCCTTTs....", ".....cCCTTs.....", "......ccss......",
    ],
  },
  luckyRoll: {
    side: SIDE.gold,
    rows: [
      ".......y........", "...y...y...y....", ".....yyyyyy.....", "...yyYYYYYYyy...",
      "..yYYGGGGGGYYy..", "..yYGwwGGwwGYy..", ".yYYGwwGGwwGYYy.", ".yYYGGGGGGGGYYy.",
      ".yYYGGGGGGGGYYy.", ".yYYGwwGGwwGYYy.", "..yYGwwGGwwGYy..", "..yYYGGGGGGYYy..",
      "...yyYYYYYYyy...", ".....OOOOOO.....", "...y...y...y....", ".......y........",
    ],
  },
  luckyPace: {
    side: SIDE.gold,
    rows: [
      "......yyyy......", ".....yYYYYy.....", "....yYYYYYYy....", "....ywwwwwwy....",
      ".....ywwwwy.....", "......ywwy......", ".......yy.......", ".......GG.......",
      ".......GG.......", "......GYYG......", ".....GYYYYG.....", "....GYYYYYYG....",
      "....GYYYYYYG....", ".....yOOOOy.....", "......OOOO......", "................",
    ],
  },
  luckyPower: {
    side: SIDE.gold,
    rows: [
      ".......y........", ".......Y........", "...y...Y...y....", "....y..Y..y.....",
      "..yYYyYYYYyYYy..", "...yYYYYYYYYy...", "....YYGwwGYY....", "....YYGwwGYY....",
      "yyYYYYGGGGYYYYyy", "....YYGwwGYY....", "....YYGwwGYY....", "...yYYYYYYYYy...",
      "..yYYyYYYYyYYy..", "....y..O..y.....", "...y...O...y....", ".......O........",
    ],
  },
  // Crafting materials and the three variant boosters each have original pixel art.
  matCommon: {
    side: SIDE.green,
    rows: [
      "................", "...........GGG..", ".......GGGGGGG..", "G.....GGGGGGGM..",
      "GaG..GGGGGGGaM..", "GGGGGGGGGGMaMM..", ".GGGGGaGGMaMMM..", ".GGGGGaMMaaaa...",
      "...GGGaMaMMM....", "..GGGMaaMMM.....", "..GGMMaMMM......", "..GMMaMMM.......",
      "..MMaMMM........", "...aM...........", "..a.............", "................",
    ],
  },
  matUncommon: {
    side: SIDE.cyan,
    rows: [
      "................", "......CCC.......", ".....CCiC.......", ".CCCCCCiCC......",
      ".CiiCCCiC.......", ".CCCi.Ci........", "..CCCCCbCCCC....", ".......CCiCCC...",
      ".......bCCCi....", ".CCCC..bCCC.....", ".CiiCC.C........", ".CCCi..b........",
      "..CCCCCb........", ".......C........", ".......b........", "................",
    ],
  },
  matRare: {
    side: SIDE.ice,
    rows: [
      "................", ".......JJ.......", "......JIJJ......", ".....JIIJJJ.....",
      "....JIIIJJJ.....", "...JIIwIJJJJ....", "..JIIwIIJCJJJ...", ".JIIIIIIJCCJJJ..",
      ".JIwwIIIJCCCJJ..", ".JIwwIIIJCCCCJ..", ".JIwwIIIJCCCCJ..", ".JIwwIIIJCCCJJ..",
      ".JJIIIIIJCCiJ...", "..JJIIJJJCJJ....", "...JJJJJJJJ.....", "................",
    ],
  },
  matEpic: {
    side: SIDE.purple,
    rows: [
      "................", "..........w.....", "....p...........", "...ppp..p.......",
      "....p...........", "............p...", "................", ".......VV.......",
      ".......PPV.V....", "...V..VPPPVPV...", "..VPPVPpPPPPPV..", "..PPPPPPPPPPpPV.",
      ".VPpPPPPPpPPPVV.", ".VVPPPPPPPPPVV..", "..VVVVVVVVVVVV..", "................",
    ],
  },
  matLegendary: {
    side: SIDE.gold,
    rows: [
      "..w......YY.....", ".www.YYYYYYY....", "..wYYYYYYYYYY...", "..YYYYYYYYYyOO..",
      ".YYYYYYYYOyOOO..", ".YYYYYYYOOyOOO..", ".YYyYYYYOyOOOO..", ".YYYyYYOyyyyO...",
      ".YYYyYYyOOOO....", "..YYYyOyOOO.....", "...YYOyOOO......", "....YyOOO.......",
      "....yOOO........", "...YyOO.........", "...y............", "................",
    ],
  },
  matMythic: {
    side: SIDE.cursed,
    rows: [
      "........RR......", ".....RRrrrR.....", "...RrrrrrRRR....", "..RrwrrrRRRRR...",
      ".RrwrrrrRRRRRR..", "RrwrrrrRRRREEEE.", "RRRRRRREEEEEEE..", ".RRRRRREEEEEE...",
      ".RRRRREEEEEE....", "..RRRREEEEEE....", "...RRRREEEE.....", "......RRRE...rr.",
      "..RRRR......rrr.", ".RRRRRR....rrrr.", ".RRRRRRR..rrrrr.", "................",
    ],
  },
  matDivine: {
    side: SIDE.gold,
    rows: [
      "................", "..y.......wwl...", ".yyy...llwwwwwl.", "..y...lwwwwwYll.",
      ".....lwwwwwYlll.", ".....wwwwwYllll.", "....lwwwwYwwl...", "...llwwwYwll....",
      "...lwwwYwllll...", "...lwwYwwlll....", "....wwggggg.....", "....lYll........",
      "...lY...........", "...Y............", "..Y.............", ".O..............",
    ],
  },
  matCosmic: {
    side: SIDE.purple,
    rows: [
      "................", "................", "......C.........", "......CCP.....c.",
      "....CCCwCCP.....", ".c.CCCwwwCCP....", "....pCCwCCpP....", "....PCCCCpPPP...",
      "....CCpCCpPP....", "....CPPpCCPP....", "......PPPCP.....", "...VV...P...V...",
      ".VcVVV....VVcV..", "..VVVcV..VVVVVc.", "...VVVVVcVVV....", "................",
    ],
  },
  matSecret: {
    side: SIDE.purple,
    rows: [
      "....VVVVVVV.....", "...VPPPPPPVV....", "..VPpPPPPPPVV...", ".VPpPPyyPPPPVV..",
      "VPpPPywyyPPPPVV.", "VPPPyyyyyyyPPPVV", "VPPCyyyyyyyRPPVV", "VPPCCCyyRRRRPPVV",
      "VPPCCCCRRRRRPPVV", "VPPCCCCRRRRRPPVV", "VPPPCCCRRRRPPVVV", "VVPPPCCRRPPPVVV.",
      ".VVPPPCRPPPVVV..", "..VVPPPPPPVVV...", "...VVVVVVVVV....", "....VVVVVVV.....",
    ],
  },
  matShiny: {
    side: SIDE.gold,
    rows: [
      "................", "......y...Y.....", ".....yyy.....w..", ".Y....y.....www.",
      ".............w..", "................", "..yyyyyyyyyyyy..", "..yyyyyyyyyyyy..",
      "...OYYYYYYYOO...", "...OwwYYYYYOO...", "...OwwYYYYYOO...", "...OwwYYYYYOO...",
      "...OYYYYYYYOO...", "...OOOBBBBBBO...", "................", "................",
    ],
  },
  matCrystal: {
    side: SIDE.ice,
    rows: [
      "................", ".......JJ.......", ".......iJJ......", "......JiJJJ.....",
      "..I...iiJJJJ...C", ".III.JiiJJJJ.CCC", "IIIIIJiiJJJJCwCC", "IwIIIIiiJJJCwCCC",
      ".IwIIIIiJJJCwCC.", ".IwIIIIiJJCCCCC.", "..IwIIIiJJCCCCC.", "..IIwIIiJJCCCCC.",
      "...IIIIJJJCCCC..", "...IIIIJJ.CCC...", "....I.JJ..CC....", "......J...C.....",
    ],
  },
  matCursed: {
    side: SIDE.cursed,
    rows: [
      "................", "........kk....r.", ".......kkkk..rrr", "......kxxkkk..r.",
      ".....kxxxxkkk...", "....kxxExxxkk...", "...kxxEExxxkk...", "..kkxxzExxkkk...",
      "..kxxzEEExkkkk..", ".kkxEEEEEEEkkk..", ".kxxEEEEEExxxk..", ".kxxEEEEEExxkk..",
      "..kxxEEEExxxk...", "...kxxxxxxxk....", "....kkkkkkk.....", "................",
    ],
  },
  matGlitched: {
    side: ["#247d8c", "#33204f"],
    rows: [
      "................", "....C..C..C.....", "....C..C..C.....", "...bbbbbbbbbb...",
      ".CCbccccnnnnbSS.", "...bnnncnnCnb...", "...bnnncnnnnb...", ".CCbnnTwwTnnbSS.",
      "...bnnTwwTnnb...", "...bnnTTTTnnb...", ".CCbnsnnnnnSbSS.", "...bnnnnnnnnb...",
      "...bbbbbbbbbb...", "....S..S..S.....", "....S..S..S.....", "................",
    ],
  },
  boostCrystal: {
    side: SIDE.ice,
    rows: [
      ".......J........", ".....JiiJ.......", "...JJiiiiJ......", "..JJiiiiiJJ.....",
      ".JJJiiiiiiJJ.y..", "JJJJiiiiiiJJy.y.", "JJJiiiiiiJJyYY.y", "JJJiiiiiJJy.YY..",
      "JJJiiiiJJJJ.YY..", "JJiiiiJJJJJ.YY..", "JJJiiJJJJJ..YY..", ".JJJJJJJJJ..YY..",
      "..IIJJJJJ...YY..", "...JIIJ.........", ".KKKKKKKKKK.....", ".KKKKKKKKKK.....",
    ],
  },
  boostCursed: {
    side: SIDE.cursed,
    rows: [
      "......E.........", ".....EEE........", "...EEExxE.......", "..EEExxxEE...z..",
      "..EExxxxEE..zrz.", "..EExzzxEE..zr.z", "..EExzzxEE.z.r..", "..EExxxxEE...r..",
      "..EExxxEEE...r..", "...EExEEE....r..", "....EEEE.....r..", ".....EEE.....r..",
      "....EEEEE....r..", "...EEEEEEE......", ".kkkkkkkkkkk....", ".kkkkkkkkkkk....",
    ],
  },
  boostGlitched: {
    side: ["#247d8c", "#33204f"],
    rows: [
      "................", "...........S....", ".PPPPPPPPPPP....", ".PnnnnnnnnnP.w..",
      ".PnCCCCCnnnPwSw.", ".PnCwwCCnnnPwS.w", ".PnCwwTTTnnw.S..", "CPnCCTTTTnnP.S..",
      ".PnnnTTTTnnP.S..", ".PnnnnnnnnnP.S..", ".PnnnnnnnnnP.S..", ".PccccccnnnP.S..",
      ".PnnnnnnnnnP.S..", ".PPPPPPPPPPP....", "....VVVVVV......", "....VVVVVV......",
    ],
  },




};

/* =========================================================
   DRAWING TOOLKIT
   Sprites are built from exact primitives on the 16x16 grid,
   so every shape is crisp, symmetric and intentional. A pixel
   at (x, y) is tested at its centre (x + 0.5, y + 0.5).
   ========================================================= */

type Grid = string[][];
type Shape = (px: number, py: number) => boolean;

const newGrid = (): Grid => Array.from({ length: 16 }, () => Array<string>(16).fill("."));

const put = (g: Grid, x: number, y: number, c: string) => {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px >= 0 && px < 16 && py >= 0 && py < 16) g[py][px] = c;
};

/** Inclusive pixel-index rectangle. */
const area = (x0: number, y0: number, x1: number, y1: number): Shape =>
  (px, py) => px >= x0 && px <= x1 + 1 && py >= y0 && py <= y1 + 1;

const disc = (cx: number, cy: number, r: number): Shape =>
  (px, py) => (px - cx) ** 2 + (py - cy) ** 2 <= r * r;

const ellipse = (cx: number, cy: number, rx: number, ry: number): Shape =>
  (px, py) => ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1;

const poly = (pts: Array<[number, number]>): Shape =>
  (px, py) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };

const and = (...shapes: Shape[]): Shape => (px, py) => shapes.every((s) => s(px, py));
const not = (shape: Shape): Shape => (px, py) => !shape(px, py);
const ring = (outer: Shape, inner: Shape): Shape => and(outer, not(inner));

/** Four-point glint: thin arms plus a small diamond core. */
const sparkle = (cx: number, cy: number, R: number, arm: number): Shape =>
  (px, py) => {
    const dx = Math.abs(px - cx);
    const dy = Math.abs(py - cy);
    return (dx <= arm && dy <= R) || (dy <= arm && dx <= R) || dx + dy <= R * 0.45;
  };

/** Paints every pixel whose centre passes the shape. */
const fill = (g: Grid, shape: Shape, c: string) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (shape(x + 0.5, y + 0.5)) g[y][x] = c;
};
/** Recolours pixels that are already drawn and pass the shape. */
const over = (g: Grid, shape: Shape, c: string) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (g[y][x] !== "." && shape(x + 0.5, y + 0.5)) g[y][x] = c;
};
const box = (g: Grid, x0: number, y0: number, x1: number, y1: number, c: string) => fill(g, area(x0, y0, x1, y1), c);
const toRows = (g: Grid): string[] => g.map((row) => row.join(""));

/* ---------------------------------------------------------
   Rarity tints. Each rarity's icon takes the colours of its
   rarity lettering, so the star matches the text exactly.
   --------------------------------------------------------- */

export type IconTint = { map?: Record<string, string>; side?: readonly [string, string]; rainbow?: boolean };

export const TIER_TINTS: Record<string, IconTint> = {
  uncommon: { map: { y: "#7dffe0", Y: "#3ff2c0", O: "#12806b", w: "#e6fff8" }, side: ["#1fae92", "#0b5e4e"] },
  rare: { map: { y: "#e2f8ff", Y: "#73d7ff", O: "#2f7fb8", w: "#ffffff" }, side: ["#4aa9dc", "#1f5f8f"] },
  epic: { map: { y: "#eedcff", Y: "#c07bff", O: "#5b2c8f", w: "#ffffff" }, side: ["#9250d6", "#43207a"] },
  legendary: { map: { y: "#fff3b0", Y: "#ffd23f", O: "#b77a0c", w: "#fff9d8" }, side: ["#d89a14", "#7a4a08"] },
  mythic: { map: { y: "#ffc2cf", Y: "#ff6782", O: "#a3203f", w: "#ffe6ec" }, side: ["#d23a5e", "#6b1028"] },
  divine: { map: { y: "#fff5dc", Y: "#ffcc92", O: "#b8763a", w: "#ffffff" }, side: ["#e6a062", "#7a4a1e"] },
  cosmic: { map: { y: "#dbe6ff", Y: "#9bb3ff", O: "#4d5fb8", w: "#ffffff" }, side: ["#6f85e0", "#2f3d86"] },
  eclipse: { map: { y: "#fbdcff", Y: "#c86bff", O: "#4a2a6e", w: "#fff1fb" }, side: ["#9b4fd6", "#3b1d5c"] },
  aurora: { map: { y: "#80ffbb", Y: "#64f0ef", O: "#4f7fd0", w: "#e9ffe3" }, side: ["#3fb8c9", "#23548f"] },
  singularity: { map: { y: "#dfd1ff", Y: "#9b82e0", O: "#50416e", w: "#faf2ff" }, side: ["#7c5fd0", "#3a2a66"] },
  prismatic: { rainbow: true, side: ["#a690ff", "#4e3a8a"] },
  solar: { map: { y: "#fff3b0", Y: "#ffb13d", O: "#9c4a0a", w: "#fffbe0" }, side: ["#e88a14", "#7a3e06"] },
  moonlit: { map: { y: "#f2f6ff", Y: "#c3d2ea", O: "#4a5a7a", w: "#ffffff" }, side: ["#9fb4d6", "#3d4f70"] },
  tidal: { map: { y: "#c9fbff", Y: "#3fb8c9", O: "#1b5f78", w: "#eafcff" }, side: ["#2a9fb3", "#124a5c"] },
  inferno: { map: { y: "#ffe98a", Y: "#ff7a2e", O: "#7a2508", w: "#fff3b0" }, side: ["#e0501a", "#6f2208"] },
  glacier: { map: { y: "#eafcff", Y: "#4d9fe0", O: "#245d9c", w: "#ffffff" }, side: ["#4d9fe0", "#1f4f85"] },
  sakura: { map: { y: "#ffe0ee", Y: "#ff9ac8", O: "#8a2a5e", w: "#ffffff" }, side: ["#e0649c", "#6a1e46"] },
  thunder: { map: { y: "#fffbe0", Y: "#fff36b", O: "#8a6a00", w: "#ffffff" }, side: ["#e8c81a", "#7a5c06"] },
  verdant: { map: { y: "#e6ffe0", Y: "#7dff7a", O: "#1f5f2a", w: "#f4fff2" }, side: ["#3fb84a", "#1a5a24"] },
  obsidian: { map: { y: "#ded0ff", Y: "#9250d6", O: "#2a1450", w: "#f2eaff" }, side: ["#5a2c9a", "#1c0d33"] },
  celestial: { map: { y: "#e8efff", Y: "#c8d8ff", O: "#2a3a7a", w: "#ffffff" }, side: ["#8aa2e0", "#2a3a6e"] },
  chrono: { map: { y: "#fff1cf", Y: "#e0a84e", O: "#5a3a10", w: "#fff9ec" }, side: ["#b8842e", "#5a3a10"] },
  infinite: { map: { y: "#fff6c2", Y: "#ffe27a", O: "#b5307a", w: "#ffffff" }, side: ["#d6a13a", "#7a2a5c"] },
  starfall: { map: { y: "#f5efff", Y: "#aebdff", O: "#49559d", w: "#ffffff" }, side: ["#727fc0", "#26335f"] },
  moss: { map: { y: "#e8ffcb", Y: "#93c979", O: "#426c36", w: "#ffffff" }, side: ["#65974b", "#284b27"] },
  marigold: { map: { y: "#fff3bf", Y: "#ffbd4a", O: "#a75b18", w: "#ffffff" }, side: ["#d88726", "#69390f"] },
  coral: { map: { y: "#ffe2cf", Y: "#ff8878", O: "#9c3f48", w: "#ffffff" }, side: ["#d75d58", "#702d42"] },
  sapphire: { map: { y: "#e2f3ff", Y: "#65a9ff", O: "#204eac", w: "#ffffff" }, side: ["#3472d5", "#183a7c"] },
  phantom: { map: { y: "#f8efff", Y: "#c5a8ff", O: "#665092", w: "#ffffff" }, side: ["#9072c8", "#463568"] },
  rift: { map: { y: "#d7fff7", Y: "#67f0e0", O: "#216c8e", w: "#ffffff" }, side: ["#38afbd", "#1c4d73"] },
  stormglass: { map: { y: "#f2ffff", Y: "#b4eeff", O: "#4a829d", w: "#ffffff" }, side: ["#79bbce", "#345c80"] },
  crownfire: { map: { y: "#fff4bd", Y: "#ff9b55", O: "#9d3d20", w: "#ffffff" }, side: ["#d5662c", "#652216"] },
  eventide: { map: { y: "#f4dcff", Y: "#d3a3ff", O: "#644598", w: "#ffffff" }, side: ["#a576d7", "#49336f"] },
};

/** Colour for one letter of a sprite, after any rarity tint. */
const colorFor = (letter: string, x: number, y: number, tint?: IconTint): string | undefined => {
  const base = PAL[letter];
  if (!base) return undefined;
  if (tint?.rainbow && "yYwO".includes(letter)) {
    const hue = (x * 26 + y * 17) % 360;
    const light = letter === "w" ? 94 : letter === "y" ? 80 : letter === "Y" ? 62 : 40;
    return `hsl(${hue} 95% ${light}%)`;
  }
  return tint?.map?.[letter] ?? base;
};

/* ---------------------------------------------------------
   Sprites
   --------------------------------------------------------- */

/** Gold star with a lit upper-left face, a bright rim, and a dark lower-right rim. */
function drawStar(): string[] {
  const g = newGrid();
  const cx = 7.5, cy = 8, R = 7.4, r = 3.3;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]);
  }
  fill(g, poly(pts), "Y");
  over(g, (px, py) => px + py < 15.2, "y");
  const solid = (x: number, y: number) => x >= 0 && x < 16 && y >= 0 && y < 16 && g[y][x] !== ".";
  const edges: Array<[number, number, string]> = [];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (!solid(x, y)) continue;
      if (!solid(x - 1, y) || !solid(x, y - 1)) edges.push([x, y, "w"]);
      else if (!solid(x + 1, y) || !solid(x, y + 1)) edges.push([x, y, "O"]);
    }
  }
  for (const [x, y, c] of edges) g[y][x] = c;
  return toRows(g);
}

/** One white die with a single red pip. */
function drawDie1(): string[] {
  const g = newGrid();
  box(g, 2, 0, 13, 10, "w");
  box(g, 12, 0, 13, 8, "l");
  box(g, 2, 9, 13, 10, "g");
  box(g, 7, 4, 8, 5, "R");
  return toRows(g);
}

/** Two dice: a shaded back die and a bordered front die. */
function drawDice2(): string[] {
  const g = newGrid();
  box(g, 1, 0, 8, 7, "l");
  box(g, 1, 6, 8, 7, "g");
  box(g, 2, 1, 3, 2, "d");
  box(g, 2, 4, 3, 5, "d");
  box(g, 5, 1, 15, 10, "d");
  box(g, 6, 2, 14, 9, "w");
  box(g, 13, 2, 14, 9, "l");
  box(g, 6, 8, 14, 9, "l");
  box(g, 8, 3, 9, 4, "n");
  box(g, 11, 3, 12, 4, "n");
  box(g, 8, 6, 9, 7, "n");
  box(g, 11, 6, 12, 7, "n");
  return toRows(g);
}

/** Flame with a dark right flank, an amber body and a yellow core. */
function drawFlame(): string[] {
  const g = newGrid();
  const outer = poly([[8, 0], [11, 3], [12, 6], [11, 9], [5, 9], [4, 6], [5, 3]]);
  fill(g, outer, "f");
  over(g, and(outer, (px) => px > 9.5), "H");
  fill(g, poly([[8, 3], [10, 6], [10, 8], [6, 8], [6, 6]]), "F");
  fill(g, poly([[8, 5], [9, 7], [7, 7]]), "h");
  return toRows(g);
}

/** Slot machine: red cabinet, three reels with symbols, and a lever. */
function drawSlots(): string[] {
  const g = newGrid();
  box(g, 1, 3, 13, 9, "R");
  box(g, 13, 3, 13, 9, "E");
  box(g, 1, 9, 13, 9, "E");
  box(g, 1, 1, 13, 2, "Y");
  box(g, 2, 1, 12, 1, "y");
  box(g, 1, 10, 13, 11, "d");
  box(g, 1, 10, 13, 10, "g");
  for (const [x0, sym] of [[2, "C"], [6, "G"], [10, "Y"]] as const) {
    box(g, x0, 5, x0 + 2, 6, "w");
    box(g, x0, 7, x0 + 2, 7, "l");
    put(g, x0 + 1, 6, sym);
  }
  box(g, 14, 4, 14, 9, "g");
  box(g, 14, 2, 15, 3, "R");
  return toRows(g);
}

/** Lightning bolt with a lit upper-left face. */
function drawBolt(): string[] {
  const g = newGrid();
  const shape = poly([[10, 0], [4, 5], [8, 5], [5, 9], [12, 4], [8, 4], [11, 0]]);
  fill(g, shape, "y");
  over(g, and(shape, (px) => px > 8.5), "Y");
  over(g, and(shape, (px, py) => px < 7 && py < 3.5), "w");
  return toRows(g);
}

/** Magnifying glass: dark metal ring, icy lens, wood handle. */
function drawLens(): string[] {
  const g = newGrid();
  const outer = disc(7.5, 6.5, 5.6);
  const inner = disc(7.5, 6.5, 3.9);
  fill(g, ring(outer, inner), "d");
  over(g, and(ring(outer, inner), (px, py) => px < 7.5 && py < 6.5), "l");
  fill(g, inner, "c");
  over(g, and(inner, (px, py) => px > 7.5 && py > 6.5), "C");
  put(g, 5, 4, "w");
  put(g, 4, 5, "w");
  for (const [x, y] of [[11, 9], [12, 9], [12, 10], [13, 10], [13, 11], [14, 11], [14, 12], [15, 12], [15, 13]]) put(g, x, y, "q");
  put(g, 14, 12, "Q");
  put(g, 15, 13, "Q");
  return toRows(g);
}

/** Almond eye with a blue iris, a black pupil and a glint. */
function drawEye(): string[] {
  const g = newGrid();
  const outer = ellipse(7.5, 6.5, 7.6, 4.8);
  const sclera = ellipse(7.5, 6.5, 6.6, 3.9);
  fill(g, outer, "d");
  fill(g, sclera, "w");
  over(g, and(sclera, (_, py) => py > 8.6), "l");
  const iris = disc(7.5, 6.5, 3.1);
  fill(g, iris, "C");
  over(g, and(iris, (_, py) => py > 6.5), "b");
  fill(g, disc(7.5, 6.5, 1.5), "n");
  put(g, 6, 5, "w");
  return toRows(g);
}

/** Parchment map with fold lines, a red route and an X marker. */
function drawMap(): string[] {
  const g = newGrid();
  box(g, 1, 1, 14, 9, "y");
  box(g, 1, 1, 14, 1, "Y");
  box(g, 1, 9, 14, 9, "O");
  box(g, 1, 1, 1, 9, "Y");
  box(g, 5, 2, 5, 8, "Y");
  box(g, 10, 2, 10, 8, "Y");
  for (const [x, y] of [[2, 8], [3, 7], [4, 7], [6, 6], [7, 6], [8, 5]]) put(g, x, y, "R");
  for (const [x, y] of [[11, 3], [13, 3], [12, 4], [11, 5], [13, 5]]) put(g, x, y, "R");
  return toRows(g);
}

/** Three-spike gold crown with a band and jewels. */
function drawCrown(): string[] {
  const g = newGrid();
  const shape = poly([[2, 4], [5, 7], [8, 2], [11, 7], [14, 4], [14, 9], [2, 9]]);
  fill(g, shape, "y");
  over(g, and(shape, (_, py) => py > 7.5), "Y");
  over(g, and(shape, (px, py) => px > 10 && py < 7.5), "Y");
  box(g, 2, 9, 14, 9, "O");
  put(g, 8, 5, "R");
  put(g, 5, 8, "C");
  put(g, 11, 8, "C");
  put(g, 7, 5, "w");
  put(g, 8, 4, "w");
  return toRows(g);
}

/** One large sparkle with a white core, plus two small gold sparkles. */
function drawSparkles(): string[] {
  const g = newGrid();
  fill(g, sparkle(7.5, 6.5, 5.8, 1), "y");
  fill(g, sparkle(7.5, 6.5, 2, 1), "w");
  fill(g, sparkle(2.5, 2.5, 2.6, 0.6), "Y");
  fill(g, sparkle(13.5, 3.5, 2.2, 0.6), "Y");
  return toRows(g);
}

/** Green up-arrow with a lit left face and a dark shaft. */
function drawArrowUp(): string[] {
  const g = newGrid();
  const shape = poly([[8, 0], [14, 6], [10, 6], [10, 10], [6, 10], [6, 6], [2, 6]]);
  fill(g, shape, "G");
  over(g, and(shape, (px) => px > 8), "M");
  over(g, and(shape, (_, py) => py > 8.5), "D");
  over(g, and(shape, (px, py) => px < 7.5 && py < 5), "a");
  return toRows(g);
}

/** A cluster of three ice crystals. */
function drawCrystals(): string[] {
  const g = newGrid();
  const left = poly([[2, 4], [5, 6], [5, 10], [1, 9]]);
  const right = poly([[12, 3], [14, 6], [13, 10], [11, 9]]);
  const center = poly([[8, 0], [11, 4], [10, 10], [6, 10], [5, 4]]);
  fill(g, left, "I");
  over(g, and(left, (px) => px > 3.5), "J");
  fill(g, right, "J");
  over(g, and(right, (px) => px > 13), "K");
  fill(g, center, "i");
  over(g, and(center, (px) => px > 8.5), "I");
  over(g, and(center, (px, py) => px > 9 && py > 6), "J");
  put(g, 7, 2, "w");
  put(g, 7, 3, "w");
  put(g, 6, 5, "w");
  return toRows(g);
}

/** Medal on a red and white ribbon. */
function drawMedal(): string[] {
  const g = newGrid();
  fill(g, poly([[3, 0], [6, 0], [8, 5], [5, 5]]), "R");
  fill(g, poly([[10, 0], [13, 0], [11, 5], [8, 5]]), "E");
  fill(g, disc(7.5, 7.5, 4.6), "O");
  fill(g, disc(7.5, 7.5, 3.6), "y");
  over(g, and(disc(7.5, 7.5, 3.6), (px, py) => px > 7.5 && py > 7.5), "Y");
  fill(g, disc(7.5, 7.5, 1.4), "w");
  return toRows(g);
}

/** Money bag with a green body, a tied neck and a gold coin. */
function drawMoneyBag(): string[] {
  const g = newGrid();
  box(g, 5, 0, 10, 2, "M");
  box(g, 4, 2, 11, 3, "O");
  const body = disc(7.5, 9.5, 5.7);
  fill(g, body, "G");
  over(g, and(body, (px, py) => px > 8 && py > 8.5), "M");
  over(g, and(body, (px, py) => px < 6 && py < 9), "a");
  const coin = disc(7.5, 7.5, 2.4);
  fill(g, coin, "y");
  over(g, and(coin, (px, py) => px > 7.5 && py > 7.5), "Y");
  return toRows(g);
}

/** Treasure chest with metal bands, a lock and coins spilling from the lid. */
function drawChest(): string[] {
  const g = newGrid();
  box(g, 1, 4, 14, 10, "Q");
  box(g, 1, 1, 14, 4, "q");
  box(g, 1, 4, 14, 4, "Q");
  box(g, 1, 8, 14, 8, "q");
  box(g, 7, 1, 8, 10, "Y");
  box(g, 6, 5, 9, 7, "y");
  put(g, 7, 6, "n");
  put(g, 8, 6, "n");
  for (const [x, y] of [[3, 0], [4, 0], [7, 0], [8, 0], [10, 0], [11, 0]]) put(g, x, y, y === 0 && (x === 7 || x === 8) ? "Y" : "y");
  return toRows(g);
}

/** Calendar page: red header with binder rings, a grid of days, one ticked day. */
function drawCalendar(): string[] {
  const g = newGrid();
  box(g, 1, 2, 14, 14, "w");
  box(g, 1, 2, 14, 5, "R");
  box(g, 1, 14, 14, 14, "l");
  box(g, 4, 0, 5, 3, "n");
  box(g, 10, 0, 11, 3, "n");
  for (const [x, y] of [[3, 8], [6, 8], [9, 8], [12, 8], [3, 11], [6, 11], [12, 11]]) box(g, x, y, x + 1, y + 1, "g");
  box(g, 9, 11, 10, 12, "G");
  put(g, 10, 11, "w");
  return toRows(g);
}

/* =========================================================
   CLOVER GEMS + FOREVER UPGRADES
   Every stone is cut from the same gem: the top-left facets
   catch the light, the lower-right sinks into deep blue, and
   the cuts meet in a white star at the heart of the stone.
   ========================================================= */

/** The facet ramp: white shine upper-left, deep blue lower-right. */
const gemTone = (px: number, py: number) => {
  const s = px + py;
  return s <= 4 ? "w" : s <= 6 ? "i" : s <= 9 ? "c" : s <= 15 ? "C" : s <= 23 ? "b" : "K";
};

const boxShape = (x0: number, y0: number, x1: number, y1: number): Shape =>
  (px, py) => px >= x0 && px <= x1 && py >= y0 && py <= y1;

/** Paints gem-cut shapes with one facet ramp across the whole stone. */
function gemCut(g: Grid, ...shapes: Shape[]): void {
  for (let y = 0; y < g.length; y++) {
    for (let x = 0; x < g[y].length; x++) {
      if (shapes.some((shape) => shape(x, y))) g[y][x] = gemTone(x, y);
    }
  }
}

/** Bright pixels: the white star where facets meet, or a lit facet edge. */
function gemGlint(g: Grid, cells: Array<[number, number]>, color = "w"): void {
  for (const [x, y] of cells) put(g, x, y, color);
}

/** A shape cut out of a 16x16 mask of "X" pixels. */
const fromMask = (rows: string[]): Shape => (px, py) => rows[py]?.[px] === "X";

/** Four-point gem star: luck that never resets. */
function drawGemStar(): string[] {
  const g = newGrid();
  gemCut(g, poly([[7.5, 0], [9.4, 5.6], [15, 7.5], [9.4, 9.4], [7.5, 15], [5.6, 9.4], [0, 7.5], [5.6, 5.6]]));
  gemGlint(g, [[7, 7], [8, 7], [7, 8], [8, 8]]);
  gemGlint(g, [[8, 6], [6, 8]], "i");
  return toRows(g);
}

/** Faceted hexagon coin: every payout is worth more. */
function drawGemCoin(): string[] {
  const g = newGrid();
  gemCut(g, poly([[4, 1], [12, 1], [15, 7.5], [12, 14], [4, 14], [1, 7.5]]));
  // the inner brilliant cut
  gemGlint(g, [[6, 6], [9, 6], [5, 7], [10, 7], [5, 8], [10, 8], [6, 9], [9, 9]], "i");
  gemGlint(g, [[7, 5], [8, 5], [7, 9], [8, 9]], "i");
  gemGlint(g, [[7, 7], [8, 7], [7, 8], [8, 8]]);
  return toRows(g);
}

/** Three gem crystals: the mint pays out more gems per rebirth. */
function drawGemCluster(): string[] {
  const g = newGrid();
  gemCut(
    g,
    poly([[7.5, 0], [10.5, 4], [10.5, 12], [7.5, 15], [4.5, 12], [4.5, 4]]),
    poly([[1.5, 6], [3.5, 9], [3.5, 13], [1.5, 15], [-0.5, 13], [-0.5, 9]]),
    poly([[13.5, 5], [15.5, 8], [15.5, 13], [13.5, 15], [12, 13], [12, 8]]),
  );
  // lit edges on every crystal
  gemGlint(g, [[5, 2], [5, 3]], "w");
  gemGlint(g, [[1, 7], [1, 8]], "i");
  gemGlint(g, [[13, 6], [13, 7]], "i");
  return toRows(g);
}

/** Gem-cut bolt: the auto spinner keeps its pace. */
const GEM_BOLT = [
  "................",
  ".......XXXX.....",
  "......XXXX......",
  ".....XXXX.......",
  "....XXXX........",
  "...XXXXXXXXXX...",
  "..XXXXXXXXXXX...",
  ".........XXXX...",
  "........XXXX....",
  ".......XXXX.....",
  "......XXXX......",
  ".....XXXX.......",
  "....XXXX........",
  "...XXXX.........",
  "................",
  "................",
];

function drawGemBolt(): string[] {
  const g = newGrid();
  gemCut(g, fromMask(GEM_BOLT));
  // the lit edge of the strike
  gemGlint(g, [[7, 2], [6, 3], [5, 4]], "w");
  gemGlint(g, [[9, 8], [8, 9], [7, 10]], "i");
  return toRows(g);
}

/** Gem die: crits are cast, never promised. */
function drawGemDie(): string[] {
  const g = newGrid();
  gemCut(g, poly([[3, 1], [13, 1], [15, 3], [15, 12], [13, 14], [3, 14], [1, 12], [1, 3]]));
  gemGlint(g, [[5, 5], [6, 5], [5, 6], [6, 6]]);
  gemGlint(g, [[10, 10], [11, 10], [10, 11], [11, 11]]);
  gemGlint(g, [[3, 2], [4, 2], [2, 3], [2, 4]], "i");
  return toRows(g);
}

/** The brilliant cut: every variant has more ways to shine. */
function drawGemDiamond(): string[] {
  const g = newGrid();
  gemCut(g, poly([[3, 3], [5, 1], [11, 1], [13, 3], [8, 15]]));
  gemGlint(g, [[4, 5], [5, 7], [6, 9], [7, 11], [12, 5], [11, 7], [10, 9], [9, 11]], "i");
  gemGlint(g, [[6, 3], [7, 3], [6, 4]]);
  return toRows(g);
}

/* Tickets, quests and clover pack containers. */

/** A star polygon: `n` points, alternating outer and inner radius. */
const starPts = (cx: number, cy: number, outer: number, inner: number, n = 5): Array<[number, number]> =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const r = i % 2 === 0 ? outer : inner;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as [number, number];
  });

function drawTicket(): string[] {
  const g = newGrid();
  box(g, 1, 3, 14, 12, "S");
  box(g, 1, 3, 14, 3, "s");
  box(g, 1, 3, 1, 12, "s");
  box(g, 1, 12, 14, 12, "T");
  box(g, 14, 3, 14, 12, "T");
  put(g, 14, 12, "U");
  // the two half-moon notches cut into the long edges
  fill(g, disc(0.6, 8, 1.9), ".");
  fill(g, disc(15.4, 8, 1.9), ".");
  // perforation between stub and body
  for (let y = 4; y <= 11; y += 2) put(g, 10, y, "w");
  // gold star on the body
  fill(g, poly(starPts(5.6, 7.7, 3.4, 1.5)), "Y");
  over(g, poly(starPts(5.6, 7.7, 3.4, 1.5)), "Y");
  over(g, and(poly(starPts(5.6, 7.7, 3.4, 1.5)), (px, py) => px + py < 13), "y");
  put(g, 5, 7, "w");
  // stub bars
  box(g, 12, 5, 13, 5, "s");
  box(g, 12, 7, 13, 7, "s");
  box(g, 12, 9, 13, 9, "s");
  return toRows(g);
}

function drawQuests(): string[] {
  const g = newGrid();
  // the sheet
  box(g, 3, 3, 12, 12, "w");
  box(g, 12, 3, 12, 12, "l");
  box(g, 3, 12, 12, 12, "l");
  // rolled top and bottom
  box(g, 2, 1, 13, 3, "q");
  box(g, 2, 1, 13, 1, "Y");
  box(g, 2, 3, 13, 3, "Q");
  box(g, 2, 12, 13, 14, "q");
  box(g, 2, 12, 13, 12, "Y");
  box(g, 2, 14, 13, 14, "Q");
  put(g, 1, 2, "O");
  put(g, 14, 2, "O");
  put(g, 1, 13, "O");
  put(g, 14, 13, "O");
  // two ticked tasks and one still to do
  put(g, 4, 5, "G"); put(g, 5, 5, "G");
  box(g, 7, 5, 11, 5, "d");
  put(g, 4, 7, "G"); put(g, 5, 7, "G");
  box(g, 7, 7, 10, 7, "d");
  put(g, 4, 9, "d"); put(g, 5, 9, "d");
  box(g, 7, 9, 11, 9, "d");
  put(g, 4, 6, "M"); put(g, 5, 6, "M");
  put(g, 4, 8, "M"); put(g, 5, 8, "M");
  return toRows(g);
}

/* Hand-authored ticket-shop containers. One sprite each, every row 16px. */
const PACK_SACK_ROWS: string[] = [
  '....aG..GGaG....',
  '...aGGGGGGGGG...',
  '..aGwwGGaGwwGG..',
  '..GGGGGGGGGGGM..',
  '...MGGGGGGGGM...',
  '....OOOOOOOO....',
  '...OqqqqqqqqO...',
  '..QqqqqqqqqqqQ..',
  '.QqqqqqqqqqqqQQ.',
  '.QqqqqaGGqqqqQQ.',
  '.QqqqaGGGGqqqQQ.',
  '.QqqqqGMMGqqqQQ.',
  '.QqqqqqMMqqqqQQ.',
  '.QQqqqqqqqqqQQQ.',
  '..QQQQQQQQQQQQ..',
  '...QQQQQQQQQQ...',
];
const PACK_CHEST_ROWS: string[] = [
  '................',
  '....GG....GG....',
  '..GGGGGGGGGGGG..',
  '..GGwwGGwwGGGG..',
  '...GGGGGGGGGG...',
  '..YYYYYYYYYYYY..',
  '.YyyyyyyyyyyyyY.',
  '.YQQQQQQQQQQQQY.',
  '.YYYYYYYYYYYYYY.',
  '.YqqqqqqqqqqqqY.',
  '.YqqqqqYYqqqqqY.',
  '.YqqqqYnnYqqqqY.',
  '.YqqqqqYYqqqqqY.',
  '.YYYYYYYYYYYYYY.',
  '..BBBBBBBBBBBB..',
  '................',
];

function drawPackSack(): string[] { return PACK_SACK_ROWS.slice(); }
function drawPackChest(): string[] { return PACK_CHEST_ROWS.slice(); }

const DRAWN: Record<string, IconDef> = {
  die1: { side: SIDE.gray, rows: drawDie1() },
  dice2: { side: SIDE.gray, rows: drawDice2() },
  flame: { side: SIDE.fire, rows: drawFlame() },
  slots: { side: ["#a8323f", "#5a1420"], rows: drawSlots() },
  bolt: { side: SIDE.gold, rows: drawBolt() },
  lens: { side: SIDE.gray, rows: drawLens() },
  eye: { side: SIDE.cyan, rows: drawEye() },
  map: { side: ["#c9a24a", "#6e4f1a"], rows: drawMap() },
  crown: { side: SIDE.gold, rows: drawCrown() },
  sparkles: { side: SIDE.gold, rows: drawSparkles() },
  arrowUp: { side: SIDE.green, rows: drawArrowUp() },
  crystals: { side: SIDE.ice, rows: drawCrystals() },
  medal: { side: SIDE.gold, rows: drawMedal() },
  moneyBag: { side: SIDE.green, rows: drawMoneyBag() },
  chest: { side: ["#8a5a1e", "#3d2404"], rows: drawChest() },
  star: { side: SIDE.gold, rows: drawStar() },
  calendar: { side: SIDE.gray, rows: drawCalendar() },
  shine: { side: SIDE.gold, rows: drawShine() },
  ticket: { side: SIDE.pink, rows: drawTicket() },
  quests: { side: ["#8a5a1e", "#3d2404"], rows: drawQuests() },
  cloverSack: { side: ["#9a6b36", "#5c3615"], rows: drawPackSack() },
  cloverChest: { side: ["#b77c19", "#57320b"], rows: drawPackChest() },
  gemStar: { side: SIDE.gem, rows: drawGemStar() },
  gemCoin: { side: SIDE.gem, rows: drawGemCoin() },
  gemCluster: { side: SIDE.gem, rows: drawGemCluster() },
  gemBolt: { side: SIDE.gem, rows: drawGemBolt() },
  gemDie: { side: SIDE.gem, rows: drawGemDie() },
  gemDiamond: { side: SIDE.gem, rows: drawGemDiamond() },
  cursed: { side: SIDE.cursed, rows: drawCursed() },
  glitched: {
    side: ["#247d8c", "#33204f"],
    rows: [
      "...CC.....PP....", "..cwwCCCCppPP...", "..cwbbbbbbbpP...", "CcwbCcbbcPbpPP..",
      "CcwbCwbbPwbbpP..", "..cbbCwwPbbbpP..", ".CwcbbCCbbbpp...", ".CwcbbCCbbbpp...",
      "..cbbPwwCbbbpP..", "..cbbPwbbCwbbpP.", "..cwbbbbbbbpP...", "...CCwwwwwPP....",
      "...CC....PP.....", "....C.....P.....", "..C.........P...", "................",
    ],
  },
};
Object.assign(ICONS, DRAWN);

/** A big yellow four-point shine with a white-hot core and two small glints. */
function drawShine(): string[] {
  const g = newGrid();
  fill(g, sparkle(7.5, 7.5, 7.4, 1.25), "Y");
  over(g, sparkle(7.5, 7.5, 5, 0.75), "y");
  fill(g, sparkle(7.5, 7.5, 2.2, 0.75), "w");
  over(g, and(sparkle(7.5, 7.5, 7.4, 1.25), (px, py) => px > 8.5 && py > 8.5), "O");
  fill(g, sparkle(2.5, 12.5, 2.2, 0.55), "y");
  fill(g, sparkle(13, 2.5, 1.9, 0.55), "y");
  put(g, 2, 12, "w");
  put(g, 13, 2, "w");
  return toRows(g);
}

/** A lacquered violet skull with glowing crimson eyes. */
function drawCursed(): string[] {
  const g = newGrid();
  const dome = ellipse(8, 6.5, 6, 5.6);
  const jaw = area(4, 10, 11, 13);
  fill(g, dome, "k");
  fill(g, jaw, "k");
  // light from the upper left, shade on the right
  over(g, and(dome, (px, py) => px < 6.5 && py < 5.5), "e");
  over(g, (px) => px > 10.5, "m");
  over(g, and(jaw, (px) => px > 9.5), "m");
  // eye sockets with a hot crimson glow
  fill(g, ellipse(5.6, 7.3, 1.75, 1.7), "x");
  fill(g, ellipse(10.4, 7.3, 1.75, 1.7), "x");
  put(g, 5, 6, "z");
  put(g, 9, 6, "z");
  // nose and teeth
  put(g, 7, 9, "n");
  put(g, 8, 9, "n");
  for (const x of [5, 7, 9]) { put(g, x, 12, "n"); put(g, x, 13, "n"); }
  put(g, 6, 1, "w");
  put(g, 5, 2, "w");
  return toRows(g);
}

const W = 16;
const PAD = 1;
const OFFSETS: Array<[number, number, 0 | 1]> = [[-1, 0, 0], [-1, 1, 0], [-2, 1, 1], [-2, 2, 1]];
const SIZE = W + 2 + PAD * 2; // 20 native pixels

const cache = new Map<string, string>();

const toGray = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const v = Math.round((0.3 * r + 0.59 * g + 0.11 * b) * 0.88);
  const h = v.toString(16).padStart(2, "0");
  return `#${h}${h}${h}`;
};

function normalize(rows: string[]): string[] {
  const out = rows.map((row) => row.padEnd(W, ".").slice(0, W));
  while (out.length < W) out.push(".".repeat(W));
  return out.slice(0, W);
}

/* ---------------------------------------------------------
   Pixel type used to burn text straight into a sprite.
   Digits are 3px wide, some letters 4 or 5, all 5px tall.
   --------------------------------------------------------- */

const FONT: Record<string, string[]> = {
  "0": ["###", "#.#", "#.#", "#.#", "###"],
  "1": [".#.", ".##", ".#.", ".#.", "###"],
  "2": ["###", "..#", "###", "#..", "###"],
  "3": ["###", "..#", "###", "..#", "###"],
  "4": ["#.#", "#.#", "###", "..#", "..#"],
  "5": ["###", "#..", "###", "..#", "###"],
  "6": ["###", "#..", "###", "#.#", "###"],
  "7": ["###", "..#", "..#", "..#", "..#"],
  "8": ["###", "#.#", "###", "#.#", "###"],
  "9": ["###", "#.#", "###", "..#", "###"],
  A: [".##.", "#..#", "####", "#..#", "#..#"],
  B: ["###.", "#..#", "###.", "#..#", "###."],
  K: ["#..#", "#.#.", "##..", "#.#.", "#..#"],
  L: ["#..", "#..", "#..", "#..", "###"],
  M: ["#...#", "##.##", "#.#.#", "#...#", "#...#"],
  X: ["#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
  D: ["###.", "#..#", "#..#", "#..#", "###."],
  V: ["#...#", "#...#", "#...#", ".#.#.", "..#.."],
  P: ["####", "#..#", "####", "#...", "#..."],
  S: ["####", "#...", "####", "...#", "####"],
  O: [".##.", "#..#", "#..#", "#..#", ".##."],
  C: [".##.", "#..#", "#...", "#..#", ".##."],
  T: ["#####", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", ".###."],
  // narrow multiplication mark, centred on the 5px baseline
  x: ["...", "#.#", ".#.", "#.#", "..."],
};

/** Burns `text` into the lower strip of a sprite on a dark plate. */
function stampText(rows: string[], text: string): string[] {
  const glyphs = text
    .split("")
    .map((c) => FONT[c] ?? FONT[c.toUpperCase()])
    .filter((g): g is string[] => Array.isArray(g));
  if (!glyphs.length) return rows;

  const textW = glyphs.reduce((sum, g) => sum + g[0].length, 0) + (glyphs.length - 1);
  const plateTop = 9;
  const plateH = 7; // rows 9..15, so the badge anchors to the bottom edge
  const plateW = Math.min(W, textW + 2);
  const plateX = Math.max(0, Math.floor((W - plateW) / 2));
  const textX = plateX + Math.max(0, Math.floor((plateW - textW) / 2));

  const out = rows.map((row) => row.split(""));
  for (let y = plateTop; y < Math.min(W, plateTop + plateH); y++) {
    for (let x = plateX; x < plateX + plateW; x++) out[y][x] = "n";
  }
  let x = textX;
  for (const glyph of glyphs) {
    for (let gy = 0; gy < glyph.length; gy++) {
      for (let gx = 0; gx < glyph[gy].length; gx++) {
        const tx = x + gx;
        if (glyph[gy][gx] === "#" && tx >= 0 && tx < W) out[plateTop + 1 + gy][tx] = "w";
      }
    }
    x += glyph[0].length + 1;
  }
  return out.map((row) => row.join(""));
}

/**
 * Returns a data URL for a 20x20 pixel sprite.
 * `muted` renders it in grayscale, `stamp` burns pixel text into the lower strip.
 */
export function getPixelIconUrl(name: IconName, muted = false, stamp?: string, tintId?: string): string {
  const key = `${name}:${muted ? 1 : 0}:${stamp ?? ""}:${tintId ?? ""}`;
  const cached = cache.get(key);
  if (cached) return cached;

  // Reuse the normal clover renderer, not a separately drawn currency shape.
  if (name === "cloverGem") {
    let url = getCloverUrl("cloverGem");
    if (muted) {
      const source = getCloverCanvas("cloverGem");
      const canvas = document.createElement("canvas");
      canvas.width = source.width;
      canvas.height = source.height;
      const ctx = canvas.getContext("2d")!;
      ctx.filter = "grayscale(1) brightness(0.88)";
      ctx.drawImage(source, 0, 0);
      url = canvas.toDataURL("image/png");
    }
    cache.set(key, url);
    return url;
  }

  const def = ICONS[name];
  const tintSpec = tintId ? TIER_TINTS[tintId] : undefined;
  const sideColors = tintSpec?.side ?? def.side;
  const plain = normalize(def.rows);
  const rows = stamp ? stampText(plain, stamp) : plain;
  const tint = (hex: string) => (muted ? toGray(hex) : hex);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  const ox = PAD + 2;
  const oy = PAD;
  const cells: Array<[number, number, string]> = [];
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const letter = rows[y][x];
      const color = letter === "." ? undefined : colorFor(letter, x, y, tintSpec);
      if (color) cells.push([x, y, color]);
    }
  }

  // 1px black outline around the art plus its whole extrusion
  const mask = new Uint8Array(SIZE * SIZE);
  for (const [x, y] of cells) {
    for (const [dx, dy] of [[0, 0, 0] as const, ...OFFSETS]) {
      const cx = ox + x + dx;
      const cy = oy + y + dy;
      for (let ay = -1; ay <= 1; ay++) {
        for (let ax = -1; ax <= 1; ax++) mask[(cy + ay) * SIZE + cx + ax] = 1;
      }
    }
  }
  ctx.fillStyle = "#050a0e";
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) ctx.fillRect(i % SIZE, Math.floor(i / SIZE), 1, 1);
  }

  // solid extrusion, far to near
  for (let i = OFFSETS.length - 1; i >= 0; i--) {
    const [dx, dy, far] = OFFSETS[i];
    ctx.fillStyle = tint(sideColors[far]);
    for (const [x, y] of cells) ctx.fillRect(ox + x + dx, oy + y + dy, 1, 1);
  }

  // the lit front face
  for (const [x, y, color] of cells) {
    ctx.fillStyle = tint(color);
    ctx.fillRect(ox + x, oy + y, 1, 1);
  }

  const url = canvas.toDataURL("image/png");
  cache.set(key, url);
  return url;
}
