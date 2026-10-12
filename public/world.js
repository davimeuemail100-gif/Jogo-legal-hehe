/* =====================================================================
   MUNDO — lê os mapas de levels.js, desenha terreno, fundos (parallax)
   e decorações (árvores, casas, flores...). Tudo gerado por código.
   Para trocar por imagens, veja Backdrop.external no fim do arquivo.
   ===================================================================== */

const TS = CONFIG.TILE;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// Números aleatórios "com semente": o cenário sai sempre igual.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Círculo "pixelado".
function pxCircle(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy));
    ctx.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2 + 1, 1);
  }
}

const World = {
  isSolidChar: (t) => t === '#' || t === 'B',

  /* Lê o mapa e cria as entidades. */
  build(level) {
    const rows = level.map.length, cols = level.map[0].length;
    const w = {
      level, rows, cols, width: cols * TS, height: rows * TS,
      tiles: level.map.map((r) => r.split('')),
      start: { x: 20, y: 100 }, stars: [], checkpoints: [], flag: null,
      npcs: [], signs: [], doors: [], props: [], decos: [],
      regions: level.regions || [], glitch: {},
      scribbles: (level.scribbles || []).map((s) => Object.assign({}, s)),
    };
    const rnd = mulberry32(cols * 31 + rows * 7 + (level.name.length * 97));
    let ni = 0, si = 0, di = 0, ki = 0;
    // Percorre coluna por coluna → NPCs/placas ficam em ordem de x.
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const ch = w.tiles[r][c];
        const X = c * TS, Y = r * TS;
        let clear = true;
        switch (ch) {
          case 'P': w.start = { x: X + 4, y: Y + 2 }; break;
          case 'o': w.stars.push({ x: X + 8, y: Y + 8, got: false, phase: rnd() * 6 }); break;
          case 'c': w.checkpoints.push({ x: X, y: Y, col: c, active: false }); break;
          case 'F': w.flag = { x: X, y: Y }; break;
          case 'N': {
            const d = (level.npcs && level.npcs[ni++]) || { name: '?', lines: ['...'] };
            w.npcs.push(Object.assign({}, d, {
              x: X + 2, y: Y + 4, mode: d.mode || 'normal', color: d.color || '#ff9ecf',
              hidden: false, alpha: 1, t: rnd() * 5, blinkT: 1 + rnd() * 3,
            }));
            break;
          }
          case 'S': w.signs.push(Object.assign({ lines: ['...'] }, level.signs && level.signs[si++], { x: X, y: Y })); break;
          case 'D': w.doors.push(Object.assign({}, level.doors && level.doors[di++], { x: X, y: Y })); break;
          case 'K': w.props.push(Object.assign({}, level.props && level.props[ki++], { x: X, y: Y })); break;
          case 'T': case 'Y': case 'H': case 'f': case 'b': case 'R': case 'L': case 'U':
            w.decos.push({ type: ch, x: X, y: Y, col: c, seed: rnd(), dark: false });
            break;
          default: clear = false;
        }
        if (clear) w.tiles[r][c] = '.';
      }
    }
    return w;
  },

  /* ---------- TERRENO (desenhado uma vez numa imagem grande) ---------- */
  renderTerrain(w, T) {
    const cv = makeCanvas(w.width, w.height), ctx = cv.getContext('2d');
    const rnd = mulberry32(w.cols * 13 + 5);
    const solid = (c, r) => {
      if (c < 0 || c >= w.cols) return true;
      if (r < 0 || r >= w.rows) return r >= w.rows;
      return this.isSolidChar(w.tiles[r][c]);
    };
    // Buracos: escurecem para baixo (parecem fundos de verdade).
    const floorRow = w.rows - 2;
    for (let c = 0; c < w.cols; c++) {
      if (solid(c, w.rows - 1)) continue;
      const g = ctx.createLinearGradient(0, floorRow * TS, 0, w.height);
      g.addColorStop(0, shadeColor(T.dirtDark, -0.35));
      g.addColorStop(1, '#050208');
      ctx.fillStyle = g;
      ctx.fillRect(c * TS, floorRow * TS + 3, TS, w.height - floorRow * TS);
    }
    for (let r = 0; r < w.rows; r++) {
      for (let c = 0; c < w.cols; c++) {
        const ch = w.tiles[r][c], x = c * TS, y = r * TS;
        let kind = ch;
        // Tema "quebrado": alguns blocos com textura errada.
        if (T.swapChance && (ch === '#' || ch === 'B') && rnd() < T.swapChance) {
          kind = rnd() < 0.3 ? 'missing' : (ch === '#' ? 'B' : '#');
        }
        if (kind === '#') this.drawGround(ctx, x, y, c, r, T, rnd, solid);
        else if (kind === 'B') this.drawBrick(ctx, x, y, c, r, T, solid);
        else if (kind === 'missing') this.drawMissing(ctx, x, y);
        else if (ch === '=') this.drawPlank(ctx, x, y, T);
        else if (ch === '^') this.drawSpikes(ctx, x, y, T);
      }
    }
    return cv;
  },

  drawGround(ctx, x, y, c, r, T, rnd, solid) {
    ctx.fillStyle = T.dirt; ctx.fillRect(x, y, TS, TS);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = T.dirtDark; ctx.fillRect(x + ((rnd() * 14) | 0), y + ((rnd() * 14) | 0), 2, 1);
      ctx.fillStyle = T.dirtLight; ctx.fillRect(x + ((rnd() * 15) | 0), y + ((rnd() * 15) | 0), 1, 1);
    }
    ctx.fillStyle = T.dirtDark;
    if (!solid(c - 1, r)) ctx.fillRect(x, y, 1, TS);
    if (!solid(c + 1, r)) ctx.fillRect(x + TS - 1, y, 1, TS);
    if (!solid(c, r - 1)) {
      ctx.fillStyle = T.grass; ctx.fillRect(x, y, TS, 4);
      for (let i = 0; i < TS; i += 2) {
        const d = rnd();
        if (d < 0.7) ctx.fillRect(x + i, y + 4, 2, d < 0.3 ? 2 : 1);
      }
      ctx.fillStyle = T.grassLight; ctx.fillRect(x, y, TS, 1);
      for (let i = 0; i < 3; i++) ctx.fillRect(x + ((rnd() * 15) | 0), y - 1, 1, 1);
      if (!solid(c - 1, r)) { ctx.fillStyle = T.grass; ctx.fillRect(x - 1, y + 1, 1, 3); }
      if (!solid(c + 1, r)) { ctx.fillStyle = T.grass; ctx.fillRect(x + TS, y + 1, 1, 3); }
    }
  },

  drawBrick(ctx, x, y, c, r, T, solid) {
    ctx.fillStyle = T.brick; ctx.fillRect(x, y, TS, TS);
    ctx.fillStyle = T.brickDark;
    ctx.fillRect(x, y + 7, TS, 1); ctx.fillRect(x, y + 15, TS, 1);
    const o = (r % 2) * 8;
    ctx.fillRect(x + o, y, 1, 7); ctx.fillRect(x + ((o + 8) % 16), y + 8, 1, 7);
    ctx.fillStyle = T.brickLight;
    ctx.fillRect(x, y, TS, 1); ctx.fillRect(x, y + 8, TS, 1);
    if (!solid(c, r + 1)) { ctx.fillStyle = T.brickDark; ctx.fillRect(x, y + 14, TS, 2); }
  },

  drawMissing(ctx, x, y) { // a famosa "textura faltando"
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      ctx.fillStyle = (i + j) % 2 ? '#000000' : '#ff00dc';
      ctx.fillRect(x + i * 4, y + j * 4, 4, 4);
    }
  },

  drawPlank(ctx, x, y, T, glitchy) {
    ctx.fillStyle = T.plank; ctx.fillRect(x, y, TS, 5);
    ctx.fillStyle = shadeColor(T.plank, 0.25); ctx.fillRect(x, y, TS, 1);
    ctx.fillStyle = T.plankDark;
    ctx.fillRect(x, y + 4, TS, 1); ctx.fillRect(x + 8, y + 1, 1, 3);
    ctx.fillRect(x + 2, y + 2, 1, 1); ctx.fillRect(x + 13, y + 2, 1, 1);
    if (glitchy) {
      ctx.fillStyle = 'rgba(255,0,220,0.5)'; ctx.fillRect(x + 1, y + 1, TS, 1);
      ctx.fillStyle = 'rgba(0,255,255,0.5)'; ctx.fillRect(x - 1, y + 3, TS, 1);
    }
  },

  drawSpikes(ctx, x, y, T) {
    if (T.goo) { // poça de gosma preta (mata do mesmo jeito)
      ctx.fillStyle = '#07040a'; ctx.fillRect(x, y + 11, TS, 5);
      ctx.fillRect(x + 1, y + 10, 6, 1); ctx.fillRect(x + 9, y + 9, 5, 2); ctx.fillRect(x + 4, y + 8, 3, 3);
      ctx.fillStyle = '#3a1f4a'; ctx.fillRect(x + 10, y + 9, 2, 1); ctx.fillRect(x + 4, y + 8, 1, 1); ctx.fillRect(x + 2, y + 12, 3, 1);
      return;
    }
    const light = T.darkUI ? '#b29aa4' : '#e6edf5', dark = T.darkUI ? '#5a4650' : '#8f9bb0';
    for (let k = 0; k < 4; k++) {
      const sx = x + k * 4;
      for (let j = 0; j < 8; j++) {
        const wd = Math.min(4, 1 + (j >> 1)), x0 = sx + ((4 - wd) >> 1);
        ctx.fillStyle = light; ctx.fillRect(x0, y + 8 + j, wd, 1);
        if (wd > 1) { ctx.fillStyle = dark; ctx.fillRect(x0 + wd - 1, y + 8 + j, 1, 1); }
      }
    }
  },

  /* ---------- DECORAÇÕES ---------- */
  drawDeco(ctx, d, T, t, px) {
    const bx = d.x + 8, by = d.y + TS;
    switch (d.type) {
      case 'T': case 'Y': this.drawTree(ctx, bx, by, T, d, t, px); break;
      case 'H': this.drawHouse(ctx, bx, by, T, d.dark); break;
      case 'f': this.drawFlower(ctx, bx, by, T, d, t); break;
      case 'b': this.drawBush(ctx, bx, by, T, d.dark); break;
      case 'R': this.drawBarn(ctx, bx, by, T); break;
      case 'L': this.drawFence(ctx, bx, by, T); break;
      case 'U': this.drawFruitHouse(ctx, bx, by, T, d.seed); break;
    }
  },

  drawTree(ctx, bx, by, T, d, t, px) {
    const dead = T.treeStyle === 'dead' || d.dark;
    if (dead) {
      const tr = d.dark ? shadeColor(T.trunk, -0.35) : T.trunk;
      ctx.fillStyle = tr; ctx.fillRect(bx - 1, by - 30, 3, 30);
      ctx.fillRect(bx - 2, by - 3, 5, 3);
      // galhos tortos
      const br = [[-1, -22, -1, -6], [1, -26, 1, -7], [-1, -14, -1, -4], [1, -18, 1, -5]];
      for (const [dir, sy, , len] of br) {
        for (let i = 0; i < -len; i++) ctx.fillRect(bx + dir * (2 + i), by + sy - Math.floor(i * 0.8), 1, 1);
      }
      ctx.fillStyle = shadeColor(tr, -0.3); ctx.fillRect(bx + 1, by - 30, 1, 30);
      return;
    }
    ctx.fillStyle = T.trunk; ctx.fillRect(bx - 2, by - 17, 4, 17);
    ctx.fillStyle = T.trunkDark; ctx.fillRect(bx + 1, by - 17, 1, 17); ctx.fillRect(bx - 3, by - 2, 6, 2);
    pxCircle(ctx, bx, by - 25, 11, T.leafDark);
    pxCircle(ctx, bx - 1, by - 26, 10, T.leaf);
    pxCircle(ctx, bx - 4, by - 29, 4, T.leafLight);
    ctx.fillStyle = T.leafLight;
    ctx.fillRect(bx + 3, by - 31, 2, 1); ctx.fillRect(bx - 8, by - 24, 1, 2);
    ctx.fillStyle = T.leafDark;
    ctx.fillRect(bx + 4, by - 22, 2, 1); ctx.fillRect(bx - 5, by - 19, 1, 1);
    if (d.type === 'Y') {
      // Um rosto QUASE imperceptível. Os olhos seguem o jogador.
      const look = px == null ? 0 : Math.max(-1, Math.min(1, Math.round((px - bx) / 40)));
      const closed = px != null && Math.abs(px - bx) < 14;
      ctx.fillStyle = shadeColor(T.leaf, -0.28);
      if (closed) { ctx.fillRect(bx - 5, by - 26, 2, 1); ctx.fillRect(bx + 2, by - 26, 2, 1); }
      else { ctx.fillRect(bx - 5 + look, by - 27, 1, 2); ctx.fillRect(bx + 3 + look, by - 27, 1, 2); }
      ctx.fillRect(bx - 2, by - 21, 4, 1); ctx.fillRect(bx - 3, by - 22, 1, 1); ctx.fillRect(bx + 2, by - 22, 1, 1);
    }
  },

  drawHouse(ctx, bx, by, T, dark) {
    const x0 = bx - 24;
    const wall = dark ? shadeColor(T.houseWall, -0.5) : T.houseWall;
    const roof = dark ? shadeColor(T.houseRoof, -0.5) : T.houseRoof;
    const win = dark ? '#050305' : T.houseWindow;
    ctx.fillStyle = dark ? '#2a2226' : T.brick; ctx.fillRect(x0 + 33, by - 47, 5, 9); // chaminé
    ctx.fillStyle = wall; ctx.fillRect(x0 + 5, by - 28, 38, 28);
    ctx.fillStyle = shadeColor(wall, -0.12); ctx.fillRect(x0 + 5, by - 3, 38, 3); ctx.fillRect(x0 + 41, by - 28, 2, 28);
    for (let r = 0; r < 17; r++) {
      const half = 5 + Math.floor(r * 1.3);
      ctx.fillStyle = r % 5 === 4 ? shadeColor(roof, -0.2) : roof;
      ctx.fillRect(x0 + 24 - half, by - 45 + r, half * 2, 1);
    }
    ctx.fillStyle = shadeColor(roof, 0.25); ctx.fillRect(x0 + 21, by - 45, 6, 1);
    ctx.fillStyle = dark ? '#000000' : T.houseDoor; ctx.fillRect(x0 + 19, by - 16, 10, 16);
    if (!dark) { ctx.fillStyle = '#ffd84a'; ctx.fillRect(x0 + 26, by - 8, 1, 1); }
    for (const wx of [x0 + 8, x0 + 32]) {
      ctx.fillStyle = win; ctx.fillRect(wx, by - 23, 8, 8);
      ctx.fillStyle = shadeColor(wall, -0.3);
      ctx.fillRect(wx + 3, by - 23, 1, 8); ctx.fillRect(wx, by - 20, 8, 1);
      if (!dark) { ctx.fillStyle = '#ffffff'; ctx.fillRect(wx + 1, by - 22, 1, 1); }
    }
    if (dark) { // alguém está na janela
      ctx.fillStyle = '#e8e0d8';
      ctx.fillRect(x0 + 9, by - 18, 1, 1); ctx.fillRect(x0 + 13, by - 18, 1, 1);
    }
  },

  drawFlower(ctx, bx, by, T, d, t) {
    const sway = Math.round(Math.sin(t * 2 + d.seed * 6));
    const cols = ['#ff7ab6', '#ffd84a', '#ffffff', '#b07aff', '#ff8a4a'];
    const pc = d.dark || T.darkUI ? '#6a5a60' : cols[Math.floor(d.seed * cols.length)];
    ctx.fillStyle = d.dark || T.darkUI ? '#3a3035' : T.leafDark; ctx.fillRect(bx, by - 5, 1, 5);
    ctx.fillRect(bx + 1, by - 3, 1, 1);
    const fx = bx + sway, fy = by - 7;
    ctx.fillStyle = pc;
    ctx.fillRect(fx - 1, fy, 1, 1); ctx.fillRect(fx + 1, fy, 1, 1);
    ctx.fillRect(fx, fy - 1, 1, 1); ctx.fillRect(fx, fy + 1, 1, 1);
    ctx.fillStyle = d.dark || T.darkUI ? '#2a2025' : '#ffe14a'; ctx.fillRect(fx, fy, 1, 1);
  },

  // Celeiro vermelho da fazendinha do Eri
  drawBarn(ctx, bx, by, T) {
    const x0 = bx - 26, red = T.barn || T.houseRoof, dk = T.barnDark || shadeColor(red, -0.3), wh = T.fence || '#f2e2c4';
    ctx.fillStyle = red; ctx.fillRect(x0 + 4, by - 34, 44, 34);
    for (let r = 0; r < 14; r++) { const h = 6 + r * 2; ctx.fillRect(bx - h, by - 48 + r, h * 2, 1); }
    ctx.fillStyle = dk; for (let i = 0; i < 44; i += 4) ctx.fillRect(x0 + 4 + i, by - 34, 1, 34);
    ctx.fillStyle = wh; ctx.fillRect(x0 + 2, by - 35, 48, 2);
    for (let r = 0; r < 14; r++) { const h = 6 + r * 2; ctx.fillRect(bx - h - 1, by - 49 + r, 2, 1); ctx.fillRect(bx + h - 1, by - 49 + r, 2, 1); }
    // portão com X
    ctx.fillStyle = wh; ctx.fillRect(bx - 9, by - 22, 18, 22);
    ctx.fillStyle = dk; ctx.fillRect(bx - 7, by - 20, 14, 20);
    ctx.fillStyle = wh;
    for (let i = 0; i < 14; i++) { ctx.fillRect(bx - 7 + i, by - 20 + Math.round(i * 20 / 14), 1, 2); ctx.fillRect(bx + 6 - i, by - 20 + Math.round(i * 20 / 14), 1, 2); }
    // janelinha do feno
    ctx.fillStyle = wh; ctx.fillRect(bx - 5, by - 40, 10, 8);
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(bx - 4, by - 39, 8, 6);
    ctx.fillStyle = '#e0a830'; ctx.fillRect(bx - 4, by - 35, 8, 2);
  },

  drawFence(ctx, bx, by, T) {
    const c = T.fence || '#f2e2c4', d = T.fenceDark || '#c8b08a';
    ctx.fillStyle = c;
    ctx.fillRect(bx - 8, by - 10, 16, 2); ctx.fillRect(bx - 8, by - 5, 16, 2);
    ctx.fillRect(bx - 7, by - 13, 3, 13); ctx.fillRect(bx + 4, by - 13, 3, 13);
    ctx.fillStyle = d; ctx.fillRect(bx - 5, by - 13, 1, 13); ctx.fillRect(bx + 6, by - 13, 1, 13);
  },

  // Casinhas em forma de fruta — a Vila das Frutas (vazia)
  drawFruitHouse(ctx, bx, by, T, seed) {
    const kinds = [['#c8742e', '#8a4a1e'], ['#b8c040', '#7a8424'], ['#c84a5a', '#8a2a3a']];
    const [c, d] = kinds[Math.floor(seed * kinds.length)];
    const cc = T.goo ? shadeColor(c, -0.35) : c, dd = T.goo ? shadeColor(d, -0.35) : d;
    pxCircle(ctx, bx, by - 15, 15, dd);
    pxCircle(ctx, bx - 1, by - 16, 14, cc);
    ctx.fillStyle = dd; ctx.fillRect(bx - 15, by - 2, 30, 2);
    ctx.fillStyle = T.trunk; ctx.fillRect(bx, by - 34, 2, 5);
    ctx.fillStyle = T.leaf; ctx.fillRect(bx + 2, by - 33, 5, 2);
    ctx.fillStyle = '#0a0608'; ctx.fillRect(bx - 4, by - 12, 8, 12);       // porta aberta, escuro
    ctx.fillStyle = T.houseWindow; ctx.fillRect(bx - 11, by - 22, 5, 5); ctx.fillRect(bx + 5, by - 22, 5, 5);
    ctx.fillStyle = dd; ctx.fillRect(bx - 9, by - 22, 1, 5); ctx.fillRect(bx + 7, by - 22, 1, 5);
  },

  drawBush(ctx, bx, by, T, dark) {
    const k = dark ? -0.45 : 0;
    pxCircle(ctx, bx - 4, by - 5, 5, shadeColor(T.leafDark, k));
    pxCircle(ctx, bx + 4, by - 5, 5, shadeColor(T.leafDark, k));
    pxCircle(ctx, bx, by - 7, 6, shadeColor(T.leaf, k));
    pxCircle(ctx, bx - 2, by - 9, 2, shadeColor(T.leafLight, k));
    ctx.fillStyle = shadeColor(T.leafDark, k); ctx.fillRect(bx - 8, by - 1, 17, 1);
  },
};

