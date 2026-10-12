/* =====================================================================
   SPRITES — pixel art desenhada em texto.
   WRICK — cabelo arco-íris animado, camisa marrom, calça preta,
   pele branca, olhos roxos, tênis laranja, contorno preto.
   ===================================================================== */

const SPRITE_PALETTE = {
  k: '#000000',
  h: '#ff0000',
  H: '#aa0000',
  s: '#ffffff',
  S: '#e0e0e0',
  e: '#8a2be2',
  m: '#ffb0b0',
  r: '#c02030',
  g: '#8b5a2b',
  G: '#6b4226',
  p: '#1a1a1a',
  P: '#000000',
  t: '#ff8a2a',
  w: '#ffffff',
  c: '#ff9ecf',
  C: '#d977a8',
  y: '#ffd84a',
  Y: '#d99a1c',
  x: '#c0203a',
  q: '#fff7e8',
  Q: '#e6d4b6',
  O: '#ff9a3a',
  a: '#a6ec5a',
  A: '#6fb52e',
  n: '#ff8a2a',
  N: '#cf5f14',
  v: '#bfe8ff',
  i: '#c4c8d4',
  I: '#7d8294',
  z: '#ff5a7a',
};

const STICK_HEAD = [
  '...kkkkk....',
  '..khhhhhkk..',
  '.khhhhhhhhk.',
  '.khhhhhhhhhk',
  '.khhHsshsshk',
  '.khhsssssssk',
  '.khsssesseSk',
  '.khsssesseSk',
  '.kssmsssssmk',
  '..ksssrrssk.',
];
const STICK_HEAD_BLINK = STICK_HEAD.slice();
STICK_HEAD_BLINK[6] = '.khsssssssSk';
STICK_HEAD_BLINK[7] = '.khssskssksk';
const STICK_HEAD_HURT = STICK_HEAD.slice();
STICK_HEAD_HURT[6] = '.khssksssskk';
STICK_HEAD_HURT[7] = '.khsssksskSk';
STICK_HEAD_HURT[9] = '..kssskkssk.';

const STICK_HEAD_GRIN = STICK_HEAD.slice();
STICK_HEAD_GRIN[8] = '.ksksssssksk';
STICK_HEAD_GRIN[9] = '..kskkkkksk.';
const STICK_HEAD_GRIN2 = STICK_HEAD_GRIN.slice();
STICK_HEAD_GRIN2[6] = '.khsssssssSk';
STICK_HEAD_GRIN2[7] = '.khskskskssk';

const STICK_BODY = {
  idle: [
    '..kggggggk..',
    '.sggggggggs.',
    '.sgggggggGs.',
    '..pppppppP..',
    '..ppp..ppp..',
    '.tttr..tttr.',
  ],
  walk1: [
    '..kggggggk..',
    '..sgggggggs.',
    '.sgggggggG..',
    '..pppppppP..',
    '.ppp....pp..',
    'tttr.....ttr',
  ],
  walk2: [
    '..kggggggk..',
    '.sggggggggs.',
    '.sgggggggGs.',
    '..pppppppP..',
    '...pppppp...',
    '...ttrttr...',
  ],
  walk3: [
    '..kggggggk..',
    '.sgggggggs..',
    '..sggggggGs.',
    '..pppppppP..',
    '..pp....ppp.',
    '.tttr....ttr',
  ],
  jump: [
    's.kggggggk.s',
    's.gggggggg.s',
    '..gggggggG..',
    '..pppppppP..',
    '..pp....pp..',
    '.ttr....ttr.',
  ],
  fall: [
    '.skggggggks.',
    '.sggggggggs.',
    '..gggggggG..',
    '..pppppppP..',
    '...pp..pp...',
    '..ttr..ttr..',
  ],
  interact: [
    '..kggggggk..',
    '.sgggggggsss',
    '.sgggggggG..',
    '..pppppppP..',
    '..ppp..ppp..',
    '.tttr..tttr.',
  ],
};

