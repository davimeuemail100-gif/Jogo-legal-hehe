/* =====================================================================
   ÁUDIO — tudo sintetizado com WebAudio (nenhum arquivo necessário).
   ---------------------------------------------------------------------
   SONGS: as músicas (notas MIDI, 0 = pausa). Edite à vontade.
   Music.set({...}) distorce a música ao vivo:
     wobble  → desafinação aleatória (cents)
     detune  → desafinação fixa (cents)
     drop    → chance de "faltar" nota (0–1)
     reverse → toca a melodia de trás pra frente
     rate    → velocidade (1 = normal)
     pitch   → transposição em semitons
   ===================================================================== */

const _ar = (a, b) => a + Math.random() * (b - a);
const _ach = (p) => Math.random() < p;
const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

const AudioSys = {
  ctx: null, master: null, musicBus: null, sfxBus: null, noiseBuf: null,
  init() {
    if (this.ctx) return true;
    const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return false;
    try { this.ctx = new AC(); } catch (e) { return false; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = CONFIG.AUDIO.master; this.master.connect(c.destination);
    this.musicBus = c.createGain(); this.musicBus.gain.value = CONFIG.AUDIO.music; this.musicBus.connect(this.master);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = CONFIG.AUDIO.sfx; this.sfxBus.connect(this.master);
    const len = c.sampleRate * 2;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return true;
  },
  unlock() {
    if (this.init() && this.ctx.state === 'suspended') this.ctx.resume();
  },
  get now() { return this.ctx ? this.ctx.currentTime : 0; },

  // Um "bip" com envelope.
  tone(freq, dur, o = {}) {
    if (!this.ctx) return;
    const c = this.ctx, t = o.when != null ? o.when : c.currentTime;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + dur);
    if (o.detune) osc.detune.setValueAtTime(o.detune, t);
    const v = Math.max(0.0002, o.vol != null ? o.vol : 0.2), a = o.attack || 0.004;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, a + 0.01));
    osc.connect(g); g.connect(o.dest || this.sfxBus);
    osc.start(t); osc.stop(t + dur + 0.05);
  },

  // Ruído filtrado (estática, sussurros, passos...).
  noise(dur, o = {}) {
    if (!this.ctx) return;
    const c = this.ctx, t = o.when != null ? o.when : c.currentTime;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 1000, t);
    if (o.freqEnd) f.frequency.exponentialRampToValueAtTime(o.freqEnd, t + dur);
    f.Q.value = o.q || 1;
    const g = c.createGain(); const v = Math.max(0.0002, o.vol || 0.1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.dest || this.sfxBus);
    src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
  },
};

// ---------- MÚSICAS ----------
const HAPPY_MELODY = [
  72, 76, 79, 76,  77, 76, 74, 0,  71, 74, 77, 74,  76, 74, 72, 0,
  72, 76, 79, 84,  81, 79, 77, 76, 74, 77, 76, 74,  72, 0, 72, 0,
];
const HAPPY_BASS = [
  48, 0, 55, 0,  53, 0, 55, 0,  55, 0, 50, 0,  48, 0, 55, 0,
  48, 0, 52, 0,  53, 0, 57, 0,  55, 0, 55, 0,  48, 0, 48, 0,
];
// Transforma a melodia em "menor" (mais triste).
const minorize = (arr) => arr.map((n) => (n && [4, 9, 11].includes(n % 12) ? n - 1 : n));

// Tema da sequência: "Stick e Seus Amigos"
const FRIENDS_MELODY = [
  67, 0, 72, 74,  76, 74, 72, 0,  69, 72, 74, 0,  72, 0, 67, 0,
  65, 69, 72, 74, 76, 77, 76, 74, 72, 71, 72, 74, 72, 0, 0, 0,
];
const FRIENDS_BASS = [
  48, 0, 55, 0,  48, 0, 55, 0,  53, 0, 57, 0,  48, 0, 55, 0,
  53, 0, 57, 0,  48, 0, 52, 0,  55, 0, 50, 0,  48, 0, 48, 0,
];

