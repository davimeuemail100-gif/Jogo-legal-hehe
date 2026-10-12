(function(){
'use strict';
const $=(t,p)=>{const e=document.createElement(t);if(p)for(const k in p)e.setAttribute(k,p[k]);return e;};
const NICK_MAX=24;
const ADMIN_NICK='DeRaminWrick';
const DEFAULT_AVATAR={skin:'#ffffff',hair:'RAINBOW',shirt:'#8b5a2b',pants:'#1a1a1a',shoes:'#ff8a2a',eyes:'#8a2be2'};
const AVATAR_OPTS={
  skin:['#ffffff','#ffe1cf','#f0bfa6','#c68642','#8d5524','#4a2f20','#a0e0c0','#b0b0ff'],
  hair:['RAINBOW','#2a1a14','#7a4a24','#c19a6b','#ffcc00','#ff3347','#b8ff2e','#8a2be2','#00d4ff'],
  shirt:['#8b5a2b','#b8ff2e','#ff3347','#508cff','#ffd84a','#a050ff','#ff8a2a','#2a2a2a','#ffffff'],
  pants:['#1a1a1a','#3d4f86','#5a3a2a','#ff5a7a','#8a8a9a','#ffffff'],
  shoes:['#ff8a2a','#1a1a1a','#ffffff','#c0203a','#b8ff2e','#508cff'],
  eyes:['#8a2be2','#1a1a1a','#00d4ff','#ff3347','#b8ff2e','#ffd84a'],
};
const MODES={
  hardcore:{name:'HARDCORE',color:'#ff3347',desc:'morrer reinicia'},
  normal:{name:'NORMAL',color:'#508cff',desc:'jogo normal'},
  pacific:{name:'PACIFICO',color:'#4ac24a',desc:'nunca morre'},
};
const MP={
  nick:null,isAdmin:false,mode:null,
  roomId:null,room:null,lastV:-1,
  remote:{},entities:{},avatar:{...DEFAULT_AVATAR},
  started:false,overlay:null,
  friends:{},friendChat:{},friendOnline:{},
};

const s=document.createElement('style');
s.textContent=`
#mpo{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(4,2,8,.97);z-index:2147483000;font-family:monospace;color:#eee;overflow-y:auto;padding:20px;box-sizing:border-box}
#mpo .c{background:#141018;border:2px solid #8a2be2;border-radius:14px;padding:18px;width:min(94vw,440px);box-shadow:0 0 30px rgba(138,43,226,.6);max-height:92vh;overflow-y:auto;box-sizing:border-box}
#mpo h1{font-size:16px;margin:0 0 12px;color:#b8ff2e;letter-spacing:2px;text-align:center}
#mpo p{font-size:12px;color:#b0a8c0;margin:4px 0;text-align:center}
#mpo input,#mpo select{width:100%;padding:9px;margin:5px 0;background:#0d0a12;color:#fff;border:1px solid #4a2a6a;border-radius:8px;font-family:inherit;font-size:13px;box-sizing:border-box}
#mpo button{width:100%;padding:9px;margin:4px 0;background:#8a2be2;color:#fff;border:none;border-radius:8px;font-family:inherit;font-size:12px;cursor:pointer;font-weight:bold}
#mpo button:hover{background:#a04ef0}
#mpo button.sec{background:#333}
#mpo button.studio{background:#4ac24a;color:#0a1a0a}
#mpo .err{color:#ff5570;font-size:12px;text-align:center;min-height:16px;margin-top:6px}
#mpo .room{background:#0d0a12;border:1px solid #4a2a6a;border-radius:8px;padding:8px;margin:5px 0;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:6px}
#mpo .room:hover{background:#1a0f26;border-color:#8a2be2}
#mpo .room .info{text-align:left;flex:1;min-width:0}
#mpo .room .nm{color:#b8ff2e;font-weight:bold;font-size:13px}
#mpo .room .meta{font-size:10px;color:#8a8a9a;margin-top:2px}
#mpo .room .cnt{background:#8a2be2;color:#fff;border-radius:6px;padding:4px 8px;font-size:11px;font-weight:bold}
#mpo .frItem{background:#0d0a12;border:1px solid #4a2a6a;border-radius:8px;padding:8px;margin:5px 0;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:6px}
#mpo .frItem:hover{background:#1a0f26;border-color:#8a2be2}
#mpo .frItem .fN{color:#b8ff2e;font-weight:bold;font-size:13px}
#mpo .frItem .fS{font-size:10px;color:#8a8a9a;margin-top:2px}
#mpo .frItem .dot{width:10px;height:10px;border-radius:50%;background:#666}
#mpo .frItem .dot.on{background:#4ac24a;box-shadow:0 0 6px #4ac24a}
#mpo .frItem .dot.off{background:#666}
.modeRow{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:6px 0}
.modeBox{padding:8px;border-radius:8px;border:2px solid #333;background:#0d0a12;color:#eee;text-align:center;cursor:pointer;font-size:10px}
.modeBox.on{background:#222;color:#fff}
.modeBox .mN{font-weight:bold;font-size:11px;margin-bottom:3px}
.modeBox .mD{font-size:9px;color:#8a8a9a}
.avPrev{width:100%;height:100px;display:flex;align-items:center;justify-content:center;background:#0d0a12;border-radius:10px;margin-bottom:10px}
.avPrev canvas{image-rendering:pixelated;width:72px;height:96px}
.avRow{display:flex;align-items:center;gap:8px;margin:5px 0}
.avRow>span{font-size:10px;color:#b0a8c0;width:56px;text-align:right;flex-shrink:0}
.avRow .sw{flex:1;display:flex;gap:4px;flex-wrap:wrap}
.avRow .sw button{width:20px;height:20px;padding:0;margin:0;border-radius:4px;border:2px solid #333;cursor:pointer;background:#000}
.avRow .sw button.sel{border-color:#b8ff2e;box-shadow:0 0 6px #b8ff2e}
.avRow .sw button[data-c="RAINBOW"]{background:linear-gradient(90deg,#ff0000,#ffcc00,#00ff00,#00d4ff,#8a2be2,#ff0000)}
.skinGrid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0}
.skinCard{padding:8px;border-radius:8px;border:2px solid #333;background:#0d0a12;text-align:center;cursor:pointer}
.skinCard.on{border-color:#b8ff2e;box-shadow:0 0 8px #b8ff2e}
.skinCard.locked{opacity:0.35;cursor:not-allowed}
.skinCard .sn{font-weight:bold;font-size:12px;margin-bottom:2px}
.skinCard .sd{font-size:9px;color:#8a8a9a}

#mpHud{position:fixed;top:6px;left:6px;background:rgba(10,8,15,.85);border:1px solid #4a2a6a;border-radius:6px;padding:4px 8px;font-family:monospace;font-size:10px;color:#ccc;z-index:999996;line-height:1.4;max-width:60vw;pointer-events:none}
#mpHud b{color:#b8ff2e}
#mpHud .adm{color:#ffd84a}
#mpHud .turn{color:#b8ff2e;font-weight:bold}
#mpHud .mH{color:#ff3347}#mpHud .mN{color:#508cff}#mpHud .mP{color:#4ac24a}

#mpMenuBtn{position:fixed;top:6px;right:6px;width:38px;height:38px;background:rgba(20,16,26,.92);color:#fff;border:2px solid #508cff;border-radius:8px;font-size:20px;cursor:pointer;z-index:999997;display:flex;align-items:center;justify-content:center;touch-action:manipulation}
#mpMenuBtn:active{background:#508cff;color:#000}
#mpMenu{position:fixed;top:50px;right:6px;background:rgba(20,16,26,.98);border:2px solid #508cff;border-radius:10px;padding:6px;z-index:999997;width:220px;box-shadow:0 4px 20px rgba(0,0,0,.6);display:none;flex-direction:column;gap:4px}
#mpMenu.open{display:flex}
#mpMenu button{width:100%;padding:8px 10px;background:#1e1e2a;color:#fff;border:1px solid #3a3a4a;border-radius:6px;font-family:monospace;font-size:11px;font-weight:bold;cursor:pointer;text-align:left;touch-action:manipulation}
#mpMenu button:active{background:#508cff;color:#000}
#mpMenu button.danger{background:#402030;border-color:#803040;color:#ff8a8a}
#mpMenu button.admin{background:#4a3a10;border-color:#a08020;color:#ffd84a}

#mpChat{position:fixed;top:50px;right:6px;width:min(90vw,340px);max-height:50vh;overflow-y:auto;background:rgba(10,8,15,.96);border:2px solid #4a2a6a;border-radius:10px;padding:8px 10px;font-family:monospace;font-size:11px;color:#ccc;z-index:999998;display:none;flex-direction:column;gap:4px;box-shadow:0 4px 20px rgba(0,0,0,.6)}
#mpChat.open{display:flex}
#mpChat .m{margin:1px 0;word-wrap:break-word;line-height:1.35}
#mpChat .me{color:#b8ff2e}
#mpChat .sys{color:#8a8a9a;font-style:italic}
#mpChat .ent{color:#ff6a9c;text-shadow:0 0 4px #ff006a}
#mpChatInputWrap{margin-top:6px;display:flex;gap:4px}
#mpChatInputWrap input{flex:1;padding:8px;background:#0d0a12;color:#fff;border:1px solid #4a2a6a;border-radius:6px;font-family:monospace;font-size:12px;min-width:0}
#mpChatInputWrap button{padding:8px 12px;background:#8a2be2;color:#fff;border:none;border-radius:6px;font-family:monospace;font-weight:bold;cursor:pointer;font-size:12px}
#mpChatInputWrap button.closeChat{background:#402030}

#mpEntInput{position:fixed;left:50%;bottom:80px;transform:translateX(-50%);width:min(90vw,420px);background:rgba(10,5,15,.98);border:2px solid #ff6a9c;border-radius:12px;padding:10px;z-index:2147483002;display:none;flex-direction:column;gap:6px;box-shadow:0 0 30px rgba(255,106,156,.4);font-family:monospace}
#mpEntInput.open{display:flex}
#mpEntInput .who{color:#ff6a9c;font-size:12px;font-weight:bold}
#mpEntInput .line{display:flex;gap:6px}
#mpEntInput input{flex:1;padding:10px;background:#0d0a12;color:#fff;border:1px solid #4a2a6a;border-radius:8px;font-family:monospace;font-size:13px;min-width:0}
#mpEntInput button{padding:10px 14px;background:#ff6a9c;color:#1a0510;border:none;border-radius:8px;font-family:monospace;font-weight:bold;cursor:pointer}
#mpEntInput button.cancel{background:#402030;color:#ff8a8a}
#mpEntReply{color:#fff;font-size:12px;line-height:1.4;padding:6px;background:rgba(255,106,156,.1);border-radius:6px;border-left:3px solid #ff6a9c;display:none}
#mpEntReply.show{display:block}

#mpOverlay{position:fixed;pointer-events:none;z-index:999994;image-rendering:pixelated;image-rendering:crisp-edges}

.mpEnt{position:fixed;transform:translate(-50%,-100%);text-align:center;font-family:monospace;font-size:9px;font-weight:bold;color:#ff6a9c;text-shadow:0 0 5px #ff006a;z-index:999995;cursor:pointer;user-select:none;touch-action:manipulation}
.mpEnt .blob{width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 40% 35%, #2a0f3a, #050208 70%);border:2px solid #3a1f4a;margin:0 auto 2px;animation:mpB 2s ease-in-out infinite}
.mpEnt.eye .blob{background:radial-gradient(circle at 50% 50%, #ff3347 8%, #1a0508 70%)}
.mpEnt.shadow .blob{background:#0a0508;border-color:#000}
@keyframes mpB{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}

#mpAdmBtn{position:fixed;top:6px;left:50%;transform:translateX(-50%);background:#ffd84a;color:#1a1a1a;border:none;padding:6px 14px;border-radius:8px;font-family:monospace;font-weight:bold;cursor:pointer;z-index:999999;font-size:12px}
#mpAdm{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:min(94vw,440px);max-height:86vh;overflow-y:auto;background:#14101a;border:2px solid #ffd84a;border-radius:12px;padding:14px;color:#eee;font-family:monospace;font-size:12px;z-index:2147483001;box-sizing:border-box}
#mpAdm h2{margin:0 0 10px;color:#ffd84a;font-size:13px;text-align:center}
#mpAdm h3{margin:12px 0 6px;color:#b8ff2e;font-size:11px;border-bottom:1px solid #333;padding-bottom:3px}
#mpAdm input,#mpAdm select{width:100%;padding:6px;margin:3px 0;background:#0d0a12;color:#fff;border:1px solid #4a2a6a;border-radius:6px;box-sizing:border-box;font-family:inherit;font-size:11px}
#mpAdm button{width:100%;padding:7px;margin:3px 0;background:#8a2be2;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;font-family:inherit;font-size:11px}
#mpAdm .x{position:absolute;top:8px;right:12px;width:auto;padding:3px 10px;background:#402030}
#mpAdm .row{display:grid;grid-template-columns:1fr auto;gap:4px;align-items:center;margin:3px 0}
#mpAdm .st{color:#0f0;font-size:10px;min-height:14px;text-align:center;margin-top:6px}
#mpAdm .danger{background:#a02030}
#mpAdm .ok{background:#4ac24a;color:#0a1a0a}

#mpJump{position:fixed;inset:0;background:#000;z-index:2147483647;display:flex;align-items:center;justify-content:center;color:#ff2030;font-family:monospace;font-size:90px;font-weight:bold;pointer-events:none;animation:mpJ .45s ease-out}
@keyframes mpJ{0%{opacity:0;transform:scale(.5)}30%{opacity:1;transform:scale(1.2)}100%{opacity:0;transform:scale(1)}}
`;
document.head.appendChild(s);

async function getHWID(){
  let id=localStorage.getItem('wrick_hwid');
  if(id)return id;
  const parts=[navigator.userAgent||'',navigator.language||'',(screen.width||0)+'x'+(screen.height||0),screen.colorDepth||0,new Date().getTimezoneOffset(),navigator.hardwareConcurrency||0,navigator.platform||''];
  try{const c=document.createElement('canvas');const x=c.getContext('2d');x.textBaseline='top';x.font='14px Arial';x.fillStyle='#f60';x.fillRect(10,10,40,20);x.fillStyle='#069';x.fillText('wrick-fp-2024',2,2);parts.push(c.toDataURL().slice(-80));}catch(e){}
  const str=parts.join('|');
  let h=0;
  for(let i=0;i<str.length;i++)h=((h<<5)-h+str.charCodeAt(i))|0;
  id='h'+Math.abs(h).toString(36);
  localStorage.setItem('wrick_hwid',id);
  return id;
}

let MY_HWID=null;
async function api(action,data){
  if(!MY_HWID)MY_HWID=await getHWID();
  const body=Object.assign({action,nick:MP.nick,hwid:MY_HWID,roomId:MP.roomId},data||{});
  const r=await fetch('/api/game',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  return r.json();
}
const getState=async()=>(await fetch('/api/game')).json();

function loadAvatar(){
  try{
    const raw=localStorage.getItem('wrick_avatar');
    if(raw)MP.avatar={...DEFAULT_AVATAR,...JSON.parse(raw)};
    const n=localStorage.getItem('wrick_nick');
    if(n)MP.nick=n;
    const f=localStorage.getItem('wrick_friends');
    if(f)MP.friends=JSON.parse(f);
    const fc=localStorage.getItem('wrick_friendchat');
    if(fc)MP.friendChat=JSON.parse(fc);
  }catch(e){}
}
function saveAvatar(){try{localStorage.setItem('wrick_avatar',JSON.stringify(MP.avatar));}catch(e){}}
function saveFriends(){try{localStorage.setItem('wrick_friends',JSON.stringify(MP.friends));}catch(e){}}
function saveFriendChat(){try{localStorage.setItem('wrick_friendchat',JSON.stringify(MP.friendChat));}catch(e){}}

function shadeLocal(hex,amt){
  const n=parseInt(hex.slice(1),16);
  let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  const f=c=>Math.round(amt<0?c*(1+amt):c+(255-c)*amt);
  r=f(r);g=f(g);b=f(b);
  return'#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);
}

function applyAvatar(a){
  MP.avatar={...MP.avatar,...a};
  saveAvatar();
  if(typeof SPRITE_PALETTE==='undefined'||typeof Sprites==='undefined')return;
  SPRITE_PALETTE.s=MP.avatar.skin;
  SPRITE_PALETTE.S=shadeLocal(MP.avatar.skin,-0.15);
  SPRITE_PALETTE.g=MP.avatar.shirt;
  SPRITE_PALETTE.G=shadeLocal(MP.avatar.shirt,-0.2);
  SPRITE_PALETTE.p=MP.avatar.pants;
  SPRITE_PALETTE.P=shadeLocal(MP.avatar.pants,-0.25);
  SPRITE_PALETTE.t=MP.avatar.shoes;
  SPRITE_PALETTE.e=MP.avatar.eyes;
  const rainbow=MP.avatar.hair==='RAINBOW';
  window.WRICK_HAIR_RAINBOW=rainbow;
  if(!rainbow){
    SPRITE_PALETTE.h=MP.avatar.hair;
    SPRITE_PALETTE.H=shadeLocal(MP.avatar.hair,-0.25);
  }
  Sprites.cache={};
}

function previewCanvas(a){
  const c=document.createElement('canvas');
  c.width=24;c.height=32;
  const x=c.getContext('2d');
  const hair=a.hair==='RAINBOW'?'#ff0000':a.hair;
  x.fillStyle='#000';x.fillRect(4,0,16,18);
  x.fillStyle=hair;x.fillRect(5,1,14,7);
  x.fillStyle=a.skin;x.fillRect(5,6,14,11);
  x.fillStyle=a.eyes;x.fillRect(8,10,2,3);x.fillRect(14,10,2,3);
  x.fillStyle=a.shirt;x.fillRect(4,18,16,8);
  x.fillStyle=a.skin;x.fillRect(2,19,2,6);x.fillRect(20,19,2,6);
  x.fillStyle=a.pants;x.fillRect(6,26,4,4);x.fillRect(14,26,4,4);
  x.fillStyle=a.shoes;x.fillRect(5,30,6,2);x.fillRect(13,30,6,2);
  return c;
}

function closeAll(){document.querySelectorAll('#mpo').forEach(x=>x.remove());}

function loginScreen(){
  closeAll();
  const o=$('div',{id:'mpo'});
  o.innerHTML=`<div class="c"><h1>WRICK ONLINE</h1>
<p>escolha um nick unico (2-${NICK_MAX} letras)</p>
<input id="mpoNick" maxlength="${NICK_MAX}" placeholder="seu nick" autocomplete="off">
<button id="mpoAv" class="sec">Escolher avatar</button>
<div class="err" id="mpoErr"></div>
<button id="mpoOk">ENTRAR</button></div>`;
  document.body.appendChild(o);
  const inp=o.querySelector('#mpoNick'),err=o.querySelector('#mpoErr');
  inp.value=MP.nick||'';
  setTimeout(()=>inp.focus(),100);
  o.querySelector('#mpoAv').onclick=()=>avatarScreen(()=>loginScreen());
  const tentar=()=>{
    const nick=inp.value.trim();
    if(!nick||nick.length<2){err.textContent='⚠ nick muito curto';return;}
    if(nick.length>NICK_MAX){err.textContent='⚠ nick muito longo';return;}
    if(!/^[\wÀ-ÿ\-_. ]{2,24}$/.test(nick)){err.textContent='⚠ invalido';return;}
    MP.nick=nick;
    try{localStorage.setItem('wrick_nick',nick);}catch(e){}
    closeAll();
    lobbyScreen();
  };
  o.querySelector('#mpoOk').onclick=tentar;
  inp.onkeydown=e=>{if(e.key==='Enter')tentar();};
}

function avatarScreen(back){
  closeAll();
  const o=$('div',{id:'mpo'});
  o.innerHTML=`<div class="c">
<h1>SEU PERSONAGEM</h1>
<div class="avPrev" id="avPrev"></div>
<div class="avRow"><span>PELE</span><div class="sw" data-k="skin"></div></div>
<div class="avRow"><span>CABELO</span><div class="sw" data-k="hair"></div></div>
<div class="avRow"><span>CAMISA</span><div class="sw" data-k="shirt"></div></div>
<div class="avRow"><span>CALCA</span><div class="sw" data-k="pants"></div></div>
<div class="avRow"><span>TENIS</span><div class="sw" data-k="shoes"></div></div>
<div class="avRow"><span>OLHOS</span><div class="sw" data-k="eyes"></div></div>
<h1 style="font-size:13px;margin-top:14px;color:#a050ff">SKINS</h1>
<div class="skinGrid" id="skinGrid"></div>
<button id="avOk">PRONTO</button>
<button id="avReset" class="sec">RESETAR</button>
</div>`;
  document.body.appendChild(o);
  const prev=o.querySelector('#avPrev');
  const renderPrev=()=>{prev.innerHTML='';prev.appendChild(previewCanvas(MP.avatar));};
  const renderSw=()=>{
    for(const k in AVATAR_OPTS){
      const box=o.querySelector(`.sw[data-k="${k}"]`);
      box.innerHTML='';
      for(const c of AVATAR_OPTS[k]){
        const b=$('button',{'data-c':c});
        if(c!=='RAINBOW')b.style.background=c;
        if(MP.avatar[k]===c)b.classList.add('sel');
        b.onclick=()=>{MP.avatar[k]=c;saveAvatar();renderSw();renderPrev();};
        box.appendChild(b);
      }
    }
  };
  const renderSkins=()=>{
    const grid=o.querySelector('#skinGrid');
    grid.innerHTML='';
    const skins=[
      {id:'default',name:'Padrao',desc:'Original',unlocked:true},
      {id:'eri',name:'Eri',desc:'Ovo amigo',unlocked:localStorage.getItem('skin_eri')==='1'},
      {id:'zoom_spider',name:'Zoom-Aranha',desc:'Heroi',unlocked:localStorage.getItem('skin_zoom')==='1'},
      {id:'torajo',name:'Torajo',desc:'Maca',unlocked:localStorage.getItem('skin_torajo')==='1'},
      {id:'sans',name:'Sans',desc:'Final ruim',unlocked:localStorage.getItem('skin_sans')==='1'},
    ];
    const cur=localStorage.getItem('wrick_skin')||'default';
    skins.forEach(sk=>{
      const card=$('div',{class:'skinCard'+(sk.unlocked?'':' locked')+(cur===sk.id?' on':'')});
      card.innerHTML=`<div class="sn">${sk.name}</div><div class="sd">${sk.unlocked?sk.desc:'Bloqueada'}</div>`;
      if(sk.unlocked)card.onclick=()=>{localStorage.setItem('wrick_skin',sk.id);renderSkins();};
      grid.appendChild(card);
    });
  };
  renderPrev();
  renderSw();
  renderSkins();
  o.querySelector('#avOk').onclick=()=>{
    applyAvatar(MP.avatar);
    closeAll();
    if(back)back();
    else if(MP.roomId){api('setAvatar',{avatar:MP.avatar});}
    else lobbyScreen();
  };
  o.querySelector('#avReset').onclick=()=>{MP.avatar={...DEFAULT_AVATAR};saveAvatar();renderSw();renderPrev();};
}

async function lobbyScreen(){
  closeAll();
  const o=$('div',{id:'mpo'});
  o.innerHTML=`<div class="c">
<h1>SALAS</h1>
<p>ola, ${MP.nick} · <span id="mpoAvA" style="color:#8a2be2;cursor:pointer;text-decoration:underline">avatar</span> · <span id="mpoFrA" style="color:#4ac24a;cursor:pointer;text-decoration:underline">amigos</span></p>
<button id="mpoStudio" class="studio">ABRIR STUDIO</button>
<button id="mpoCreate">CRIAR NOVA SALA</button>
<button id="mpoRefresh" class="sec">Atualizar lista</button>
<div id="mpoList" style="margin-top:8px"><p>carregando...</p></div>
<div class="err" id="mpoErr"></div>
</div>`;
  document.body.appendChild(o);
  o.querySelector('#mpoAvA').onclick=()=>avatarScreen(()=>lobbyScreen());
  o.querySelector('#mpoFrA').onclick=()=>friendsScreen();
  o.querySelector('#mpoStudio').onclick=()=>{window.location.href='/studio.html';};
  o.querySelector('#mpoCreate').onclick=()=>createRoomScreen();
  const listBox=o.querySelector('#mpoList'),err=o.querySelector('#mpoErr');

  async function refreshList(){
    try{
      const r=await fetch('/api/game',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'listRooms'})}).then(x=>x.json());
      if(!r.ok){listBox.innerHTML='<p>erro</p>';return;}
      if(!r.rooms.length){listBox.innerHTML='<p>nenhuma sala aberta</p>';return;}
      listBox.innerHTML='';
      r.rooms.forEach(room=>{
        const el=$('div',{class:'room'});
        const full=room.players>=room.maxPlayers;
        const mode=MODES[room.gameMode||'normal']||MODES.normal;
        el.innerHTML=`<div class="info">
<div class="nm">${room.name}</div>
<div class="meta">host: ${room.host} · <span style="color:${mode.color}">${mode.name}</span></div>
<div class="meta">codigo: <b>${room.id}</b></div>
</div>
<div class="cnt ${full?'full':''}">${room.players}/${room.maxPlayers}</div>`;
        el.onclick=()=>{if(full){err.textContent='sala lotada';return;}joinRoom(room.id);};
        listBox.appendChild(el);
      });
    }catch(e){listBox.innerHTML='<p>erro de rede</p>';}
  }
  async function joinRoom(roomId){
    err.textContent='entrando...';
    const r=await api('joinRoom',{roomId,avatar:MP.avatar});
    if(!r.ok){err.textContent='⚠ '+(r.reason||'erro');return;}
    MP.roomId=r.roomId;
    MP.room=r.room;
    closeAll();
    modeScreen();
  }
  o.querySelector('#mpoRefresh').onclick=refreshList;
  refreshList();
}

