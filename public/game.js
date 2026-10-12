/* =====================================================================
   WRICK E SEUS AMIGOS — NÚCLEO DO JOGO
   ---------------------------------------------------------------------
   Ordem dos arquivos (index.html): config → sprites → audio → messages
   → levels → world → game.
   Seções deste arquivo:
     1. Tela e entrada (teclado / toque)
     2. Estado do jogo e carregamento de fases
     3. Física e colisão do Wrick
     4. Mensagens de terror, sequências e efeitos
     5. API usada pelos eventos das fases (makeApi)
     6. Atualização de cada estado (título, intro, jogo, fim de fase...)
     7. Desenho (cenário, entidades, luz, interface)
     8. Loop principal
   ===================================================================== */
(function () {
  'use strict';

  const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, PH = CONFIG.PHYSICS, PL = CONFIG.PLAYER;
  const FONT = CONFIG.FONT;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ================================================================
     1. TELA E ENTRADA
     ================================================================ */
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
  canvas.addEventListener('pointerdown', () => { Input.pressed.Tap = true; Input.any = true; AudioSys.unlock(); });
  document.querySelectorAll('[data-key]').forEach((el) => {
    const code = el.getAttribute('data-key');
    const on = (e) => { e.preventDefault(); Input.press(code); };
    const off = (e) => { e.preventDefault(); Input.release(code); };
    el.addEventListener('pointerdown', on);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => el.addEventListener(ev, off));
  });

  /* ================================================================
     2. ESTADO DO JOGO E FASES
     ================================================================ */
  let fimVisto = false;
  try { fimVisto = localStorage.getItem('stick_amigos_fim') === '1'; } catch (e) { /* sem storage */ }

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
  };
  const titleBg = Backdrop.build(THEMES.farm, 1);

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

  /* ================================================================
     3. FÍSICA E COLISÃO
     ================================================================ */
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

  /* ================================================================
     4. MENSAGENS, SEQUÊNCIAS E EFEITOS
     ================================================================ */
  function say(key, opts) {
    let def;
    if (typeof key === 'string') def = MESSAGES[key];
    else if (key && key.key) def = Object.assign({}, MESSAGES[key.key], key);
    else def = key;
    if (!def) { console.warn('Mensagem não encontrada:', key); return; }
    const m = Object.assign({ style: 'center', dur: 2, size: 8 }, def, opts || {});
    if (m.once) { if (G.once.has(m.text)) return; G.once.add(m.text); }
    m.t = 0;
    if (m.sound) Sfx.play(m.sound);
    if (m.glitch) glitch(m.glitch, 1);
    if (m.shake) shake(0.5, m.shake);
    if (m.style === 'subtle') { m.px = rand(30, W - 30); m.py = rand(30, H - 50); }
    G.messages.push(m);
  }

  function seq(steps, o) { G.seqs.push({ steps, i: 0, t: 0, blocking: !!(o && o.blocking) }); }

  function talkStyle(who) {
    const c = CHARACTERS[who];
    return c ? { name: c.name, color: c.color, pitch: c.pitch } : { name: who, color: '#ffffff', pitch: 520 };
  }

  function updateSeqs(dt) {
    for (const s of G.seqs) {
      let budget = dt;
      while (s.i < s.steps.length) {
        if (s.waitDialog) { if (G.dialog) break; s.waitDialog = false; }
        const st = s.steps[s.i];
        if (st.wait != null) {
          s.t += budget; budget = 0;
          if (s.t < st.wait) break;
          s.t = 0; s.i++; continue;
        }
        if (st.until) { if (!st.until(api)) break; s.i++; continue; }
        s.i++;
        if (st.say) say(st.say, st.opts);
        if (st.black != null) { G.black = st.black; G.fadeTo = null; }
        if (st.fade) api.fade(st.fade[0], st.fade[1]);
        if (st.talk) {
          const ts = st.talk[0] ? talkStyle(st.talk[0]) : { name: null };
          openDialog(ts.name, st.talk[1], null, { color: ts.color, pitch: ts.pitch });
          s.waitDialog = true;
        }
        if (st.run) st.run(api);
        if (s.waitDialog) break;
      }
    }
    G.seqs = G.seqs.filter((s) => s.i < s.steps.length || (s.waitDialog && G.dialog));
  }

  function laughSteps(k) {
    const head = (text, o) => ({ run: () => say(Object.assign({ text, style: 'world', x: G.player.x + 4, y: G.player.y - 10, dur: 1.2, size: 8, color: '#ffffff' }, o)) });
    const steps = [
      { run: () => { G.player.grin = true; } }, { wait: 1.0 },
      head('he.', { alpha: 0.85 }), { run: () => Sfx.play('laugh', 1) }, { wait: 1.4 },
      head('hehe'), { run: () => { Sfx.play('laugh', 1); G.player.laughT = 0.8; } }, { wait: 1.4 },
      { run: () => {
        Sfx.play('laugh', Math.min(3, k + 1)); G.player.laughT = 2.4;
        say({ text: k >= 3 ? 'HAHAHAHAHAHA' : 'HAHAHA', style: 'scatter', dur: 1.2 + k * 0.4, size: 8, count: 2 + k * 3, color: '#ffffff' });
        if (k >= 2) shake(1.2, 1 + k * 0.4);
        if (k >= 3) glitch(1.2, 1.4);
      } },
      { wait: 2.6 }, { run: () => { G.player.laughT = 0; } }, { wait: 1.2 },
      { run: () => { G.player.grin = false; } },
    ];
    return steps;
  }

  function glitch(d, i) { G.glitchT = Math.max(G.glitchT, d); G.glitchI = i || 1; }
  function shake(d, m) { G.shakeT = Math.max(G.shakeT, d); G.shakeM = m || 2; }
  function scare() {
    G.scareT = 0.18;
    Sfx.play('stinger');
    shake(0.6, 3); glitch(0.45, 1.6);
  }

  function openDialog(name, lines, onEnd, o) {
    G.dialog = Object.assign({ name, lines, i: 0, shown: 0, onEnd, lastChar: 0 }, o || {});
  }

  function updateDialog(dt) {
    const d = G.dialog, line = d.lines[d.i];
    if (d.shown < line.length) {
      d.shown = Math.min(line.length, d.shown + CONFIG.TEXT_SPEED * dt);
      const n = Math.floor(d.shown);
      if (n !== d.lastChar && n % 2 === 0 && line[n - 1] !== ' ') Sfx.play('talk', d.pitch || 520);
      d.lastChar = n;
    }
    if (Input.confirm()) {
      if (d.shown < line.length) d.shown = line.length;
      else if (d.i < d.lines.length - 1) { d.i++; d.shown = 0; }
      else { G.dialog = null; if (d.onEnd) d.onEnd(api); }
    }
  }

  function burst(x, y, n, colors, spd) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), s = rand(0.3, 1) * (spd || 50);
      G.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: rand(0.3, 0.7), max: 0.7,
        color: colors[(Math.random() * colors.length) | 0], g: 120, size: 1 });
    }
  }
  function dust(x, y, n) {
    const c = G.theme ? shadeColor(G.theme.dirtLight, 0.3) : '#ffffff';
    for (let i = 0; i < n; i++) {
      G.particles.push({ x: x + rand(-3, 3), y: y - 1, vx: rand(-25, 25), vy: rand(-18, -4), life: rand(0.2, 0.4), max: 0.4, color: c, g: 40, size: 1 });
    }
  }

  function initAmbient() {
    G.amb = [];
    const type = G.theme.particles;
    const n = { butterflies: 5, leaves: 10, fireflies: 14, glitchdust: 16, ash: 40 }[type] || 0;
    for (let i = 0; i < n; i++) {
      G.amb.push({ x: rand(0, W), y: rand(0, H), t: rand(0, 10), s: rand(0.5, 1.2),
        c: ['#ff7ab6', '#ffffff', '#ffd84a', '#8ad8ff'][i % 4] });
    }
  }
  function updateAmbient(dt, camDX) {
    const type = G.theme.particles;
    for (const a of G.amb) {
      a.t += dt;
      a.x -= camDX * 0.9;
      switch (type) {
        case 'butterflies': a.x += Math.sin(a.t * 0.7) * 12 * dt + 6 * dt; a.y += Math.sin(a.t * 2.3) * 14 * dt; break;
        case 'leaves': a.x += (10 + Math.sin(a.t * 2) * 12) * dt * a.s; a.y += 14 * dt * a.s; break;
        case 'fireflies': a.x += Math.sin(a.t * 0.9 + a.s * 5) * 8 * dt; a.y += Math.cos(a.t * 1.1) * 6 * dt; break;
        case 'glitchdust': if (Math.random() < 0.02) { a.x = rand(0, W); a.y = rand(0, H); } break;
        case 'ash': a.x += (Math.sin(a.t + a.s * 3) * 6 - 4) * dt; a.y += 9 * dt * a.s; break;
      }
      if (a.x < -8) a.x += W + 16; if (a.x > W + 8) a.x -= W + 16;
      if (a.y > H + 4) { a.y = -4; a.x = rand(0, W); } if (a.y < -8) a.y = H;
    }
  }

  /* ================================================================
     5. API DOS EVENTOS
     ================================================================ */
  const api = {
    get player() { return G.player; },
    get camX() { return G.camX; },
    get time() { return G.levelT; },
    tileX: () => Math.floor((G.player.x + PL.width / 2) / TS),
    moving: () => Math.abs(G.player.vx) > 5 || !G.player.onGround,
    say,
    music: {
      play: (n) => Music.play(n), stop: (f) => Music.stop(f),
      set: (o) => Music.set(o), reset: () => Music.reset(),
    },
    sfx: (n, a) => Sfx.play(n, a),
    drone: (on, v) => (on ? Ambient.droneOn(v) : Ambient.droneOff()),
    heartbeat: (r) => Ambient.heartbeat(r),
    seq, glitch, shake, scare,
    flip: (d) => { G.flipT = d; },
    flag(k, v) { if (v === undefined) return G.flags[k]; G.flags[k] = v; return v; },
    npc: (i) => G.world.npcs[i], door: (i) => G.world.doors[i],
    prop: (i) => G.world.props[i], sign: (i) => G.world.signs[i],
    decosIn: (x1, x2) => G.world.decos.filter((d) => d.col >= x1 && d.col <= x2),
    hud: (t, d) => { G.hudText = t; G.hudT = d || 2; },
    shadow: (o) => G.shadows.push(Object.assign({ t: 0, vx: 0, dur: 1, alpha: 0.5 }, o)),
    addScribble: (s) => G.world.scribbles.push(s),
    black: (v) => { G.black = v; },
    dialog: (name, lines, onEnd, o) => openDialog(name, lines, onEnd, o),
    clearTitle: (t) => { G.clearTitle = t; },
    get dialogOpen() { return !!G.dialog; },
    get friend() { return G.friend; },
    get goo() { return G.goo; },
    get stars() { return G.stars; },
    get starsTotal() { return G.starsTotal; },
    laughSteps,
    fade: (to, secs) => { G.fadeTo = to; G.fadeSpd = Math.abs(to - G.black) / Math.max(0.01, secs || 1); },
    flash: (d) => { G.flashT = d || 0.25; },
    burst: (x, y, n, colors, spd) => burst(x, y, n, colors, spd),
    debris: (o) => G.debris.push(Object.assign({ vx: 0, vy: 0, rot: 0, vr: 0, rest: false }, o)),
    grin: (on) => { G.player.grin = !!on; },
    face: (d) => { G.player.face = d; },
    walkTo: (x, speed) => { G.player.autoX = x; G.player.autoSpeed = speed || 0; },
    friendWalk: (x, speed, cb) => { const f = G.friend; f.mode = 'walk'; f.tx = x - f.w / 2; f.speed = speed || 40; f.onArrive = cb || null; },
    friendLook: (l) => { G.friend.look = l || null; },
    friendFace: (d) => { G.friend.face = d; G.friend.watch = false; },
    friendWatch: (on) => { G.friend.watch = on !== false; },
    friendFall: (vx, cb) => { const f = G.friend; f.mode = 'fall'; f.vx = vx || 0; f.vy = -40; f.onLand = cb || null; },
    friendMode: (m) => { G.friend.mode = m; },
    friendSay: (text, o) => { const f = G.friend; say(Object.assign({ text, style: 'world', x: f.x + f.w / 2, y: f.y - 8, dur: 1.4, size: 8, color: '#ffffff' }, o)); },
    gooStart: (x, by) => { G.goo = { x, by, r: 0, target: 0, t: 0, tH: 0, tendrils: 0, bubT: 0, leaf: false, speed: 0.9 }; },
    gooSet: (o) => Object.assign(G.goo, o),
    complete: (title, info) => {
      setState('clear');
      G.clearTitle = title || 'MISSÃO CONCLUÍDA!';
      G.clearInfo = info || null;
      G.dialog = null;
    },
    nextLevel: () => {
      if (G.levelIndex + 1 < LEVELS.length) loadLevel(G.levelIndex + 1); else api.endGame();
    },
    endGame: () => {
      setState('ending');
      Music.stop(0.05); Ambient.stopAll();
      G.messages = []; G.black = 1; G.dialog = null; G.seqs = [];
      say('querSerAmigo');
      try { localStorage.setItem('stick_amigos_fim', '1'); } catch (e) { /* ok */ }
      fimVisto = true;
    },
  };

  /* ================================================================
     6. ATUALIZAÇÃO
     ================================================================ */
  function update(dt) {
    G.t += dt; G.stateT += dt;
    Music.update();
    Ambient.update(dt);
    if (G.state === 'play' && G.paused) return updatePause(dt);

    switch (G.state) {
      case 'title': updateTitle(); break;
      case 'intro': updateIntro(); break;
      case 'play': updatePlay(dt); break;
      case 'clear': updateClear(dt); break;
      case 'ending': updateEnding(); break;
    }
    G.glitchT = Math.max(0, G.glitchT - dt);
    G.shakeT = Math.max(0, G.shakeT - dt);
    G.flipT = Math.max(0, G.flipT - dt);
    G.scareT = Math.max(0, G.scareT - dt);
    G.hudT = Math.max(0, G.hudT - dt);
    G.flashT = Math.max(0, G.flashT - dt);
    if (G.fadeTo != null) {
      const d = G.fadeTo - G.black, st = G.fadeSpd * dt;
      if (Math.abs(d) <= st) { G.black = G.fadeTo; G.fadeTo = null; } else G.black += Math.sign(d) * st;
    }
    for (const m of G.messages) m.t += dt;
    G.messages = G.messages.filter((m) => m.t < m.dur);
  }

  function updateTitle() {
    if (Input.any && !Music.playing && !Music.pending) Music.play('title');
    if (Input.confirm() && G.stateT > 0.3) {
      const q = /[?&]fase=(\d)/.exec(location.search || '');
      startGame(q ? parseInt(q[1], 10) - 1 : CONFIG.START_LEVEL);
    }
  }

  function updateIntro() {
    if (G.stateT > 2.8 || (G.stateT > 0.6 && Input.confirm())) {
      setState('play');
      if (G.level.onStart) G.level.onStart(api);
    }
  }

  function updatePause(dt) {
    G.pauseT += dt;
    if (Input.hit('pause') || Input.confirm()) { G.paused = false; Sfx.play('select'); }
  }

  function interactTarget() {
    const p = G.player, cx = p.x + PL.width / 2, cy = p.y + PL.height / 2;
    let best = null, bd = CONFIG.PLAYER.interactRange;
    const test = (obj, ox, oy, kind) => {
      const d = Math.abs(cx - ox);
      if (d < bd && Math.abs(cy - oy) < 24) { bd = d; best = { obj, kind }; }
    };
    for (const n of G.world.npcs) if (!n.hidden && !n.fading) test(n, n.x + 6, n.y + 6, 'npc');
    for (const s of G.world.signs) test(s, s.x + 8, s.y + 8, 'sign');
    for (const d of G.world.doors) if (!d.hidden && !d.used) test(d, d.x + 8, d.y + 4, 'door');
    for (const k of G.world.props) if (!k.noInteract && !k.locked && !(k.used && k.once)) test(k, k.x + 8, k.y + 8, 'prop');
    const f = G.friend;
    if (!best && f && G.level.friendTalk && (f.mode === 'follow' || f.mode === 'idle') && !f.cracked) test(f, f.x + f.w / 2, f.y + f.h / 2, 'friend');
    return best;
  }

  function interact() {
    const tg = interactTarget();
    if (!tg) return;
    const p = G.player, o = tg.obj;
    p.interactT = 0.3;
    if (tg.kind === 'npc') {
      p.face = o.x + 6 > p.x ? 1 : -1;
      openDialog(o.name, o.lines, () => {
        if (o.onEnd) o.onEnd(api);
        if (o.mode === 'ghost') { o.fading = true; Sfx.play('vanish'); }
      }, { upside: o.mode === 'upside', color: o.mode === 'ghost' ? '#6d7280' : o.color, pitch: o.mode === 'ghost' ? 260 : 560 });
    } else if (tg.kind === 'sign') {
      openDialog(null, o.lines);
    } else if (tg.kind === 'door') {
      o.used = true;
      if (o.onEnter) o.onEnter(api);
    } else if (tg.kind === 'prop') {
      o.used = true;
      if (o.onUse) o.onUse(api, o);
    } else if (tg.kind === 'friend') {
      const talks = G.level.friendTalk, lines = talks[Math.min(o.talkI, talks.length - 1)];
      o.talkI++;
      const ts = talkStyle(o.kind);
      p.face = o.x + o.w / 2 > p.x + 4 ? 1 : -1;
      o.face = -p.face;
      openDialog(ts.name, typeof lines === 'function' ? lines(api) : lines, null, { color: ts.color, pitch: ts.pitch });
    }
  }

  function updatePlay(dt) {
    const p = G.player, w = G.world;
    if (Input.hit('pause') && !G.dialog) { G.paused = true; G.pauseT = 0; Sfx.play('select'); return; }

    const blocked = !!G.dialog || G.seqs.some((s) => s.blocking);
    updateSeqs(dt);
    if (G.state !== 'play' || G.world !== w) return;

    if (G.dialog) updateDialog(dt);
    else if (!blocked && Input.hit('interact')) interact();

    updatePlayer(dt, blocked || !!G.dialog);
    updateGlitchTiles(dt);

    if (!G.player.dead) {
      const q = G.player, cx = q.x + PL.width / 2;
      for (const s of w.stars) {
        if (!s.got && Math.abs(cx - s.x) < 9 && Math.abs(q.y + 7 - s.y) < 11) {
          s.got = true; G.stars++;
          const item = G.level.item || 'star';
          Sfx.play(item === 'star' ? 'star' : 'pickup');
          const cols = { egg: ['#fff7e8', '#ffffff', '#ffd84a'], gear: ['#c4c8d4', '#ffffff'], berry: ['#ff5a7a', '#ffffff', '#a6ec5a'] }[item];
          burst(s.x, s.y, 8, cols || (G.theme.darkUI ? ['#ff5a6a', '#ffffff'] : ['#ffd84a', '#ffffff', '#fff27a']), 55);
          if (G.level.onPickup) G.level.onPickup(api, G.stars);
        }
      }
      for (const c of w.checkpoints) {
        if (!c.active && cx > c.x && cx < c.x + TS && q.y + PL.height > c.y - 16) {
          w.checkpoints.forEach((o) => { o.active = false; });
          c.active = true;
          G.respawn = { x: c.x + 4, y: c.y + 2 };
          Sfx.play('checkpoint');
          burst(c.x + 8, c.y - 12, 8, ['#b8ff2e', '#ffffff'], 40);
        }
      }
      const c0 = Math.floor(q.x / TS), c1 = Math.floor((q.x + PL.width - 0.01) / TS);
      const r0 = Math.floor(q.y / TS), r1 = Math.floor((q.y + PL.height - 0.01) / TS);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        if (tileAt(c, r) === '^' && q.y + PL.height > r * TS + 9 && q.x + PL.width > c * TS + 2 && q.x < c * TS + 14) die();
      }
      if (q.y > w.height + 24) die();
      if (w.flag && q.x + PL.width > w.flag.x + 6 && !q.dead) {
        Sfx.play('flag'); Music.stop(0.6);
        burst(w.flag.x + 8, w.flag.y - 20, 16, ['#ffd84a', '#ff4a5a', '#b8ff2e', '#ffffff'], 70);
        setState('clear');
        if (G.level.onClear) G.level.onClear(api);
        return;
      }
      const tx = api.tileX();
      (G.level.events || []).forEach((ev, i) => {
        const inside = tx >= ev.x && tx < ev.x + (ev.w || 1);
        const entering = inside && !G.inside[i];
        G.inside[i] = inside;
        if (!entering) return;
        if (ev.once !== false && G.fired[i]) return;
        if (ev.when && !ev.when(api)) return;
        G.fired[i] = true;
        ev.run(api);
      });
      if (G.state !== 'play' || G.world !== w) return;
    }
    if (G.level.update) G.level.update(api, dt);

    updateFriend(dt, true);
    updateDebris(dt);
    updateGoo(dt);
    updateProps(dt);
    updateNpcs(dt);
    updateEffects(dt);
    updateCamera(dt);

    const active = ['left', 'right', 'jump', 'interact'].some((k) => Input.isDown(k));
    G.idleT = active || G.dialog || blocked ? 0 : G.idleT + dt;
    if (G.level.secrets && !G.flags._parado && G.idleT > CONFIG.SECRETS.idleSeconds) {
      G.flags._parado = true;
      say('porQueParou');
      Sfx.play('whisper');
    }
    G.levelT += dt;
  }

  function updateNpcs(dt) {
    const p = G.player;
    for (const n of G.world.npcs) {
      n.t += dt;
      n.blinkT -= dt;
      if (n.blinkT < -0.15) n.blinkT = rand(1.5, 4);
      const d = Math.abs(p.x + 4 - (n.x + 6));
      if (n.mode === 'vanish' && !n.hidden && d < 56) {
        n.hidden = true; Sfx.play('vanish');
        burst(n.x + 6, n.y + 6, 10, ['#7fd0ff', '#ff00dc', '#00ffff'], 40);
      }
      if (n.fading) { n.alpha -= dt * 0.8; if (n.alpha <= 0) { n.hidden = true; n.fading = false; } }
    }
  }

  function updateEffects(dt) {
    for (const s of G.shadows) { s.t += dt; s.x += s.vx * dt; }
    G.shadows = G.shadows.filter((s) => s.t < s.dur);
    for (const q of G.particles) { q.life -= dt; q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
    G.particles = G.particles.filter((q) => q.life > 0);
  }

  function updateCamera(dt, snap) {
    const p = G.player, w = G.world;
    const prev = G.camX;
    const tx = clamp(p.x + 4 - W / 2 + p.face * 18, 0, w.width - W);
    const ty = clamp(p.y - 110, 0, w.height - H);
    const k = snap ? 1 : Math.min(1, dt * 4);
    G.camX += (tx - G.camX) * k;
    G.camY += (ty - G.camY) * k;
    updateAmbient(dt, G.camX - prev);
  }

  function updateClear(dt) {
    updatePlayer(dt, true);
    updateFriend(dt, false);
    updateDebris(dt);
    updateGoo(dt);
    updateEffects(dt);
    updateCamera(dt);
    updateSeqs(dt);
    if (G.stateT > 1.6 && Input.confirm()) {
      Sfx.play('select');
      api.nextLevel();
    }
  }

  function updateEnding() {
    if (G.stateT > 10 && Input.confirm()) {
      G.messages = []; G.black = 0;
      setState('title');
      Music.play('title');
    }
  }

  /* ================================================================
     7. DESENHO
     ================================================================ */
  function txt(ctx, s, x, y, o) {
    o = o || {};
    const size = o.size || 8;
    ctx.font = size + 'px ' + FONT;
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = o.alpha != null ? clamp(o.alpha, 0, 1) : 1;
    const lines = String(s).split('\n');
    const lh = size + 4;
    lines.forEach((line, li) => {
      const ly = Math.round(y + (li - (lines.length - 1) / 2) * lh);
      if (o.jitter) {
        const total = ctx.measureText(line).width;
        let cx = o.align === 'left' ? x : o.align === 'right' ? x - total : x - total / 2;
        ctx.textAlign = 'left';
        for (const ch of line) {
          const jx = Math.round(rand(-1, 1)), jy = Math.round(rand(-1, 1));
          if (o.shadow !== false) { ctx.fillStyle = o.shadowColor || '#000000'; ctx.fillText(ch, cx + jx + 1, ly + jy + 1); }
          ctx.fillStyle = o.color || '#ffffff'; ctx.fillText(ch, cx + jx, ly + jy);
          cx += ctx.measureText(ch).width;
        }
        ctx.textAlign = o.align || 'center';
        return;
      }
      if (o.outline) {
        ctx.fillStyle = o.outline;
        for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) ctx.fillText(line, x + ox, ly + oy);
        ctx.fillText(line, x + 1, ly + 2);
      } else if (o.shadow !== false) {
        ctx.fillStyle = o.shadowColor || '#000000'; ctx.fillText(line, x + 1, ly + 1);
      }
      ctx.fillStyle = o.color || '#ffffff';
      ctx.fillText(line, x, ly);
    });
    ctx.globalAlpha = 1;
  }

  function drawSun(ctx, T, camX) {
    const t = G.t;
    const sx = Math.round(250 - camX * 0.02), p = G.player;
    switch (T.sunType) {
      case 'sun':
        pxCircle(ctx, sx, 34, 13, shadeColor(T.sun, 0.4));
        pxCircle(ctx, sx, 34, 11, T.sun);
        ctx.fillStyle = shadeColor(T.sun, 0.5); ctx.fillRect(sx - 5, 28, 3, 2);
        break;
      case 'lowsun': pxCircle(ctx, sx - 30, 92, 15, T.sun); pxCircle(ctx, sx - 34, 88, 5, shadeColor(T.sun, 0.4)); break;
      case 'bigsun':
        pxCircle(ctx, sx - 60, 98, 28, T.sun);
        ctx.fillStyle = T.sky[2];
        for (let i = 0; i < 4; i++) ctx.fillRect(sx - 92, 92 + i * 6 + (i * i), 64, 1 + i);
        break;
      case 'pale': pxCircle(ctx, sx, 40, 12, T.sun); ctx.fillStyle = T.sky[1]; ctx.fillRect(sx - 12, 38, 24, 1); break;
      case 'eye': {
        const ex = sx - 20, ey = 36;
        const blink = Math.sin(t * 0.37) > 0.985;
        pxCircle(ctx, ex, ey, 17, '#1a0508');
        if (blink) { ctx.fillStyle = T.sun; ctx.fillRect(ex - 14, ey, 28, 1); break; }
        ctx.fillStyle = '#e8d8cc';
        for (let dy = -7; dy <= 7; dy++) {
          const hw = Math.floor(15 * Math.sqrt(1 - (dy * dy) / 64));
          ctx.fillRect(ex - hw, ey + dy, hw * 2 + 1, 1);
        }
        const lookX = p ? clamp((p.x - G.camX - ex) / 12, -7, 7) : 0;
        const lookY = p ? clamp((p.y - G.camY - ey) / 30, -2, 3) : 0;
        pxCircle(ctx, ex + lookX, ey + lookY, 5, T.sun);
        pxCircle(ctx, ex + lookX, ey + lookY, 2, '#0a0204');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(ex + lookX - 2), Math.round(ey + lookY - 3), 1, 1);
        ctx.fillStyle = '#5a1018'; ctx.fillRect(ex - 9, ey - 3, 4, 1); ctx.fillRect(ex + 6, ey + 4, 5, 1);
        break;
      }
    }
  }

  function drawBackground(ctx, bg, camX, camY) {
    const T = bg.T;
    ctx.drawImage(bg.sky, 0, 0);
    drawSun(ctx, T, camX);
    for (const c of bg.clouds) {
      const x = ((c.x - camX * 0.06 - G.t * 3 * c.s) % 700 + 700) % 700 - 60;
      Backdrop.drawCloud(ctx, Math.round(x), Math.round(c.y), c.s, T.cloud);
    }
    const dy = (camY - 12) * 0.3;
    Backdrop.layer(ctx, bg.mountains, camX, 0.12, -dy * 0.4);
    Backdrop.layer(ctx, bg.hills, camX, 0.3, -dy * 0.7);
    Backdrop.layer(ctx, bg.trees, camX, 0.5, -dy);
  }

  function drawRegions(ctx, w, T) {
    for (const r of w.regions) {
      const x = r.x1 * TS, y = r.y1 * TS, rw = (r.x2 - r.x1 + 1) * TS, rh = (r.y2 - r.y1 + 1) * TS;
      if (r.type === 'cave') {
        ctx.fillStyle = T.caveBg; ctx.fillRect(x, y - 2, rw, rh + 2);
        ctx.fillStyle = shadeColor(T.caveBg, -0.25);
        for (let i = 0; i < rw; i += 11) ctx.fillRect(x + i + ((i * 7) % 5), y + ((i * 13) % 30), 3, 2);
        ctx.fillStyle = shadeColor(T.caveBg, 0.12);
        for (let i = 5; i < rw; i += 19) ctx.fillRect(x + i, y, 1, 2 + (i % 4));
      } else if (r.type === 'room') {
        ctx.fillStyle = T.roomBg; ctx.fillRect(x, y, rw, rh);
        ctx.fillStyle = shadeColor(T.roomBg, 0.07);
        for (let i = 0; i < rw; i += 6) ctx.fillRect(x + i, y, 2, rh);
        ctx.fillStyle = shadeColor(T.roomBg, -0.3); ctx.fillRect(x, y + rh - 4, rw, 4);
        const wx = x + 150, wy = y + 14;
        ctx.fillStyle = '#3a2a2e'; ctx.fillRect(wx - 2, wy - 2, 28, 22);
        ctx.fillStyle = '#050206'; ctx.fillRect(wx, wy, 24, 18);
        ctx.fillStyle = '#3a2a2e'; ctx.fillRect(wx + 11, wy, 2, 18); ctx.fillRect(wx, wy + 8, 24, 2);
        if (Math.sin(G.t * 0.5) > 0.2) { ctx.fillStyle = '#c8303c'; ctx.fillRect(wx + 5, wy + 5, 1, 1); ctx.fillRect(wx + 8, wy + 5, 1, 1); }
        const lx0 = x + 200;
        ctx.fillStyle = '#1a1014'; ctx.fillRect(lx0, y, 1, 12);
        ctx.fillStyle = Math.random() < 0.03 ? '#554033' : '#ffe6a0'; ctx.fillRect(lx0 - 2, y + 12, 5, 4);
      }
    }
  }

  function drawShadowFigure(ctx, s) {
    const fade = Math.min(1, s.t / 0.15, (s.dur - s.t) / 0.3);
    let a = s.alpha * fade;
    if (s.still && Math.random() < 0.1) a *= 0.4;
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.fillStyle = '#0b0710';
    const x = Math.round(s.x), y = Math.round(s.y);
    pxCircle(ctx, x, y - 27, 3, '#0b0710');
    ctx.fillRect(x - 3, y - 23, 7, 12);
    ctx.fillRect(x - 2, y - 11, 2, 11); ctx.fillRect(x + 1, y - 11, 2, 11);
    ctx.fillRect(x - 5, y - 22, 2, 11); ctx.fillRect(x + 4, y - 22, 2, 11);
    ctx.globalAlpha = 1;
  }

  function drawSign(ctx, s, T) {
    const by = s.y + TS;
    ctx.fillStyle = T.trunkDark; ctx.fillRect(s.x + 7, by - 9, 2, 9);
    ctx.fillStyle = T.plankDark; ctx.fillRect(s.x + 1, by - 17, 14, 10);
    ctx.fillStyle = T.plank; ctx.fillRect(s.x + 2, by - 16, 12, 8);
    ctx.fillStyle = T.plankDark;
    ctx.fillRect(s.x + 4, by - 14, 8, 1); ctx.fillRect(s.x + 4, by - 11, 6, 1);
  }

  function drawCheckpoint(ctx, c, T) {
    const by = c.y + TS, x = c.x + 7;
    ctx.fillStyle = T.brickDark; ctx.fillRect(x - 3, by - 2, 8, 2);
    ctx.fillStyle = '#e8e8e8'; ctx.fillRect(x, by - 24, 2, 22);
    const wv = Math.round(Math.sin(G.t * 6) * 1);
    ctx.fillStyle = c.active ? '#b8ff2e' : '#9a9aa8';
    for (let i = 0; i < 6; i++) ctx.fillRect(x + 2, by - 24 + i, 8 - i + (i % 2 ? wv : 0), 1);
    ctx.fillStyle = c.active ? '#86d11a' : '#7a7a88'; ctx.fillRect(x + 2, by - 19, 3, 1);
  }

  function drawFlag(ctx, f) {
    const by = f.y + TS, x = f.x + 7;
    ctx.fillStyle = '#6f6a8a'; ctx.fillRect(x - 4, by - 3, 10, 3);
    ctx.fillStyle = '#f0f0f0'; ctx.fillRect(x, by - 44, 2, 41);
    pxCircle(ctx, x + 1, by - 46, 2, '#ffd84a');
    for (let i = 0; i < 12; i++) {
      const w = 14 - Math.abs(i - 6) * 2 + Math.round(Math.sin(G.t * 5 + i * 0.5));
      ctx.fillStyle = i === 5 || i === 6 ? '#ffd84a' : '#ff4a5a';
      ctx.fillRect(x + 2, by - 42 + i, Math.max(1, w), 1);
    }
  }

  function drawDoor(ctx, d, T) {
    if (d.hidden) {
      if (d.cover === 'bush') World.drawBush(ctx, d.x + 8, d.y + TS, T, false);
      return;
    }
    const by = d.y + TS;
    ctx.fillStyle = '#1a1014'; ctx.fillRect(d.x, by - 27, 16, 27);
    ctx.fillStyle = T.houseDoor; ctx.fillRect(d.x + 2, by - 25, 12, 25);
    ctx.fillStyle = shadeColor(T.houseDoor, -0.3);
    ctx.fillRect(d.x + 5, by - 25, 1, 25); ctx.fillRect(d.x + 9, by - 25, 1, 25);
    ctx.fillStyle = '#000000'; ctx.fillRect(d.x + 13, by - 25, 1, 25);
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(d.x + 11, by - 12, 1, 2);
  }

  function drawRocket(ctx, k, T) {
    const cx = k.x + 8, base = k.y + TS;
    ctx.fillStyle = '#6a6a7a'; ctx.fillRect(cx - 18, base - 4, 36, 4);
    ctx.fillStyle = '#8a8a9a'; ctx.fillRect(cx - 18, base - 4, 36, 1);
    ctx.fillStyle = '#c84a3a';
    for (let y = base - 60; y < base - 4; y += 2) ctx.fillRect(cx + 20, y, 1, 1);
    ctx.fillRect(cx + 18, base - 60, 1, 56); ctx.fillRect(cx + 23, base - 60, 1, 56);
    for (let y = base - 58; y < base - 4; y += 8) { ctx.fillRect(cx + 18, y, 6, 1); }
    if (k.state === 'gone') {
      ctx.fillStyle = '#2a2226'; ctx.fillRect(cx - 12, base - 6, 24, 2);
      return;
    }
    const y0 = base - 4 - k.lift;
    const shake = k.state === 'launch' ? Math.round(rand(-1, 1)) : 0;
    ctx.save();
    ctx.translate(cx + shake + Math.sin(k.tilt) * 8, y0);
    ctx.rotate(k.tilt);
    if (k.state === 'launch') {
      for (let i = 0; i < 12 + ((Math.random() * 6) | 0); i++) {
        const w = Math.max(1, 8 - Math.floor(i * 0.6));
        ctx.fillStyle = i < 4 ? '#fff6a0' : i < 9 ? '#ffd84a' : '#ff8a2a';
        ctx.fillRect(-w / 2 + Math.round(rand(-1, 1)), i, w, 1);
      }
    }
    ctx.fillStyle = '#e8503a';
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(-8 - Math.floor(i / 2), -10 + i, 2 + Math.floor(i / 2), 1);
      if (k.state !== 'broken') ctx.fillRect(6, -10 + i, 2 + Math.floor(i / 2), 1);
    }
    if (k.state === 'broken') { ctx.fillStyle = '#e8503a'; ctx.fillRect(8, -2, 3, 1); ctx.fillRect(9, -1, 3, 1); }
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(-6, -46, 12, 46);
    ctx.fillStyle = '#c8ccd8'; ctx.fillRect(3, -46, 3, 46);
    ctx.fillStyle = '#ff8a2a'; ctx.fillRect(-6, -14, 12, 3); ctx.fillRect(-6, -34, 12, 2);
    for (let i = 0; i < 12; i++) {
      const w = Math.max(1, Math.round(12 - i)); ctx.fillStyle = i < 3 ? '#e8503a' : '#ff8a2a';
      ctx.fillRect(-Math.floor(w / 2), -47 - i, w, 1);
    }
    pxCircle(ctx, 0, -26, 4, '#6a7080');
    pxCircle(ctx, 0, -26, 3, '#9fe0ff');
    if (k.crew) {
      pxCircle(ctx, 0, -25, 2, '#ff8a2a');
      ctx.fillStyle = '#bfe8ff'; ctx.fillRect(-1, -26, 3, 1);
      ctx.fillStyle = '#1e1a2a'; ctx.fillRect(-1, -26, 1, 1); ctx.fillRect(1, -26, 1, 1);
    }
    if (k.state === 'broken') {
      ctx.fillStyle = '#2a2230'; ctx.fillRect(-5, -20, 4, 4); ctx.fillRect(1, -40, 3, 3);
      ctx.fillStyle = '#d8d8e0'; ctx.fillRect(-9, -21, 4, 6);
      if (Math.random() < 0.15) { ctx.fillStyle = '#9a9a9a'; ctx.fillRect(-3 + rand(-2, 2), -24 - rand(0, 6), 1, 1); }
    }
    ctx.restore();
  }

  function drawProp(ctx, k, T) {
    const x = k.x, by = k.y + TS;
    switch (k.kind) {
      case 'rocket': drawRocket(ctx, k, T); break;
      case 'arch': {
        const cx = x + 8;
        ctx.fillStyle = T.trunkDark; ctx.fillRect(cx - 62, by - 54, 4, 54); ctx.fillRect(cx + 58, by - 54, 4, 54);
        ctx.fillStyle = T.trunk; ctx.fillRect(cx - 61, by - 54, 2, 54); ctx.fillRect(cx + 59, by - 54, 2, 54);
        ctx.fillStyle = T.plankDark; ctx.fillRect(cx - 66, by - 62, 132, 14);
        ctx.fillStyle = T.plank; ctx.fillRect(cx - 65, by - 61, 130, 12);
        txt(ctx, 'VILA DAS FRUTAS', cx, by - 55, { color: '#2a1a14', shadow: false });
        const fr = ['#ff5a7a', '#ffb43a', '#a6ec5a', '#ff5a7a', '#c86ad8'];
        fr.forEach((c, i) => {
          if (i === 3) return;
          const fx = cx - 48 + i * 24;
          ctx.fillStyle = '#3a2a2a'; ctx.fillRect(fx, by - 48, 1, 4);
          pxCircle(ctx, fx, by - 42, 2, c);
        });
        break;
      }
      case 'photo': {
        const px = x - 2, py = by - 52;
        ctx.fillStyle = '#6a4a30'; ctx.fillRect(px, py, 22, 17);
        ctx.fillStyle = '#d8e8f0'; ctx.fillRect(px + 2, py + 2, 18, 13);
        ctx.fillStyle = '#7fb06a'; ctx.fillRect(px + 2, py + 11, 18, 4);
        ctx.fillStyle = '#fff7e8'; ctx.fillRect(px + 4, py + 7, 3, 4);
        ctx.fillStyle = '#ff8a2a'; ctx.fillRect(px + 8, py + 6, 3, 5);
        ctx.fillStyle = '#a6ec5a'; ctx.fillRect(px + 12, py + 7, 3, 4);
        ctx.fillStyle = '#120a10'; ctx.fillRect(px + 16, py + 5, 3, 7); ctx.fillRect(px + 15, py + 6, 1, 4);
        break;
      }
      case 'invite':
        ctx.fillStyle = T.plankDark; ctx.fillRect(x, by - 9, 16, 2); ctx.fillRect(x + 1, by - 7, 2, 7); ctx.fillRect(x + 13, by - 7, 2, 7);
        ctx.fillStyle = '#ffc6dc'; ctx.fillRect(x + 3, by - 13, 10, 4);
        ctx.fillStyle = '#ff7ab6'; ctx.fillRect(x + 4, by - 12, 5, 1); ctx.fillRect(x + 4, by - 10, 7, 1);
        break;
      case 'crayons': {
        const pics = [[x - 12, by - 48], [x + 2, by - 52], [x + 16, by - 46]];
        pics.forEach(([px, py], i) => {
          ctx.fillStyle = '#e8e0d0'; ctx.fillRect(px, py, 12, 13);
          ctx.fillStyle = '#b8ff2e'; ctx.fillRect(px + 1, py + 6, 2, 4);
          ctx.fillStyle = '#fff7e8'; ctx.fillRect(px + 4, py + 7, 2, 3);
          ctx.fillStyle = '#ff8a2a'; ctx.fillRect(px + 7, py + 6, 2, 4);
          ctx.fillStyle = '#a6ec5a'; ctx.fillRect(px + 10, py + 7, 1, 3);
          if (i === 2) {
            ctx.fillStyle = '#c0203a';
            for (const fx of [5, 8, 10]) { ctx.fillRect(px + fx - 1, py + 5, 1, 1); ctx.fillRect(px + fx + 1, py + 5, 1, 1); ctx.fillRect(px + fx, py + 6, 1, 1); ctx.fillRect(px + fx - 1, py + 7, 1, 1); ctx.fillRect(px + fx + 1, py + 7, 1, 1); }
          }
        });
        break;
      }
      case 'mirror': {
        const mx0 = x, my0 = by - 36;
        ctx.fillStyle = '#5a4030'; ctx.fillRect(mx0, my0, 16, 36);
        ctx.fillStyle = '#1a2028'; ctx.fillRect(mx0 + 2, my0 + 2, 12, 32);
        const p = G.player;
        if (Math.abs(p.x + 4 - (mx0 + 8)) < 70) {
          ctx.globalAlpha = 0.75;
          ctx.save(); ctx.translate(mx0 + 8, my0 + 14); ctx.scale(p.face > 0 ? -1 : 1, 1);
          ctx.drawImage(Sprites.get('player', 'grin'), -6, 0); ctx.restore();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = 'rgba(200,220,255,0.15)'; ctx.fillRect(mx0 + 3, my0 + 3, 2, 30);
        break;
      }
      case 'papers':
        ctx.fillStyle = T.plankDark; ctx.fillRect(x - 3, by - 10, 22, 2); ctx.fillRect(x - 2, by - 8, 2, 8); ctx.fillRect(x + 16, by - 8, 2, 8);
        ctx.fillStyle = '#d8d0c4';
        for (let i = 0; i < 5; i++) ctx.fillRect(x + 1 + (i % 2), by - 12 - i, 10, 1);
        ctx.fillStyle = '#9a9088'; ctx.fillRect(x + 3, by - 15, 5, 1);
        ctx.fillStyle = '#c8c0b4'; ctx.fillRect(x - 8, by - 1, 6, 1); ctx.fillRect(x + 20, by - 1, 5, 1); ctx.fillRect(x + 12, by - 2, 4, 1);
        break;
      case 'drawings': {
        const pics = [[x - 10, by - 48], [x + 3, by - 52], [x + 16, by - 46]];
        pics.forEach(([px, py], i) => {
          ctx.fillStyle = '#e8e0d0'; ctx.fillRect(px, py, 11, 13);
          ctx.fillStyle = '#b8ff2e'; ctx.fillRect(px + 4, py + 6, 3, 4);
          ctx.fillStyle = '#7a4a24'; ctx.fillRect(px + 4, py + 3, 3, 2);
          ctx.fillStyle = ['#ff9ecf', '#7fd0ff', '#ffd06a'][i]; ctx.fillRect(px + 1, py + 8, 2, 2);
          if (i === 2) { ctx.fillStyle = '#0a0508'; ctx.fillRect(px + 8, py + 2, 2, 9); }
        });
        break;
      }
      case 'notebook':
        ctx.fillStyle = T.plankDark; ctx.fillRect(x + 2, by - 7, 12, 2); ctx.fillRect(x + 4, by - 5, 2, 5); ctx.fillRect(x + 10, by - 5, 2, 5);
        ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x + 3, by - 9, 10, 2);
        ctx.fillStyle = '#6a2a30'; ctx.fillRect(x + 8, by - 9, 1, 2); ctx.fillRect(x + 4, by - 9, 3, 1);
        break;
      case 'computer': {
        ctx.fillStyle = T.plankDark; ctx.fillRect(x - 6, by - 11, 28, 2); ctx.fillRect(x - 5, by - 9, 2, 9); ctx.fillRect(x + 19, by - 9, 2, 9);
        ctx.fillStyle = '#b8b0a0'; ctx.fillRect(x - 3, by - 35, 24, 22);
        ctx.fillStyle = '#8a8272'; ctx.fillRect(x + 4, by - 13, 10, 2);
        ctx.fillStyle = '#0a1a14'; ctx.fillRect(x - 1, by - 33, 20, 16);
        ctx.globalAlpha = 0.85;
        ctx.drawImage(mini, 0, 0, mini.width, mini.height, x - 1, by - 32, 20, 12);
        ctx.globalAlpha = 1;
        if (Math.random() < 0.3) { ctx.fillStyle = 'rgba(180,255,220,0.25)'; ctx.fillRect(x - 1, by - 33 + ((G.t * 30) % 16 | 0), 20, 1); }
        ctx.fillStyle = '#d8d0c0'; ctx.fillRect(x + 1, by - 13, 16, 1);
        break;
      }
    }
  }

  function drawStar(ctx, s, T) {
    if (s.got) return;
    const bob = Math.round(Math.sin(G.t * 3 + s.phase) * 1.5);
    const img = Sprites.get('star', T.darkUI ? 'eye' : (G.level.item || 'star'));
    ctx.drawImage(img, Math.round(s.x - 3), Math.round(s.y - 3 + bob));
    if (!T.darkUI && Math.sin(G.t * 4 + s.phase * 3) > 0.9) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(s.x + 3), Math.round(s.y - 5 + bob), 1, 1); }
  }

  function drawNpc(ctx, n) {
    if (n.hidden) return;
    const p = G.player;
    const ghost = n.mode === 'ghost';
    let img;
    if (n.sheet) {
      const rec = ghost ? GHOST_RECOLOR : null;
      const fr = ghost ? 'sad' : (n.mode !== 'stare' && n.blinkT < 0 ? 'blink' : 'idle');
      img = Sprites.get(n.sheet, fr, rec);
    } else {
      const rec = ghost
        ? { c: '#8a90a0', C: '#5d6270', k: '#2a2d38', w: '#a8acb8', m: '#8a90a0', e: '#000000' }
        : { c: n.color, C: shadeColor(n.color, -0.22) };
      let frame = 'idle';
      if (n.mode === 'stare' || ghost) frame = p.x + 4 < n.x + 6 ? 'stareL' : 'stareR';
      else if (n.blinkT < 0) frame = 'blink';
      img = Sprites.get('npc', frame, rec);
    }
    const bob = n.mode === 'normal' || n.mode === 'vanish' ? (Math.floor(n.t * 2.5) % 2) : 0;
    let a = n.alpha;
    if (ghost) a *= 0.45 + Math.sin(n.t * 7) * 0.1 + (Math.random() < 0.05 ? -0.3 : 0);
    ctx.globalAlpha = clamp(a, 0, 1);
    const x = Math.round(n.x), y = Math.round(n.y) + bob;
    const yy = y + 12 - img.height;
    if (n.mode === 'upside') {
      ctx.save(); ctx.translate(x, y + 12); ctx.scale(1, -1); ctx.drawImage(img, 0, 0); ctx.restore();
    } else if (n.sheet && n.mode !== 'ghost') {
      ctx.save(); ctx.translate(x + img.width / 2, yy); ctx.scale(p.x + 4 < n.x + 6 ? -1 : 1, 1); ctx.drawImage(img, -img.width / 2, 0); ctx.restore();
    } else ctx.drawImage(img, x, yy);
    ctx.globalAlpha = 1;
  }

  function drawFriend(ctx) {
    const f = G.friend;
    if (!f || f.mode === 'hidden') return;
    const bx = Math.round(f.x + f.w / 2), by = Math.round(f.y + f.h);
    if (f.cracked) {
      ctx.fillStyle = '#ffcf3a'; ctx.fillRect(bx - 8, by - 2, 16, 2); ctx.fillRect(bx - 5, by - 3, 9, 1);
      ctx.fillStyle = '#f0a020'; ctx.fillRect(bx - 2, by - 3, 3, 1);
      ctx.drawImage(Sprites.get('shell', 'left'), bx - 13, by - 7);
      ctx.drawImage(Sprites.get('shell', 'right'), bx + 4, by - 7);
      return;
    }
    const frame = f.look || (f.blinkT < 0 ? 'blink' : 'idle');
    const img = Sprites.get(f.kind, frame);
    const bob = f.moving ? Math.floor(f.anim) % 2 : 0;
    let dx = Math.round(f.x), dy = Math.round(f.y) - bob;
    if (f.shake) { dx += Math.round(rand(-1, 1)); }
    if (f.mode !== 'fall' && f.mode !== 'sink' && f.mode !== 'board') { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(dx + 2, by, f.w - 4, 1); }
    ctx.save();
    ctx.globalAlpha = f.alpha;
    if (f.mode === 'sink' && G.goo) {
      ctx.beginPath(); ctx.rect(dx - 8, 0, f.w + 16, G.goo.by - 2); ctx.clip();
      dy += Math.round(f.sink * (f.h + 3));
    }
    ctx.translate(dx + f.w / 2, dy);
    ctx.scale(f.face < 0 ? -1 : 1, 1);
    ctx.drawImage(img, -f.w / 2, 0);
    ctx.restore();
  }

  function drawGoo(ctx, layer) {
    const g = G.goo;
    if (!g || g.r < 0.5) return;
    const r = Math.round(g.r), x = Math.round(g.x), by = g.by;
    const h = Math.max(2, Math.round(r * 0.12));
    if (layer === 'back') {
      if (g.tH <= 1) return;
      ctx.fillStyle = '#07040a';
      for (let i = 0; i < 6; i++) {
        const tx = x - r * 0.7 + (i / 5) * r * 1.4, th = g.tH * (0.6 + ((i * 37) % 10) / 20);
        for (let yy = 0; yy < th; yy++) {
          const wv = Math.round(Math.sin(g.t * 4 + i * 1.7 + yy * 0.25) * (1 + yy / 10));
          ctx.fillRect(Math.round(tx + wv), Math.round(by - h - yy), yy > th - 3 ? 1 : 2, 1);
        }
      }
      return;
    }
    for (let dy = -h; dy <= 1; dy++) {
      const w = Math.round(r * Math.sqrt(Math.max(0, 1 - (dy * dy) / ((h + 1) * (h + 1)))));
      ctx.fillStyle = '#07040a'; ctx.fillRect(x - w, by + dy, w * 2, 1);
    }
    ctx.fillStyle = '#3a1f4a';
    ctx.fillRect(x - Math.round(r * 0.5), by - h + 1, Math.round(r * 0.4), 1);
    for (let i = 0; i < Math.min(6, r / 4); i++) {
      const ph = (g.t * 0.8 + i * 0.37) % 1;
      const bxp = Math.round(x + Math.sin(i * 12.9) * r * 0.7);
      if (ph < 0.8) { ctx.fillStyle = '#1a0f22'; pxCircle(ctx, bxp, by - h - Math.round(ph * 2), 1 + (i % 2), '#120a18'); }
    }
    if (g.leaf) {
      const lx = x + Math.round(Math.sin(g.t * 1.2) * 2), ly = by - h - 1;
      ctx.fillStyle = '#5a3a24'; ctx.fillRect(lx, ly - 3, 1, 3);
      ctx.fillStyle = '#86d11a'; ctx.fillRect(lx + 1, ly - 3, 3, 1); ctx.fillRect(lx + 1, ly - 2, 2, 1);
    }
  }

  function drawDebris(ctx) {
    for (const d of G.debris) {
      ctx.save();
      ctx.translate(Math.round(d.x), Math.round(d.y));
      ctx.rotate(d.rot);
      switch (d.kind) {
        case 'gear': ctx.drawImage(Sprites.get('star', 'gear'), -3, -4); break;
        case 'panel': ctx.fillStyle = d.color || '#f4f4f4'; ctx.fillRect(-3, -2, 6, 3); break;
        case 'helmet':
          pxCircle(ctx, 0, -4, 5, '#2a1a14'); pxCircle(ctx, 0, -4, 4, '#ff8a2a');
          ctx.fillStyle = '#5a6a7a'; ctx.fillRect(-3, -6, 6, 4);
          ctx.fillStyle = '#bfe8ff'; ctx.fillRect(-3, -6, 2, 1);
          ctx.fillStyle = '#1a1014'; ctx.fillRect(0, -6, 1, 2); ctx.fillRect(1, -4, 1, 2);
          break;
      }
      ctx.restore();
    }
  }

  function drawPlayer(ctx) {
    const p = G.player;
    let frame = 'idle';
    if (p.dead) frame = 'hurt';
    else if (p.interactT > 0) frame = 'interact';
    else if (!p.onGround) frame = p.vy < 0 ? 'jump' : 'fall';
    else if (Math.abs(p.vx) > 8) frame = ['walk1', 'walk2', 'walk3', 'walk2'][Math.floor(p.anim) % 4];
    else if (p.blinkT < 0) frame = 'blink';
    if (p.grin && !p.dead) frame = p.laughT > 0 && Math.floor(G.t * 10) % 2 ? 'grin2' : 'grin';
    const img = Sprites.get('player', frame);
    const dx = Math.round(p.x - 2), dy = Math.round(p.y - 2) - (p.laughT > 0 ? Math.floor(G.t * 12) % 2 : 0);
    if (p.onGround && !p.dead) { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(dx + 2, dy + 16, 8, 1); }
    ctx.save();
    ctx.translate(dx + 6, dy + 8);
    ctx.scale(p.face < 0 ? -1 : 1, p.dead && p.popped ? -1 : 1);
    ctx.drawImage(img, -6, -8);
    ctx.restore();
  }

  function drawLighting(ctx, T, camX, camY) {
    const dark = T.darkness || 0;
    if (dark <= 0) return;
    lx.globalCompositeOperation = 'source-over';
    lx.clearRect(0, 0, W, H);
    lx.fillStyle = 'rgba(4,0,8,' + dark + ')';
    lx.fillRect(0, 0, W, H);
    lx.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r) => {
      const g = lx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      lx.fillStyle = g; lx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    const p = G.player;
    hole(p.x + 4 - camX, p.y + 6 - camY, 66 + Math.sin(G.t * 9) * 2);
    const f = G.friend;
    if (f && f.mode !== 'hidden') hole(f.x + f.w / 2 - camX, f.y + f.h / 2 - camY, 34);
    for (const k of G.world.props) if (k.glow) hole(k.x + 8 - camX, k.y - 10 - camY, k.glow);
    for (const s of G.world.stars) if (!s.got) hole(s.x - camX, s.y - camY, 12);
    if (T.sunType === 'eye') hole(Math.round(250 - camX * 0.02) - 20, 36, 30);
    for (const k of G.world.props) if (k.kind === 'computer') hole(k.x + 9 - camX, k.y - 8 - camY, 34 + Math.random() * 3);
    for (const r of G.world.regions) if (r.type === 'room' && Math.random() > 0.03) hole(r.x1 * TS + 202 - camX, r.y1 * TS + 18 - camY, 70);
    lx.globalCompositeOperation = 'source-over';
    ctx.drawImage(light, 0, 0);
  }

  function renderScene() {
    const ctx = bx, T = G.theme, w = G.world;
    let camX = Math.round(G.camX), camY = Math.round(G.camY);
    if (G.shakeT > 0) { camX += Math.round(rand(-G.shakeM, G.shakeM)); camY += Math.round(rand(-G.shakeM, G.shakeM)); }
    ctx.imageSmoothingEnabled = false;
    drawBackground(ctx, G.bg, camX, camY);

    ctx.save();
    ctx.translate(-camX, -camY);
    drawRegions(ctx, w, T);
    const px = G.player.x + 4;
    for (const s of G.shadows) drawShadowFigure(ctx, s);
    for (const d of w.decos) if (d.x > camX - 48 && d.x < camX + W + 48) World.drawDeco(ctx, d, T, G.t, px);
    const tsx = clamp(camX, 0, w.width - 1), tsw = Math.min(W + 4, w.width - tsx);
    ctx.drawImage(G.terrain, tsx, 0, tsw, w.height, tsx, 0, tsw, w.height);
    for (let r = 0; r < w.rows; r++) for (let c = Math.floor(camX / TS); c <= Math.floor((camX + W) / TS); c++) {
      if (w.tiles[r] && w.tiles[r][c] === '~') {
        const g = w.glitch[c + ',' + r];
        if (g && g.gone > 0) continue;
        if (g && g.on && Math.random() < g.t / CONFIG.DIFFICULTY.glitchPlatformTime) continue;
        const jx = g && g.on ? Math.round(rand(-1, 1)) : 0;
        World.drawPlank(ctx, c * TS + jx, r * TS, T, true);
      }
    }
    for (const s of w.signs) drawSign(ctx, s, T);
    for (const c of w.checkpoints) drawCheckpoint(ctx, c, T);
    if (w.flag) drawFlag(ctx, w.flag);
    for (const d of w.doors) drawDoor(ctx, d, T);
    for (const k of w.props) drawProp(ctx, k, T);
    for (const s of w.stars) drawStar(ctx, s, T);
    for (const n of w.npcs) drawNpc(ctx, n);
    drawGoo(ctx, 'back');
    drawFriend(ctx);
    drawGoo(ctx, 'front');
    drawPlayer(ctx);
    drawDebris(ctx);
    for (const q of G.particles) {
      ctx.globalAlpha = clamp(q.life / q.max * 1.5, 0, 1);
      ctx.fillStyle = q.color; ctx.fillRect(Math.round(q.x), Math.round(q.y), q.size, q.size);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    const type = T.particles;
    for (const a of G.amb) {
      const x = Math.round(a.x), y = Math.round(a.y);
      switch (type) {
        case 'butterflies': {
          ctx.fillStyle = a.c; const f = Math.floor(a.t * 8) % 2;
          ctx.fillRect(x - 1, y - f, 1, 1 + f); ctx.fillRect(x + 1, y - f, 1, 1 + f); ctx.fillStyle = '#2a1a14'; ctx.fillRect(x, y, 1, 1);
          break;
        }
        case 'leaves': ctx.fillStyle = a.s > 0.9 ? '#e8963a' : '#8ccf5a'; ctx.fillRect(x, y, 2, 1); break;
        case 'fireflies':
          if (Math.sin(a.t * 2 + a.s * 9) > 0) { ctx.fillStyle = 'rgba(255,240,140,0.35)'; ctx.fillRect(x - 1, y - 1, 3, 3); ctx.fillStyle = '#fff6a0'; ctx.fillRect(x, y, 1, 1); }
          break;
        case 'glitchdust': ctx.fillStyle = ['#ff00dc', '#00ffff', '#ffffff', '#b8ff2e'][(a.t * 10 | 0) % 4]; ctx.globalAlpha = 0.5; ctx.fillRect(x, y, 2, 1); ctx.globalAlpha = 1; break;
        case 'ash': ctx.fillStyle = a.s > 1.1 ? '#c8303c' : '#6a5a60'; ctx.fillRect(x, y, 1, 1); break;
      }
    }

    drawLighting(ctx, T, camX, camY);
    for (const s of w.scribbles) {
      const sx = s.x - camX, sy = s.y - camY;
      if (sx < -160 || sx > W + 160) continue;
      txt(ctx, s.text, sx, sy, { color: s.color || (T.darkUI ? '#ff9aa6' : '#1a0f18'), alpha: s.alpha || 0.25, shadow: false, size: s.size || 8 });
    }
    ctx.drawImage(G.bg.vignette, 0, 0);

    if (w.props.some((k) => k.kind === 'computer')) mx.drawImage(buf, 0, 0, W, H, 0, 0, mini.width, mini.height);

    if (G.flipT > 0) {
      fx.clearRect(0, 0, W, H);
      fx.save(); fx.translate(0, H); fx.scale(1, -1); fx.drawImage(buf, 0, 0); fx.restore();
      ctx.drawImage(flipBuf, 0, 0);
    }
  }

  function drawMessage(ctx, m) {
    const size = m.size || 8, color = m.color || '#ffffff';
    let a = m.alpha != null ? m.alpha : 1;
    if (m.style !== 'flash' && m.style !== 'typed' && m.style !== 'scatter') {
      a *= clamp(Math.min(m.t / 0.25, (m.dur - m.t) / 0.4), 0, 1);
    }
    if (m.flicker && Math.random() < 0.18) a *= 0.25;
    const o = { size, color, alpha: a, jitter: m.jitter, shadow: m.shadow };
    switch (m.style) {
      case 'center': txt(ctx, m.text, W / 2, H / 2 - 12, o); break;
      case 'flash': if (Math.floor(m.t * 22) % 3 !== 2) txt(ctx, m.text, W / 2, H / 2 - 12, o); break;
      case 'corner': {
        const c = m.corner || 'br';
        o.align = c[1] === 'l' ? 'left' : 'right';
        txt(ctx, m.text, c[1] === 'l' ? 8 : W - 8, c[0] === 't' ? 24 : H - 14, o);
        break;
      }
      case 'subtle': txt(ctx, m.text, m.px, m.py, o); break;
      case 'world': txt(ctx, m.text, (m.x || 0) - G.camX, (m.y || 0) - G.camY, o); break;
      case 'scatter':
        if (!m.pos || G.t - (m.posT || 0) > 0.07) {
          m.posT = G.t; m.pos = [];
          for (let i = 0; i < (m.count || 5); i++) m.pos.push([rand(60, W - 60), rand(12, H - 12)]);
        }
        for (const [x, y] of m.pos) txt(ctx, m.text, x, y, o);
        break;
      case 'typed': {
        const n = Math.min(m.text.length, Math.floor(m.t * (m.cps || 12)));
        ctx.font = size + 'px ' + FONT;
        const full = ctx.measureText(m.text).width;
        o.align = 'left';
        txt(ctx, m.text.slice(0, n), Math.round(W / 2 - full / 2), H / 2 - 8, o);
        if (Math.floor(G.t * 2.5) % 2 === 0 && n < m.text.length + 1) {
          ctx.fillStyle = color; ctx.globalAlpha = a;
          ctx.fillRect(Math.round(W / 2 - full / 2 + ctx.measureText(m.text.slice(0, n)).width + 1), H / 2 - 8 - size / 2, Math.max(2, size / 4), size);
          ctx.globalAlpha = 1;
        }
        break;
      }
    }
  }

  function wrap(ctx, text, maxW) {
    const words = text.split(' '), lines = [];
    let cur = '';
    for (const wd of words) {
      const t = cur ? cur + ' ' + wd : wd;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function drawDialog(ctx) {
    const d = G.dialog, dark = G.theme.darkUI;
    const bxX = 8, bxY = G.seqs.some((q) => q.blocking) ? 22 : 126, bw = W - 16, bh = 48;
    ctx.save();
    if (d.upside) { ctx.translate(W / 2, bxY + bh / 2); ctx.rotate(Math.PI); ctx.translate(-W / 2, -(bxY + bh / 2)); }
    const border = dark ? '#6a3a44' : '#2a1a14', fill = dark ? '#120a10' : '#fff8ec', ink = dark ? '#e8d8dc' : '#2a1a14';
    ctx.fillStyle = border;
    ctx.fillRect(bxX + 2, bxY, bw - 4, bh); ctx.fillRect(bxX, bxY + 2, bw, bh - 4);
    ctx.fillStyle = fill;
    ctx.fillRect(bxX + 2, bxY + 2, bw - 4, bh - 4);
    if (d.name) {
      ctx.font = '8px ' + FONT;
      const nw = ctx.measureText(d.name).width + 10;
      ctx.fillStyle = border; ctx.fillRect(bxX + 8, bxY - 9, nw + 2, 12);
      ctx.fillStyle = d.color || '#b8ff2e'; ctx.fillRect(bxX + 9, bxY - 8, nw, 10);
      txt(ctx, d.name, bxX + 14, bxY - 2, { align: 'left', color: '#2a1a14', shadow: false });
    }
    ctx.font = '8px ' + FONT;
    const line = d.lines[d.i];
    const lines = wrap(ctx, line, bw - 20);
    let left = Math.floor(d.shown);
    lines.forEach((l, i) => {
      const part = l.slice(0, Math.max(0, left));
      left -= l.length + 1;
      txt(ctx, part, bxX + 10, bxY + 12 + i * 12, { align: 'left', color: ink, shadow: false });
    });
    if (d.shown >= line.length && Math.floor(G.t * 3) % 2 === 0) {
      ctx.fillStyle = ink;
      const ax = bxX + bw - 14, ay = bxY + bh - 11;
      ctx.fillRect(ax, ay, 5, 1); ctx.fillRect(ax + 1, ay + 1, 3, 1); ctx.fillRect(ax + 2, ay + 2, 1, 1);
    }
    ctx.restore();
  }

  function drawHud(ctx) {
    const T = G.theme;
    const col = T.darkUI ? '#e8b8c0' : '#ffffff';
    if (G.starsTotal > 0) {
      ctx.drawImage(Sprites.get('star', T.darkUI ? 'eye' : (G.level.item || 'star')), 6, 5);
      txt(ctx, G.stars + '/' + G.starsTotal, 16, 9, { align: 'left', color: col });
    }
    if (G.hudT > 0) {
      txt(ctx, G.hudText, W / 2, 9, { color: '#ff5a6a', alpha: Math.min(1, G.hudT * 2), jitter: true });
    } else {
      txt(ctx, G.level.hudLabel || ('MISSÃO ' + (G.levelIndex + 1)), W - 6, 9, { align: 'right', color: col, alpha: 0.75 });
    }
    if (!G.dialog && !G.player.dead && !G.seqs.some((s) => s.blocking)) {
      const tg = interactTarget();
      if (tg) {
        const o = tg.obj;
        const x = Math.round(o.x + 8 - G.camX), y = Math.round(o.y - 14 - G.camY + Math.sin(G.t * 5) * 1.5);
        ctx.fillStyle = '#2a1a14'; ctx.fillRect(x - 6, y - 6, 12, 12);
        ctx.fillStyle = '#b8ff2e'; ctx.fillRect(x - 5, y - 5, 10, 10);
        txt(ctx, 'E', x + 1, y + 1, { color: '#2a1a14', shadow: false });
      }
    }
  }

  const FACE = [
    '....ssssssssssss....',
    '..ssssssssssssssss..',
    '.ssssssssssssssssss.',
    '.ssKKKKssssssKKKKss.',
    '.ssKKKKssssssKKKKss.',
    '.ssKwKKssssssKKwKss.',
    '.ssKKKKssssssKKKKss.',
    '.ssssssssssssssssss.',
    '.ssssssssKKssssssss.',
    '.ssssssssssssssssss.',
    '..ssKKKKKKKKKKKKss..',
    '..sssKsKsKsKsKsss...',
    '...ssssssssssssss...',
    '.....ssssssssss.....',
  ];
  function drawScare(ctx) {
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H);
    const cs = 11, ox = Math.round(W / 2 - 10 * cs + rand(-3, 3)), oy = Math.round(H / 2 - 7 * cs + rand(-3, 3));
    const pal = { s: '#e2d6cc', K: '#0a0508', w: '#ff2030' };
    FACE.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = pal[row[x]];
        if (c) { ctx.fillStyle = c; ctx.fillRect(ox + x * cs, oy + y * cs, cs, cs); }
      }
    });
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  }

  function drawPanel(ctx, x, y, w, h, dark) {
    ctx.fillStyle = dark ? '#6a3a44' : '#2a1a14';
    ctx.fillRect(x + 2, y, w - 4, h); ctx.fillRect(x, y + 2, w, h - 4);
    ctx.fillStyle = dark ? '#120a10' : '#fff8ec';
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = dark ? '#3a1a24' : '#b8ff2e';
    ctx.fillRect(x + 2, y + 2, w - 4, 3);
  }

  function renderPlayUI(ctx) {
    if (G.flashT > 0) { ctx.globalAlpha = Math.min(1, G.flashT * 4); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    if (G.black > 0) { ctx.globalAlpha = G.black; ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    if (G.black < 1) drawHud(ctx);
    for (const m of G.messages) drawMessage(ctx, m);
    if (G.dialog) drawDialog(ctx);

    if (G.state === 'clear' && G.stateT > 1) {
      const dark = G.theme.darkUI, ink = dark ? '#e8d8dc' : '#2a1a14';
      const a = Math.min(1, (G.stateT - 1) * 3);
      ctx.globalAlpha = a;
      drawPanel(ctx, 60, 38, 200, 100, dark);
      ctx.globalAlpha = 1;
      txt(ctx, G.clearTitle || 'FASE CONCLUÍDA!', W / 2, 56, { color: ink, shadow: false, alpha: a });
      ctx.globalAlpha = a;
      ctx.drawImage(Sprites.get('star', G.level.item || 'star'), 110, 74);
      ctx.globalAlpha = 1;
      txt(ctx, G.stars + ' / ' + G.starsTotal, 122, 78, { align: 'left', color: ink, shadow: false, alpha: a });
      const tt = Math.floor(G.levelT), mm = Math.floor(tt / 60), ss = String(tt % 60).padStart(2, '0');
      txt(ctx, 'tempo  ' + mm + ':' + ss, W / 2, 94, { color: ink, shadow: false, alpha: a });
      const ci = G.clearInfo;
      if (ci) {
        const changed = G.stateT > 2.6 || (G.stateT > 2.1 && Math.random() < 0.5);
        txt(ctx, 'amigos  ' + (changed ? ci.to : ci.from), W / 2, 108, { color: changed ? '#c0203a' : ink, shadow: false, alpha: a, jitter: G.stateT > 2.1 && G.stateT < 2.6 });
      } else txt(ctx, 'quedas ' + G.deaths, W / 2, 108, { color: ink, shadow: false, alpha: a });
      if (G.stateT > 1.6 && Math.floor(G.t * 2) % 2 === 0) txt(ctx, 'ENTER / E', W / 2, 126, { color: dark ? '#ff9aa6' : '#5a9a1a', shadow: false, alpha: a });
    }

    if (G.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
      const creepy = G.levelIndex >= 2 && G.pauseT > 2.5 && Math.random() < 0.5;
      txt(ctx, creepy ? 'NÃO ME DEIXE' : 'PAUSA', W / 2, H / 2 - 8, { size: 16, color: creepy ? '#ff3347' : '#ffffff', jitter: creepy });
      txt(ctx, 'ESC para continuar', W / 2, H / 2 + 16, { color: '#cccccc' });
    }
  }

  function renderTitle(ctx) {
    const camX = G.t * 18;
    drawBackground(ctx, titleBg, camX, 12);
    const T = THEMES.farm;
    ctx.fillStyle = T.dirt; ctx.fillRect(0, 150, W, 30);
    ctx.fillStyle = T.grass; ctx.fillRect(0, 148, W, 5);
    ctx.fillStyle = T.grassLight; ctx.fillRect(0, 148, W, 1);
    ctx.fillStyle = T.dirtDark;
    for (let x = -((camX | 0) % 16); x < W; x += 16) { ctx.fillRect(x + 3, 160, 2, 1); ctx.fillRect(x + 10, 170, 2, 1); }
    const step = Math.floor(G.t * 8) % 4;
    const fr = ['walk1', 'walk2', 'walk3', 'walk2'][step];
    const grin = (G.t % 9) > 8.93;
    ctx.drawImage(Sprites.get('player', grin ? 'grin' : fr), 186, 132);
    if (!fimVisto) {
      const bob = (i) => (Math.floor(G.t * 8 + i * 2) % 4 < 2 ? 0 : 1);
      ctx.drawImage(Sprites.get('eri', Math.sin(G.t * 1.7) > 0.96 ? 'blink' : 'idle'), 164, 135 - bob(1));
      ctx.drawImage(Sprites.get('zoom', Math.sin(G.t * 1.3 + 2) > 0.96 ? 'blink' : 'idle'), 142, 134 - bob(2));
      ctx.drawImage(Sprites.get('torajo', Math.sin(G.t * 1.5 + 4) > 0.96 ? 'blink' : 'idle'), 120, 135 - bob(3));
    }
    const by = Math.round(Math.sin(G.t * 2) * 2);
    let sub = 'E SEUS AMIGOS';
    if (fimVisto && (G.t % 7) > 6.8) sub = 'SOZINHO';
    txt(ctx, 'WRICK', W / 2, 34 + by, { size: 24, color: '#b8ff2e', outline: '#2a1a14' });
    txt(ctx, sub, W / 2, 62 + by, { size: 16, color: sub === 'SOZINHO' ? '#ff3347' : '#ffffff', outline: '#2a1a14' });
    if (Math.floor(G.t * 2) % 2 === 0) txt(ctx, 'APERTE ENTER', W / 2, 94, { color: '#ffffff', outline: '#2a1a14' });
    txt(ctx, 'A/D andar  W pular  E interagir', W / 2, 112, { color: '#2a1a14', shadow: false, alpha: 0.8 });
    txt(ctx, 'continuação de O Mundinho de Stick', W / 2, H - 6, { color: '#ffffff', shadow: false, alpha: 0.7 });
    if (fimVisto) txt(ctx, 'eles não vêm mais.', W - 6, 124, { align: 'right', color: '#2a1a14', shadow: false, alpha: 0.35 });
  }

  function renderIntro(ctx) {
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H);
    const L = G.level, T = G.theme;
    let name = L.name;
    if (L.nameGlitch && Math.floor(G.t * 7) % 5 === 0) name = L.nameGlitch;
    const a = Math.min(1, G.stateT * 2, (2.8 - G.stateT) * 2);
    txt(ctx, L.label || ('MISSÃO ' + (G.levelIndex + 1)), W / 2, 62, { color: T.darkUI ? '#8a5a64' : '#b8ff2e', alpha: a });
    txt(ctx, name, W / 2, 84, { color: '#ffffff', alpha: a, jitter: G.levelIndex >= 2 });
    ctx.globalAlpha = Math.max(0, a);
    if (L.friend) {
      const fi = Sprites.get(L.friend, 'idle');
      ctx.drawImage(Sprites.get('player', Math.floor(G.t * 2) % 5 === 0 ? 'blink' : 'idle'), 146, 108);
      ctx.drawImage(fi, 162, 124 - fi.height);
    } else ctx.drawImage(Sprites.get('player', 'idle'), 154, 108);
    ctx.globalAlpha = 1;
  }

  function render() {
    const ctx = bx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = false;
    switch (G.state) {
      case 'title': renderTitle(ctx); break;
      case 'intro': renderIntro(ctx); break;
      case 'play': case 'clear': renderScene(); renderPlayUI(ctx); break;
      case 'ending':
        ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H);
        for (const m of G.messages) drawMessage(ctx, m);
        if (G.stateT > 5) {
          ctx.globalAlpha = Math.min(1, (G.stateT - 5) / 3);
          ctx.drawImage(Sprites.get('player', 'grin'), W / 2 - 6, H / 2 + 20);
          ctx.globalAlpha = 1;
        }
        if (G.stateT > 8) txt(ctx, 'prometo que vai ser divertido.', W / 2, H / 2 + 50, { color: '#777777', shadow: false, alpha: Math.min(0.8, (G.stateT - 8) / 2) });
        if (G.stateT > 11) txt(ctx, 'fim.', W / 2, H - 12, { color: '#555555', shadow: false, alpha: Math.min(1, (G.stateT - 11) / 2) });
        break;
    }
    if (G.scareT > 0) drawScare(ctx);
    present();
  }

  function present() {
    const s = scale;
    screen.imageSmoothingEnabled = false;
    if (G.glitchT > 0) {
      screen.fillStyle = '#000000'; screen.fillRect(0, 0, canvas.width, canvas.height);
      let y = 0;
      while (y < H) {
        const h = 2 + ((Math.random() * 14) | 0);
        const off = Math.random() < 0.45 ? Math.round(rand(-12, 12) * G.glitchI) : 0;
        screen.drawImage(buf, 0, y, W, Math.min(h, H - y), off * s, y * s, W * s, Math.min(h, H - y) * s);
        y += h;
      }
      if (Math.random() < 0.35) {
        screen.globalCompositeOperation = 'difference';
        screen.fillStyle = '#ffffff';
        screen.fillRect(0, Math.floor(rand(0, H)) * s, W * s, Math.floor(rand(2, 8)) * s);
        screen.globalCompositeOperation = 'source-over';
      }
    } else {
      screen.drawImage(buf, 0, 0, W, H, 0, 0, W * s, H * s);
    }
  }

  /* ================================================================
     8. LOOP PRINCIPAL
     ================================================================ */
  const STEP = 1 / 60;
  let last = performance.now(), acc = 0;
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    acc += dt;
    while (acc >= STEP) { update(STEP); Input.endStep(); acc -= STEP; }
    render();
    requestAnimationFrame(frame);
  }

  Sprites.loadExternal();
  if (document.fonts && document.fonts.load) document.fonts.load('8px "Press Start 2P"').catch(() => {});
  requestAnimationFrame(frame);

  window.StickDebug = window.MundinhoDebug = { G, api, go: (i) => loadLevel(i), update, render, Input };
})();