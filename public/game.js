/* =====================================================================
   WRICK E SEUS AMIGOS — NÚCLEO (PARTE 1)
   ===================================================================== */
(function () {
  'use strict';

  const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, PH = CONFIG.PHYSICS, PL = CONFIG.PLAYER;
  const FONT = CONFIG.FONT;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rand = (a, b) => a + Math.random() * (b - a);

  const canvas = document.getElementById('game');
  const screen = canvas.getContext('2d');
  const buf = makeCanvas(W, H), bx = buf.getContext('2d');
  const flipBuf = makeCanvas(W, H), fx = flipBuf.getContext('2d');
  const light = makeCanvas(W, H), lx = light.getContext('2d');
  const mini = makeCanvas(64, 36), mx = mini.getContext('2d');
  let scale = 1;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const s = Math.max(1, Math.floor(Math.min((window.innerWidth * dpr) / W, (window.innerHeight * dpr) / H)));
    scale = s;
    canvas.width = W * s; canvas.height = H * s;
    canvas.style.width = (W * s) / dpr + 'px';
    canvas.style.height = (H * s) / dpr + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  const Input = {
    down: {}, pressed: {}, any: false,
    isDown(a) { return CONFIG.KEYS[a].some((k) => this.down[k]); },
    hit(a) { return CONFIG.KEYS[a].some((k) => this.pressed[k]); },
    confirm() { return this.hit('confirm') || this.pressed.Tap; },
    press(code) {
      if (!this.down[code]) this.pressed[code] = true;
      this.down[code] = true; this.any = true;
      AudioSys.unlock();
    },
    release(code) { this.down[code] = false; },
    endStep() { this.pressed = {}; this.any = false; },
  };
  const PREVENT = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  window.addEventListener('keydown', (e) => {
    if (PREVENT.includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    Input.press(e.code);
    if (CONFIG.DEBUG && G.state === 'title' && /^Digit[1-4]$/.test(e.code)) {
      startGame(parseInt(e.code.slice(5), 10) - 1);
    }
  });
  window.addEventListener('keyup', (e) => Input.release(e.code));
  window.addEventListener('blur', () => { Input.down = {}; });

  canvas.addEventListener('pointerdown', (e) => {
    Input.pressed.Tap = true; Input.any = true; AudioSys.unlock();
    if (window.Battle && window.Battle.active) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (W / rect.width);
    const cy = (e.clientY - rect.top) * (H / rect.height);
    const d = G.dialog;
    if (d && d.choiceActive && d.choices) {
      const cw = 220, chh = 20;
      const ccx = (W - cw) / 2;
      const startY = 30;
      for (let i = 0; i < d.choices.length; i++) {
        const ccy = startY + i * (chh + 8);
        if (cx >= ccx && cx <= ccx + cw && cy >= ccy && cy <= ccy + chh) {
          d.choiceIdx = i;
          const ch = d.choices[i];
          const onEnd = d.onEnd;
          d.choiceActive = false;
          d.choices = null;
          G.dialog = null;
          Sfx.play('heart_pick');
          if (ch.onSelect) ch.onSelect(api);
          if (onEnd) onEnd(api);
          Input.pressed.Tap = false;
          return;
        }
      }
    }
  });

  document.querySelectorAll('[data-key]').forEach((el) => {
    const code = el.getAttribute('data-key');
    const on = (e) => { e.preventDefault(); Input.press(code); };
    const off = (e) => { e.preventDefault(); Input.release(code); };
    el.addEventListener('pointerdown', on);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => el.addEventListener(ev, off));
  });

  let fimVisto = false;
  try { fimVisto = localStorage.getItem('stick_amigos_fim') === '1'; } catch (e) {}

  // ===== SKINS =====
  function getSkin() {
    try { return localStorage.getItem('wrick_skin') || 'default'; } catch (e) { return 'default'; }
  }
  function getMode() {
    try { return localStorage.getItem('wrick_mode') || 'normal'; } catch (e) { return 'normal'; }
  }

  const G = {
    state: 'title', stateT: 0, t: 0,
    levelIndex: 0, level: null, world: null, theme: null, bg: null, terrain: null,
    player: null, respawn: null, camX: 0, camY: 12,
    stars: 0, starsTotal: 0, deaths: 0, levelT: 0,
    flags: {}, fired: {}, inside: {}, once: new Set(),
    messages: [], seqs: [], shadows: [], particles: [], amb: [],
    dialog: null, glitchT: 0, glitchI: 1, shakeT: 0, shakeM: 0, flipT: 0,
    black: 0, scareT: 0, hudText: null, hudT: 0, clearTitle: null,
    idleT: 0, paused: false, pauseT: 0,
    friend: null, trail: [], debris: [], goo: null, flashT: 0, fadeTo: null, fadeSpd: 0, clearInfo: null,
    skin: 'default', mode: 'normal',
  };
  const titleBg = Backdrop.build(THEMES.farm, 1);

  function _snapToGround(w) {
    const solid = (c, r) => {
      if (c < 0 || c >= w.cols) return true;
      if (r < 0 || r >= w.rows) return r >= w.rows;
      const t = w.tiles[r][c];
      return t === '#' || t === 'B';
    };
    const plat = (c, r) => {
      if (c < 0 || c >= w.cols || r < 0 || r >= w.rows) return false;
      const t = w.tiles[r][c];
      return t === '=' || t === '~';
    };
    const findGround = (col, fromRow) => {
      for (let r = Math.max(0, fromRow); r < w.rows; r++) {
        if (solid(col, r) || plat(col, r)) return r * TS;
      }
      return w.height + 32;
    };
    const fixList = (list) => {
      for (const item of list) {
        const col = Math.floor((item.x + 8) / TS);
        const startRow = Math.max(0, Math.floor((item.y + 16) / TS));
        const groundY = findGround(col, startRow);
        item.y = groundY - TS;
      }
    };
    fixList(w.npcs);
    fixList(w.decos);
    fixList(w.props);
  }

  function newPlayer(s) {
    return {
      x: s.x, y: s.y, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, jumpBuf: 0, cut: true,
      anim: 0, blinkT: 2.5, interactT: 0, dead: false, deadT: 0, popped: false,
      grin: false, laughT: 0, autoX: null, autoSpeed: 0,
    };
  }

  function loadLevel(i) {
    const L = LEVELS[i];
    G.levelIndex = i; G.level = L; G.theme = THEMES[L.theme];
    G.world = World.build(L);
    _snapToGround(G.world);
    G.terrain = World.renderTerrain(G.world, G.theme);
    G.bg = Backdrop.build(G.theme, i + 2);
    G.player = newPlayer(G.world.start);
    G.respawn = { x: G.world.start.x, y: G.world.start.y };
    G.stars = 0; G.starsTotal = G.world.stars.length; G.deaths = 0; G.levelT = 0;
    G.flags = {}; G.fired = {}; G.inside = {};
    G.messages = []; G.seqs = []; G.shadows = []; G.particles = [];
    G.dialog = null; G.black = 0; G.flipT = 0; G.glitchT = 0; G.shakeT = 0; G.scareT = 0;
    G.hudText = null; G.clearTitle = null; G.idleT = 0; G.paused = false;
    G.camX = clamp(G.player.x - W / 2, 0, G.world.width - W); G.camY = G.world.height - H;
    G.debris = []; G.goo = null; G.flashT = 0; G.fadeTo = null; G.clearInfo = null;
    G.friend = makeFriend(L.friend); G.trail = [];
    initAmbient();
    Music.stop(0.3); Music.reset(); Ambient.stopAll();
    setState('intro');
  }

  function setState(s) { G.state = s; G.stateT = 0; }

  function startGame(i) {
    Sfx.play('select');
    loadLevel(clamp(i, 0, LEVELS.length - 1));
  }

  function tileAt(c, r) {
    const w = G.world;
    if (c < 0 || c >= w.cols) return 'B';
    if (r < 0 || r >= w.rows) return '.';
    return w.tiles[r][c];
  }
  const isSolid = (c, r) => World.isSolidChar(tileAt(c, r));
  function isPlatform(c, r) {
    const t = tileAt(c, r);
    if (t === '=') return true;
    if (t === '~') { const g = G.world.glitch[c + ',' + r]; return !(g && g.gone > 0); }
    return false;
  }

  function moveX(p, dx) {
    p.x += dx;
    const r0 = Math.floor(p.y / TS), r1 = Math.floor((p.y + PL.height - 0.01) / TS);
    if (dx > 0) {
      const c = Math.floor((p.x + PL.width - 0.01) / TS);
      for (let r = r0; r <= r1; r++) if (isSolid(c, r)) { p.x = c * TS - PL.width; p.vx = 0; return; }
    } else if (dx < 0) {
      const c = Math.floor(p.x / TS);
      for (let r = r0; r <= r1; r++) if (isSolid(c, r)) { p.x = (c + 1) * TS; p.vx = 0; return; }
    }
  }

  function moveY(p, dy) {
    const prevBottom = p.y + PL.height;
    p.y += dy;
    p.onGround = false;
    const c0 = Math.floor(p.x / TS), c1 = Math.floor((p.x + PL.width - 0.01) / TS);
    if (dy > 0) {
      const r = Math.floor((p.y + PL.height) / TS);
      for (let c = c0; c <= c1; c++) {
        if (isSolid(c, r) || (isPlatform(c, r) && prevBottom <= r * TS + 0.5)) {
          p.y = r * TS - PL.height; p.vy = 0; p.onGround = true;
          for (let cc = c0; cc <= c1; cc++) {
            if (tileAt(cc, r) === '~') {
              const k = cc + ',' + r;
              if (!G.world.glitch[k]) G.world.glitch[k] = { t: 0, gone: 0, on: true };
            }
          }
          return;
        }
      }
    } else if (dy < 0) {
      const r = Math.floor(p.y / TS);
      for (let c = c0; c <= c1; c++) if (isSolid(c, r)) { p.y = (r + 1) * TS; p.vy = 0; return; }
    }
  }

  function updateGlitchTiles(dt) {
    const g = G.world.glitch, D = CONFIG.DIFFICULTY;
    for (const k in g) {
      const o = g[k];
      if (o.on) {
        o.t += dt;
        if (o.t >= D.glitchPlatformTime) {
          o.on = false; o.gone = D.glitchPlatformRespawn;
          const [c, r] = k.split(',').map(Number);
          burst(c * TS + 8, r * TS + 2, 6, ['#ff00dc', '#00ffff', '#ffffff'], 40);
          Sfx.play('vanish');
        }
      } else {
        o.gone -= dt;
        if (o.gone <= 0) delete g[k];
      }
    }
  }

  function updatePlayer(dt, blocked) {
    const p = G.player;
    p.interactT -= dt;
    if (p.dead) return updateDeath(p, dt);
    if (G.mode === 'pacific') { /* pacífico: nada mata */ }
    let dir = 0;
    if (!blocked) {
      if (Input.isDown('left')) dir -= 1;
      if (Input.isDown('right')) dir += 1;
    } else if (p.autoX != null) {
      const dd = p.autoX - (p.x + PL.width / 2);
      p.autoT = (p.autoT || 0) + dt;
      if (Math.abs(dd) <= 2) { p.autoX = null; p.autoT = 0; }
      else if (p.autoT > 6) {
        p.x = p.autoX - PL.width / 2; p.y = groundTop(p.autoX, p.y - TS * 3) - PL.height; p.vx = 0; p.vy = 0;
        p.autoX = null; p.autoT = 0;
      } else {
        dir = Math.sign(dd);
        const ahead = Math.floor((dir > 0 ? p.x + PL.width + 2 : p.x - 2) / TS);
        const r0 = Math.floor(p.y / TS), r1 = Math.floor((p.y + PL.height - 1) / TS);
        let wall = false;
        for (let r = r0; r <= r1; r++) if (isSolid(ahead, r)) wall = true;
        if (wall && p.onGround) { p.vy = -PH.jumpVelocity; p.onGround = false; p.cut = true; Sfx.play('jump'); }
      }
    }
    const maxV = p.autoX != null && p.autoSpeed ? p.autoSpeed : PH.runSpeed;
    const accel = p.onGround ? PH.groundAccel : PH.airAccel;
    if (dir) {
      if (Math.sign(p.vx) === -dir && p.onGround) p.vx += dir * PH.groundFriction * dt;
      p.vx = clamp(p.vx + dir * accel * dt, -maxV, maxV);
      p.face = dir;
    } else {
      const fr = (p.onGround ? PH.groundFriction : PH.airAccel * 0.4) * dt;
      p.vx = p.vx > 0 ? Math.max(0, p.vx - fr) : Math.min(0, p.vx + fr);
    }
    if (!blocked && Input.hit('jump')) p.jumpBuf = PH.jumpBuffer; else p.jumpBuf -= dt;
    p.coyote = p.onGround ? PH.coyoteTime : p.coyote - dt;
    if (p.jumpBuf > 0 && p.coyote > 0) {
      p.vy = -PH.jumpVelocity; p.jumpBuf = 0; p.coyote = 0; p.onGround = false; p.cut = false;
      Sfx.play('jump');
      dust(p.x + 4, p.y + PL.height, 3);
    }
    if (!p.cut && p.vy < 0 && !Input.isDown('jump')) { p.vy *= PH.jumpCut; p.cut = true; }
    if (p.vy >= 0) p.cut = true;
    const wasGround = p.onGround, fallSpeed = p.vy;
    p.vy = Math.min(PH.maxFall, p.vy + PH.gravity * dt);
    moveX(p, p.vx * dt);
    moveY(p, p.vy * dt);
    if (p.onGround && !wasGround && fallSpeed > 140) { Sfx.play('land'); dust(p.x + 4, p.y + PL.height, 4); }
    if (p.onGround && Math.abs(p.vx) > 8) p.anim += dt * (Math.abs(p.vx) / 9);
    else p.anim = 0;
    p.blinkT -= dt;
    if (p.blinkT < -0.12) p.blinkT = rand(2, 4.5);
    p.laughT = Math.max(0, p.laughT - dt);
  }

  function updateDeath(p, dt) {
    p.deadT += dt;
    if (p.deadT > 0.35 && !p.popped) { p.popped = true; p.vy = -230; Sfx.play('die'); }
    if (p.popped) { p.vy += PH.gravity * dt; p.y += p.vy * dt; }
    if (p.deadT > 0.35 + CONFIG.DIFFICULTY.respawnDelay) {
      G.player = newPlayer(G.respawn);
      G.player.face = 1;
      friendRespawn();
      burst(G.respawn.x + 4, G.respawn.y + 8, 10, ['#b8ff2e', '#ffffff'], 50);
    }
  }

  function die() {
    const p = G.player;
    if (p.dead) return;
    if (G.mode === 'pacific') return;
    if (G.mode === 'hardcore') {
      p.dead = true; p.deadT = 0; p.vx = 0; p.vy = 0; p.popped = false;
      Sfx.play('hurt'); shake(0.25, 2);
      setTimeout(() => loadLevel(G.levelIndex), 1500);
      return;
    }
    p.dead = true; p.deadT = 0; p.vx = 0; p.vy = 0; p.popped = false;
    Sfx.play('hurt');
    shake(0.25, 2);
    G.deaths++;
    if (G.level.secrets && G.deaths === CONFIG.SECRETS.deathsForMessage) say('tentandoDeNovo');
    if (G.level.secrets && G.deaths === CONFIG.SECRETS.deathsForMessage * 2) say('euTambemTentei');
  }

  const FR = CONFIG.FRIEND;
  function makeFriend(kind) {
    if (!kind || !SPRITES[kind]) return null;
    const p = G.player, d = SPRITES[kind];
    return {
      kind, w: d.w, h: d.h, x: Math.max(2, p.x - 16), y: p.y + PL.height - d.h,
      face: 1, mode: 'follow', look: null, moving: false, anim: 0, blinkT: 2, vx: 0, vy: 0,
      tx: null, speed: 40, onArrive: null, onLand: null, sink: 0, sinkSpd: 0.2, alpha: 1,
      talkI: 0, callT: 4, cracked: false, shake: false, watch: true,
    };
  }
  function groundTop(px, fromY) {
    const c = Math.floor(px / TS);
    for (let r = Math.max(0, Math.floor(fromY / TS)); r < G.world.rows; r++) {
      if (isSolid(c, r) || isPlatform(c, r)) return r * TS;
    }
    return G.world.height + 64;
  }
  function friendRespawn() {
    const f = G.friend;
    if (!f || f.mode !== 'follow') return;
    f.x = Math.max(2, G.respawn.x - 16); f.y = G.respawn.y + PL.height - f.h;
    G.trail = [];
  }
  function updateFriend(dt, follow) {
    const f = G.friend, p = G.player;
    if (!f) return;
    f.blinkT -= dt; if (f.blinkT < -0.15) f.blinkT = rand(1.8, 4);
    const ox = f.x;
    if (f.mode === 'follow' && follow) {
      if (!p.dead) {
        const last = G.trail[G.trail.length - 1];
        const pt = { x: p.x + PL.width / 2, b: p.y + PL.height };
        if (!last || Math.abs(last.x - pt.x) + Math.abs(last.b - pt.b) > 1.2) {
          G.trail.push(pt);
          if (G.trail.length > 200) G.trail.shift();
        }
      }
      const n = G.trail.length;
      if (n) {
        const tg = G.trail[Math.max(0, n - 1 - FR.delay)];
        const k = Math.min(1, dt * 14);
        f.x += (tg.x - f.w / 2 - f.x) * k;
        f.y += (tg.b - f.h - f.y) * k;
      }
      const dist = Math.abs(f.x + f.w / 2 - (p.x + 4)) + Math.abs(f.y + f.h - (p.y + PL.height));
      f.callT -= dt;
      if (dist > FR.teleport && !p.dead) {
        f.x = Math.max(2, p.x - 16); f.y = p.y + PL.height - f.h; G.trail = [];
        burst(f.x + f.w / 2, f.y + f.h / 2, 8, ['#ffffff', CHARACTERS[f.kind].color], 40);
      } else if (dist > FR.waitCall && f.callT <= 0 && G.level.friendWait) {
        f.callT = 7;
        say({ text: G.level.friendWait, style: 'world', x: f.x + f.w / 2, y: f.y - 8, dur: 1.4, size: 8, color: '#ffffff' });
      }
    } else if (f.mode === 'walk') {
      const d = f.tx - f.x;
      if (Math.abs(d) <= f.speed * dt + 0.5) {
        f.x = f.tx; f.mode = 'idle';
        const cb = f.onArrive; f.onArrive = null; if (cb) cb(api);
      } else f.x += Math.sign(d) * f.speed * dt;
      f.y = groundTop(f.x + f.w / 2, f.y + f.h - 4) - f.h;
    } else if (f.mode === 'fall') {
      const prevB = f.y + f.h;
      f.vy = Math.min(PH.maxFall, f.vy + PH.gravity * dt);
      f.x += f.vx * dt; f.y += f.vy * dt;
      const gt = groundTop(f.x + f.w / 2, prevB - 1);
      if (f.y + f.h >= gt && f.vy > 0) {
        f.y = gt - f.h; f.vy = 0; f.vx = 0; f.mode = 'idle';
        const cb = f.onLand; f.onLand = null; if (cb) cb(api);
      }
    } else if (f.mode === 'sink') {
      f.sink = Math.min(1, f.sink + dt * f.sinkSpd);
    }
    const dx = f.x - ox;
    f.moving = Math.abs(dx) > 0.08 && f.mode !== 'fall';
    if (f.moving) { f.face = dx > 0 ? 1 : -1; f.anim += dt * 8; }
    else if (f.watch && f.mode !== 'sink') f.face = p.x + 4 > f.x + f.w / 2 ? 1 : -1;
  }

  function updateDebris(dt) {
    for (const d of G.debris) {
      if (d.rest) continue;
      const prevB = d.y + 2;
      d.vy = Math.min(PH.maxFall, d.vy + PH.gravity * 0.8 * dt);
      d.x += d.vx * dt; d.y += d.vy * dt; d.rot += d.vr * dt;
      const gt = groundTop(d.x, prevB - 1);
      if (d.y + 2 >= gt && d.vy > 0) {
        d.y = gt - 2;
        if (d.vy > 70) { d.vy *= -0.35; d.vx *= 0.6; d.vr *= 0.5; if (d.kind === 'helmet') Sfx.play('clank'); }
        else { d.vy = 0; d.vx *= 0.9; if (Math.abs(d.vx) < 4) { d.rest = true; d.vr = 0; if (d.kind !== 'helmet') d.rot = Math.round(d.rot / Math.PI) * Math.PI; } }
      }
    }
  }

  function updateGoo(dt) {
    const g = G.goo;
    if (!g) return;
    g.t += dt;
    g.r += (g.target - g.r) * Math.min(1, dt * (g.speed || 0.9));
    g.tH += ((g.tendrils || 0) - g.tH) * Math.min(1, dt * 1.5);
    g.bubT -= dt;
    if (g.r > 4 && g.bubT <= 0) { g.bubT = rand(0.25, 0.7); Sfx.play('goo'); }
  }

  function updateProps(dt) {
    for (const k of G.world.props) {
      if (k.kind !== 'rocket' || k.state !== 'launch') continue;
      k.liftV += (k.liftA || 0) * dt;
      k.lift += k.liftV * dt;
      k.tilt += (k.tiltV || 0) * dt;
      const cx = k.x + 8 + Math.sin(k.tilt) * 6, by = k.y + TS - 4 - k.lift;
      for (let i = 0; i < 2; i++) {
        G.particles.push({ x: cx + rand(-4, 4), y: by + 4, vx: rand(-30, 30), vy: rand(10, 40), life: rand(0.4, 1), max: 1,
          color: ['#ffd84a', '#ff8a2a', '#c8c8c8', '#9a9a9a'][(Math.random() * 4) | 0], g: -10, size: 2 });
      }
    }
  }