function createRoomScreen(){
  closeAll();
  const o=$('div',{id:'mpo'});
  o.innerHTML=`<div class="c">
<h1>CRIAR SALA</h1>
<input id="crName" placeholder="nome da sala" maxlength="24" value="${MP.nick}'s room">
<p style="font-size:11px;margin-top:8px">modo de jogo:</p>
<div class="modeRow" id="modeRow"></div>
<p style="font-size:11px;margin-top:8px">limite de jogadores:</p>
<input id="crMax" type="number" min="2" max="200" value="20">
<div class="err" id="crErr"></div>
<button id="crOk">CRIAR</button>
<button id="crBack" class="sec">voltar</button>
</div>`;
  document.body.appendChild(o);
  let selMode='normal';
  const modeRow=o.querySelector('#modeRow');
  const renderModes=()=>{
    modeRow.innerHTML='';
    for(const k in MODES){
      const m=MODES[k];
      const b=$('div',{class:'modeBox'+(selMode===k?' on':'')});
      b.style.borderColor=m.color;
      b.innerHTML=`<div class="mN" style="color:${m.color}">${m.name}</div><div class="mD">${m.desc}</div>`;
      b.onclick=()=>{selMode=k;renderModes();};
      modeRow.appendChild(b);
    }
  };
  renderModes();
  const err=o.querySelector('#crErr');
  o.querySelector('#crBack').onclick=()=>lobbyScreen();
  o.querySelector('#crOk').onclick=async()=>{
    const roomName=o.querySelector('#crName').value.trim()||(MP.nick+"'s room");
    const maxPlayers=Math.max(2,Math.min(200,+o.querySelector('#crMax').value||20));
    err.textContent='criando...';
    const r=await api('createRoom',{roomName,maxPlayers,avatar:MP.avatar,gameMode:selMode});
    if(!r.ok){err.textContent='⚠ '+(r.reason||'erro');return;}
    MP.roomId=r.roomId;
    MP.room=r.room;
    closeAll();
    modeScreen();
  };
}