const SONGS = {
  title:   { bpm: 116, melody: FRIENDS_MELODY, bass: FRIENDS_BASS, lead: 'triangle', leadVol: 0.14, bassVol: 0.12, hat: false },
  farm:    { bpm: 140, melody: FRIENDS_MELODY, bass: FRIENDS_BASS, lead: 'square', leadVol: 0.09, bassVol: 0.14, hat: true },
  rocket:  { bpm: 126, melody: HAPPY_MELODY, bass: HAPPY_BASS, lead: 'square', leadVol: 0.085, bassVol: 0.13, hat: true, transpose: -2 },
  dusk:    { bpm: 96, melody: minorize(FRIENDS_MELODY), bass: minorize(FRIENDS_BASS), lead: 'triangle', leadVol: 0.13, bassVol: 0.12, hat: false, transpose: -3 },
  musicbox:{ bpm: 60, melody: minorize(FRIENDS_MELODY).map((n, i) => (i % 2 ? 0 : n)), bass: null, lead: 'triangle', leadVol: 0.07, transpose: 12, legato: 1.8 },
};

const Music = {
  song: null, name: null, step: 0, nextT: 0, playing: false, gain: null, pending: null,
  defaults: { wobble: 0, detune: 0, drop: 0, reverse: false, rate: 1, pitch: 0 },
  p: null,
  play(name) { this.name = name; this.pending = name; if (AudioSys.ctx) this._start(); },
  _start() {
    const c = AudioSys.ctx, s = SONGS[this.name];
    this.pending = null;
    if (!s) { this.playing = false; return; }
    if (this.gain) { const old = this.gain; setTimeout(() => { try { old.disconnect(); } catch (e) {} }, 800); }
    this.gain = c.createGain();
    this.gain.gain.setValueAtTime(0.0001, c.currentTime);
    this.gain.gain.exponentialRampToValueAtTime(1, c.currentTime + 0.3);
    this.gain.connect(AudioSys.musicBus);
    this.song = s; this.step = 0; this.nextT = c.currentTime + 0.08; this.playing = true;
  },
  stop(fade = 0.4) {
    this.pending = null;
    if (!this.playing || !AudioSys.ctx) { this.playing = false; return; }
    const c = AudioSys.ctx, g = this.gain.gain;
    g.cancelScheduledValues(c.currentTime);
    g.setValueAtTime(Math.max(0.0001, g.value), c.currentTime);
    g.exponentialRampToValueAtTime(0.0001, c.currentTime + Math.max(0.02, fade));
    this.playing = false;
  },
  set(o) { Object.assign(this.p, o); },
  reset() { this.p = Object.assign({}, this.defaults); },
  update() {
    if (!AudioSys.ctx) return;
    if (this.pending) this._start();
    if (!this.playing) return;
    const c = AudioSys.ctx;
    if (this.nextT < c.currentTime - 0.3) this.nextT = c.currentTime + 0.05;
    while (this.nextT < c.currentTime + 0.15) {
      this._schedule(this.step, this.nextT);
      this.nextT += 60 / this.song.bpm / 2 / this.p.rate;
      this.step++;
    }
  },
  _schedule(i, t) {
    const s = this.song, p = this.p, n = s.melody.length;
    const idx = p.reverse ? n - 1 - (i % n) : i % n;
    const stepDur = 60 / s.bpm / 2 / p.rate;
    const tr = (s.transpose || 0) + p.pitch;
    const det = () => p.detune + (p.wobble ? _ar(-p.wobble, p.wobble) : 0);
    const m = s.melody[idx];
    if (m && !_ach(p.drop)) {
      AudioSys.tone(midiToFreq(m + tr), stepDur * (s.legato || 0.9),
        { type: s.lead || 'square', vol: s.leadVol || 0.1, when: t, detune: det(), dest: this.gain });
    }
    const b = s.bass && s.bass[idx];
    if (b && !_ach(p.drop * 0.5)) {
      AudioSys.tone(midiToFreq(b + tr), stepDur * 1.8,
        { type: 'triangle', vol: s.bassVol || 0.14, when: t, detune: det(), dest: this.gain });
    }
    if (s.hat && idx % 2 === 1 && !_ach(p.drop)) {
      AudioSys.noise(0.03, { filter: 'highpass', freq: 7000, vol: 0.025, when: t, dest: this.gain });
    }
  },
};
Music.reset();

