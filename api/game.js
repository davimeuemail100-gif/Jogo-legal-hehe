import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const KEY = 'wrick:state';
const GROQ_KEY = process.env.GROQ_KEY;
const MAIN_ADMIN = 'DeRaminWrick';
const TTL = 90;
const ROOM_TTL = 3600;
const NICK_MAX = 24;
const NICK_REGEX = new RegExp('^[\\wÀ-ÿ\\-_. ]{2,' + NICK_MAX + '}$');
const DEFAULT_AVATAR = { skin:'#ffffff', hair:'RAINBOW', shirt:'#8b5a2b', pants:'#1a1a1a', shoes:'#ff8a2a', eyes:'#8a2be2' };
const EMPTY = () => ({ v: 0, rooms: {}, hwidIndex: {}, builds: {}, toolbox: [], leaderboard: {}, bans: {} });

async function getState() {
  let s = await redis.get(KEY);
  if (!s) { s = EMPTY(); await redis.set(KEY, s); }
  if (typeof s === 'string') s = JSON.parse(s);
  if (!s.rooms) s.rooms = {};
  if (!s.hwidIndex) s.hwidIndex = {};
  if (!s.builds) s.builds = {};
  if (!s.toolbox) s.toolbox = [];
  if (!s.leaderboard) s.leaderboard = {};
  if (!s.bans) s.bans = {};
  const now = Date.now();
  let mudou = false;
  for (const rid in s.rooms) {
    const r = s.rooms[rid];
    for (const nick in r.players) {
      if (now - (r.players[nick].lastSeen || 0) > TTL * 1000) { delete r.players[nick]; mudou = true; }
    }
    if (Object.keys(r.players).length === 0 && now - (r.createdAt || 0) > ROOM_TTL * 1000) {
      delete s.rooms[rid]; mudou = true;
    } else {
      const mn = Object.keys(r.players).filter(n => r.players[n].mode === 'multi');
      if (!mn.includes(r.turnNick)) { r.turnNick = mn[0] || null; mudou = true; }
    }
  }
  if (mudou) { s.v++; await redis.set(KEY, s); }
  return s;
}
async function save(s) { s.v++; await redis.set(KEY, s); }