function modeScreen(){
  closeAll();
  const o=$('div',{id:'mpo'});
  const m=MODES[MP.room.gameMode||'normal']||MODES.normal;
  o.innerHTML=`<div class="c">
<h1>SALA: ${MP.room.name}</h1>
<p>codigo: <b style="color:#b8ff2e">${MP.room.id}</b> · <span style="color:${m.color}">${m.name}</span></p>
<p style="margin-top:12px">como jogar?</p>
<button id="mpoSolo">SOZINHO</button>
<button id="mpoMulti">MULTIPLAYER</button>
<button id="mpoAvEdit" class="sec">Mudar avatar</button>
<button id="mpoExit" class="sec">Sair da sala</button>
</div>`;
  document.body.appendChild(o);
  o.querySelector('#mpoSolo').onclick=()=>{MP.mode='solo';api('setMode',{mode:'solo'});closeAll();start();};
  o.querySelector('#mpoMulti').onclick=()=>{MP.mode='multi';api('setMode',{mode:'multi'});closeAll();start();};
  o.querySelector('#mpoAvEdit').onclick=()=>avatarScreen(()=>{api('setAvatar',{avatar:MP.avatar});modeScreen();});
  o.querySelector('#mpoExit').onclick=async()=>{await api('leaveRoom');MP.roomId=null;MP.room=null;lobbyScreen();};
}