// ---------- EFEITOS SONOROS ----------
const Sfx = {
  play(name, arg) {
    if (!AudioSys.ctx) return;
    const A = AudioSys, t = A.now;
    switch (name) {
      case 'jump': A.tone(330, 0.13, { slide: 760, vol: 0.1 }); break;
      case 'land': A.noise(0.06, { filter: 'lowpass', freq: 500, vol: 0.05 }); break;
      case 'star': A.tone(988, 0.07, { vol: 0.09 }); A.tone(1319, 0.14, { vol: 0.09, when: t + 0.07 }); break;
      case 'talk': A.tone(arg || 520, 0.035, { vol: 0.045 }); break;
      case 'select': A.tone(660, 0.06, { vol: 0.09 }); A.tone(990, 0.08, { vol: 0.09, when: t + 0.06 }); break;
      case 'checkpoint': [523, 659, 784, 1047].forEach((f, i) => A.tone(f, 0.09, { vol: 0.09, when: t + i * 0.07 })); break;
      case 'flag': [523, 659, 784, 659, 784, 1047].forEach((f, i) => A.tone(f, 0.14, { vol: 0.1, when: t + i * 0.11 })); break;
      case 'hurt': A.tone(420, 0.22, { slide: 110, vol: 0.12 }); A.noise(0.15, { vol: 0.07, freq: 800 }); break;
      case 'die': A.tone(520, 0.7, { slide: 60, vol: 0.1, type: 'triangle' }); break;
      case 'door': A.noise(0.6, { filter: 'bandpass', freq: 300, freqEnd: 120, q: 4, vol: 0.12 }); A.tone(80, 0.5, { type: 'sawtooth', vol: 0.05 }); break;
      case 'glitch':
        for (let i = 0; i < 4; i++) A.tone(_ar(80, 2000), 0.04, { vol: 0.04, when: t + i * 0.03 });
        A.noise(0.12, { filter: 'highpass', freq: 2500, vol: 0.05 });
        break;
      case 'static': A.noise(arg || 0.4, { filter: 'highpass', freq: 1800, vol: 0.05 }); break;
      case 'whisper': A.noise(1.6, { filter: 'bandpass', freq: 900, freqEnd: 1700, q: 7, vol: 0.035, attack: 0.4 }); break;
      case 'stinger':
        A.noise(0.8, { filter: 'lowpass', freq: 3000, vol: 0.3 });
        A.tone(55, 0.9, { type: 'sawtooth', vol: 0.25 }); A.tone(58, 0.9, { type: 'sawtooth', vol: 0.2 });
        A.tone(1400, 0.5, { type: 'square', vol: 0.06, slide: 900 });
        break;
      case 'heartbeat': A.tone(55, 0.12, { type: 'sine', vol: 0.35 }); A.tone(48, 0.14, { type: 'sine', vol: 0.28, when: t + 0.18 }); break;
      case 'vanish': A.tone(900, 0.2, { slide: 120, vol: 0.05, type: 'triangle' }); break;
      // ---- sequência ----
      case 'laugh': { // arg = intensidade 1, 2 ou 3
        const k = arg || 1, n = [4, 7, 12][k - 1] || 4;
        let when = t;
        for (let i = 0; i < n; i++) {
          const f = (k === 3 ? 260 : 330) - i * (k === 3 ? 6 : 4) + _ar(-15, 15);
          A.tone(f, 0.09, { type: 'square', vol: 0.07 + k * 0.015, when, slide: f * 0.8 });
          A.noise(0.08, { filter: 'bandpass', freq: 1100, q: 3, vol: 0.05 + k * 0.01, when });
          when += Math.max(0.09, 0.17 - i * (k === 3 ? 0.006 : 0.004));
        }
        if (k === 3) A.tone(46, when - t, { type: 'sawtooth', vol: 0.06 });
        break;
      }
      case 'crack': A.noise(0.12, { filter: 'highpass', freq: 3000, vol: 0.2 }); A.noise(0.25, { filter: 'bandpass', freq: 1400, q: 2, vol: 0.12, when: t + 0.05 }); A.tone(160, 0.15, { slide: 60, vol: 0.12, type: 'triangle' }); break;
      case 'thud': A.tone(70, 0.25, { type: 'sine', vol: 0.35, slide: 40 }); A.noise(0.15, { filter: 'lowpass', freq: 400, vol: 0.12 }); break;
      case 'clank': A.tone(1200 + _ar(-200, 200), 0.08, { type: 'square', vol: 0.06 }); A.noise(0.06, { filter: 'highpass', freq: 4000, vol: 0.06 }); break;
      case 'beep': A.tone(arg || 880, 0.18, { type: 'square', vol: 0.08 }); break;
      case 'rumble': A.noise(arg || 3, { filter: 'lowpass', freq: 220, vol: 0.18, attack: 0.4 }); A.tone(48, arg || 3, { type: 'sawtooth', vol: 0.06 }); break;
      case 'sputter': for (let i = 0; i < 5; i++) A.noise(0.07, { filter: 'bandpass', freq: 600, vol: 0.12, when: t + i * 0.13 + _ar(0, 0.05) }); break;
      case 'boom':
        A.noise(1.6, { filter: 'lowpass', freq: 900, freqEnd: 80, vol: 0.45 });
        A.tone(60, 1.2, { type: 'sawtooth', vol: 0.25, slide: 30 });
        A.noise(0.3, { filter: 'highpass', freq: 2000, vol: 0.2 });
        break;
      case 'goo': A.tone(_ar(90, 160), 0.18, { type: 'sine', vol: 0.12, slide: _ar(200, 320) }); A.noise(0.2, { filter: 'lowpass', freq: 300, vol: 0.06 }); break;
      case 'pickup': A.tone(784, 0.06, { vol: 0.08 }); A.tone(1047, 0.1, { vol: 0.08, when: t + 0.06 }); break;
    }
  },
};

