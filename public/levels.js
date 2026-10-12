/* =====================================================================
   MISSÕES — WRICK E SEUS AMIGOS (Eri e Zoom são os bons, Torajo é o vilão)
   ===================================================================== */
function joinScreens(screens){const rows=[];for(let r=0;r<12;r++)rows.push(screens.map(s=>s[r]).join(''));return rows;}
const countdown=(a)=>['3','2','1'].flatMap((n,i)=>[
  {run:()=>{a.say({text:n,style:'center',dur:0.9,size:24});a.sfx('beep',660+i*110);}},{wait:1},
]);
const floweyTalk={
  name:'FLOWEY',sheet:'chick',color:'#ffd84a',
  lines:['Howdy! Eu sou FLOWEY.','FLOWEY, a FLOR!','Quer ouvir minha música? Ela é bem legal!'],
  choices:[
    {text:'Sim, quero ouvir!',onSelect:(a)=>{a.music.play('flowey');
      a.say({text:'Toma! Minha música especial!',style:'center',dur:2.5,size:8,color:'#ffd84a'});
      setTimeout(()=>a.say({text:'Ela me ajuda a ficar... animado.',style:'center',dur:2.5,size:8,color:'#ffd84a'}),2600);
      setTimeout(()=>a.say({text:'Anima a todos, né? Hihi.',style:'flash',dur:1.5,size:8,color:'#ffffff'}),5200);}},
    {text:'Não, obrigado.',onSelect:(a)=>{a.sfx('flowey_laugh');
      a.say({text:'Ah. Que pena.',style:'center',dur:2,size:8,color:'#ffffff'});
      setTimeout(()=>a.say({text:'Tá. Se cuida, Wrick.',style:'center',dur:2,size:8,color:'#ffffff'}),2100);
      setTimeout(()=>a.scare(),4200);}},
  ],
};
function napstablookTalk(extra){
  return{name:'NAPSTABLOOK',color:'#e8e8f0',mode:'ghost',
    lines:(extra||[]).concat(['oh no...','eu sou o napstablook...','eu fiz uma música...','quer ouvir? ...talvez...']),
    choices:[
      {text:'Sim, quero ouvir.',onSelect:(a)=>{a.music.play('napstablook');
        a.say({text:'...',style:'center',dur:1.5,size:8,color:'#e8e8f0'});
        setTimeout(()=>a.say({text:'...obrigado...',style:'center',dur:2.5,size:8,color:'#e8e8f0'}),1600);
        setTimeout(()=>a.say({text:'ninguém nunca quer ouvir...',style:'center',dur:3,size:8,color:'#e8e8f0'}),4200);
        setTimeout(()=>a.say({text:'você é legal, Wrick.',style:'center',dur:2.5,size:8,color:'#e8e8f0'}),7300);}},
      {text:'Não, obrigado.',onSelect:(a)=>{
        a.say({text:'ah...',style:'center',dur:1.2,size:8,color:'#e8e8f0'});
        setTimeout(()=>a.say({text:'tudo bem...',style:'center',dur:1.8,size:8,color:'#e8e8f0'}),1300);
        setTimeout(()=>a.say({text:'eu já esperava...',style:'center',dur:2.5,size:8,color:'#e8e8f0'}),3100);
        setTimeout(()=>a.say({text:'desculpa...',style:'center',dur:2,size:8,color:'#e8e8f0'}),5700);}},
    ]};
}