function friendsScreen(){
  closeAll();
  const o=$('div',{id:'mpo'});
  o.innerHTML=`<div class="c">
<h1>AMIGOS</h1>
<input id="frAdd" placeholder="nick do amigo" maxlength="24">
<button id="frAddBtn">ADICIONAR AMIGO</button>
<div id="frList" style="margin-top:8px"></div>
<div class="err" id="frErr"></div>
<button id="frBack" class="sec">voltar</button>
</div>`;
  document.body.appendChild(o);
  const frList=o.querySelector('#frList'),err=o.querySelector('#frErr');
  const names=Object.keys(MP.friends);

  async function render(){
    if(!names.length){frList.innerHTML='<p>voce nao tem amigos ainda</p>';return;}
    frList.innerHTML='';
    for(const n of names){
      const el=$('div',{class:'frItem'});
      const online=MP.friendOnline[n];
      el.innerHTML=`<div class="info" style="text-align:left;flex:1">
<div class="fN">${n}</div>
<div class="fS">${online?'Online':'Offline'}</div>
</div>
<div class="dot ${online?'on':'off'}"></div>`;
      el.onclick=()=>{if(!online){err.textContent='a pessoa nao esta jogando';return;}closeAll();openFriendChat(n);};
      frList.appendChild(el);
    }
    const checkAll=async()=>{
      for(const n of names){
        try{
          const r=await fetch('/api/game',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'checkOnline',nick:n})}).then(x=>x.json());
          MP.friendOnline[n]=!!(r.ok&&r.online);
        }catch(e){MP.friendOnline[n]=false;}
      }
    };
    await checkAll();
    frList.innerHTML='';
    for(const n of names){
      const el=$('div',{class:'frItem'});
      const online=MP.friendOnline[n];
      el.innerHTML=`<div class="info" style="text-align:left;flex:1">
<div class="fN">${n}</div>
<div class="fS">${online?'Online':'Offline'}</div>
</div>
<div class="dot ${online?'on':'off'}"></div>`;
      el.onclick=()=>{if(!online){err.textContent='a pessoa nao esta jogando';return;}closeAll();openFriendChat(n);};
      frList.appendChild(el);
    }
  }
  render();
  o.querySelector('#frAddBtn').onclick=async()=>{
    const n=o.querySelector('#frAdd').value.trim();
    if(!n||n===MP.nick){err.textContent='nick invalido';return;}
    err.textContent='verificando...';
    const r=await fetch('/api/game',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'checkOnline',nick:n})}).then(x=>x.json());
    if(!r.ok||!r.online){err.textContent='essa pessoa nao esta jogando agora';return;}
    MP.friends[n]=true;
    saveFriends();
    MP.friendOnline[n]=true;
    err.textContent='amigo adicionado!';
    o.querySelector('#frAdd').value='';
    setTimeout(()=>{closeAll();friendsScreen();},800);
  };
  o.querySelector('#frBack').onclick=()=>{closeAll();lobbyScreen();};
}