const NPC_BASE = [
  '..kk....kk..',
  '.kcck..kcck.',
  '.kcck..kcck.',
  '..kckkkkck..',
  '.kccccccccck',
  'kcccccccccck',
  'kcceccccecck',
  'kcceccccecck',
  'kcmcckkccmck',
  'kcccwwwwccck',
  '.kccwwwwcck.',
  '..kkkkkkkk..',
];
function npcVariant(r6, r7, r8) {
  const f = NPC_BASE.slice();
  f[6] = r6; f[7] = r7; if (r8) f[8] = r8;
  return f;
}

function friendFace(base, rows) {
  const f = base.slice();
  for (const k in rows) f[k] = rows[k];
  return f;
}

const ERI = [
  '....kkkk....',
  '...kqqqqk...',
  '..kqqqqqqk..',
  '.kqqwqqqqqk.',
  '.kqqqqqqqQk.',
  'kqqeqqqqeqQk',
  'kqqeqqqqeqQk',
  'kqmqkqqkqmQk',
  'kqqqqkkqqqQk',
  '.kqqqqqqqQk.',
  '.kQqqqqqQQk.',
  '..kkQQQQkk..',
  '...OO..OO...',
];
const TORAJO = [
  '.....kk.kkk.',
  '.....khkGGGk',
  '..kkkkhkkkk.',
  '.kaaaaaaaaak',
  'kaaaaaaaaaAk',
  'kaawaaaaaaAk',
  'kaaeaaaaeaAk',
  'kaaeaaaaeaAk',
  'kamakaakamAk',
  'kaaaakkaaaAk',
  '.kaaaaaaaAk.',
  '.kAaaaaaAAk.',
  '..kkk..kkk..',
];
const ZOOM = [
  '...kkkkkk...',
  '..knnnnnnk..',
  '.knnnnnnnNk.',
  'knvvvvvvvnNk',
  'knvwvvvvvnNk',
  'knvevvvevnNk',
  'knvvkvvkvnNk',
  'knnvvkkvvnNk',
  '.knnnnnnnNk.',
  'kknnnnnnnNkk',
  '.knnnwwnnNk.',
  '.knnnnnnnNk.',
  '.knnk..knNk.',
  '.kkkk..kkkk.',
];
// ===== SANS (Undertale) =====
const SANS = [
  '..kkkkkk..',
  '.kwwwwwwk.',
  'kwwwwwwwwk',
  'kwkwkkwkwk',
  'kwwwwwwwwk',
  'kwwkkkkwwk',
  '.kwwwwwwk.',
  '..kkkkkk..',
  '.kwwwwwwk.',
  'kwwwwwwwwk',
  'kwwwwwwwwk',
  'kwwwwwwwwk',
  'kwwwwwwwwk',
  '.kk....kk.',
  '.kk....kk.',
  '.kkk..kkk.',
];

