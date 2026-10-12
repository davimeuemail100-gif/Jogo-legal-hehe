window.Battle = {
  active: false, mode: null, t: 0, hp: 20, maxHp: 20,
  heart: { x: 160, y: 120, speed: 90 },
  bullets: [], spawnT: 0, duration: 0, onWin: null, onLose: null,
  config: null, introT: 0, introLines: [], introIdx: 0,
  state: 'idle', t2: 0, patterns: [], patternIdx: 0, patternT: 0,
  start(cfg) {
    this.config = cfg;
    this.active = true;
    this.mode = cfg.mode || 'eri';
    this.hp = this.maxHp = cfg.hp || 20;
    this.heart.x = 160; this.heart.y = 120;
    this.bullets = []; this.spawnT = 0;
    this.duration = cfg.duration || 20;
    this.onWin = cfg.onWin; this.onLose = cfg.onLose;
    this.introLines = cfg.dialog || [];
    this.introIdx = 0; this.introT = 0;
    this.state = 'intro'; this.t = 0; this.t2 = 0;
    this.patterns = cfg.patterns || ['bones'];
    this.patternIdx = 0; this.patternT = 0;
    if (typeof Music !== 'undefined') Music.play('napstablook');
    if (typeof Sfx !== 'undefined') Sfx.play('stinger');
  },
  stop() { this.active = false; this.state = 'idle'; this.bullets = []; },
  update(dt) {
    if (!this.active) return;
    this.t += dt;
    if (this.state === 'intro') {
      this.introT += dt;
      if (this.introT > 1.6) {
        this.introT = 0; this.introIdx++;
        if (this.introIdx >= this.introLines.length) {
          this.state = 'fight';
          this.duration = this.config.duration || 20;
          this.patternT = 0; this.patternIdx = 0; this.t = 0;
          if (typeof Sfx !== 'undefined') Sfx.play('beep', 440);
        }
      }
      return;
    }
    if (this.state === 'win') {
      this.t2 += dt;
      if (this.t2 > 1.5) { this.stop(); if (this.onWin) this.onWin(); }
      return;
    }
    if (this.state === 'lose') {
      this.t2 += dt;
      if (this.t2 > 2.5) { this.stop(); if (this.onLose) this.onLose(); }
      return;
    }
    if (this.state !== 'fight') return;
    if (this.t > this.duration) {
      this.state = 'win'; this.t2 = 0;
      if (typeof Music !== 'undefined') Music.stop(0.5);
      return;
    }
    const Input = window.StickDebug && window.StickDebug.Input;
    if (Input) {
      if (Input.isDown('left')) this.heart.x -= this.heart.speed * dt;
      if (Input.isDown('right')) this.heart.x += this.heart.speed * dt;
      if (Input.isDown('up')) this.heart.y -= this.heart.speed * dt;
      if (Input.isDown('down')) this.heart.y += this.heart.speed * dt;
    }
    this.heart.x = Math.max(65, Math.min(255, this.heart.x));
    this.heart.y = Math.max(55, Math.min(165, this.heart.y));
    this.patternT += dt;
    const pattern = this.patterns[this.patternIdx % this.patterns.length];
    const spawnRate = this.mode === 'zoom' ? 0.28 : 0.42;
    if (this.patternT > spawnRate) {
      this.patternT = 0;
      this.spawnBullet(pattern);
      if (this.mode === 'zoom' && Math.random() < 0.3) this.spawnBullet('skullRay');
      this.patternIdx++;
    }
    for (const b of this.bullets) {
      b.t += dt;
      if (b.type === 'bone') { b.x += b.vx * dt; b.y += b.vy * dt; }
      else if (b.type === 'skullRay') {
        b.life -= dt;
        if (b.life < 0.35) {
          if (!b.fired) {
            b.fired = true;
            const dx = this.heart.x - b.sx, dy = this.heart.y - b.sy;
            const dist = Math.max(1, Math.hypot(dx, dy));
            const speed = 260;
            b.vx = (dx / dist) * speed; b.vy = (dy / dist) * speed;
            b.x = b.sx; b.y = b.sy;
          }
          b.x += b.vx * dt; b.y += b.vy * dt;
        }
      }
    }
    for (const b of this.bullets) {
      if (b.hit) continue;
      const hb = b.type === 'bone' ? { x: b.x - 3, y: b.y, w: 6, h: 40 } : { x: b.x - 4, y: b.y - 4, w: 8, h: 8 };
      const hx = this.heart.x - 4, hy = this.heart.y - 4, hw = 8, hh = 8;
      if (hx < hb.x + hb.w && hx + hw > hb.x && hy < hb.y + hb.h && hy + hh > hb.y) {
        b.hit = true;
        this.hp -= this.mode === 'zoom' ? 3 : 2;
        if (typeof Sfx !== 'undefined') Sfx.play('hurt');
        if (window.StickDebug) window.StickDebug.G.shakeT = 0.2;
        if (this.hp <= 0) {
          this.state = 'lose'; this.t2 = 0;
          if (typeof Music !== 'undefined') Music.stop(0.4);
          return;
        }
      }
    }
    this.bullets = this.bullets.filter(b => {
      if (b.type === 'bone') return b.x > -50 && b.x < 370 && b.y > -50 && b.y < 230;
      return b.t < 3;
    });
  },
  spawnBullet(pattern) {
    if (pattern === 'bones') {
      this.bullets.push({ type: 'bone', x: 65 + Math.random() * 190, y: -40, vx: (Math.random() - 0.5) * 20, vy: 90 + Math.random() * 40, t: 0 });
    } else if (pattern === 'skullRay') {
      const sx = 80 + Math.random() * 160;
      this.bullets.push({ type: 'skullRay', sx, sy: 55, x: sx, y: 55, vx: 0, vy: 0, life: 0.6, t: 0, fired: false });
    } else if (pattern === 'skullRaySweep') {
      for (let i = 0; i < 3; i++) {
        const sx = 70 + i * 60;
        this.bullets.push({ type: 'skullRay', sx, sy: 55, x: sx, y: 55, vx: 0, vy: 0, life: 0.7 + i * 0.15, t: 0, fired: false });
      }
    }
  },
  draw(ctx) {
    if (!this.active) return;
    const bxX = 55, bxY = 45, bw = 210, bh = 130;
    ctx.fillStyle = '#000000'; ctx.fillRect(bxX - 2, bxY - 2, bw + 4, bh + 4);
    ctx.fillStyle = '#0a0a12'; ctx.fillRect(bxX, bxY, bw, bh);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
    ctx.strokeRect(bxX + 0.5, bxY + 0.5, bw - 1, bh - 1);
    for (const b of this.bullets) {
      if (b.type === 'bone') {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - 3, b.y, 6, 40);
        ctx.fillStyle = '#d8d8e8'; ctx.fillRect(b.x - 3, b.y, 2, 40);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - 5, b.y + 2, 10, 4); ctx.fillRect(b.x - 5, b.y + 34, 10, 4);
      } else if (b.type === 'skullRay') {
        ctx.fillStyle = '#e8e8e8'; ctx.fillRect(b.sx - 6, b.sy - 4, 12, 8);
        ctx.fillStyle = '#000000'; ctx.fillRect(b.sx - 3, b.sy - 2, 2, 2); ctx.fillRect(b.sx + 1, b.sy - 2, 2, 2); ctx.fillRect(b.sx - 1, b.sy + 1, 2, 1);
        if (b.fired && b.t < 2.5) {
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(b.sx, b.sy); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.lineWidth = 1; ctx.strokeStyle = '#ffd84a';
          ctx.beginPath(); ctx.moveTo(b.sx, b.sy); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    const hx = this.heart.x, hy = this.heart.y;
    ctx.fillStyle = '#ff3040';
    ctx.fillRect(hx - 2, hy - 3, 4, 2); ctx.fillRect(hx - 3, hy - 1, 6, 3);
    ctx.fillRect(hx - 2, hy + 2, 4, 1); ctx.fillRect(hx - 1, hy + 3, 2, 1);
    ctx.fillStyle = '#ffffff'; ctx.font = '8px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('HP ' + Math.max(0, this.hp) + '/' + this.maxHp, 160, 30);
    const pct = 1 - (this.t / this.duration);
    ctx.fillStyle = '#3a3a4a'; ctx.fillRect(60, 180, 200, 3);
    ctx.fillStyle = '#b8ff2e'; ctx.fillRect(60, 180, 200 * Math.max(0, pct), 3);
    if (this.state === 'intro') {
      const line = this.introLines[this.introIdx] || '';
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(30, 145, 260, 30);
      ctx.strokeStyle = '#ffffff'; ctx.strokeRect(30.5, 145.5, 259, 29);
      ctx.fillStyle = '#ffffff'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
      ctx.fillText(line, 160, 162);
    }
    if (this.state === 'win') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, 320, 180);
      ctx.fillStyle = '#b8ff2e'; ctx.font = '16px monospace'; ctx.textAlign = 'center';
      ctx.fillText('VOCÊ VENCEU!', 160, 90);
    }
    if (this.state === 'lose') {
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, 320, 180);
      ctx.fillStyle = '#ff3347'; ctx.font = '24px monospace'; ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', 160, 90);
    }
  },
};
window.BattleHelper = {
  startEriBattle(a) {
    a.battle.start({
      name: 'ERI', color: '#fff7e8', hp: 16, duration: 18,
      patterns: ['bones'],
      dialog: ['Então você quer lutar...', 'Tá bom. Vamos ver.', 'Desvie dos meus ossos!'],
      mode: 'eri',
      onWin: () => {
        a.say({ text: '* Você ganhou a batalha.', style: 'typed', dur: 3, size: 8, cps: 10, color: '#ffffff' });
        setTimeout(() => a.say({ text: 'Eri: Você é bom mesmo, Wrick.', style: 'center', dur: 3, size: 8, color: '#fff7e8' }), 3200);
        setTimeout(() => a.flag('venceuEri', true), 6500);
        setTimeout(() => a.complete('MISSÃO CONCLUÍDA!', { from: 3, to: 2 }), 7000);
      },
      onLose: () => {
        a.say({ text: 'GAME OVER', style: 'center', dur: 2, size: 24, color: '#ff3347' });
        setTimeout(() => a.say({ text: 'Tente de novo.', style: 'center', dur: 2, size: 8, color: '#ffffff' }), 2200);
        setTimeout(() => a.battle.startEriBattle(), 3200);
      },
    });
  },
  startZoomBattle(a) {
    a.battle.start({
      name: 'ZOOM', color: '#ff8a2a', hp: 24, duration: 22,
      patterns: ['skullRay', 'skullRay', 'skullRaySweep', 'skullRay'],
      dialog: ['Então você sobreviveu.', 'Você matou meu primo...', 'Aquele astronauta... era meu PRIMO!', 'Agora você vai pagar!'],
      mode: 'zoom',
      onWin: () => {
        a.say({ text: 'OBRIGADO...', style: 'center', dur: 3, size: 16, color: '#ff8a2a' });
        setTimeout(() => a.say({ text: 'Você me libertou.', style: 'center', dur: 3, size: 8, color: '#ffffff' }), 3200);
        setTimeout(() => a.say({ text: 'Toma. Um presente.', style: 'center', dur: 2.5, size: 8, color: '#ffffff' }), 6400);
        setTimeout(() => a.say({ text: '* OVO MISTERIOSO obtido!', style: 'typed', dur: 4, size: 8, cps: 10, color: '#ffd84a' }), 9200);
        setTimeout(() => { a.flag('ovoMisterioso', true); a.complete('MISSÃO CONCLUÍDA!', { from: 2, to: 1 }); }, 13500);
      },
      onLose: () => {
        a.say({ text: 'GAME OVER', style: 'center', dur: 2, size: 24, color: '#ff3347' });
        setTimeout(() => a.say({ text: 'Tente de novo.', style: 'center', dur: 2, size: 8, color: '#ffffff' }), 2200);
        setTimeout(() => a.battle.startZoomBattle(), 3200);
      },
    });
  },
};