function openFriendChat(friend){
  closeAll();
  const o=$('div',{id:'mpo'});
  o.innerHTML=`<div class="c">
<h1>Chat com ${friend}</h1>
<div id="fcMsgs" style="background:#0d0a12;border-radius:8px;padding:8px;min-height:180px;max-height:280px;overflow-y:auto;font-size:11px"></div>
<div style="display:flex;gap:4px;margin-top:6px">
<input id="fcTxt" placeholder="mensagem..." maxlength="200" style="flex:1;padding:8px;background:#0d0a12;color:#fff;border:1px solid #4a2a6a;border-radius:8px;font-family:inherit;font-size:12px;box-sizing:border-box">
<button id="fcSend" style="padding:8px 14px;background:#8a2be2;color:#fff;border:none;border-radius:8px;font-family:inherit;font-weight:bold;cursor:pointer;width:auto;margin:0">ENVIAR</button>
</div>
<button id="fcBack" class="sec">voltar</button>
</div>`;
  document.body.appendChild(o);
  const msgs=o.querySelector('#fcMsgs');
  const inp=o.querySelector('#fcTxt');
  let lastMsgCount = 0;

  function renderMsgs(list){
    msgs.innerHTML='';
    if(!list.length){
      msgs.innerHTML='<p style="color:#666;text-align:center;padding:20px">nenhuma mensagem ainda. diga oi!</p>';
      return;
    }
    list.forEach(m=>{
      const d=$('div');
      d.style.margin='3px 0';
      d.style.color = m.from === MP.nick ? '#b8ff2e' : '#8ad8ff';
      d.textContent = (m.from === MP.nick ? 'Você: ' : m.from + ': ') + m.text;
      msgs.appendChild(d);
    });
    msgs.scrollTop=msgs.scrollHeight;
  }

  async function carregar(){
    if(!document.getElementById('fcMsgs'))return;
    try{
      const r=await fetch('/api/game',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'getFriendMsgs',nick:MP.nick,to:friend})}).then(x=>x.json());
      if(r.ok && r.msgs.length !== lastMsgCount){
        lastMsgCount = r.msgs.length;
        renderMsgs(r.msgs);
      }
    }catch(e){}
    if(document.getElementById('fcMsgs'))setTimeout(carregar,2000);
  }
  carregar();

  const enviar=async()=>{
    const t=inp.value.trim();
    if(!t)return;
    inp.value='';
    await fetch('/api/game',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'sendFriendMsg',nick:MP.nick,to:friend,text:t})});
    carregar();
  };
  o.querySelector('#fcSend').onclick=enviar;
  inp.onkeydown=e=>{if(e.key==='Enter')enviar();};

  o.querySelector('#fcBack').onclick=()=>{closeAll();friendsScreen();};
}
  renderChat();
  o.querySelector('#fcSend').onclick=()=>{
    const t=o.querySelector('#fcTxt').value.trim();
    if(!t)return;
    chat.push({me:true,text:t});
    MP.friendChat[friend]=chat;
    saveFriendChat();
    o.querySelector('#fcTxt').value='';
    renderChat();
    setTimeout(()=>{
      const replies=['oi!','kkk','beleza','to jogando','vamo','serio?','kkkkk','manda','ok','depois eu falo'];
      chat.push({me:false,text:replies[(Math.random()*replies.length)|0]});
      saveFriendChat();
      renderChat();
    },900);
  };
  o.querySelector('#fcBack').onclick=()=>{closeAll();friendsScreen();};
}