const CHICK = [
  '...kkkk...',
  '..kyyyyk..',
  '.kyyyyyyk.',
  '.kyeyyeyk.',
  '.kyyOOyyk.',
  'kyyyyyyyyk',
  'kYyyyyyyYk',
  '.kyyyyyyk.',
  '..kkkkkk..',
  '..O....O..',
];
const SPRITES = {
   sans: {
  w: 10, h: 16,
  frames: {
    idle:   SANS,
    wink:   (() => {
      const f = SANS.slice();
      f[3] = 'kwkwwwkwkk';
      return f;
    })(),
  },
},
  player: {
    w: 12, h: 16,
    frames: {
      idle:     STICK_HEAD.concat(STICK_BODY.idle),
      blink:    STICK_HEAD_BLINK.concat(STICK_BODY.idle),
      walk1:    STICK_HEAD.concat(STICK_BODY.walk1),
      walk2:    STICK_HEAD.concat(STICK_BODY.walk2),
      walk3:    STICK_HEAD.concat(STICK_BODY.walk3),
      jump:     STICK_HEAD.concat(STICK_BODY.jump),
      fall:     STICK_HEAD.concat(STICK_BODY.fall),
      interact: STICK_HEAD.concat(STICK_BODY.interact),
      hurt:     STICK_HEAD_HURT.concat(STICK_BODY.jump),
      grin:     STICK_HEAD_GRIN.concat(STICK_BODY.idle),
      grin2:    STICK_HEAD_GRIN2.concat(STICK_BODY.idle),
    },
  },
  npc: {
    w: 12, h: 12,
    frames: {
      idle:   NPC_BASE,
      blink:  npcVariant('kcccccccccck', 'kckkcccckkck'),
      stareL: npcVariant('kcecccceccck', 'kcecccceccck', 'kcccccccccck'),
      stareR: npcVariant('kcccecccceck', 'kcccecccceck', 'kcccccccccck'),
    },
  },
  star: {
    w: 7, h: 7,
    frames: {
      star:  ['...Y...', '..YyY..', 'YYywyYY', '.YyyyY.', '..YyY..', '.YY.YY.', '.Y...Y.'],
      eye:   ['..kkk..', '.kwwwk.', 'kwwxwwk', 'kwxkxwk', 'kwwxwwk', '.kwwwk.', '..kkk..'],
      egg:   ['..kkk..', '.kqqqk.', 'kqqqqqk', 'kqwqqQk', 'kqqqqQk', '.kqQQk.', '..kkk..'],
      gear:  ['..k.k..', '.kiiik.', 'kiiIiik', '.iIkIi.', 'kiiIiik', '.kiiik.', '..k.k..'],
      berry: ['...G...', '..GGk..', '.kzzzk.', 'kzwzzxk', 'kzzzzxk', '.kzxxk.', '..kkk..'],
    },
  },
  eri: {
    w: 12, h: 13,
    frames: {
      idle:   ERI,
      blink:  friendFace(ERI, { 5: 'kqqqqqqqqqQk', 6: 'kqqkqqqqkqQk' }),
      scared: friendFace(ERI, { 5: 'kqeeqqqeeqQk', 6: 'kqeeqqqeeqQk', 7: 'kqmqqkkqqmQk', 8: 'kqqqqkkqqqQk' }),
      sad:    friendFace(ERI, { 7: 'kqmqqkkqqmQk', 8: 'kqqqkqqkqqQk' }),
    },
  },
  torajo: {
    w: 12, h: 13,
    frames: {
      idle:   TORAJO,
      blink:  friendFace(TORAJO, { 6: 'kaaaaaaaaaAk', 7: 'kaakaaaakaAk' }),
      scared: friendFace(TORAJO, { 6: 'kaeeaaaeeaAk', 7: 'kaeeaaaeeaAk', 8: 'kamaakkaamAk', 9: 'kaaaakkaaaAk' }),
      sad:    friendFace(TORAJO, { 8: 'kamaakkaamAk', 9: 'kaaakaakaaAk' }),
    },
  },
  zoom: {
    w: 12, h: 14,
    frames: {
      idle:   ZOOM,
      blink:  friendFace(ZOOM, { 5: 'knvvvvvvvnNk' }),
      scared: friendFace(ZOOM, { 5: 'knveevveenNk', 6: 'knvvvkkvvnNk', 7: 'knnvvkkvvnNk' }),
      sad:    friendFace(ZOOM, { 6: 'knvvvkkvvnNk', 7: 'knnvkvvkvnNk' }),
    },
  },
  shell: {
    w: 7, h: 7,
    frames: {
      left:  ['.......', '.......', 'k.k.k..', 'kqkqkk.', 'kqqqQk.', '.kQQk..', '..kk...'],
      right: ['..k.k..', '.kqkqk.', 'kqqqeqk', 'kqqqeQk', 'kqkkqQk', '.kqqQk.', '..kkk..'],
    },
  },
  chick: {
    w: 10, h: 10,
    frames: {
      idle:  CHICK,
      blink: friendFace(CHICK, { 3: '.kyyyyyyk.' }),
    },
  },
};

