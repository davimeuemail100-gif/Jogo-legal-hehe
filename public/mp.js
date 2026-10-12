(function () {
  'use strict';
  const $ = (t, p) => { const e = document.createElement(t); if (p) for (const k in p) e.setAttribute(k, p[k]); return e; };

  const NICK_MAX = 24;
  const ADMIN_NICK = 'DeRaminWrick';

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
    remote: {}, entities: {}, avatar: { ...DEFAULT_AVATAR },
    started: false, overlay: null,
  };

  // ============ CSS ============
  const s = document.createElement('style');
  s.textContent = `
    #mpo{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
      background:rgba(4,2,8,.97);z-index:2147483000;font-family:monospace;color:#eee;
      overflow-y:auto;padding:20px;box-sizing:border-box}
    #mpo .c{background:#141018;border:2px solid #8a2be2;border-radius:14px;padding:18px;
      width:min(94vw,420px);box-shadow:0 0 30px rgba(138,43,226,.6);max-height:90vh;
      overflow-y:auto;box-sizing:border-box}
    #mpo h1{font-size:17px;margin:0 0 12px;color:#b8ff2e;letter-spacing:2px;text-align:center}
    #mpo p{font-size:12px;color:#b0a8c0;margin:4px 0;text-align:center}
    #mpo input,#mpo select{width:100%;padding:10px;margin:5px 0;background:#0d0a12;color:#fff;
      border:1px solid #4a2a6a;border-radius:8px;font-family:inherit;font-size:13px;box-sizing:border-box}
    #mpo button{width:100%;padding:10px;margin:4px 0;background:#8a2be2;color:#fff;
      border:none;border-radius:8px;font-family:inherit;font-size:12px;cursor:pointer;font-weight:bold}
    #mpo button:hover{background:#a04ef0}
    #mpo button.sec{background:#333}
    #mpo button.studio{background:#4ac24a;color:#0a1a0a}
    #mpo .err{color:#ff5570;font-size:12px;text-align:center;min-height:16px;margin-top:6px}
    #mpo .room{background:#0d0a12;border:1px solid #4a2a6a;border-radius:8px;padding:8px;margin:5px 0;
      cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:6px}
    #mpo .room:hover{background:#1a0f26;border-color:#8a2be2}
    #mpo .room .info{text-align:left;flex:1;min-width:0}
    #mpo .room .nm{color:#b8ff2e;font-weight:bold;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #mpo .room .meta{font-size:10px;color:#8a8a9a;margin-top:2px}
    #mpo .room .cnt{background:#8a2be2;color:#fff;border-radius:6px;padding:4px 8px;font-size:11px;font-weight:bold}
    #mpo .room .cnt.full{background:#c0203a}
    .avPrev{width:100%;height:100px;display:flex;align-items:center;justify-content:center;
      background:#0d0a12;border-radius:10px;margin-bottom:10px}
    .avPrev canvas{image-rendering:pixelated;width:72px;height:96px}
    .avRow{display:flex;align-items:center;gap:8px;margin:6px 0}
    .avRow>span{font-size:11px;color:#b0a8c0;width:60px;text-align:right;flex-shrink:0}
    .avRow .sw{flex:1;display:flex;gap:4px;flex-wrap:wrap}
    .avRow .sw button{width:22px;height:22px;padding:0;margin:0;border-radius:4px;border:2px solid #333;cursor:pointer;background:#000}
    .avRow .sw button.sel{border-color:#b8ff2e;box-shadow:0 0 6px #b8ff2e}
    .avRow .sw button[data-c="RAINBOW"]{background:linear-gradient(90deg,#ff0000,#ffcc00,#00ff00,#00d4ff,#8a2be2,#ff0000)}

    #mpHud{position:fixed;top:6px;left:6px;background:rgba(10,8,15,.82);
      border:1px solid #4a2a6a;border-radius:6px;padding:4px 8px;
      font-family:monospace;font-size:10px;color:#ccc;z-index:999996;line-height:1.3;pointer-events:none;max-width:60vw}
    #mpHud b{color:#b8ff2e}
    #mpHud .adm{color:#ffd84a}
    #mpHud .turn{color:#b8ff2e;font-weight:bold}

    #mpMenuBtn{position:fixed;top:6px;right:6px;width:38px;height:38px;
      background:rgba(20,16,26,.92);color:#fff;border:2px solid #508cff;border-radius:8px;
      font-size:20px;cursor:pointer;z-index:999997;display:flex;align-items:center;justify-content:center;
      touch-action:manipulation}
    #mpMenuBtn:active{background:#508cff;color:#000}

    #mpMenu{position:fixed;top:50px;right:6px;background:rgba(20,16,26,.98);
      border:2px solid #508cff;border-radius:10px;padding:6px;z-index:999997;
      width:200px;box-shadow:0 4px 20px rgba(0,0,0,.6);display:none;flex-direction:column;gap:4px}
    #mpMenu.open{display:flex}
    #mpMenu button{width:100%;padding:9px 12px;background:#1e1e2a;color:#fff;border:1px solid #3a3a4a;
      border-radius:6px;font-family:monospace;font-size:11px;font-weight:bold;cursor:pointer;
      text-align:left;touch-action:manipulation}
    #mpMenu button:active{background:#508cff;color:#000}
    #mpMenu button.danger{background:#402030;border-color:#803040;color:#ff8a8a}
    #mpMenu button.admin{background:#4a3a10;border-color:#a08020;color:#ffd84a}

    #mpChat{position:fixed;top:50px;right:6px;width:min(90vw,340px);max-height:50vh;
      overflow-y:auto;background:rgba(10,8,15,.96);border:2px solid #4a2a6a;border-radius:10px;
      padding:8px 10px;font-family:monospace;font-size:11px;color:#ccc;z-index:999998;
      display:none;flex-direction:column;gap:4px;box-shadow:0 4px 20px rgba(0,0,0,.6)}
    #mpChat.open{display:flex}
    #mpChat .m{margin:1px 0;word-wrap:break-word;line-height:1.35}
    #mpChat .me{color:#b8ff2e}
    #mpChat .sys{color:#8a8a9a;font-style:italic}
    #mpChat .ent{color:#ff6a9c;text-shadow:0 0 4px #ff006a}
    #mpChatInputWrap{margin-top:6px;display:flex;gap:4px}
    #mpChatInputWrap input{flex:1;padding:8px;background:#0d0a12;color:#fff;
      border:1px solid #4a2a6a;border-radius:6px;font-family:monospace;font-size:12px;min-width:0}
    #mpChatInputWrap button{padding:8px 12px;background:#8a2be2;color:#fff;border:none;border-radius:6px;
      font-family:monospace;font-weight:bold;cursor:pointer;font-size:12px;touch-action:manipulation}
    #mpChatInputWrap button.closeChat{background:#402030}

    #mpEntInput{position:fixed;left:50%;bottom:80px;transform:translateX(-50%);
      width:min(90vw,420px);background:rgba(10,5,15,.98);border:2px solid #ff6a9c;
      border-radius:12px;padding:10px;z-index:2147483002;display:none;flex-direction:column;gap:6px;
      box-shadow:0 0 30px rgba(255,106,156,.4);font-family:monospace}
    #mpEntInput.open{display:flex}
    #mpEntInput .who{color:#ff6a9c;font-size:12px;font-weight:bold;text-shadow:0 0 5px #ff006a}
    #mpEntInput .line{display:flex;gap:6px}
    #mpEntInput input{flex:1;padding:10px;background:#0d0a12;color:#fff;border:1px solid #4a2a6a;
      border-radius:8px;font-family:monospace;font-size:13px;min-width:0}
    #mpEntInput button{padding:10px 14px;background:#ff6a9c;color:#1a0510;border:none;
      border-radius:8px;font-family:monospace;font-weight:bold;cursor:pointer;touch-action:manipulation}
    #mpEntInput button.cancel{background:#402030;color:#ff8a8a}
    #mpEntReply{color:#fff;font-size:12px;line-height:1.4;padding:6px;
      background:rgba(255,106,156,.1);border-radius:6px;border-left:3px solid #ff6a9c;display:none}
    #mpEntReply.show{display:block}

    #mpOverlay{position:fixed;pointer-events:none;z-index:999994;image-rendering:pixelated;
      image-rendering:crisp-edges}

    #mpAdm{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
      width:min(92vw,400px);max-height:80vh;overflow-y:auto;background:#14101a;
      border:2px solid #ffd84a;border-radius:12px;padding:14px;color:#eee;
      font-family:monospace;font-size:12px;z-index:2147483001;box-sizing:border-box}
    #mpAdm h2{margin:0 0 10px;color:#ffd84a;font-size:13px;text-align:center}
    #mpAdm h3{margin:12px 0 6px;color:#b8ff2e;font-size:11px;border-bottom:1px solid #333;padding-bottom:3px}
    #mpAdm input,#mpAdm select{width:100%;padding:6px;margin:3px 0;background:#0d0a12;color:#fff;
      border:1px solid #4a2a6a;border-radius:6px;box-sizing:border-box;font-family:inherit;font-size:11px}
    #mpAdm button{width:100%;padding:7px;margin:3px 0;background:#8a2be2;color:#fff;border:none;
      border-radius:6px;cursor:pointer;font-weight:bold;font-family:inherit;font-size:11px}
    #mpAdm .x{position:absolute;top:8px;right:12px;width:auto;padding:3px 10px;background:#402030}
    #mpAdm .row{display:grid;grid-template-columns:1fr auto;gap:4px;align-items:center;margin:3px 0}
    #mpAdm .st{color:#0f0;font-size:10px;min-height:14px;text-align:center;margin-top:6px}

    #mpJump{position:fixed;inset:0;background:#000;z-index:2147483647;display:flex;
      align-items:center;justify-content:center;color:#ff2030;font-family:monospace;
      font-size:90px;font-weight:bold;pointer-events:none;animation:mpJ .45s ease-out;
      text-shadow:0 0 50px #ff2030}
    @keyframes mpJ{0%{opacity:0;transform:scale(.5)}30%{opacity:1;transform:scale(1.2)}100%{opacity:0;transform:scale(1)}}
  `;
  document.head.appendChild(s);

  // ============ HWID ============
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

  // ============ AVATAR ============
  function loadAvatar() {
    try {
      const raw = localStorage.getItem('wrick_avatar');
      if (raw) MP.avatar = { ...DEFAULT_AVATAR, ...JSON.parse(raw) };
      const n = localStorage.getItem('wrick_nick');
      if (n) MP.nick = n;
    } catch (e) {}
  }
  function saveAvatar() { try { localStorage.setItem('wrick_avatar', JSON.stringify(MP.avatar)); } catch (e) {} }
  function shadeLocal(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = c => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
    r = f(r); g = f(g); b = f(b);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
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

  // ============ LOGIN ============
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
      if (nick.length > NICK_MAX) { err.textContent = '⚠ nick muito longo'; return; }
      if (!/^[\wÀ-ÿ\-_. ]{2,24}$/.test(nick)) { err.textContent = '⚠ inválido'; return; }
      MP.nick = nick;
      try { localStorage.setItem('wrick_nick', nick); } catch (e) {}
      closeAll();
      lobbyScreen();
    };
    o.querySelector('#mpoOk').onclick = tentar;
    inp.onkeydown = e => { if (e.key === 'Enter') tentar(); };
  }

  // ============ AVATAR ============
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
      else if (MP.roomId) { api('setAvatar', { avatar: MP.avatar }); }
      else lobbyScreen();
    };
    o.querySelector('#avReset').onclick = () => { MP.avatar = { ...DEFAULT_AVATAR }; saveAvatar(); renderSw(); renderPrev(); };
  }

  // ============ LOBBY ============
  async function lobbyScreen() {
    closeAll();
    const o = $('div', { id: 'mpo' });
    o.innerHTML = `
      <div class="c">
        <h1>SALAS</h1>
        <p>olá, ${MP.nick} · <span id="mpoAvA" style="color:#8a2be2;cursor:pointer;text-decoration:underline">🎨 avatar</span></p>
        <button id="mpoStudio" class="studio">🛠 ABRIR STUDIO</button>
        <button id="mpoCreate">➕ CRIAR NOVA SALA</button>
        <button id="mpoRefresh" class="sec">🔄 Atualizar lista</button>
        <div id="mpoList" style="margin-top:8px"><p>carregando...</p></div>
        <div class="err" id="mpoErr"></div>
      </div>`;
    document.body.appendChild(o);
    o.querySelector('#mpoAvA').onclick = () => avatarScreen(() => lobbyScreen());
    o.querySelector('#mpoStudio').onclick = () => { window.location.href = '/studio.html'; };
    o.querySelector('#mpoCreate').onclick = () => createRoomScreen();
    const listBox = o.querySelector('#mpoList');
    const err = o.querySelector('#mpoErr');

    async function refreshList() {
      try {
        const r = await fetch('/api/game', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'listRooms' }),
        }).then(x => x.json());
        if (!r.ok) { listBox.innerHTML = '<p>erro</p>'; return; }
        if (!r.rooms.length) { listBox.innerHTML = '<p>nenhuma sala aberta</p>'; return; }
        listBox.innerHTML = '';
        r.rooms.forEach(room => {
          const el = $('div', { class: 'room' });
          const full = room.players >= room.maxPlayers;
          el.innerHTML = `
            <div class="info">
              <div class="nm">${room.name}</div>
              <div class="meta">host: ${room.host}</div>
              <div class="meta">código: <b>${room.id}</b></div>
            </div>
            <div class="cnt ${full ? 'full' : ''}">${room.players}/${room.maxPlayers}</div>`;
          el.onclick = () => { if (full) { err.textContent = '⚠ sala lotada'; return; } joinRoom(room.id); };
          listBox.appendChild(el);
        });
      } catch (e) { listBox.innerHTML = '<p>erro de rede</p>'; }
    }

    async function joinRoom(roomId) {
      err.textContent = 'entrando...';
      const r = await api('joinRoom', { roomId, avatar: MP.avatar });
      if (!r.ok) {
        err.textContent = '⚠ ' + (r.reason || 'erro');
        return;
      }
      MP.roomId = r.roomId; MP.room = r.room;
      closeAll();
      modeScreen();
    }

    o.querySelector('#mpoRefresh').onclick = refreshList;
    refreshList();
  }

  function createRoomScreen() {
    closeAll();
    const o = $('div', { id: 'mpo' });
    o.innerHTML = `
      <div class="c">
        <h1>CRIAR SALA</h1>
        <input id="crName" placeholder="nome da sala" maxlength="24" value="${MP.nick}'s room">
        <p style="font-size:11px;margin-top:8px">limite de jogadores:</p>
        <input id="crMax" type="number" min="2" max="200" value="20">
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
      err.textContent = 'criando...';
      const r = await api('createRoom', { roomName, maxPlayers, avatar: MP.avatar });
      if (!r.ok) { err.textContent = '⚠ ' + (r.reason || 'erro'); return; }
      MP.roomId = r.roomId; MP.room = r.room;
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
        <p>código: <b style="color:#b8ff2e">${MP.room.id}</b></p>
        <p style="margin-top:12px">como jogar?</p>
        <button id="mpoSolo">🎮 SOZINHO</button>
        <button id="mpoMulti">👥 MULTIPLAYER</button>
        <button id="mpoAvEdit" class="sec">🎨 Mudar avatar</button>
        <button id="mpoExit" class="sec">← Sair da sala</button>
      </div>`;
    document.body.appendChild(o);
    o.querySelector('#mpoSolo').onclick = () => { MP.mode = 'solo'; api('setMode', { mode: 'solo' }); closeAll(); start(); };
    o.querySelector('#mpoMulti').onclick = () => { MP.mode = 'multi'; api('setMode', { mode: 'multi' }); closeAll(); start(); };
    o.querySelector('#mpoAvEdit').onclick = () => avatarScreen(() => { api('setAvatar', { avatar: MP.avatar }); modeScreen(); });
    o.querySelector('#mpoExit').onclick = async () => { await api('leaveRoom'); MP.roomId = null; MP.room = null; lobbyScreen(); };
  }

  // ============ START ============
  function start() {
    if (MP.started) return;
    MP.started = true;
    applyAvatar(MP.avatar);
    closeAll();

    // HUD
    const h = $('div', { id: 'mpHud' });
    document.body.appendChild(h);
    MP.turnEl = h;

    // Overlay (onde os outros jogadores vão ser desenhados)
    const ov = $('canvas', { id: 'mpOverlay' });
    ov.width = 320; ov.height = 180;
    document.body.appendChild(ov);
    MP.overlay = ov;
    MP.overlayCtx = ov.getContext('2d');

    // Botão menu
    const btn = $('button', { id: 'mpMenuBtn' }); btn.textContent = '☰';
    btn.onclick = (e) => {
      e.stopPropagation();
      const m = document.getElementById('mpMenu');
      m.classList.toggle('open');
      if (!m.classList.contains('open')) {
        const c = document.getElementById('mpChat');
        if (c) c.classList.remove('open');
      }
    };
    document.body.appendChild(btn);

    // Menu
    const menu = $('div', { id: 'mpMenu' });
    menu.innerHTML = `
      <button id="mmAv">🎨 Trocar avatar</button>
      <button id="mmChat">💬 Abrir chat</button>
      <button id="mmStudio">🛠 Ir pro Studio</button>
      <button id="mmExit" class="danger">← Sair da sala</button>
    `;
    document.body.appendChild(menu);

    // Chat
    const chat = $('div', { id: 'mpChat' });
    chat.innerHTML = `<div id="mpChatMsgs"></div>
      <div id="mpChatInputWrap">
        <input id="mpTxt" maxlength="240" placeholder="mensagem..." autocomplete="off">
        <button id="mpSend">➤</button>
        <button id="mpChatClose" class="closeChat">×</button>
      </div>`;
    document.body.appendChild(chat);
    MP.chatEl = chat;

    const txt = chat.querySelector('#mpTxt');
    const enviar = async () => {
      const t = txt.value.trim(); if (!t) return;
      txt.value = '';
      const r = await api('chat', { text: t });
      if (!r.ok && r.reason === 'naoEhSuaVez') addChat({ type: 'sys', nick: 'SISTEMA', text: 'é a vez de ' + r.turn });
    };
    chat.querySelector('#mpSend').onclick = enviar;
    chat.querySelector('#mpChatClose').onclick = () => { chat.classList.remove('open'); menu.classList.remove('open'); };
    txt.onkeydown = e => { if (e.key === 'Enter') enviar(); };

    menu.querySelector('#mmAv').onclick = () => { menu.classList.remove('open'); avatarScreen(() => { api('setAvatar', { avatar: MP.avatar }); }); };
    menu.querySelector('#mmChat').onclick = () => {
      chat.classList.toggle('open');
      menu.classList.remove('open');
      if (chat.classList.contains('open')) setTimeout(() => txt.focus(), 200);
    };
    menu.querySelector('#mmStudio').onclick = () => { window.location.href = '/studio.html'; };
    menu.querySelector('#mmExit').onclick = async () => {
      await api('leaveRoom');
      MP.roomId = null; MP.room = null; MP.started = false;
      location.reload();
    };

    if (MP.nick === ADMIN_NICK) {
      MP.isAdmin = true;
      const ab = $('button', { id: 'mmAdmin', class: 'admin' });
      ab.textContent = '⚙ Painel Admin';
      ab.onclick = () => { menu.classList.remove('open'); openAdmin(); };
      menu.insertBefore(ab, menu.firstChild);
    }

    // Diálogo com entidade
    const ei = $('div', { id: 'mpEntInput' });
    ei.innerHTML = `
      <div class="who" id="mpEntWho"></div>
      <div id="mpEntReply"></div>
      <div class="line">
        <input id="mpEntTxt" maxlength="200" placeholder="fale com a criatura..." autocomplete="off">
        <button id="mpEntSend">➤</button>
        <button id="mpEntCancel" class="cancel">×</button>
      </div>`;
    document.body.appendChild(ei);
    MP.entEl = ei;
    ei.querySelector('#mpEntCancel').onclick = () => ei.classList.remove('open');
    const entTxt = ei.querySelector('#mpEntTxt');
    const entSend = async () => {
      const t = entTxt.value.trim(); if (!t) return;
      entTxt.value = '';
      const id = ei.dataset.entityId;
      const name = ei.dataset.entityName;
      const reply = ei.querySelector('#mpEntReply');
      reply.classList.remove('show');
      reply.textContent = '...';
      const r = await api('entityTalk', { id, text: t });
      if (r.ok) {
        reply.textContent = name + ': ' + r.text;
        reply.classList.add('show');
        if (r.scare) jumpscare();
      } else {
        reply.textContent = 'não consegui falar';
        reply.classList.add('show');
      }
    };
    ei.querySelector('#mpEntSend').onclick = entSend;
    entTxt.onkeydown = e => { if (e.key === 'Enter') entSend(); };

    document.addEventListener('click', (e) => {
      const m = document.getElementById('mpMenu');
      const b = document.getElementById('mpMenuBtn');
      if (m && m.classList.contains('open') && !m.contains(e.target) && !b.contains(e.target)) {
        m.classList.remove('open');
      }
    });

    pollLoop(); moveLoop(); renderLoop();

    window.addEventListener('beforeunload', () => {
      try { navigator.sendBeacon('/api/game', JSON.stringify({ action: 'leaveRoom', nick: MP.nick, hwid: MY_HWID, roomId: MP.roomId })); } catch (e) {}
    });
  }

  function updateHud(room) {
    const players = Object.values(room.players || {});
    const meTurn = room.turnNick === MP.nick;
    const nicks = players.map(p => (p.nick || '?') + (p.isAdmin ? '⚙' : '')).join(' ');
    MP.turnEl.innerHTML =
      `<b>${MP.nick}</b>${MP.isAdmin ? ' <span class="adm">⚙</span>' : ''} · ${players.length}/${room.maxPlayers}` +
      (MP.mode === 'multi' && meTurn ? ' <span class="turn">▶</span>' : '') +
      `<br>[${nicks}]`;
  }

  function addChat(e) {
    const c = document.getElementById('mpChatMsgs'); if (!c) return;
    const cls = 'm' + (e.type === 'entity' ? ' ent' : e.type === 'sys' ? ' sys' : e.nick === MP.nick ? ' me' : '');
    const div = $('div', { class: cls });
    div.textContent = `${e.nick}: ${e.text}`;
    c.appendChild(div);
    while (c.children.length > 30) c.removeChild(c.firstChild);
    const chat = document.getElementById('mpChat');
    if (chat) chat.scrollTop = chat.scrollHeight;
  }

  // ============ ADMIN ============
  function openAdmin() {
    if (document.getElementById('mpAdm')) return;
    const o = $('div', { id: 'mpAdm' });
    o.innerHTML = `
      <button class="x" id="mpAdmX">×</button>
      <h2>⚙ PAINEL ADMIN</h2>
      <h3>SPAWNAR ENTIDADE</h3>
      <input id="mpAdmName" placeholder="nome" maxlength="18">
      <select id="mpAdmKind">
        <option value="goo">🖤 Gosma</option>
        <option value="eye">👁 Olho</option>
        <option value="shadow">👤 Sombra</option>
      </select>
      <input id="mpAdmX2" placeholder="x" value="300">
      <input id="mpAdmY2" placeholder="y" value="120">
      <button id="mpAdmSpawn">SPAWNAR</button>
      <h3>ENTIDADES</h3>
      <div id="mpAdmEnts"></div>
      <h3>DAR ADMIN</h3>
      <input id="mpAdmGive" placeholder="nick" maxlength="24">
      <button id="mpAdmGiveBtn">DAR</button>
      <div class="st" id="mpAdmSt"></div>`;
    document.body.appendChild(o);
    const st = o.querySelector('#mpAdmSt');
    const setSt = t => { st.textContent = t; setTimeout(() => { if (st.textContent === t) st.textContent = ''; }, 2000); };
    o.querySelector('#mpAdmX').onclick = () => o.remove();
    o.querySelector('#mpAdmSpawn').onclick = async () => {
      const r = await api('spawnEntity', {
        name: o.querySelector('#mpAdmName').value.trim() || 'SOMBRA',
        kind: o.querySelector('#mpAdmKind').value,
        x: +o.querySelector('#mpAdmX2').value || 300,
        y: +o.querySelector('#mpAdmY2').value || 120,
      });
      setSt(r.ok ? '✅' : '❌ ' + (r.reason || ''));
    };
    o.querySelector('#mpAdmGiveBtn').onclick = async () => {
      const n = o.querySelector('#mpAdmGive').value.trim(); if (!n) return;
      const r = await api('giveAdmin', { nick: n });
      setSt(r.ok ? '✅ ' + n : '❌ ' + (r.reason || ''));
    };
    const renderEnts = (room) => {
      const box = o.querySelector('#mpAdmEnts'); box.innerHTML = '';
      (room.entities || []).forEach(e => {
        const d = $('div', { class: 'row' });
        d.innerHTML = `<span>${e.name}</span>`;
        const b = $('button'); b.textContent = '×'; b.style.width = 'auto'; b.style.padding = '2px 8px';
        b.onclick = async () => { await api('removeEntity', { id: e.id }); refreshEnts(); };
        d.appendChild(b); box.appendChild(d);
      });
      if (!room.entities || !room.entities.length) box.innerHTML = '<span style="color:#888;font-size:10px">—</span>';
    };
    const refreshEnts = async () => {
      const s = await getState();
      const room = s.rooms && s.rooms[MP.roomId];
      if (room) renderEnts(room);
    };
    refreshEnts();
    MP.adminEntsRefresh = refreshEnts;
  }

  // ============ POLL ============
  async function pollLoop() {
    try {
      const s = await getState();
      if (s.v !== MP.lastV) {
        MP.lastV = s.v;
        const room = s.rooms && s.rooms[MP.roomId];
        if (!room) { setTimeout(() => location.reload(), 1500); return; }
        MP.room = room;
        updateHud(room);
        syncChat(room);
        syncEntities(room);
        syncRemote(room);
        if (MP.adminEntsRefresh && document.getElementById('mpAdm')) MP.adminEntsRefresh();
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

  // ============ OUTROS JOGADORES (só guarda os dados) ============
  function syncRemote(room) {
    const used = {};
    for (const nick in room.players) {
      if (nick === MP.nick) continue;
      const p = room.players[nick];
      if (p.mode !== 'multi') continue;
      used[nick] = true;
      let r = MP.remote[nick];
      if (!r) {
        r = { x: p.x, y: p.y, face: p.face, avatar: p.avatar, lastX: p.x, lastY: p.y, anim: 0, moving: 0 };
        MP.remote[nick] = r;
      }
      r.x = p.x; r.y = p.y; r.face = p.face; r.avatar = p.avatar || DEFAULT_AVATAR;
    }
    for (const nick in MP.remote) if (!used[nick]) delete MP.remote[nick];
  }

  // ============ ENTIDADES ============
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
      el._x = e.x; el._y = e.y; el._id = e.id;
    });
    for (const id in MP.entities) if (!used[id]) { MP.entities[id].remove(); delete MP.entities[id]; }
  }
  function talkTo(e) {
    const ei = document.getElementById('mpEntInput');
    if (!ei) return;
    ei.dataset.entityId = e.id;
    ei.dataset.entityName = e.name;
    document.getElementById('mpEntWho').textContent = '👁 ' + e.name;
    const reply = document.getElementById('mpEntReply');
    reply.classList.remove('show');
    reply.textContent = '';
    const inp = document.getElementById('mpEntTxt');
    inp.value = '';
    ei.classList.add('open');
    setTimeout(() => inp.focus(), 250);
  }
  function jumpscare() {
    const j = $('div', { id: 'mpJump' }); j.textContent = '👁';
    document.body.appendChild(j);
    setTimeout(() => j.remove(), 500);
  }

  // ============ HEARTBEAT (manda posição sempre) ============
  let lastSent = 0;
  let lastX = 40, lastY = 120, lastFace = 1;
  function moveLoop() {
    if (MP.roomId) {
      const g = window.StickDebug && window.StickDebug.G;
      if (g && g.player) {
        lastX = Math.round(g.player.x);
        lastY = Math.round(g.player.y);
        lastFace = g.player.face;
      }
      const now = Date.now();
      if (now - lastSent > 500) {
        lastSent = now;
        api('move', { x: lastX, y: lastY, face: lastFace }).catch(() => {});
      }
    }
    setTimeout(moveLoop, 500);
  }

  // ============ RENDER: desenha os outros Wricks no mapa ============
  function renderLoop() {
    const g = window.StickDebug && window.StickDebug.G;
    const ov = MP.overlay;
    const ctx = MP.overlayCtx;
    if (!ov || !ctx) { requestAnimationFrame(renderLoop); return; }

    const canvas = document.getElementById('game');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      ov.style.left = rect.left + 'px';
      ov.style.top = rect.top + 'px';
      ov.style.width = rect.width + 'px';
      ov.style.height = rect.height + 'px';
    }

    ctx.clearRect(0, 0, 320, 180);
    ctx.imageSmoothingEnabled = false;

    if (g && g.camX != null) {
      const camX = g.camX, camY = g.camY;

      // --- OUTROS JOGADORES ---
      for (const nick in MP.remote) {
        const r = MP.remote[nick];
        const a = r.avatar || DEFAULT_AVATAR;

        const dx = Math.abs(r.x - r.lastX);
        const dy = Math.abs(r.y - r.lastY);
        const moving = dx > 0.4 || dy > 0.4;
        if (moving) { r.moving = 12; r.anim += 0.15; }
        else if (r.moving > 0) r.moving--;
        r.lastX = r.x; r.lastY = r.y;

        let frame = 'idle';
        if (r.moving > 0) frame = ['walk1','walk2','walk3','walk2'][Math.floor(r.anim) % 4];

        const recolor = {
          h: a.hair === 'RAINBOW' ? '#ff2030' : a.hair,
          H: shadeLocal(a.hair === 'RAINBOW' ? '#ff2030' : a.hair, -0.25),
          s: a.skin, S: shadeLocal(a.skin, -0.15),
          g: a.shirt, G: shadeLocal(a.shirt, -0.2),
          p: a.pants, P: shadeLocal(a.pants, -0.25),
          t: a.shoes,
          e: a.eyes,
        };

        let img;
        try { img = Sprites.get('player', frame, recolor); } catch (e) { continue; }

        const px = Math.round(r.x + 4 - camX - 6);
        const py = Math.round(r.y + 8 - camY - 8);
        ctx.save();
        ctx.translate(px + 6, py + 8);
        ctx.scale(r.face < 0 ? -1 : 1, 1);
        ctx.drawImage(img, -6, -8);
        ctx.restore();

        // nome em cima
        ctx.font = '6px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const nameY = py - 4;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillText(nick, px + 7, nameY + 1);
        ctx.fillStyle = '#b8ff2e';
        ctx.fillText(nick, px + 6, nameY);
      }

      // --- ENTIDADES já são HTML por cima, então não desenha aqui ---
    }

    requestAnimationFrame(renderLoop);
  }

  loadAvatar();
  window.addEventListener('load', () => setTimeout(loginScreen, 300));
})();