function start(){
  if(MP.started)return;
  MP.started=true;
  applyAvatar(MP.avatar);
  closeAll();

  const h=$('div',{id:'mpHud'});
  document.body.appendChild(h);
  MP.turnEl=h;

  const ov=$('canvas',{id:'mpOverlay'});
  ov.width=320;
  ov.height=180;
  document.body.appendChild(ov);
  MP.overlay=ov;
  MP.overlayCtx=ov.getContext('2d');

  const btn=$('button',{id:'mpMenuBtn'});
  btn.textContent='☰';
  btn.onclick=(e)=>{
    e.stopPropagation();
    const m=document.getElementById('mpMenu');
    m.classList.toggle('open');
    if(!m.classList.contains('open')){
      const c=document.getElementById('mpChat');
      if(c)c.classList.remove('open');
    }
  };
  document.body.appendChild(btn);

  const menu=$('div',{id:'mpMenu'});
  menu.innerHTML=`
<button id="mmAv">Trocar avatar</button>
<button id="mmFr">Amigos</button>
<button id="mmChat">Abrir chat</button>
<button id="mmStudio">Studio</button>
<button id="mmExit" class="danger">Sair da sala</button>`;
  document.body.appendChild(menu);

  const chat=$('div',{id:'mpChat'});
  chat.innerHTML=`<div id="mpChatMsgs"></div>
<div id="mpChatInputWrap">
<input id="mpTxt" maxlength="240" placeholder="mensagem..." autocomplete="off">
<button id="mpSend">➤</button>
<button id="mpChatClose" class="closeChat">×</button>
</div>`;
  document.body.appendChild(chat);
  MP.chatEl=chat;
  const txt=chat.querySelector('#mpTxt');
  const enviar=async()=>{
    const t=txt.value.trim();
    if(!t)return;
    txt.value='';
    const r=await api('chat',{text:t});
    if(!r.ok&&r.reason==='naoEhSuaVez')addChat({type:'sys',nick:'SISTEMA',text:'e a vez de '+r.turn});
  };
  chat.querySelector('#mpSend').onclick=enviar;
  chat.querySelector('#mpChatClose').onclick=()=>{chat.classList.remove('open');menu.classList.remove('open');};
  txt.onkeydown=e=>{if(e.key==='Enter')enviar();};

  menu.querySelector('#mmAv').onclick=()=>{menu.classList.remove('open');avatarScreen(()=>{api('setAvatar',{avatar:MP.avatar});});};
  menu.querySelector('#mmFr').onclick=()=>{menu.classList.remove('open');friendsScreen();};
  menu.querySelector('#mmChat').onclick=()=>{
    chat.classList.toggle('open');
    menu.classList.remove('open');
    if(chat.classList.contains('open'))setTimeout(()=>txt.focus(),200);
  };
  menu.querySelector('#mmStudio').onclick=()=>{window.location.href='/studio.html';};
  menu.querySelector('#mmExit').onclick=async()=>{await api('leaveRoom');MP.roomId=null;MP.room=null;MP.started=false;location.reload();};

  if(MP.nick===ADMIN_NICK){
    MP.isAdmin=true;
    const ab=$('button',{id:'mmAdmin',class:'admin'});
    ab.textContent='Painel Admin';
    ab.onclick=()=>{menu.classList.remove('open');openAdmin();};
    menu.insertBefore(ab,menu.firstChild);
  }

  const ei=$('div',{id:'mpEntInput'});
  ei.innerHTML=`<div class="who" id="mpEntWho"></div>
<div id="mpEntReply"></div>
<div class="line">
<input id="mpEntTxt" maxlength="200" placeholder="fale com a criatura..." autocomplete="off">
<button id="mpEntSend">➤</button>
<button id="mpEntCancel" class="cancel">×</button>
</div>`;
  document.body.appendChild(ei);
  MP.entEl=ei;
  ei.querySelector('#mpEntCancel').onclick=()=>ei.classList.remove('open');
  const entTxt=ei.querySelector('#mpEntTxt');
  const entSend=async()=>{
    const t=entTxt.value.trim();
    if(!t)return;
    entTxt.value='';
    const id=ei.dataset.entityId;
    const name=ei.dataset.entityName;
    const reply=ei.querySelector('#mpEntReply');
    reply.classList.remove('show');
    reply.textContent='...';
    const r=await api('entityTalk',{id,text:t});
    if(r.ok){
      reply.textContent=name+': '+r.text;
      reply.classList.add('show');
      if(r.scare)jumpscare();
    }else{
      reply.textContent='nao consegui falar';
      reply.classList.add('show');
    }
  };
  ei.querySelector('#mpEntSend').onclick=entSend;
  entTxt.onkeydown=e=>{if(e.key==='Enter')entSend();};

  document.addEventListener('click',(e)=>{
    const m=document.getElementById('mpMenu');
    const b=document.getElementById('mpMenuBtn');
    if(m&&m.classList.contains('open')&&!m.contains(e.target)&&!b.contains(e.target))m.classList.remove('open');
  });

  pollLoop();
  moveLoop();
  renderLoop();

  window.addEventListener('beforeunload',()=>{
    try{navigator.sendBeacon('/api/game',JSON.stringify({action:'leaveRoom',nick:MP.nick,hwid:MY_HWID,roomId:MP.roomId}));}catch(e){}
  });
}