const GHOST_RECOLOR = (() => {
  const r = {};
  for (const ch in SPRITE_PALETTE) {
    const [R, G2, B] = hexToRgbRaw(SPRITE_PALETTE[ch]);
    const l = Math.round(0.3 * R + 0.59 * G2 + 0.11 * B);
    const g = Math.round(l * 0.75 + 30);
    r[ch] = 'rgb(' + g + ',' + (g + 4) + ',' + (g + 14) + ')';
  }
  r.e = '#000000'; r.k = '#22252e';
  return r;
})();
function hexToRgbRaw(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

const EXTERNAL_SPRITES = {
  player: {
    enabled: false,
    src: 'assets/sprites/stick.png',
    frameW: 12, frameH: 16,
    order: ['idle', 'blink', 'walk1', 'walk2', 'walk3', 'jump', 'fall', 'interact', 'hurt'],
  },
  npc: {
    enabled: false,
    src: 'assets/sprites/npc.png',
    frameW: 12, frameH: 12,
    order: ['idle', 'blink', 'stareL', 'stareR'],
  },
};

function shadeColor(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
  r = f(r); g = f(g); b = f(b);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// =====================================================================
//  SPRITES — com cabelo arco-íris animado do WRICK
// =====================================================================
const Sprites = {
  cache: {},
  ext: {},
  _lastHue: -1,

  // velocidade do cabelo: 5=lento · 20=padrão · 40=rápido · 90=doidão
  HAIR_SPEED: 20,

  get(sheet, frame, recolor) {
    // WRICK: cabelo arco-íris animado
    if (sheet === 'player' && !recolor) {
      const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
      const hue = Math.floor((((t * this.HAIR_SPEED) % 360) / 5) * 5);
      const key = 'player|' + frame + '|hue' + hue;
      if (this._lastHue !== hue) {
        for (const k in this.cache) {
          if (k.indexOf('player|') === 0) delete this.cache[k];
        }
        this._lastHue = hue;
      }
      let c = this.cache[key];
      if (c) return c;

      const def = SPRITES.player;
      c = document.createElement('canvas');
      c.width = def.w; c.height = def.h;
      const x = c.getContext('2d');
      const rows = def.frames[frame] || def.frames.idle;
      const hair   = 'hsl(' + hue + ', 90%, 55%)';
      const hairDk = 'hsl(' + hue + ', 90%, 35%)';
      for (let y = 0; y < rows.length; y++) {
        for (let i = 0; i < rows[y].length; i++) {
          const ch = rows[y][i];
          if (ch === '.' || ch === ' ') continue;
          let col;
          if (ch === 'h') col = hair;
          else if (ch === 'H') col = hairDk;
          else col = SPRITE_PALETTE[ch];
          if (!col) continue;
          x.fillStyle = col;
          x.fillRect(i, y, 1, 1);
        }
      }
      this.cache[key] = c;
      return c;
    }

    // resto igual
    const key = sheet + '|' + frame + '|' + (recolor ? JSON.stringify(recolor) : '');
    let c = this.cache[key];
    if (c) return c;
    const ext = this.ext[sheet];
    if (ext && ext.ready && !recolor) {
      c = this.fromSheet(ext, frame);
      if (c) { this.cache[key] = c; return c; }
    }
    const def = SPRITES[sheet];
    const rows = def.frames[frame] || def.frames[Object.keys(def.frames)[0]];
    c = document.createElement('canvas');
    c.width = def.w; c.height = def.h;
    const x = c.getContext('2d');
    for (let y = 0; y < rows.length; y++) {
      for (let i = 0; i < rows[y].length; i++) {
        const ch = rows[y][i];
        if (ch === '.' || ch === ' ') continue;
        const col = (recolor && recolor.all) || (recolor && recolor[ch]) || SPRITE_PALETTE[ch];
        if (!col) continue;
        x.fillStyle = col;
        x.fillRect(i, y, 1, 1);
      }
    }
    this.cache[key] = c;
    return c;
  },

  loadExternal() {
    for (const name in EXTERNAL_SPRITES) {
      const e = EXTERNAL_SPRITES[name];
      if (!e || !e.enabled) continue;
      const img = new Image();
      img.onload = () => { e.ready = true; e.img = img; this.cache = {}; };
      img.src = e.src;
      this.ext[name] = e;
    }
  },
  fromSheet(e, frame) {
    const i = e.order.indexOf(frame);
    if (i < 0) return null;
    const c = document.createElement('canvas');
    c.width = e.frameW; c.height = e.frameH;
    c.getContext('2d').drawImage(e.img, i * e.frameW, 0, e.frameW, e.frameH, 0, 0, e.frameW, e.frameH);
    return c;
  },
};
