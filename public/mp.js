(function () {
  'use strict';
  const $ = (t, p) => { const e = document.createElement(t); if (p) for (const k in p) e.setAttribute(k, p[k]); return e; };

  const NICK_MAX = 24;

  const DEFAULT_AVATAR = {
    skin: '#ffffff', hair: 'RAINBOW', shirt: '#8b5a2b',
    pants: '#1a1a1a', shoes: '#ff8a2a', eyes: '#8a2be2',
  };
  const AVATAR_OPTS = {
    skin:  ['#ffffff','#ffe1cf','#f0bfa6','#c68642','#8d5524','#4a2f20','#a0e0c0','#b0b0ff'],
    hair:  ['RAINBOW','#2a1a14','#7a4a24','#c19a6b','#ffcc00','#ff3347','#b8ff2e','#8a2be2','#00d4ff'],
    shirt: ['#8b5a2b','#b8ff2e','#ff3347','#508cff','#ffd84a','#a050ff','#ff8a2a','#2a2a2a','#ffffff'],
    pants: ['#1a1a1a','#3d4f86','#5a3a2a','#ff5a7a','#8a8a9a','#ffffff'],
    shoes: ['#ff8a2a','#1a1a1a','#ffffff','#c0203a','#b8ff2e','#508cff'],
    eyes:  ['#8a2be2','#1a1a1a','#00d4ff','#ff3347','#b8ff2e','#ffd84a'],
  };

  const MP = {
    nick: null, isAdmin: false, mode: null,
    roomId: null, room: null, lastV: -1,
    avatars: {}, entities: {}, avatar: { ...DEFAULT_AVATAR },
    turnEl: null, chatBar: null, liveEl: null, liveSig: null,
  };

  const s = document.createElement('style');
  s.textContent = `
    #mpo { position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
      background:rgba(4,2,8,.97); z-index:2147483000; font-family:monospace; color:#eee; overflow-y:auto; padding:20px; box-sizing:border-box }
    #mpo .c { background:#141018; border:2px solid #8a2be2; border-radius:14px; padding:18px;
      width:min(94vw,420px); box-shadow:0 0 30px rgba(138,43,226,.6); max-height:90vh; overflow-y:auto; box-sizing:border-box }
    #mpo h1 { font-size:17px; margin:0 0 12px; color:#b8ff2e; letter-spacing:2px; text-align:center }
    #mpo p { font-size:12px; color:#b0a8c0; margin:4px 0; text-align:center }
    #mpo input, #mpo select { width:100%; padding:10px; margin:5px 0; background:#0d0a12; color:#fff;
      border:1px solid #4a2a6a; border-radius:8px; font-family:inherit; font-size:13px; box-sizing:border-box }
    #mpo button { width:100%; padding:10px; margin:4px 0; background:#8a2be2; color:#fff;
      border:none; border-radius:8px; font-family:inherit; font-size:12px; cursor:pointer; font-weight:bold }
    #mpo button:hover { background:#a04ef0 }
    #mpo button.sec { background:#333 }
    #mpo button.sec:hover { background:#444 }
    #mpo .err { color:#ff5570; font-size:12px; text-align:center; min-height:16px; margin-top:6px }
    #mpo .room { background:#0d0a12; border:1px solid #4a2a6a; border-radius:8px;
      padding:8px; margin:5px 0; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:6px }
    #mpo .room:hover { background:#1a0f26; border-color:#8a2be2 }
    #mpo .room .info { text-align:left; flex:1; min-width:0 }
    #mpo .room .nm { color:#b8ff2e; font-weight:bold; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
    #mpo .room .meta { font-size:10px; color:#8a8a9a; margin-top:2px }
    #mpo .room .cnt { background:#8a2be2; color:#fff; border-radius:6px; padding:4px 8px; font-size:11px; font-weight:bold; white-space:nowrap }
    #mpo .room .cnt.full { background:#c0203a }
    #mpo .room .live { color:#ff3347; font-weight:bold }

    .avPrev { width:100%; height:100px; display:flex; align-items:center; justify-content:center;
      background:#0d0a12; border-radius:10px; margin-bottom:10px }
    .avPrev canvas { image-rendering:pixelated; width:72px; height:96px }
    .avRow { display:flex; align-items:center; gap:8px; margin:6px 0 }
    .avRow > span { font-size:11px; color:#b0a8c0; width:60px; text-align:right; flex-shrink:0 }
    .avRow .sw { flex:1; display:flex; gap:4px; flex-wrap:wrap }
    .avRow .sw button { width:22px; height:22px; padding:0; margin:0; border-radius:4px;
      border:2px solid #333; cursor:pointer; background:#000 }
    .avRow .sw button.sel { border-color:#b8ff2e; box-shadow:0 0 6px #b8ff2e }
    .avRow .sw button[data-c="RAINBOW"] { background:linear-gradient(90deg,#ff0000,#ffcc00,#00ff00,#00d4ff,#8a2be2,#ff0000) }

    #mpHud { position:fixed; top:8px; left:8px; background:rgba(10,8,15,.86);
      border:1px solid #4a2a6a; border-radius:8px; padding:6px 10px; font-family:monospace;
      font-size:11px; color:#fff; z-index:999998; line-height:1.45; max-width:60vw }
    #mpHud .adm { color:#ffd84a } #mpHud .turn { color:#b8ff2e } #mpHud .me { color:#ff6a9c }

    #mpChat { position:fixed; left:8px; bottom:88px; width:min(76vw,340px); max-height:180px;
      overflow-y:auto; background:rgba(10,8,15,.9); border:1px solid #4a2a6a;
      border-radius:10px; padding:6px; font-family:monospace; font-size:11px; color:#ddd; z-index:999998 }
    #mpChat .m { margin:3px 0; word-wrap:break-word } #mpChat .me { color:#b8ff2e }
    #mpChat .sys { color:#8a8a9a; font-style:italic } #mpChat .ent { color:#ff6a9c; text-shadow:0 0 5px #ff006a }

    #mpIn { position:fixed; left:8px; bottom:58px; width:min(76vw,340px); display:flex; gap:4px; z-index:999998 }
    #mpIn input { flex:1; padding:8px; background:rgba(10,8,15,.92); color:#fff;
      border:1px solid #4a2a6a; border-radius:8px; font-family:monospace; font-size:12px; min-width:0 }
    #mpIn button { padding:8px 12px; background:#8a2be2; color:#fff; border:none; border-radius:8px;
      font-family:monospace; font-weight:bold; cursor:pointer; width:auto; flex-shrink:0 }
    #mpIn.off { opacity:.4; pointer-events:none }

    .mpAv { position:fixed; transform:translate(-50%,-100%); text-align:center;
      font-family:monospace; font-size:10px; font-weight:bold; color:#fff;
      text-shadow:0 0 4px #000,0 0 4px #000; z-index:999997; pointer-events:none }
    .mpAv .body { width:18px; height:22px; margin:0 auto 2px; border-radius:4px;
      position:relative; border:1px solid #000; box-shadow:0 0 6px rgba(255,255,255,.35) }
    .mpAv .head { position:absolute; top:-7px; left:50%; transform:translateX(-50%);
      width:10px; height:10px; border-radius:50%; border:1px solid #000 }
    .mpAv .eye { position:absolute; top:3px; width:2px; height:2px; border-radius:50% }
    .mpAv .eye.l { left:2px } .mpAv .eye.r { right:2px }

    .mpEnt { position:fixed; transform:translate(-50%,-100%); text-align:center;
      font-family:monospace; font-size:10px; font-weight:bold; color:#ff6a9c;
      text-shadow:0 0 6px #ff006a; z-index:999997; cursor:pointer; user-select:none }
    .mpEnt .blob { width:34px; height:34px; border-radius:50%;
      background:radial-gradient(circle at 40% 35%, #2a0f3a, #050208 70%);
      border:2px solid #3a1f4a; margin:0 auto 2px; animation:mpB 2s ease-in-out infinite }
    .mpEnt.eye .blob { background:radial-gradient(circle at 50% 50%, #ff3347 8%, #1a0508 70%) }
    .mpEnt.shadow .blob { background:#0a0508; border-color:#000 }
    @keyframes mpB { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }

    #mpAdmBtn { position:fixed; top:8px; left:50%; transform:translateX(-50%);
      background:#ffd84a; color:#1a1a1a; border:none; padding:6px 14px; border-radius:8px;
      font-family:monospace; font-weight:bold; cursor:pointer; z-index:999999; font-size:12px }
    #mpAvBtn { position:fixed; top:8px; left:calc(50% + 100px); background:#8a2be2;
      color:#fff; border:none; padding:6px 12px; border-radius:8px; font-family:monospace;
      font-weight:bold; cursor:pointer; z-index:999999; font-size:12px }

    #mpAdm { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
      width:min(94vw,420px); max-height:86vh; overflow-y:auto; background:#14101a;
      border:2px solid #ffd84a; border-radius:12px; padding:14px; color:#eee;
      font-family:monospace; font-size:12px; z-index:2147483001 }
    #mpAdm h2 { margin:0 0 10px; color:#ffd84a; font-size:14px; text-align:center }
    #mpAdm h3 { margin:12px 0 6px; color:#b8ff2e; font-size:12px; border-bottom:1px solid #333; padding-bottom:3px }
    #mpAdm input, #mpAdm select { width:100%; padding:7px; margin:3px 0; background:#0d0a12;
      color:#fff; border:1px solid #4a2a6a; border-radius:6px; box-sizing:border-box; font-family:inherit; font-size:12px }
    #mpAdm button { width:100%; padding:8px; margin:3px 0; background:#8a2be2; color:#fff;
      border:none; border-radius:6px; cursor:pointer; font-weight:bold; font-family:inherit; font-size:12px }
    #mpAdm .x { position:absolute; top:8px; right:12px; width:auto; padding:3px 10px; background:#402030 }
    #mpAdm .row { display:grid; grid-template-columns:1fr auto; gap:4px; align-items:center; margin:3px 0 }
    #mpAdm .st { color:#0f0; font-size:11px; min-height:14px; text-align:center; margin-top:6px }

    #mpLive { position:fixed; bottom:8px; right:8px; width:min(50vw,360px); aspect-ratio:16/9;
      background:#000; border:2px solid #ff3347; border-radius:10px; z-index:999997;
      overflow:hidden; box-shadow:0 0 20px rgba(255,51,71,.5); transition:all .2s }
    #mpLive iframe { width:100%; height:100%; border:0; display:block }
    #mpLive .tag { position:absolute; top:4px; left:4px; background:#ff3347; color:#fff;
      font-family:monospace; font-size:10px; font-weight:bold; padding:2px 6px; border-radius:4px; z-index:1 }
    #mpLive .min { position:absolute; top:4px; right:4px; background:rgba(0,0,0,.7); color:#fff;
      border:none; font-family:monospace; font-size:11px; padding:2px 8px; border-radius:4px;
      cursor:pointer; z-index:1; width:auto; font-weight:bold }
    #mpLive.minimized { aspect-ratio:auto; height:28px; width:110px }
    #mpLive.minimized iframe { display:none }

    #mpJump { position:fixed; inset:0; background:#000; z-index:2147483647;
      display:flex; align-items:center; justify-content:center; color:#ff2030;
      font-family:monospace; font-size:90px; font-weight:bold; pointer-events:none;
      animation:mpJ .45s ease-out; text-shadow:0 0 50px #ff2030 }
    @keyframes mpJ { 0%{opacity:0; transform:scale(.5)} 30%{opacity:1; transform:scale(1.2)} 100%{opacity:0; transform:scale(1)} }
  `;
  document.head.appendChild(s);

  async function getHWID() {
    let id = localStorage.getItem('wrick_hwid');
    if (id) return id;
    const parts = [
      navigator.userAgent || '', navigator.language || '',
      (screen.width || 0) + 'x' + (screen.height || 0),
      screen.colorDepth || 0, new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0, navigator.platform || '',
    ];
    try {
      const c = document.createElement('canvas');
      const x = c.getContext('2d');
      x.textBaseline = 'top'; x.font = '14px Arial';
      x.fillStyle = '#f60'; x.fillRect(10, 10, 40, 20);
      x.fillStyle = '#069'; x.fillText('wrick-fp-2024', 2, 2);
      parts.push(c.toDataURL().slice(-80));
    } catch (e) {}
    const str = parts.join('|');
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    id = 'h' + Math.abs(h).toString(36);
    localStorage.setItem('wrick_hwid', id);
    return id;
  }

  let MY_HWID = null;
  async function api(action, data) {
    if (!MY_HWID) MY_HWID = await getHWID();
    const body = Object.assign({ action, nick: MP.nick, hwid: MY_HWID, roomId: MP.roomId }, data || {});
    const r = await fetch('/api/game', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.json();
  }
  const getState = async () => (await fetch('/api/game')).json();

  function loadAvatar() {
    try {
      const raw = localStorage.getItem('wrick_avatar');
      if (raw) MP.avatar = { ...DEFAULT_AVATAR, ...JSON.parse(raw) };
    } catch (e) {}
  }
  function saveAvatar() { try { localStorage.setItem('wrick_avatar', JSON.stringify(MP.avatar)); } catch (e) {} }
  function applyAvatar(a) {
    MP.avatar = { ...MP.avatar, ...a };
    saveAvatar();
    if (typeof SPRITE_PALETTE === 'undefined' || typeof Sprites === 'undefined') return;
    SPRITE_PALETTE.s = MP.avatar.skin;
    SPRITE_PALETTE.S = shadeLocal(MP.avatar.skin, -0.15);
    SPRITE_PALETTE.g = MP.avatar.shirt;
    SPRITE_PALETTE.G = shadeLocal(MP.avatar.shirt, -0.2);
    SPRITE_PALETTE.p = MP.avatar.pants;
    SPRITE_PALETTE.P = shadeLocal(MP.avatar.pants, -0.25);
    SPRITE_PALETTE.t = MP.avatar.shoes;
    SPRITE_PALETTE.e = MP.avatar.eyes;
    const rainbow = MP.avatar.hair === 'RAINBOW';
    window.WRICK_HAIR_RAINBOW = rainbow;
    if (!rainbow) { SPRITE_PALETTE.h = MP.avatar.hair; SPRITE_PALETTE.H = shadeLocal(MP.avatar.hair, -0.25); }
    if (!Sprites._patched) {
      Sprites._patched = true;
      const orig = Sprites.get.bind(Sprites);
      Sprites.get = function (sheet, frame, recolor) {
        if (sheet === 'player' && !recolor && !window.WRICK_HAIR_RAINBOW) {
          const key = 'player|' + frame + '|solid';
          let c = this.cache[key]; if (c) return c;
          const def = SPRITES.player;
          c = document.createElement('canvas');
          c.width = def.w; c.height = def.h;
          const x = c.getContext('2d');
          const rows = def.frames[frame] || def.frames.idle;
          for (let y = 0; y < rows.length; y++) for (let i = 0; i < rows[y].length; i++) {
            const ch = rows[y][i]; if (ch === '.' || ch === ' ') continue;
            const col = SPRITE_PALETTE[ch]; if (!col) continue;
            x.fillStyle = col; x.fillRect(i, y, 1, 1);
          }
          this.cache[key] = c; return c;
        }
        return orig(sheet, frame, recolor);
      };
    }
    Sprites.cache = {};
  }
  function shadeLocal(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = c => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
    r = f(r); g = f(g); b = f(b);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  function previewCanvas(a) {
    const c = document.createElement('canvas');
    c.width = 24; c.height = 32;
    const x = c.getContext('2d');
    const hair = a.hair === 'RAINBOW' ? '#ff0000' : a.hair;
    x.fillStyle = '#000'; x.fillRect(4, 0, 16, 18);
    x.fillStyle = hair;   x.fillRect(5, 1, 14, 7);
    x.fillStyle = a.skin; x.fillRect(5, 6, 14, 11);
    x.fillStyle = a.eyes; x.fillRect(8, 10, 2, 3); x.fillRect(14, 10, 2, 3);
    x.fillStyle = a.shirt; x.fillRect(4, 18, 16, 8);
    x.fillStyle = a.skin; x.fillRect(2, 19, 2, 6); x.fillRect(20, 19, 2, 6);
    x.fillStyle = a.pants; x.fillRect(6, 26, 4, 4); x.fillRect(14, 26, 4, 4);
    x.fillStyle = a.shoes; x.fillRect(5, 30, 6, 2); x.fillRect(13, 30, 6, 2);
    return c;
  }

  function closeAll() { document.querySelectorAll('#mpo').forEach(x => x.remove()); }

  function loginScreen() {
    closeAll();
    const o = $('div', { id: 'mpo' });
    o.innerHTML = `
      <div class="c">
        <h1>WRICK ONLINE</h1>
        <p>escolha um nick único (2–${NICK_MAX} letras)</p>
        <input id="mpoNick" maxlength="${NICK_MAX}" placeholder="seu nick" autocomplete="off">
        <button id="mpoAv" class="sec">🎨 Escolher avatar</button>
        <div class="err" id="mpoErr"></div>
        <button id="mpoOk">ENTRAR</button>
      </div>`;
    document.body.appendChild(o);
    const inp = o.querySelector('#mpoNick'), err = o.querySelector('#mpoErr');
    inp.value = MP.nick || '';
    setTimeout(() => inp.focus(), 100);
    o.querySelector('#mpoAv').onclick = () => avatarScreen(() => loginScreen());
    const tentar = () => {
      const nick = inp.value.trim();
      if (!nick || nick.length < 2) { err.textContent = '⚠ nick muito curto'; return; }
      if (nick.length > NICK_MAX) { err.textContent = '⚠ nick muito longo (máx ' + NICK_MAX + ')'; return; }
      if (!/^[\wÀ-ÿ\-_. ]{2,24}$/.test(nick)) { err.textContent = '⚠ só letras, números, _ - . e espaço'; return; }
      MP.nick = nick;
      closeAll();
      lobbyScreen();
    };
    o.querySelector('#mpoOk').onclick = tentar;
    inp.onkeydown = e => { if (e.key === 'Enter') tentar(); };
  }

  function avatarScreen(back) {
    closeAll();
    const o = $('div', { id: 'mpo' });
    o.innerHTML = `
      <div class="c">
        <h1>MONTE SEU AVATAR</h1>
        <div class="avPrev" id="avPrev"></div>
        <div class="avRow"><span>PELE</span><div class="sw" data-k="skin"></div></div>
        <div class="avRow"><span>CABELO</span><div class="sw" data-k="hair"></div></div>
        <div class="avRow"><span>CAMISA</span><div class="sw" data-k="shirt"></div></div>
        <div class="avRow"><span>CALÇA</span><div class="sw" data-k="pants"></div></div>
        <div class="avRow"><span>TÊNIS</span><div class="sw" data-k="shoes"></div></div>
        <div class="avRow"><span>OLHOS</span><div class="sw" data-k="eyes"></div></div>
        <button id="avOk">PRONTO</button>
        <button id="avReset" class="sec">RESETAR</button>
      </div>`;
    document.body.appendChild(o);
    const prev = o.querySelector('#avPrev');
    const renderPrev = () => { prev.innerHTML = ''; prev.appendChild(previewCanvas(MP.avatar)); };
    const renderSw = () => {
      for (const k in AVATAR_OPTS) {
        const box = o.querySelector(`.sw[data-k="${k}"]`); box.innerHTML = '';
        for (const c of AVATAR_OPTS[k]) {
          const b = $('button', { 'data-c': c });
          if (c !== 'RAINBOW') b.style.background = c;
          if (MP.avatar[k] === c) b.classList.add('sel');
          b.onclick = () => { MP.avatar[k] = c; saveAvatar(); renderSw(); renderPrev(); };
          box.appendChild(b);
        }
      }
    };
    renderPrev(); renderSw();
    o.querySelector('#avOk').onclick = () => {
      applyAvatar(MP.avatar);
      closeAll();
      if (back) back();
      else if (MP.roomId) { api('setAvatar', { avatar: MP.avatar }); start(); }
      else lobbyScreen();
    };
    o.querySelector('#avReset').onclick = () => { MP.avatar = { ...DEFAULT_AVATAR }; saveAvatar(); renderSw(); renderPrev(); };
  }

  async function lobbyScreen() {
    closeAll();
    const o = $('div', { id: 'mpo' });
    o.innerHTML = `
      <div class="c">
        <h1>SALAS</h1>
        <p>olá, ${MP.nick} · <span id="mpoAvA" style="color:#8a2be2;cursor:pointer;text-decoration:underline">🎨 trocar avatar</span></p>
        <button id="mpoCreate">➕ CRIAR NOVA SALA</button>
        <button id="mpoRefresh" class="sec">🔄 Atualizar lista</button>
        <div id="mpoList" style="margin-top:8px"><p>carregando...</p></div>
        <div class="err" id="mpoErr"></div>
      </div>`;
    document.body.appendChild(o);
    o.querySelector('#mpoAvA').onclick = () => avatarScreen(() => lobbyScreen());
    o.querySelector('#mpoCreate').onclick = () => createRoomScreen();
    const listBox = o.querySelector('#mpoList');
    const err = o.querySelector('#mpoErr');

    async function refreshList() {
      try {
        const r = await fetch('/api/game', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'listRooms' }),
        }).then(x => x.json());
        if (!r.ok) { listBox.innerHTML = '<p>erro ao carregar</p>'; return; }
        if (!r.rooms.length) { listBox.innerHTML = '<p>nenhuma sala aberta. cria a primeira!</p>'; return; }
        listBox.innerHTML = '';
        r.rooms.forEach(room => {
          const el = $('div', { class: 'room' });
          const full = room.players >= room.maxPlayers;
          el.innerHTML = `
            <div class="info">
              <div class="nm">${room.name}</div>
              <div class="meta">host: ${room.host} ${room.hasLive ? '· <span class="live">● AO VIVO</span>' : ''}</div>
              <div class="meta">código: <b>${room.id}</b></div>
            </div>
            <div class="cnt ${full ? 'full' : ''}">${room.players}/${room.maxPlayers}</div>`;
          el.onclick = () => {
            if (full) { err.textContent = '⚠ sala lotada'; return; }
            joinRoom(room.id);
          };
          listBox.appendChild(el);
        });
      } catch (e) { listBox.innerHTML = '<p>erro de rede</p>'; }
    }

    async function joinRoom(roomId) {
      err.textContent = 'entrando em ' + roomId + '...';
      const r = await api('joinRoom', { roomId, avatar: MP.avatar });
      if (!r.ok) {
        const msgs = {
          salaNaoExiste: '⚠ essa sala não existe mais',
          salaLotada: '⚠ sala lotada (' + r.players + '/' + r.max + ')',
          nickEmUso: '⚠ esse nick já está em uso nessa sala',
          nickInvalido: '⚠ nick inválido',
        };
        err.textContent = msgs[r.reason] || ('⚠ ' + r.reason);
        return;
      }
      MP.roomId = r.roomId; MP.room = r.room;
      MP.isAdmin = (r.room.players[MP.nick] && r.room.players[MP.nick].isAdmin) || false;
      closeAll();
      modeScreen();
    }

    o.querySelector('#mpoRefresh').onclick = refreshList;
    refreshList();
    MP._refreshLobby = refreshList;
  }

  function createRoomScreen() {
    closeAll();
    const o = $('div', { id: 'mpo' });
    o.innerHTML = `
      <div class="c">
        <h1>CRIAR SALA</h1>
        <input id="crName" placeholder="nome da sala" maxlength="24" value="${MP.nick}'s room">
        <p style="font-size:11px;margin-top:8px">limite de jogadores (recomendado: 20):</p>
        <input id="crMax" type="number" min="2" max="200" value="20">
        <p style="font-size:11px;margin-top:8px">live (opcional — Twitch ou YouTube):</p>
        <input id="crLive" placeholder="twitch.tv/seucanal ou youtube.com/...">
        <div class="err" id="crErr"></div>
        <button id="crOk">CRIAR</button>
        <button id="crBack" class="sec">← voltar</button>
      </div>`;
    document.body.appendChild(o);
    const err = o.querySelector('#crErr');
    o.querySelector('#crBack').onclick = () => lobbyScreen();
    o.querySelector('#crOk').onclick = async () => {
      const roomName = o.querySelector('#crName').value.trim() || (MP.nick + "'s room");
      const maxPlayers = Math.max(2, Math.min(200, +o.querySelector('#crMax').value || 20));
      const liveUrl = o.querySelector('#crLive').value.trim();
      err.textContent = 'criando...';
      const r = await api('createRoom', { roomName, maxPlayers, liveUrl, avatar: MP.avatar });
      if (!r.ok) { err.textContent = '⚠ ' + (r.reason || 'erro'); return; }
      MP.roomId = r.roomId; MP.room = r.room; MP.isAdmin = true;
      closeAll();
      modeScreen();
    };
  }

  function modeScreen() {
    closeAll();
    const o = $('div', { id: 'mpo' });
    o.innerHTML = `
      <div class="c">
        <h1>SALA: ${MP.room.name}</h1>
        <p>código: <b style="color:#b8ff2e">${MP.room.id}</b> · max ${MP.room.maxPlayers}</p>
        <p style="margin-top:12px">como jogar?</p>
        <button id="mpoSolo">🎮 SOZINHO</button>
        <button id="mpoMulti">👥 MULTIPLAYER (chat em turnos)</button>
        <button id="mpoAvEdit" class="sec">🎨 Mudar avatar</button>
        <button id="mpoExit" class="sec">← Sair da sala</button>
      </div>`;
    document.body.appendChild(o);
    o.querySelector('#mpoSolo').onclick = () => { MP.mode = 'solo'; api('setMode', { mode: 'solo' }); closeAll(); start(); };
    o.querySelector('#mpoMulti').onclick = () => { MP.mode = 'multi'; api('setMode', { mode: 'multi' }); closeAll(); start(); };
    o.querySelector('#mpoAvEdit').onclick = () => avatarScreen(() => { api('setAvatar', { avatar: MP.avatar }); modeScreen(); });
    o.querySelector('#mpoExit').onclick = async () => { await api('leaveRoom'); MP.roomId = null; MP.room = null; lobbyScreen(); };
  }

  function start() {
    applyAvatar(MP.avatar);
    buildHud(); buildChat();
    if (MP.isAdmin) buildAdminButton();
    buildAvatarButton();
    pollLoop(); moveLoop(); renderLoop();
    window.addEventListener('beforeunload', () => {
      try { navigator.sendBeacon('/api/game', JSON.stringify({ action: 'leaveRoom', nick: MP.nick, hwid: MY_HWID, roomId: MP.roomId })); } catch (e) {}
    });
  }

  function buildHud() { const h = $('div', { id: 'mpHud' }); document.body.appendChild(h); MP.turnEl = h; }
  function updateHud(room) {
    const players = Object.values(room.players || {});
    const online = players.map(p => p.nick + (p.isAdmin ? ' ⚙' : '')).join(', ');
    const myTurn = room.turnNick === MP.nick;
    MP.turnEl.innerHTML =
      `<span class="me">${MP.nick}${MP.isAdmin ? ' <span class="adm">⚙</span>' : ''}</span> · ${MP.mode === 'multi' ? 'multi' : 'solo'}<br>` +
      `sala: ${room.name} (${MP.roomId}) · ${players.length}/${room.maxPlayers}<br>` +
      `online: ${online || '—'}<br>` +
      (MP.mode === 'multi'
        ? (myTurn ? '<span class="turn">▶ SUA VEZ de falar</span>' : `<span>⏳ vez de ${room.turnNick || '—'}</span>`)
        : '<span style="color:#8a8a9a">chat desligado no modo sozinho</span>');
  }

  function buildChat() {
    const c = $('div', { id: 'mpChat' }); document.body.appendChild(c);
    const i = $('div', { id: 'mpIn' });
    i.innerHTML = `<input id="mpTxt" maxlength="240" placeholder="mensagem..." autocomplete="off"><button id="mpSend">➤</button>`;
    document.body.appendChild(i);
    const inp = i.querySelector('#mpTxt');
    const enviar = async () => {
      const txt = inp.value.trim(); if (!txt) return;
      inp.value = '';
      const r = await api('chat', { text: txt });
      if (!r.ok) {
        if (r.reason === 'naoEhSuaVez') addChat({ type: 'sys', nick: 'SISTEMA', text: 'calma, é a vez de ' + r.turn });
        else if (r.reason === 'solo') addChat({ type: 'sys', nick: 'SISTEMA', text: 'você está no modo sozinho' });
      }
    };
    i.querySelector('#mpSend').onclick = enviar;
    inp.onkeydown = e => { if (e.key === 'Enter') enviar(); };
    MP.chatInput = inp;
    MP.chatBar = i;
  }
  function addChat(e) {
    const c = document.getElementById('mpChat'); if (!c) return;
    const cls = 'm' + (e.type === 'entity' ? ' ent' : e.type === 'sys' ? ' sys' : e.nick === MP.nick ? ' me' : '');
    const div = $('div', { class: cls });
    div.textContent = `${e.nick}: ${e.text}`;
    c.appendChild(div);
    while (c.children.length > 40) c.removeChild(c.firstChild);
    c.scrollTop = c.scrollHeight;
  }

  function buildAvatarButton() {
    const b = $('button', { id: 'mpAvBtn' }); b.textContent = '🎨';
    b.onclick = () => avatarScreen(() => { api('setAvatar', { avatar: MP.avatar }); });
    document.body.appendChild(b);
  }

  function buildAdminButton() {
    const b = $('button', { id: 'mpAdmBtn' }); b.textContent = '⚙ PAINEL ADMIN';
    b.onclick = openAdmin;
    document.body.appendChild(b);
  }
  function openAdmin() {
    if (document.getElementById('mpAdm')) return;
    const o = $('div', { id: 'mpAdm' });
    o.innerHTML = `
      <button class="x" id="mpAdmX">×</button>
      <h2>⚙ PAINEL ADMIN</h2>
      <h3>SPAWNAR ENTIDADE</h3>
      <input id="mpAdmName" placeholder="nome da entidade" maxlength="18">
      <select id="mpAdmKind">
        <option value="goo">🖤 Gosma humanoide</option>
        <option value="eye">👁 Olho flutuante</option>
        <option value="shadow">👤 Sombra</option>
      </select>
      <input id="mpAdmX2" placeholder="x" value="300">
      <input id="mpAdmY2" placeholder="y" value="120">
      <button id="mpAdmSpawn">SPAWNAR</button>
      <h3>ENTIDADES ATIVAS</h3>
      <div id="mpAdmEnts"></div>
      <h3>DAR ADMIN</h3>
      <input id="mpAdmGive" placeholder="nick do jogador" maxlength="${NICK_MAX}">
      <button id="mpAdmGiveBtn">DAR ADMIN</button>
      <h3>LIVE DA SALA</h3>
      <input id="mpAdmLive" placeholder="twitch.tv/seucanal ou link do youtube">
      <button id="mpAdmLiveBtn">DEFINIR LIVE</button>
      <h3>EVENTO GLOBAL</h3>
      <input id="mpAdmEvt" placeholder="ex: escurecer tela">
      <button id="mpAdmEvtBtn">DISPARAR</button>
      <div class="st" id="mpAdmSt"></div>`;
    document.body.appendChild(o);
    const st = o.querySelector('#mpAdmSt');
    const setSt = t => { st.textContent = t; setTimeout(() => { if (st.textContent === t) st.textContent = ''; }, 2500); };

    o.querySelector('#mpAdmX').onclick = () => o.remove();
    o.querySelector('#mpAdmSpawn').onclick = async () => {
      const name = o.querySelector('#mpAdmName').value.trim() || 'SOMBRA';
      const kind = o.querySelector('#mpAdmKind').value;
      const x = +o.querySelector('#mpAdmX2').value || 300;
      const y = +o.querySelector('#mpAdmY2').value || 120;
      const r = await api('spawnEntity', { name, kind, x, y });
      setSt(r.ok ? '✅ spawnada' : '❌ ' + (r.reason || 'erro'));
    };
    o.querySelector('#mpAdmGiveBtn').onclick = async () => {
      const n = o.querySelector('#mpAdmGive').value.trim();
      if (!n) return;
      const r = await api('giveAdmin', { nick: n });
      setSt(r.ok ? '✅ ' + n + ' agora é admin' : '❌ ' + (r.reason || 'erro'));
    };
    o.querySelector('#mpAdmLiveBtn').onclick = async () => {
      const url = o.querySelector('#mpAdmLive').value.trim();
      const r = await api('setLive', { liveUrl: url });
      setSt(r.ok ? (r.live ? '✅ live definida' : '✅ live removida') : '❌');
    };
    o.querySelector('#mpAdmEvtBtn').onclick = async () => {
      const ev = o.querySelector('#mpAdmEvt').value.trim();
      if (!ev) return;
      const r = await api('globalEvent', { event: ev });
      setSt(r.ok ? '✅ evento disparado' : '❌');
    };

    const renderEnts = (room) => {
      const box = o.querySelector('#mpAdmEnts'); box.innerHTML = '';
      (room.entities || []).forEach(e => {
        const d = $('div', { class: 'row' });
        const sp = $('span'); sp.textContent = `${e.name} (${e.kind}) x=${e.x}`;
        const b = $('button'); b.textContent = 'remover'; b.style.width = 'auto'; b.style.padding = '3px 8px';
        b.onclick = async () => { await api('removeEntity', { id: e.id }); setSt('✅ removida'); refreshEnts(); };
        d.appendChild(sp); d.appendChild(b); box.appendChild(d);
      });
      if (!room.entities || !room.entities.length) box.innerHTML = '<span style="color:#888">— nenhuma</span>';
    };
    const refreshEnts = async () => {
      const s = await getState();
      const room = s.rooms && s.rooms[MP.roomId];
      if (room) renderEnts(room);
    };
    refreshEnts();
    MP.adminEntsRefresh = refreshEnts;
  }

  async function pollLoop() {
    try {
      const s = await getState();
      if (s.v !== MP.lastV) {
        MP.lastV = s.v;
        const room = s.rooms && s.rooms[MP.roomId];
        if (!room) {
          addChat({ type: 'sys', nick: 'SISTEMA', text: 'a sala foi fechada' });
          setTimeout(() => lobbyScreen(), 1500);
          return;
        }
        MP.room = room;
        updateHud(room);
        syncChat(room);
        syncEntities(room);
        syncAvatars(room);
        syncLive(room);
        if (MP.adminEntsRefresh && document.getElementById('mpAdm')) MP.adminEntsRefresh();
        if (room.players[MP.nick] && room.players[MP.nick].isAdmin && !MP.isAdmin) {
          MP.isAdmin = true;
          if (!document.getElementById('mpAdmBtn')) buildAdminButton();
        }
        if (MP.chatBar) MP.chatBar.classList.toggle('off', MP.mode === 'multi' && room.turnNick !== MP.nick);
      }
    } catch (e) {}
    setTimeout(pollLoop, 1000);
  }
  let lastChatLen = 0;
  function syncChat(room) {
    if (!room.chat) return;
    if (room.chat.length < lastChatLen) lastChatLen = 0;
    for (let i = lastChatLen; i < room.chat.length; i++) addChat(room.chat[i]);
    lastChatLen = room.chat.length;
  }

  function syncAvatars(room) {
    const used = {};
    for (const nick in room.players) {
      if (nick === MP.nick) continue;
      const p = room.players[nick];
      if (p.mode !== 'multi') continue;
      used[nick] = true;
      let el = MP.avatars[nick];
      if (!el) {
        el = $('div', { class: 'mpAv' });
        document.body.appendChild(el);
        MP.avatars[nick] = el;
      }
      const a = p.avatar || DEFAULT_AVATAR;
      const sig = JSON.stringify(a) + '|' + p.isAdmin;
      if (el._sig !== sig) {
        el._sig = sig;
        const hair = a.hair === 'RAINBOW'
          ? 'linear-gradient(90deg,#ff0000,#ffcc00,#00ff00,#00d4ff,#8a2be2,#ff0000)'
          : a.hair;
        el.innerHTML = `
          <div class="body" style="background:${a.shirt};border-color:${a.pants}">
            <div class="head" style="background:linear-gradient(180deg,${hair === 'linear-gradient(90deg,#ff0000,#ffcc00,#00ff00,#00d4ff,#8a2be2,#ff0000)' ? '#ff0000' : hair} 0 50%, ${a.skin} 50% 100%)"></div>
            <div class="eye l" style="background:${a.eyes}"></div>
            <div class="eye r" style="background:${a.eyes}"></div>
          </div>
          ${nick}${p.isAdmin ? ' ⚙' : ''}`;
      }
      el._x = p.x; el._y = p.y;
    }
    for (const nick in MP.avatars) if (!used[nick]) { MP.avatars[nick].remove(); delete MP.avatars[nick]; }
  }

  function syncEntities(room) {
    const used = {};
    (room.entities || []).forEach(e => {
      used[e.id] = true;
      let el = MP.entities[e.id];
      if (!el) {
        el = $('div', { class: 'mpEnt ' + e.kind });
        el.innerHTML = `<div class="blob"></div>${e.name}`;
        el.onclick = () => talkTo(e);
        document.body.appendChild(el);
        MP.entities[e.id] = el;
      }
      el._x = e.x; el._y = e.y; el._id = e.id; el._name = e.name;
    });
    for (const id in MP.entities) if (!used[id]) { MP.entities[id].remove(); delete MP.entities[id]; }
  }
  function talkTo(e) {
    const txt = prompt(`falar com ${e.name}:`);
    if (!txt) return;
    api('entityTalk', { id: e.id, text: txt }).then(r => { if (r.scare) jumpscare(); });
  }
  function jumpscare() {
    const j = $('div', { id: 'mpJump' }); j.textContent = '👁';
    document.body.appendChild(j);
    setTimeout(() => j.remove(), 500);
  }

  function syncLive(room) {
    const live = room.live;
    if (!live) {
      if (MP.liveEl) { MP.liveEl.remove(); MP.liveEl = null; MP.liveSig = null; }
      return;
    }
    const sig = live.type + ':' + live.id;
    if (MP.liveSig === sig && MP.liveEl) return;
    if (MP.liveEl) MP.liveEl.remove();
    MP.liveSig = sig;

    const box = $('div', { id: 'mpLive' });
    let src = '';
    if (live.type === 'twitch') {
      const host = location.hostname || 'localhost';
      src = `https://player.twitch.tv/?channel=${live.id}&parent=${host}&muted=true`;
    } else if (live.type === 'youtube') {
      src = `https://www.youtube.com/embed/${live.id}?autoplay=1&mute=1`;
    }
    box.innerHTML = `
      <button class="min" id="mpLiveMin">–</button>
      <span class="tag">● AO VIVO</span>
      <iframe src="${src}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    document.body.appendChild(box);
    box.querySelector('#mpLiveMin').onclick = () => box.classList.toggle('minimized');
    MP.liveEl = box;
  }

  let lastSent = 0;
  function moveLoop() {
    const g = window.StickDebug && window.StickDebug.G;
    if (g && g.player && MP.roomId) {
      const now = Date.now();
      if (now - lastSent > 500) {
        lastSent = now;
        api('move', { x: Math.round(g.player.x), y: Math.round(g.player.y), face: g.player.face }).catch(() => {});
      }
    }
    setTimeout(moveLoop, 400);
  }

  function renderLoop() {
    const g = window.StickDebug && window.StickDebug.G;
    if (g && g.camX != null) {
      const canvas = document.getElementById('game');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scale = rect.width / 320;
        for (const nick in MP.avatars) {
          const el = MP.avatars[nick];
          el.style.left = (rect.left + (el._x - g.camX) * scale) + 'px';
          el.style.top  = (rect.top  + (el._y - g.camY) * scale) + 'px';
        }
        for (const id in MP.entities) {
          const el = MP.entities[id];
          el.style.left = (rect.left + (el._x - g.camX) * scale) + 'px';
          el.style.top  = (rect.top  + (el._y - g.camY) * scale) + 'px';
        }
      }
    }
    requestAnimationFrame(renderLoop);
  }

  loadAvatar();
  window.addEventListener('load', () => setTimeout(loginScreen, 300));
})();