function sanitizeAvatar(a) {
  if (!a || typeof a !== 'object') return { ...DEFAULT_AVATAR };
  const clean = {};
  for (const k of ['skin','hair','shirt','pants','shoes','eyes']) {
    const v = String(a[k] || DEFAULT_AVATAR[k]).slice(0, 16);
    if (k === 'hair' && v === 'RAINBOW') clean[k] = 'RAINBOW';
    else if (/^#[0-9a-f]{6}$/i.test(v)) clean[k] = v;
    else clean[k] = DEFAULT_AVATAR[k];
  }
  return clean;
}
function newRoomId(existing) {
  for (let i = 0; i < 20; i++) {
    const id = Math.random().toString(36).slice(2, 8).toUpperCase();
    if (!existing[id]) return id;
  }
  return 'R' + Date.now().toString(36).slice(-5).toUpperCase();
}
function sanitizeLive(url) {
  if (!url) return null;
  const s = String(url).slice(0, 200).trim();
  const tw = s.match(/(?:twitch\.tv\/)?([a-zA-Z0-9_]{3,25})$/);
  if (/twitch\.tv\//.test(s) || (!/^https?:/i.test(s) && /^[a-zA-Z0-9_]{3,25}$/.test(s))) return { type:'twitch', id:(tw?tw[1]:s).toLowerCase() };
  const yt = s.match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return { type:'youtube', id: yt[1] };
  return null;
}

async function askAI(entityName, history, userMessage) {
  const system = 'Você é ' + entityName + ', uma criatura misteriosa de um jogo de terror analógico. Fala português do Brasil. Responda em frases curtas (no máximo 2 linhas), com tom enigmático e assustador. Nunca saia do personagem.';
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer ' + GROQ_KEY },
      body: JSON.stringify({ model:'llama-3.3-70b-versatile', messages:[{role:'system',content:system},...history,{role:'user',content:userMessage}], temperature:0.9, max_tokens:120 }),
    });
    if (!r.ok) return '...';
    const j = await r.json();
    return (j.choices?.[0]?.message?.content || '...').trim();
  } catch { return '...'; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') { const s = await getState(); return res.status(200).json(s); }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { action, nick: rawNick, hwid: rawHwid, roomId: rawRoomId, ...rest } = body;
    const s = await getState();
    const nick = rawNick ? String(rawNick).slice(0, NICK_MAX) : null;
    const hwid = rawHwid ? String(rawHwid).slice(0, 32) : null;
    const roomId = rawRoomId ? String(rawRoomId).toUpperCase().slice(0, 8) : null;
    const isMain = nick === MAIN_ADMIN;

    // ===== LISTAR SALAS =====
    if (action === 'listRooms') {
      const list = Object.values(s.rooms).map(r => ({
        id:r.id, name:r.name, host:r.host,
        players:Object.keys(r.players).length, maxPlayers:r.maxPlayers,
        hasLive:!!r.live, live:r.live||null, gameMode: r.gameMode || 'normal',
      })).sort((a,b) => b.players - a.players);
      return res.status(200).json({ ok:true, rooms:list });
    }
// ===== MANDAR MENSAGEM PARA AMIGO =====
if (action === 'sendFriendMsg') {
  if (!nick) return res.status(200).json({ ok:false, reason:'semNick' });
  const to = String(rest.to || '').trim();
  const text = String(rest.text || '').slice(0, 200).trim();
  if (!to || !text) return res.status(200).json({ ok:false });
  if (!s.friendMsgs) s.friendMsgs = {};
  const pair = [nick, to].sort().join('|');
  if (!s.friendMsgs[pair]) s.friendMsgs[pair] = [];
  s.friendMsgs[pair].push({ from: nick, to, text, t: Date.now() });
  if (s.friendMsgs[pair].length > 200) s.friendMsgs[pair].shift();
  await save(s);
  return res.status(200).json({ ok:true });
}

// ===== PEGAR MENSAGENS DE AMIGO =====
if (action === 'getFriendMsgs') {
  if (!nick) return res.status(200).json({ ok:false, reason:'semNick' });
  const to = String(rest.to || '').trim();
  if (!to) return res.status(200).json({ ok:false });
  const pair = [nick, to].sort().join('|');
  const msgs = (s.friendMsgs && s.friendMsgs[pair]) || [];
  return res.status(200).json({ ok:true, msgs });
}
    
    // ===== CHECAR SE UM NICK ESTA ONLINE =====
    if (action === 'checkOnline') {
      const target = String(rest.nick || '').trim();
      if (!target) return res.status(200).json({ ok:false, reason:'semNick' });
      let found = null;
      for (const rid in s.rooms) {
        const r = s.rooms[rid];
        if (r.players[target]) {
          found = { roomId: rid, roomName: r.name, mode: r.players[target].mode };
          break;
        }
      }
      if (found) return res.status(200).json({ ok:true, online:true, room: found });
      return res.status(200).json({ ok:true, online:false });
    }

    // ===== REPORTAR VITORIA =====
    if (action === 'reportWin') {
      if (!nick) return res.status(200).json({ ok:false, reason:'semNick' });
      if (!s.leaderboard[nick]) s.leaderboard[nick] = { wins:0, last:0 };
      s.leaderboard[nick].wins++;
      s.leaderboard[nick].last = Date.now();
      await save(s);
      return res.status(200).json({ ok:true, wins: s.leaderboard[nick].wins });
    }

    // ===== VER PLACAR =====
    if (action === 'getLeaderboard') {
      const lb = s.leaderboard || {};
      const list = Object.keys(lb).map(n => ({ nick:n, wins:lb[n].wins, last:lb[n].last })).sort((a,b) => b.wins - a.wins).slice(0, 20);
      return res.status(200).json({ ok:true, list });
    }

    // ===== BUILD SALVAR/CARREGAR =====
    if (action === 'saveBuild') { if (!nick) return res.status(200).json({ ok:false }); s.builds[nick] = rest.build; await save(s); return res.status(200).json({ ok:true }); }
    if (action === 'loadBuild') { if (!nick) return res.status(200).json({ ok:false }); return res.status(200).json({ ok:true, build: s.builds[nick] || null }); }

    // ===== TOOLBOX =====
    if (action === 'publishBuild') {
      if (!nick) return res.status(200).json({ ok:false });
      const name = String(rest.name||'Sem nome').slice(0,40).trim();
      const desc = String(rest.desc||'').slice(0,200).trim();
      const type = rest.type === 'character' ? 'character' : 'model';
      if (!name || !rest.build || !rest.build.parts || !rest.build.parts.length) return res.status(200).json({ ok:false, reason:'invalido' });
      const id = 'b' + Math.random().toString(36).slice(2,8);
      s.toolbox.unshift({ id, author:nick, name, desc, type, parts:rest.build.parts.length, build:rest.build, ts:Date.now() });
      if (s.toolbox.length > 200) s.toolbox.length = 200;
      await save(s);
      return res.status(200).json({ ok:true, id });
    }
    if (action === 'listToolbox') {
      const list = s.toolbox.map(b => ({ id:b.id, author:b.author, name:b.name, desc:b.desc, type:b.type, parts:b.parts, ts:b.ts }));
      return res.status(200).json({ ok:true, list });
    }
    if (action === 'getToolbox') {
      const b = s.toolbox.find(x => x.id === rest.id);
      if (!b) return res.status(200).json({ ok:false });
      return res.status(200).json({ ok:true, build:b.build, meta:{name:b.name,author:b.author,type:b.type} });
    }

    // ===== CRIAR SALA =====
    if (action === 'createRoom') {
      if (!hwid) return res.status(200).json({ ok:false, reason:'semHWID' });
      if (!nick || !NICK_REGEX.test(nick)) return res.status(200).json({ ok:false, reason:'nickInvalido' });
      if (s.bans[nick] || s.bans['hwid:' + hwid]) return res.status(200).json({ ok:false, reason:'banido' });
      const roomName = String(rest.roomName || (nick + "'s room")).slice(0, 24);
      const maxPlayers = Math.max(2, Math.min(200, +rest.maxPlayers || 20));
      const live = sanitizeLive(rest.liveUrl);
      const mode = ['hardcore','normal','pacific'].includes(rest.gameMode) ? rest.gameMode : 'normal';
      const id = newRoomId(s.rooms);
      const admins = isMain ? [MAIN_ADMIN] : [];
      s.rooms[id] = { id, name:roomName, host:nick, maxPlayers, live, gameMode:mode, createdAt:Date.now(), admins, players:{}, entities:[], chat:[], turnNick:null };
      s.rooms[id].players[nick] = { nick, isAdmin:isMain, mode:'solo', x:40, y:120, face:1, hwid, lastSeen:Date.now(), avatar:sanitizeAvatar(rest.avatar) };
      s.hwidIndex[hwid] = { roomId:id, nick };
      await save(s);
      return res.status(200).json({ ok:true, roomId:id, nick, room:s.rooms[id] });
    }

    // ===== ENTRAR EM SALA =====
    if (action === 'joinRoom') {
      if (!hwid) return res.status(200).json({ ok:false, reason:'semHWID' });
      if (!nick || !NICK_REGEX.test(nick)) return res.status(200).json({ ok:false, reason:'nickInvalido' });
      if (s.bans[nick] || s.bans['hwid:' + hwid]) return res.status(200).json({ ok:false, reason:'banido' });
      const r = s.rooms[roomId];
      if (!r) return res.status(200).json({ ok:false, reason:'salaNaoExiste' });
      const sameDev = r.players[nick] && r.players[nick].hwid === hwid;
      const count = Object.keys(r.players).length;
      if (!sameDev && count >= r.maxPlayers) return res.status(200).json({ ok:false, reason:'salaLotada' });
      const existing = r.players[nick];
      if (existing && existing.hwid && existing.hwid !== hwid) return res.status(200).json({ ok:false, reason:'nickEmUso' });
      if (isMain && !r.admins.includes(MAIN_ADMIN)) r.admins.push(MAIN_ADMIN);
      const isAdmin = r.admins.includes(nick);
      r.players[nick] = { nick, isAdmin, mode: existing ? existing.mode : 'solo', x: existing?existing.x:40, y: existing?existing.y:120, face:1, hwid, lastSeen:Date.now(), avatar:sanitizeAvatar(rest.avatar || (existing && existing.avatar)) };
      s.hwidIndex[hwid] = { roomId, nick };
      if (!r.turnNick) { const mn = Object.keys(r.players).filter(n => r.players[n].mode === 'multi'); r.turnNick = mn[0] || null; }
      await save(s);
      return res.status(200).json({ ok:true, roomId, nick, room:r });
    }

    // ===== SAIR DA SALA =====
    if (action === 'leaveRoom') {
      const r = s.rooms[roomId];
      if (r && nick && r.players[nick] && r.players[nick].hwid === hwid) {
        delete r.players[nick];
        const mn = Object.keys(r.players).filter(n => r.players[n].mode === 'multi');
        if (!mn.includes(r.turnNick)) r.turnNick = mn[0] || null;
        await save(s);
      }
      return res.status(200).json({ ok:true });
    }

    // ===== PRECISA ESTAR NA SALA =====
    const r = s.rooms[roomId];
    if (!r) return res.status(200).json({ ok:false, reason:'salaNaoExiste' });
    if (!nick || !r.players[nick] || r.players[nick].hwid !== hwid) return res.status(200).json({ ok:false, reason:'naoLogado' });
    const me = r.players[nick];
    me.lastSeen = Date.now();

    if (action === 'setAvatar') { me.avatar = sanitizeAvatar(rest.avatar); await save(s); return res.status(200).json({ ok:true, avatar:me.avatar }); }
    if (action === 'setMode') {
      me.mode = rest.mode === 'multi' ? 'multi' : 'solo';
      const mn = Object.keys(r.players).filter(n => r.players[n].mode === 'multi');
      if (!mn.includes(r.turnNick)) r.turnNick = mn[0] || null;
      await save(s);
      return res.status(200).json({ ok:true });
    }
    if (action === 'move') { me.x = +rest.x || 0; me.y = +rest.y || 0; me.face = +rest.face || 1; await save(s); return res.status(200).json({ ok:true }); }

    if (action === 'chat') {
      if (me.mode === 'multi' && r.turnNick && r.turnNick !== nick) return res.status(200).json({ ok:false, reason:'naoEhSuaVez', turn:r.turnNick });
      const text = String(rest.text||'').slice(0,240).trim();
      if (!text) return res.status(200).json({ ok:false });
      r.chat.push({ type:'player', nick, text, t:Date.now() });
      if (r.chat.length > 80) r.chat.shift();
      if (me.mode === 'multi') {
        const mn = Object.keys(r.players).filter(n => r.players[n].mode === 'multi');
        const i = mn.indexOf(nick);
        r.turnNick = mn.length <= 1 ? nick : mn[(i+1) % mn.length];
      }
      await save(s);
      return res.status(200).json({ ok:true, turn:r.turnNick });
    }

    if (action === 'entityTalk') {
      const e = r.entities.find(x => x.id === rest.id);
      if (!e) return res.status(200).json({ ok:false });
      const text = String(rest.text||'').slice(0,200).trim();
      if (!text) return res.status(200).json({ ok:false });
      r.chat.push({ type:'player', nick, text, t:Date.now(), toEntity:e.id, toName:e.name });
      if (r.chat.length > 80) r.chat.shift();
      const hist = e.hist || [];
      const reply = await askAI(e.name, hist, nick + ': ' + text);
      let out = reply, scare = false;
      if (out.startsWith('!!JUMPSCARE!!')) { scare = true; out = out.replace('!!JUMPSCARE!!','').trim(); }
      e.hist = hist.concat([{role:'user',content:nick+': '+text},{role:'assistant',content:out}]).slice(-20);
      r.chat.push({ type:'entity', id:e.id, nick:e.name, text:out, scare, t:Date.now() });
      if (r.chat.length > 80) r.chat.shift();
      await save(s);
      return res.status(200).json({ ok:true, text:out, scare });
    }

    // ===== ADMIN =====
    if (!me.isAdmin) return res.status(200).json({ ok:false, reason:'notAdmin' });

    if (action === 'spawnEntity') {
      const kind = ['goo','eye','shadow'].includes(rest.kind) ? rest.kind : 'goo';
      const name = String(rest.name || 'SOMBRA').slice(0,18).toUpperCase();
      r.entities.push({ id:'e'+Math.random().toString(36).slice(2,8), name, kind, x:+rest.x||220, y:+rest.y||120, hist:[] });
      await save(s);
      return res.status(200).json({ ok:true });
    }
    if (action === 'removeEntity') { r.entities = r.entities.filter(e => e.id !== rest.id); await save(s); return res.status(200).json({ ok:true }); }
    if (action === 'giveAdmin') {
      const t = String(rest.nick||'').trim();
      if (!r.players[t]) return res.status(200).json({ ok:false, reason:'nickNaoEncontrado' });
      if (!r.admins.includes(t)) r.admins.push(t);
      r.players[t].isAdmin = true;
      r.chat.push({ type:'sys', nick:'SISTEMA', text:t+' agora e admin.', t:Date.now() });
      await save(s);
      return res.status(200).json({ ok:true });
    }
    if (action === 'globalEvent') { r.chat.push({ type:'sys', nick:'GLOBAL', text:'Evento: '+String(rest.event||'').slice(0,120), t:Date.now() }); await save(s); return res.status(200).json({ ok:true }); }
    if (action === 'broadcast') { r.chat.push({ type:'sys', nick:'ADMIN', text:String(rest.text||'').slice(0,200), t:Date.now() }); await save(s); return res.status(200).json({ ok:true }); }
    if (action === 'tacoRain') { r.chat.push({ type:'sys', nick:'TACO', text:'CHUVA DE TACO!!!', t:Date.now() }); r.tacoRain = Date.now(); await save(s); return res.status(200).json({ ok:true }); }
    if (action === 'giveWeapon') {
      const t = String(rest.nick || 'TODOS').trim();
      if (t === 'TODOS') { for (const n in r.players) r.players[n].hasWeapon = true; }
      else { if (!r.players[t]) return res.status(200).json({ ok:false }); r.players[t].hasWeapon = true; }
      r.chat.push({ type:'sys', nick:'WEAPON', text:t+' ganhou uma arma.', t:Date.now() });
      await save(s);
      return res.status(200).json({ ok:true });
    }
    if (action === 'freezePlayer') {
      const t = String(rest.nick||'').trim();
      if (!r.players[t]) return res.status(200).json({ ok:false });
      r.players[t].frozen = !r.players[t].frozen;
      r.chat.push({ type:'sys', nick:'FREEZE', text:t+(r.players[t].frozen?' congelado.':' descongelado.'), t:Date.now() });
      await save(s);
      return res.status(200).json({ ok:true, frozen:r.players[t].frozen });
    }
    if (action === 'banPlayer') {
      const t = String(rest.nick||'').trim();
      const target = r.players[t];
      if (!target) return res.status(200).json({ ok:false, reason:'nickNaoEncontrado' });
      const thwid = target.hwid;
      s.bans[t] = { hwid:thwid, by:nick, ts:Date.now() };
      if (thwid) s.bans['hwid:' + thwid] = { nick:t, by:nick, ts:Date.now() };
      delete r.players[t];
      r.chat.push({ type:'sys', nick:'BAN', text:t+' foi banido.', t:Date.now() });
      await save(s);
      return res.status(200).json({ ok:true });
    }
    if (action === 'unbanPlayer') {
      const t = String(rest.nick||'').trim();
      const b = s.bans[t];
      if (b && b.hwid) delete s.bans['hwid:' + b.hwid];
      delete s.bans[t];
      r.chat.push({ type:'sys', nick:'UNBAN', text:t+' foi desbanido.', t:Date.now() });
      await save(s);
      return res.status(200).json({ ok:true });
    }
    if (action === 'setLive') { r.live = sanitizeLive(rest.liveUrl); await save(s); return res.status(200).json({ ok:true, live:r.live }); }

    return res.status(200).json({ ok:false, reason:'acaoDesconhecida' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok:false, error:String(e) });
  }
}