// ---------- AMBIENTE (zumbido grave, batimentos) ----------
const Ambient = {
  drone: null, hbRate: 0, hbNext: 0,
  droneOn(vol = 0.05) {
    if (!AudioSys.ctx || this.drone) return;
    const c = AudioSys.ctx;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(vol, c.currentTime + 2.5);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 240;
    const o1 = c.createOscillator(), o2 = c.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'sawtooth'; o1.frequency.value = 55; o2.frequency.value = 55.7;
    const lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 0.07; lg.gain.value = 110;
    lfo.connect(lg); lg.connect(f.frequency);
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(AudioSys.master);
    [o1, o2, lfo].forEach((o) => o.start());
    this.drone = { g, nodes: [o1, o2, lfo] };
  },
  droneOff(fade = 1) {
    if (!this.drone || !AudioSys.ctx) { this.drone = null; return; }
    const c = AudioSys.ctx, d = this.drone;
    d.g.gain.cancelScheduledValues(c.currentTime);
    d.g.gain.setValueAtTime(Math.max(0.0001, d.g.gain.value), c.currentTime);
    d.g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + fade);
    d.nodes.forEach((o) => o.stop(c.currentTime + fade + 0.1));
    this.drone = null;
  },
  heartbeat(rate) { this.hbRate = rate || 0; this.hbNext = 0.3; },
  update(dt) {
    if (this.hbRate > 0 && AudioSys.ctx) {
      this.hbNext -= dt;
      if (this.hbNext <= 0) { Sfx.play('heartbeat'); this.hbNext = 1 / this.hbRate; }
    }
  },
  stopAll() { this.droneOff(0.05); this.hbRate = 0; },
};