function updateHud(room){
  const players=Object.values(room.players||{});
  const meTurn=room.turnNick===MP.nick;
  const nicks=players.map(p=>(p.nick||'?')+(p.isAdmin?' ⚙':'')).join(' ');
  const m=MODES[room.gameMode||'normal']||MODES.normal;
  const modeCls=m.name==='HARDCORE'?'mH':m.name==='PACIFICO'?'mP':'mN';
  MP.turnEl.innerHTML=`<b>${MP.nick}</b>${MP.isAdmin?' <span class="adm">⚙</span>':''} · <span class="${modeCls}">${m.name}</span> · ${players.length}/${room.maxPlayers}`+(MP.mode==='multi'&&meTurn?' <span class="turn">▶</span>':'')+`<br>[${nicks}]`;
}

function addChat(e){
  const c=document.getElementById('mpChatMsgs');
  if(!c)return;
  const cls='m'+(e.type==='entity'?' ent':e.type==='sys'?' sys':e.nick===MP.nick?' me':'');
  const div=$('div',{class:cls});
  div.textContent=`${e.nick}: ${e.text}`;
  c.appendChild(div);
  while(c.children.length>30)c.removeChild(c.firstChild);
  const chat=document.getElementById('mpChat');
  if(chat)chat.scrollTop=chat.scrollHeight;
}

function openAdmin(){
  if(document.getElementById('mpAdm'))return;
  const o=$('div',{id:'mpAdm'});
  o.innerHTML=`<button class="x" id="mpAdmX">×</button>
<h2>PAINEL ADMIN</h2>
<h3>SPAWNAR ENTIDADE</h3>
<input id="mpAdmName" placeholder="nome" maxlength="18">
<select id="mpAdmKind"><option value="goo">Gosma</option><option value="eye">Olho</option><option value="shadow">Sombra</option></select>
<input id="mpAdmX2" placeholder="x" value="300">
<input id="mpAdmY2" placeholder="y" value="120">
<button id="mpAdmSpawn">SPAWNAR</button>
<h3>ENTIDADES</h3>
<div id="mpAdmEnts"></div>
<h3>ACOES GLOBAIS</h3>
<input id="mpAdmBroadcast" placeholder="mensagem pra todos">
<button id="mpAdmBroadcastBtn" class="ok">MANDAR MENSAGEM</button>
<button id="mpAdmTaco">CHUVA DE TACO</button>
<button id="mpAdmWeapon">DAR ARMA PARA TODOS</button>
<h3>MODERAR JOGADOR</h3>
<input id="mpAdmTarget" placeholder="nick do jogador" maxlength="24">
<button id="mpAdmGiveBtn">DAR ADMIN</button>
<button id="mpAdmFreeze" class="danger">CONGELAR/DESCONGELAR</button>
<button id="mpAdmBan" class="danger">BANIR (HWID + NICK)</button>
<button id="mpAdmUnban">DESBANIR</button>
<div class="st" id="mpAdmSt"></div>`;
  document.body.appendChild(o);
  const st=o.querySelector('#mpAdmSt');
  const setSt=t=>{st.textContent=t;setTimeout(()=>{if(st.textContent===t)st.textContent='';},2500);};
  o.querySelector('#mpAdmX').onclick=()=>o.remove();
  o.querySelector('#mpAdmSpawn').onclick=async()=>{
    const r=await api('spawnEntity',{
      name:o.querySelector('#mpAdmName').value.trim()||'SOMBRA',
      kind:o.querySelector('#mpAdmKind').value,
      x:+o.querySelector('#mpAdmX2').value||300,
      y:+o.querySelector('#mpAdmY2').value||120,
    });
    setSt(r.ok?'spawnada':'erro');
  };
  o.querySelector('#mpAdmBroadcastBtn').onclick=async()=>{
    const t=o.querySelector('#mpAdmBroadcast').value.trim();
    if(!t)return;
    const r=await api('broadcast',{text:t});
    setSt(r.ok?'mensagem enviada':'erro');
  };
  o.querySelector('#mpAdmTaco').onclick=async()=>{
    const r=await api('tacoRain',{});
    setSt(r.ok?'choveu!':'erro');
  };
  o.querySelector('#mpAdmWeapon').onclick=async()=>{
    const r=await api('giveWeapon',{nick:'TODOS'});
    setSt(r.ok?'todos armados':'erro');
  };
  o.querySelector('#mpAdmGiveBtn').onclick=async()=>{
    const n=o.querySelector('#mpAdmTarget').value.trim();
    if(!n)return;
    const r=await api('giveAdmin',{nick:n});
    setSt(r.ok?n+' e admin':'erro '+(r.reason||''));
  };
  o.querySelector('#mpAdmFreeze').onclick=async()=>{
    const n=o.querySelector('#mpAdmTarget').value.trim();
    if(!n)return;
    const r=await api('freezePlayer',{nick:n});
    setSt(r.ok?(r.frozen?n+' congelado':n+' descongelado'):'erro');
  };
  o.querySelector('#mpAdmBan').onclick=async()=>{
    const n=o.querySelector('#mpAdmTarget').value.trim();
    if(!n)return;
    const r=await api('banPlayer',{nick:n});
    setSt(r.ok?n+' BANIDO':'erro');
  };
  o.querySelector('#mpAdmUnban').onclick=async()=>{
    const n=o.querySelector('#mpAdmTarget').value.trim();
    if(!n)return;
    const r=await api('unbanPlayer',{nick:n});
    setSt(r.ok?n+' desbanido':'erro');
  };
  const renderEnts=(room)=>{
    const box=o.querySelector('#mpAdmEnts');
    box.innerHTML='';
    (room.entities||[]).forEach(e=>{
      const d=$('div',{class:'row'});
      d.innerHTML=`<span>${e.name}</span>`;
      const b=$('button');
      b.textContent='×';
      b.style.width='auto';
      b.style.padding='2px 8px';
      b.onclick=async()=>{await api('removeEntity',{id:e.id});refreshEnts();};
      d.appendChild(b);
      box.appendChild(d);
    });
    if(!room.entities||!room.entities.length)box.innerHTML='<span style="color:#888;font-size:10px">-</span>';
  };
  const refreshEnts=async()=>{
    const s=await getState();
    const room=s.rooms&&s.rooms[MP.roomId];
    if(room)renderEnts(room);
  };
  refreshEnts();
  MP.adminEntsRefresh=refreshEnts;
}