const LEVELS = [
  // ===== MISSÃO 1 — OS OVOS DO ERI (salva o Eri) =====
  {
    name:'OS OVOS DO ERI',theme:'farm',friend:'eri',item:'egg',secrets:false,friendWait:'me espera!',
    map:joinScreens([
      ['....................','....................','....................','....................','....................','....................','....................','..........o.........','.........===........','.PN.S.f..N.L.N..R.N.','####################','####################'],
      ['....................','....................','....................','....................','....................','.............o......','............===.....','.......o............','......===.......o...','..N.f.......L.L.....','####################','####################'],
      ['....................','....................','....................','....................','....................','....................','.........o..........','....o...===....o....','...===.........==...','.b........T.......f.','#####..#######..####','#####..#######..####'],
      ['....................','....................','....................','....................','..............o.....','.............===....','.........o..........','........===.........','....o...............','.c...........Y...f..','####################','####################'],
      ['....................','....................','....................','....................','....................','....................','...........o........','..........===.......','....................','..H...f..........b..','########...#########','########...#########'],
      ['....................','....................','....................','....................','..........o.........','....................','.......#######......','....o.########......','....##########......','.c..##########...f..','####################','####################'],
    ]),
    npcs:[floweyTalk,
      {name:'PINTINHO',sheet:'chick',lines:['Piu!','Piu piu!']},
      {name:'PINTINHO',sheet:'chick',mode:'stare',lines:['...','piu.']},
      {name:'PINTINHO',sheet:'chick',lines:['Piu piu piu?']},
      napstablookTalk()],
    signs:[{lines:['FAZENDINHA DO ERI','Amigos bem-vindos:','Zoom, Torajo e...','(tem um nome riscado aqui)']}],
    friendTalk:[['Cuidado com os buracos, Wrick!','Ovo quebrado não tem conserto. Hihi!'],['Sabia que eu já fui pintinho?','Mentira. Eu sou um ovo. Hihi!'],['O Zoom vai levar a gente pra lua um dia!','...a gente quem? Ah. Eu e o Torajo.'],['Você tá quietinho, Wrick.','Tá tudo bem?']],
    onStart:(a)=>{a.music.play('farm');a.seq([{wait:0.4},{talk:['eri',['WRICK! Você veio!','Hoje é dia de colher os ovos da fazendinha!','Me ajuda? Depois a gente toma suco!','...quer dizer, eu, o Zoom e o Torajo. Mas você pode ajudar!']]},{wait:3},{say:'quisDizer'}],{blocking:false});},
    events:[
      {x:47,run:(a)=>a.say('naoMeChamam')},
      {x:104,w:4,run:(a)=>{
        const edge=112*16;
        a.seq([
          {run:()=>{a.walkTo(edge-46,50);a.friendWalk(edge-4,45);}},
          {until:(a)=>a.friend.mode==='idle'&&a.player.autoX==null},
          {run:()=>{a.friendFace(-1);a.face(1);}},
          {talk:['eri',['Olha, Wrick! Dá pra ver a fazendinha inteira daqui!','Obrigado por me ajudar com os ovos!']]},
          {talk:['eri',['Ah... posso te contar uma coisa?','Ontem teve festa lá em casa. O Zoom e o Torajo vieram.','Mas o Torajo ficou estranho...','Ele ficava me olhando, e cochichava com o Zoom.','Você acha que tá tudo bem?']]},
          {run:()=>{a.friendFace(1);a.music.stop(2.5);}},
          {wait:2.8},
          {run:()=>a.friendWalk(edge+2,22)},
          {until:(a)=>a.friend.mode==='idle'},
          {wait:1},
          {run:()=>{a.dialog(null,['O Eri tá na beirada...','Você o avisa?'],null,{color:'#ffffff',choices:[
            {text:'Ei! Cuidado com a beirada!',onSelect:(a2)=>{
              a2.say({text:'* Você avisa o Eri.',style:'typed',dur:2,size:8,cps:10,color:'#ffffff'});
              setTimeout(()=>{a2.friendWalk(edge-30,40);a2.friendSay('Ah! Obrigado, Wrick!');},2100);
              setTimeout(()=>a2.say({text:'* O Eri deu um pulo de alegria!',style:'typed',dur:3,size:8,cps:10,color:'#ffd84a'}),4500);
              setTimeout(()=>a2.say({text:'Eri: Você é o melhor amigo do mundo!',style:'center',dur:3,size:8,color:'#fff7e8'}),8000);
              setTimeout(()=>{a2.flag('eriSalvo',true);a2.flag('easterEggGaster',true);},11000);
              setTimeout(()=>a2.complete('MISSÃO CONCLUÍDA!',{from:3,to:3}),11500);}},
          ]});}},
        ],{blocking:true});}},
    ],
  },

  // ===== MISSÃO 2 — O FOGUETE DO ZOOM (conserta e vai pra lua) =====
  {
    name:'O FOGUETE DO ZOOM',theme:'launch',friend:'zoom',item:'gear',secrets:true,friendWait:'ei, Wrick! aqui!',
    map:joinScreens([
      ['....................','....................','....................','....................','....................','....................','....................','.............o......','............===.....','.P...S..T......b....','####################','####################'],
      ['....................','....................','....................','....................','....................','............o.......','..........=====.....','....................','.....===............','..N.............N...','#######...##########','#######...##########'],
      ['....................','....................','....................','...BBBBBBBBBBBBB....','...BBBBBBBBBBBBB....','....................','....................','...........o........','.......BB..BB.......','..c...BBB..BBB..f...','####################','####################'],
      ['....................','....................','....................','....................','...............o....','..............===...','..........===.......','......===...........','....................','..N....Y............','#############...####','#############...####'],
      ['....................','....................','....................','....................','....................','....................','.........o..........','........===.........','....................','..f...S.......^^..N.','####################','####################'],
      ['....................','....................','....................','....................','....................','....................','....................','....................','....................','..c..S.......K......','####################','####################'],
    ]),
    npcs:[
      {name:'PIPO',color:'#ff9ecf',lines:['Oi, Zoom!','...e oi, você.']},
      {name:'TUTI',color:'#7fd0ff',lines:['Você vai na festa do Zoom?','Ah. Não? Que pena.']},
      {name:'???',color:'#c9b3ff',mode:'stare',lines:['cadê o ovinho?']},
      napstablookTalk(['um foguete...','tão alto...'])],
    signs:[{lines:['BASE ESPACIAL DO ZOOM','Proibido mexer no foguete!']},{lines:['FESTA NO FOGUETE DO ZOOM!','Sábado. Todo mundo convidado!','(menos o esquisito)']}],
    scribbles:[{x:560,y:60,text:'ninguém me chama',alpha:0.3},{x:1290,y:50,text:'eu sorrio. eu sempre sorrio.',alpha:0.3}],
    friendTalk:[['Esse foguete vai até a lua!','Eu tô treinando faz um tempão.'],['O Eri não respondeu minhas mensagens.','Estranho, né?'],['Na festa de ontem a gente brincou de astronauta!','...ops. Esquece que eu falei da festa.'],['Wrick... por que você tá me olhando assim?']],
    props:[
      {kind:'rocket',state:'broken',lift:0,liftV:0,tilt:0,onUse:(a,k)=>{
        if(a.stars<a.starsTotal){a.seq([{talk:['zoom',['Ainda faltam peças, Wrick!','A gente achou '+a.stars+' de '+a.starsTotal+'.']]}]);return;}
        k.locked=true;
        const rx=k.x+8;
        a.seq([
          {run:()=>{a.friendWalk(rx-30,50);a.walkTo(rx-56,60);}},
          {until:(a)=>a.friend.mode==='idle'&&a.player.autoX==null},
          {run:()=>{a.face(1);}},
          {talk:['zoom',['Todas as peças! Wrick, você é demais!','Sobrou um parafuso...']]},
          {talk:['zoom',['Aperta pra mim? Eu seguro o foguete.']]},
          {run:()=>{a.walkTo(rx-12,50);}},
          {until:(a)=>a.player.autoX==null},
          {run:()=>{a.face(1);a.player.interactT=0.4;a.sfx('clank');}},{wait:0.45},
          {run:()=>{a.player.interactT=0.4;a.sfx('clank');}},{wait:0.45},
          {run:()=>{a.player.interactT=0.4;a.sfx('clank');k.state='fixed';a.burst(rx,k.y-12,8,['#ffffff','#c4c8d4'],40);}},
          {wait:0.8},
          {talk:['zoom',['Pronto! Wrick, você é o melhor!','Sobe comigo! Vamos pra lua!']]},
          {run:()=>{a.walkTo(rx-40,50);a.friendWalk(rx,40,()=>{a.friendMode('hidden');k.crew=true;a.sfx('door');});}},
          {until:(a)=>a.friend.mode==='hidden'&&a.player.autoX==null},
          {run:()=>{a.face(1);a.player.autoX=rx-40;}},
          {until:(a)=>a.player.autoX==null},
          {run:()=>{a.say({text:'* VOCÊS DOIS SUBIRAM!',style:'typed',dur:3,size:8,cps:10,color:'#ffd84a'});a.player.autoX=rx-30;}},
          {until:(a)=>a.player.autoX==null},
          {run:()=>{a.player.autoX=rx-20;}},
          {until:(a)=>a.player.autoX==null},
          {run:()=>{a.player.autoX=rx-10;}},
          {until:(a)=>a.player.autoX==null},
          {run:()=>{a.say({text:'* Wrick entrou no foguete!',style:'typed',dur:2.5,size:8,cps:10,color:'#b8ff2e'});a.player.visible=false;}},
          {wait:0.5},
          {...countdown(a)[0]},{...countdown(a)[1]},
          {run:()=>{a.say({text:'DECOLAR!',style:'center',dur:1.2,size:16,color:'#ffd84a'});a.sfx('beep',1320);a.sfx('rumble',4);k.state='launch';k.liftV=4;k.liftA=26;a.shake(2.5,1);}},
          {until:()=>k.lift>46},
          {run:()=>{a.sfx('sputter');a.debris({kind:'gear',x:rx+3,y:k.y+12-k.lift-14,vx:-18,vy:10,vr:7});k.liftA=-6;k.tiltV=0.38;}},
          {until:()=>k.lift>72||k.liftV<4},
          {wait:0.4},
          {run:()=>{const ex=rx+Math.sin(k.tilt)*10,ey=k.y+16-4-k.lift-24;k.state='gone';k.crew=false;a.flash(0.3);a.sfx('boom');a.shake(1.4,4);a.burst(ex,ey,46,['#ffd84a','#ff8a2a','#ffffff','#9a9a9a','#5a5a5a'],130);}},
          {wait:3},
          {run:()=>{a.black(1);}},
          {wait:1.5},
          {say:'sobrouUm'},
          {wait:2.5},
          {say:'queriaSozinho'},
          {wait:2.5},
          {run:()=>{a.flag('zoomMorto',true);a.complete('MISSÃO CONCLUÍDA?',{from:2,to:1});}},
        ],{blocking:true});
      }},
    ],
    onStart:(a)=>{a.music.play('rocket');a.seq([{wait:0.4},{talk:['zoom',['Oi, Wrick! Meu foguete quebrou!','As peças caíram pelo caminho todo.','Me ajuda a achar as 5 peças?']]},{talk:['zoom',['Ah... cadê o Eri? Ele ia vir também.']]},{talk:['stick',['Ele tá no morro.']]},{talk:['zoom',['...','Tá. Vamos lá, então.']]});},
    events:[
      {x:30,run:(a)=>a.say('riemDeMim')},
      {x:66,run:(a)=>a.seq([{run:()=>{a.music.set({wobble:60,detune:-50,drop:0.2,rate:0.92});a.sfx('static');}},{wait:0.5},{say:'esquisito'},{wait:2.4},{run:()=>a.music.reset()}])},
      {x:86,run:(a)=>a.say('sorrioPraEles')},
    ],
  },

  // ===== MISSÃO 3 — A VILA DAS FRUTAS (Torajo é o vilão) =====
  {
    name:'A VILA DAS FRUTAS',theme:'dusk',friend:'torajo',item:'berry',secrets:true,friendWait:'Wrick?! não me deixa sozinho!',
    map:joinScreens([
      ['....................','....................','....................','....................','....................','....................','....................','..........o.........','.........===........','.P..S....T.....T.f..','####################','####################'],
      ['....................','....................','....................','....................','....................','.............o......','............===.....','.......===..........','..o.................','.....T....^^....T...','####################','####################'],
      ['....................','....................','....................','....................','....................','....................','........o...........','.......===....o.....','.............===....','..N...........b..Y..','######...###########','######...###########'],
      ['....................','....................','....................','....................','....................','...........o........','..........===.......','.....===.......===..','....................','.c....^^...T...^^...','####################','####################'],
      ['....................','....................','....................','....................','....................','....................','.........o..........','.......=====........','....................','..T...^^^.....^^..T.','####################','####################'],
      ['....................','....................','....................','....................','....................','....................','....................','....................','..........N.........','.c..S.....K....U....','####################','####################'],
      ['....................','....................','....................','....................','....................','....................','....................','....................','....................','..U...........U...U.','####################','####################'],
    ]),
    npcs:[{name:'MIMI',color:'#ffd06a',mode:'stare',lines:['Não vai pra vila.','Tem uma coisa lá embaixo.']},napstablookTalk(['escureceu...','aconteceu alguma coisa aqui?'])],
    signs:[{lines:['CAMINHO DA VILA DAS FRUTAS →']},{lines:['VILA DAS FRUTAS','População: 48']}],
    props:[{kind:'arch',noInteract:true}],
    scribbles:[{x:640,y:58,text:'eu sou o melhor amigo deles',alpha:0.35,color:'#ff9aa6'},{x:1560,y:66,text:'eles só não sabem ainda',alpha:0.35,color:'#ff9aa6'}],
    friendTalk:[['Pega as frutinhas!','A vovó Pera faz geleia com elas.'],['Cuidado com essa coisa preta no chão.','Ela não tava aqui antes.'],['Wrick... você sabia da festa, né?','Eu falei pra chamarem você. Juro.','...mais ou menos.'],['Por que você tá tão quieto?']],
    onStart:(a)=>{a.music.play('dusk');a.seq([{wait:0.4},{talk:['torajo',['Wrick! Que bom que você veio comigo.','Eu preciso voltar pra Vila das Frutas antes de escurecer.','Minha família tá me esperando!']]},{talk:['torajo',['Ei... cadê o Eri e o Zoom?','Ninguém responde.']]},{talk:['stick',['Eles viajaram.']]},{talk:['torajo',['Sem me chamar?']]},{talk:['stick',['Dói, né?']]},{talk:['torajo',['...','Vamos logo.']]});},
    events:[
      {x:24,run:(a)=>a.say('nuncaSorriram')},
      {x:50,run:(a)=>a.seq([{run:()=>a.grin(true)},{talk:['torajo',['Wrick...','Por que você tá sorrindo assim?']]},{run:()=>a.grin(false)},{wait:0.4},{talk:['stick',['Sorrindo? Eu?']]}],{blocking:true})},
      {x:70,run:(a)=>{a.say('melhorAmigo');a.shadow({x:a.camX+340,y:150,vx:-280,dur:1.4,alpha:0.5});}},
      {x:92,run:(a)=>a.say('dentroDeMim')},
      {x:104,run:(a)=>a.music.set({detune:-30,drop:0.15})},
      // ===== CENA: TORAJO REVELA =====
      {x:122,w:4,run:(a)=>{
        const gx=129*16+8,gy=10*16;
        a.seq([
          {run:()=>{a.walkTo(gx-52,50);a.friendWalk(gx-22,45);}},
          {until:(a)=>a.friend.mode==='idle'&&a.player.autoX==null},
          {run:()=>a.face(1)},
          {talk:['torajo',['Chegamos! A Vila das Frutas!','...','Cadê todo mundo?','Mamãe? Vovó Pera?']]},
          {run:()=>{a.music.stop(2);a.friendLook('sad');}},
          {wait:1.5},
          {run:()=>a.friendWalk(gx,22)},
          {until:(a)=>a.friend.mode==='idle'},
          {wait:1},
          {talk:['torajo',['As casas estão todas vazias, Wrick.','Sabe por quê?']]},
          {wait:0.5},
          {run:()=>{a.sfx('stinger');a.shake(0.6,3);a.music.set({detune:-50,rate:0.9});}},
          {talk:['torajo',['Porque EU mandei todos embora.','Eu cansei de vocês.','O Eri caindo do morro? Eu planejei.','O foguete do Zoom explodindo? Também.','Agora só sobrou você, Wrick.']]},
          {talk:['torajo',['E eu vou te tirar do caminho também!']]},
          {run:()=>{a.friendLook('scared');a.say({text:'* TORAJO ATACA!',style:'typed',dur:2,size:8,cps:10,color:'#ff3347'});}},
          {wait:2.5},
          {run:()=>{
            a.battle.start({
              name:'TORAJO',color:'#a6ec5a',hp:28,duration:25,
              patterns:['bones','bones','bones','bones','bones'],
              mode:'eri',
              dialog:['Você não vai escapar.','Sou mais forte que os outros.','Você é só um esquisito!'],
              onWin:()=>{
                a.say({text:'* Você venceu o Torajo!',style:'typed',dur:3,size:8,cps:10,color:'#b8ff2e'});
                setTimeout(()=>a.say({text:'Torajo: Impossível...',style:'center',dur:3,size:8,color:'#a6ec5a'}),3400);
                setTimeout(()=>a.say({text:'Torajo: Você é... mais forte.',style:'center',dur:3,size:8,color:'#a6ec5a'}),6500);
                setTimeout(()=>a.say({text:'* O Torajo virou fumaça e sumiu.',style:'typed',dur:3,size:8,cps:10,color:'#ffffff'}),9800);
                setTimeout(()=>a.say({text:'* Você salvou a todos.',style:'typed',dur:3,size:8,cps:10,color:'#ffd84a'}),13000);
                setTimeout(()=>{a.flag('torajoVencido',true);a.black(1);},16500);
                setTimeout(()=>a.complete('MISSÃO CONCLUÍDA!',{from:1,to:1}),18000);
              },
              onLose:()=>{
                a.say({text:'GAME OVER',style:'center',dur:2,size:24,color:'#ff3347'});
                setTimeout(()=>{a.say({text:'Tente de novo.',style:'center',dur:2,size:8,color:'#ffffff'});},2200);
                setTimeout(()=>{
                  a.battle.start({
                    name:'TORAJO',color:'#a6ec5a',hp:28,duration:25,
                    patterns:['bones','bones','bones','bones','bones'],
                    mode:'eri',
                    dialog:['Você voltou?','Tolo.'],
                    onWin:()=>{
                      a.say({text:'* Você venceu o Torajo!',style:'typed',dur:3,size:8,cps:10,color:'#b8ff2e'});
                      setTimeout(()=>a.say({text:'* O Torajo virou fumaça e sumiu.',style:'typed',dur:3,size:8,cps:10,color:'#ffffff'}),3400);
                      setTimeout(()=>{a.flag('torajoVencido',true);a.black(1);},6500);
                      setTimeout(()=>a.complete('MISSÃO CONCLUÍDA!',{from:1,to:1}),8000);
                    },
                    onLose:()=>{a.say({text:'Tente de novo.',style:'center',dur:2,size:8,color:'#ffffff'});setTimeout(()=>a.battle.startEriBattle(),3000);},
                  });
                },3200);
              },
            });
          }},
        ],{blocking:true});
      }},
    ],
  },

  // ===== DEPOIS — FINAL BOM =====
  {
    name:'DEPOIS',nameGlitch:'E SEUS AMIGOS',label:'DEPOIS',hudLabel:'...',theme:'farm',secrets:false,
    map:joinScreens([
      ['....................','....................','....................','....................','....................','....................','....................','....................','....................','.P..................','####################','####################'],
      ['....................','....................','....................','....................','....................','....................','....................','....................','....................','....N.........N.....','####################','####################'],
    ]),
    npcs:[
      {name:'ERI',sheet:'eri',lines:['WRICK!!!','Você venceu o Torajo!','Eu sabia que você conseguia!','Você é o melhor amigo do mundo!']},
      {name:'ZOOM',sheet:'zoom',lines:['Ei, Wrick!','Eu voltei da lua só pra te ver.','Você é um herói!','Toma, uma pedrinha da lua!']},
    ],
    props:[
      {kind:'mirror',once:true,glow:40,onUse:(a)=>a.seq([
        {talk:[null,['Um espelho.','O Wrick do espelho está sorrindo.','O Wrick de verdade também está.']]},
        {wait:0.8},
        {run:()=>a.say({text:'* Finalmente, um final feliz.',style:'typed',dur:4,size:8,cps:8,color:'#ffd84a'})},
        {wait:4.5},
        {run:()=>a.say({text:'* Você tem amigos de verdade agora.',style:'typed',dur:4,size:8,cps:8,color:'#b8ff2e'})},
        {wait:4.5},
        {run:()=>{a.music.stop(0.5);}},
        {wait:1},
        {run:()=>a.endGame()},
      ],{blocking:true})},
    ],
    events:[
      {x:21,run:(a)=>a.say({text:'em casa.',style:'subtle',dur:1.4,alpha:0.4,shadow:false})},
    ],
    onStart:(a)=>{a.music.play('farm');a.say({text:'* FIM BOM DESBLOQUEADO',style:'typed',dur:3,size:8,cps:10,color:'#ffd84a'});},
  },
];