/* =====================================================================
   FUNDOS COM PARALLAX — céu, sol, nuvens, montanhas, colinas, árvores
   ===================================================================== */
const Backdrop = {
  LAYER_W: 640,

  build(T, seed) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, LW = this.LAYER_W;
    const rnd = mulberry32(seed * 101 + 3);
    const b = { T };

    // Céu em degradê com pontilhado (dithering) estilo 8-bit.
    b.sky = makeCanvas(W, H);
    const sctx = b.sky.getContext('2d');
    const img = sctx.createImageData(W, H), data = img.data;
    const cols = T.sky.map(hexToRgb), n = cols.length;
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let y = 0; y < H; y++) {
      const tt = Math.min(n - 1, (y / (H * 0.85)) * (n - 1));
      const i = Math.floor(tt), f = tt - i;
      for (let x = 0; x < W; x++) {
        const th = (bayer[(y % 4) * 4 + (x % 4)] + 0.5) / 16;
        const c = cols[Math.min(n - 1, f > th ? i + 1 : i)];
        const o = (y * W + x) * 4;
        data[o] = c[0]; data[o + 1] = c[1]; data[o + 2] = c[2]; data[o + 3] = 255;
      }
    }
    sctx.putImageData(img, 0, 0);

    const wave = (x, parts) => parts.reduce((s, [k, a, ph]) => s + a * Math.sin((x / LW) * Math.PI * 2 * k + ph), 0);

    // Montanhas
    b.mountains = makeCanvas(LW, H);
    let ctx = b.mountains.getContext('2d');
    const mp = [[2, 22, rnd() * 6], [5, 11, rnd() * 6], [11, 5, rnd() * 6]];
    const mh = (x) => 70 + wave(x, mp) + (T.jagged ? ((x * 7919) % 11) - 5 : 0);
    for (let x = 0; x < LW; x++) {
      const top = Math.round(H - 40 - mh(x));
      const desc = mh(x + 5) < mh(x - 5);
      ctx.fillStyle = desc ? T.mountainShade : T.mountain;
      ctx.fillRect(x, top, 1, H - top);
      if (T.snow && top < 62) { ctx.fillStyle = T.snow; ctx.fillRect(x, top, 1, Math.min(4, 62 - top)); }
    }

    // Colinas
    b.hills = makeCanvas(LW, H);
    ctx = b.hills.getContext('2d');
    const hp = [[3, 9, rnd() * 6], [7, 5, rnd() * 6]];
    for (let x = 0; x < LW; x++) {
      const top = Math.round(H - 52 - wave(x, hp));
      ctx.fillStyle = T.hill; ctx.fillRect(x, top, 1, H - top);
      ctx.fillStyle = T.hillLight; ctx.fillRect(x, top, 1, 2);
      ctx.fillStyle = T.hillShade;
      for (let y = top + 10; y < H; y += 2) if ((x + y) % 4 === 0) ctx.fillRect(x, y, 1, 1);
    }

    // Arvorezinhas ao fundo
    b.trees = makeCanvas(LW, H);
    ctx = b.trees.getContext('2d');
    for (let i = 0; i < 22; i++) {
      const x = Math.floor(rnd() * LW), base = H - 30 - Math.floor(rnd() * 8);
      if (T.treeStyle === 'dead') {
        ctx.fillStyle = T.bgTree;
        ctx.fillRect(x, base - 16, 2, 16); ctx.fillRect(x - 3, base - 12, 3, 1); ctx.fillRect(x + 2, base - 9, 3, 1);
        ctx.fillRect(x - 4, base - 13, 1, 1); ctx.fillRect(x + 5, base - 10, 1, 1);
      } else {
        ctx.fillStyle = shadeColor(T.bgTree, -0.2); ctx.fillRect(x, base - 5, 2, 5);
        pxCircle(ctx, x + 1, base - 9, 5, T.bgTree);
        pxCircle(ctx, x, base - 10, 2, shadeColor(T.bgTree, 0.15));
      }
    }
    ctx.fillStyle = T.hillShade; ctx.fillRect(0, H - 30, LW, 30);

    // Nuvens
    b.clouds = [];
    for (let i = 0; i < 6; i++) b.clouds.push({ x: rnd() * LW, y: 12 + rnd() * 50, s: 0.6 + rnd() * 0.8 });

    // Vinheta (bordas escuras)
    b.vignette = makeCanvas(W, H);
    if (T.vignette > 0) {
      ctx = b.vignette.getContext('2d');
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,' + T.vignette + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    return b;
  },

  drawCloud(ctx, x, y, s, color) {
    const r = Math.round(6 * s);
    pxCircle(ctx, x, y, r, color);
    pxCircle(ctx, x + r + 2, y + 1, Math.round(r * 0.8), color);
    pxCircle(ctx, x - r, y + 2, Math.round(r * 0.7), color);
    ctx.fillStyle = color; ctx.fillRect(Math.round(x - r * 1.6), Math.round(y + 2), Math.round(r * 3.6), Math.round(r * 0.7));
  },

  // Desenha uma camada repetida horizontalmente com parallax.
  layer(ctx, cv, camX, factor, yOff) {
    const LW = this.LAYER_W;
    let ox = -Math.floor((camX * factor) % LW);
    if (ox > 0) ox -= LW;
    for (let x = ox; x < CONFIG.WIDTH; x += LW) ctx.drawImage(cv, x, Math.round(yOff || 0));
  },
};