async function pollLoop(){
  try{
    const s=await getState();
    if(s.v!==MP.lastV){
      MP.lastV=s.v;
      const room=s.rooms&&s.rooms[MP.roomId];
      if(!room){setTimeout(()=>location.reload(),1500);return;}
      MP.room=room;
      updateHud(room);
      syncChat(room);
      syncEntities(room);
      syncRemote(room);
      if(MP.adminEntsRefresh&&document.getElementById('mpAdm'))MP.adminEntsRefresh();
    }
  }catch(e){}
  setTimeout(pollLoop,1000);
}

let lastChatLen=0;
function syncChat(room){
  if(!room.chat)return;
  if(room.chat.length<lastChatLen)lastChatLen=0;
  for(let i=lastChatLen;i<room.chat.length;i++)addChat(room.chat[i]);
  lastChatLen=room.chat.length;
}

function syncRemote(room){
  const used={};
  for(const nick in room.players){
    if(nick===MP.nick)continue;
    const p=room.players[nick];
    used[nick]=true;
    let r=MP.remote[nick];
    if(!r){
      r={x:p.x,y:p.y,face:p.face,avatar:p.avatar,lastX:p.x,lastY:p.y,anim:0,moving:0};
      MP.remote[nick]=r;
    }
    r.x=p.x;
    r.y=p.y;
    r.face=p.face;
    r.avatar=p.avatar||DEFAULT_AVATAR;
    r.frozen=p.frozen;
    r.weapon=p.hasWeapon;
  }
  for(const nick in MP.remote)if(!used[nick])delete MP.remote[nick];
}

function syncEntities(room){
  const used={};
  (room.entities||[]).forEach(e=>{
    used[e.id]=true;
    let el=MP.entities[e.id];
    if(!el){
      el=$('div',{class:'mpEnt '+e.kind});
      el.innerHTML=`<div class="blob"></div>${e.name}`;
      el.onclick=()=>talkTo(e);
      document.body.appendChild(el);
      MP.entities[e.id]=el;
    }
    el._x=e.x;
    el._y=e.y;
    el._id=e.id;
  });
  for(const id in MP.entities)if(!used[id]){MP.entities[id].remove();delete MP.entities[id];}
}

function talkTo(e){
  const ei=document.getElementById('mpEntInput');
  if(!ei)return;
  ei.dataset.entityId=e.id;
  ei.dataset.entityName=e.name;
  document.getElementById('mpEntWho').textContent=e.name;
  const reply=document.getElementById('mpEntReply');
  reply.classList.remove('show');
  reply.textContent='';
  const inp=document.getElementById('mpEntTxt');
  inp.value='';
  ei.classList.add('open');
  setTimeout(()=>inp.focus(),250);
}

function jumpscare(){
  const j=$('div',{id:'mpJump'});
  j.textContent='👁';
  document.body.appendChild(j);
  setTimeout(()=>j.remove(),500);
}

let lastSent=0,lastX=40,lastY=120,lastFace=1;
function moveLoop(){
  if(MP.roomId){
    const g=window.StickDebug&&window.StickDebug.G;
    if(g&&g.player){
      lastX=Math.round(g.player.x);
      lastY=Math.round(g.player.y);
      lastFace=g.player.face;
    }
    const now=Date.now();
    if(now-lastSent>500){
      lastSent=now;
      api('move',{x:lastX,y:lastY,face:lastFace}).catch(()=>{});
    }
  }
  setTimeout(moveLoop,500);
}

function renderLoop(){
  const g=window.StickDebug&&window.StickDebug.G;
  const ov=MP.overlay,ctx=MP.overlayCtx;
  if(!ov||!ctx){requestAnimationFrame(renderLoop);return;}
  const canvas=document.getElementById('game');
  if(canvas){
    const rect=canvas.getBoundingClientRect();
    ov.style.left=rect.left+'px';
    ov.style.top=rect.top+'px';
    ov.style.width=rect.width+'px';
    ov.style.height=rect.height+'px';
  }
  ctx.clearRect(0,0,320,180);
  ctx.imageSmoothingEnabled=false;
  if(g&&g.camX!=null){
    const camX=g.camX,camY=g.camY;
    for(const nick in MP.remote){
      const r=MP.remote[nick];
      const a=r.avatar||DEFAULT_AVATAR;
      const dx=Math.abs(r.x-r.lastX),dy=Math.abs(r.y-r.lastY);
      const moving=dx>0.4||dy>0.4;
      if(moving){r.moving=12;r.anim+=0.15;}
      else if(r.moving>0)r.moving--;
      r.lastX=r.x;
      r.lastY=r.y;
      let frame='idle';
      if(r.moving>0)frame=['walk1','walk2','walk3','walk2'][Math.floor(r.anim)%4];
      const recolor={
        h:a.hair==='RAINBOW'?'#ff2030':a.hair,
        H:shadeLocal(a.hair==='RAINBOW'?'#ff2030':a.hair,-0.25),
        s:a.skin,
        S:shadeLocal(a.skin,-0.15),
        g:a.shirt,
        G:shadeLocal(a.shirt,-0.2),
        p:a.pants,
        P:shadeLocal(a.pants,-0.25),
        t:a.shoes,
        e:a.eyes,
      };
      let img;
      try{img=Sprites.get('player',frame,recolor);}catch(e){continue;}
      const px=Math.round(r.x+4-camX-6);
      const py=Math.round(r.y+8-camY-8);
      ctx.save();
      ctx.translate(px+6,py+8);
      ctx.scale(r.face<0?-1:1,1);
      ctx.drawImage(img,-6,-8);
      ctx.restore();
      if(r.frozen){
        ctx.fillStyle='#8ad8ff';
        ctx.fillRect(px,py-3,12,2);
      }
      if(r.weapon){
        ctx.fillStyle='#c4c8d4';
        ctx.fillRect(px+(r.face<0?-8:12),py+3,6,2);
      }
      ctx.font='6px monospace';
      ctx.textAlign='center';
      ctx.textBaseline='bottom';
      const nameY=py-4;
      ctx.fillStyle='rgba(0,0,0,0.75)';
      ctx.fillText(nick,px+7,nameY+1);
      ctx.fillStyle='#b8ff2e';
      ctx.fillText(nick,px+6,nameY);
    }
  }
  requestAnimationFrame(renderLoop);
}

loadAvatar();
window.addEventListener('load',()=>setTimeout(loginScreen,300));
})();
