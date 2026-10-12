/* =====================================================================
   MISSÕES — WRICK E SEUS AMIGOS
   ===================================================================== */
function joinScreens(screens) {
  const rows = [];
  for (let r = 0; r < 12; r++) rows.push(screens.map((s) => s[r]).join(''));
  return rows;
}
const countdown = (a) => ['3', '2', '1'].flatMap((n, i) => [
  { run: () => { a.say({ text: n, style: 'center', dur: 0.9, size: 24 }); a.sfx('beep', 660 + i * 110); } },
  { wait: 1 },
]);
const floweyTalk = {
  name: 'FLOWEY', sheet: 'chick', color: '#ffd84a',
  lines: ['Howdy! Eu sou FLOWEY.', 'FLOWEY, a FLOR!', 'Quer ouvir minha música? Ela é bem legal!'],
  choices: [
    { text: 'Sim, quero ouvir!', onSelect: (a) => {
        a.music.play('flowey');
        a.say({ text: 'Toma! Minha música especial!', style: 'center', dur: 2.5, size: 8, color: '#ffd84a' });
        setTimeout(() => a.say({ text: 'Ela me ajuda a ficar... animado.', style: 'center', dur: 2.5, size: 8, color: '#ffd84a' }), 2600);
        setTimeout(() => a.say({ text: 'Anima a todos, né? Hihi.', style: 'flash', dur: 1.5, size: 8, color: '#ffffff' }), 5200);
      } },
    { text: 'Não, obrigado.', onSelect: (a) => {
        a.sfx('flowey_laugh');
        a.say({ text: 'Ah. Que pena.', style: 'center', dur: 2, size: 8, color: '#ffffff' });
        setTimeout(() => a.say({ text: 'Tá. Se cuida, Wrick.', style: 'center', dur: 2, size: 8, color: '#ffffff' }), 2100);
        setTimeout(() => a.scare(), 4200);
      } },
  ],
};
function napstablookTalk(extra) {
  return {
    name: 'NAPSTABLOOK', color: '#e8e8f0', mode: 'ghost',
    lines: (extra || []).concat(['oh no...', 'eu sou o napstablook...', 'eu fiz uma música...', 'quer ouvir? ...talvez...']),
    choices: [
      { text: 'Sim, quero ouvir.', onSelect: (a) => {
          a.music.play('napstablook');
          a.say({ text: '...', style: 'center', dur: 1.5, size: 8, color: '#e8e8f0' });
          setTimeout(() => a.say({ text: '...obrigado...', style: 'center', dur: 2.5, size: 8, color: '#e8e8f0' }), 1600);
          setTimeout(() => a.say({ text: 'ninguém nunca quer ouvir...', style: 'center', dur: 3, size: 8, color: '#e8e8f0' }), 4200);
          setTimeout(() => a.say({ text: 'você é legal, Wrick.', style: 'center', dur: 2.5, size: 8, color: '#e8e8f0' }), 7300);
        } },
      { text: 'Não, obrigado.', onSelect: (a) => {
          a.say({ text: 'ah...', style: 'center', dur: 1.2, size: 8, color: '#e8e8f0' });
          setTimeout(() => a.say({ text: 'tudo bem...', style: 'center', dur: 1.8, size: 8, color: '#e8e8f0' }), 1300);
          setTimeout(() => a.say({ text: 'eu já esperava...', style: 'center', dur: 2.5, size: 8, color: '#e8e8f0' }), 3100);
          setTimeout(() => a.say({ text: 'desculpa...', style: 'center', dur: 2, size: 8, color: '#e8e8f0' }), 5700);
        } },
    ],
  };
}

const LEVELS = [
  // ===== MISSÃO 1 — OS OVOS DO ERI =====
  {
    name: 'OS OVOS DO ERI', theme: 'farm', friend: 'eri', item: 'egg', secrets: false,
    friendWait: 'me espera!',
    map: joinScreens([
      ['....................','....................','....................','....................','....................','....................','....................','..........o.........','.........===........','.PN.S.f..N.L.N..R.N.','####################','####################'],
      ['....................','....................','....................','....................','....................','.............o......','............===.....','.......o............','......===.......o...','..N.f.......L.L.....','####################','####################'],
      ['....................','....................','....................','....................','....................','....................','.........o..........','....o...===....o....','...===.........==...','.b........T.......f.','#####..#######..####','#####..#######..####'],
      ['....................','....................','....................','....................','..............o.....','.............===....','.........o..........','........===.........','....o...............','.c...........Y...f..','####################','####################'],
      ['....................','....................','....................','....................','....................','....................','...........o........','..........===.......','....................','..H...f..........b..','########...#########','########...#########'],
      ['....................','....................','....................','....................','..........o.........','....................','.......#######......','....o.########......','....##########......','.c..##########...f..','####################','####################'],
    ]),
    npcs: [
      floweyTalk,
      { name: 'PINTINHO', sheet: 'chick', lines: ['Piu!', 'Piu piu!'] },
      { name: 'PINTINHO', sheet: 'chick', mode: 'stare', lines: ['...', 'piu.'] },
      { name: 'PINTINHO', sheet: 'chick', lines: ['Piu piu piu?'] },
      napstablookTalk(),
    ],
    signs: [{ lines: ['FAZENDINHA DO ERI', 'Amigos bem-vindos:', 'Zoom, Torajo e...', '(tem um nome riscado aqui)'] }],
    friendTalk: [
      ['Cuidado com os buracos, Wrick!', 'Ovo quebrado não tem conserto. Hihi!'],
      ['Sabia que eu já fui pintinho?', 'Mentira. Eu sou um ovo. Hihi!'],
      ['O Zoom vai levar a gente pra lua um dia!', '...a gente quem? Ah. Eu e o Torajo.'],
      ['Você tá quietinho, Wrick.', 'Tá tudo bem?'],
    ],
    onStart: (a) => {
      a.music.play('farm');
      a.seq([
        { wait: 0.4 },
        { talk: ['eri', ['WRICK! Você veio!', 'Hoje é dia de colher os ovos da fazendinha!', 'Me ajuda? Depois a gente toma suco!', '...quer dizer, eu, o Zoom e o Torajo. Mas você pode ajudar!']] },
        { wait: 3 },
        { say: 'quisDizer' },
      ], { blocking: false });
    },
    events: [
      { x: 47, run: (a) => a.say('naoMeChamam') },
      // ===== CENA DO PENHASCO — ESCOLHA =====
      { x: 106, w: 4, run: (a) => {
        const edge = 114 * 16;
        a.seq([
          { run: () => { a.walkTo(edge - 46, 50); a.friendWalk(edge - 10, 45); } },
          { until: (a) => a.friend.mode === 'idle' && a.player.autoX == null },
          { run: () => { a.friendFace(-1); a.face(1); } },
          { talk: ['eri', ['Olha, Wrick! Dá pra ver a fazendinha inteira daqui!', 'Obrigado por me ajudar com os ovos!']] },
          { talk: ['eri', ['Ah... posso te contar uma coisa?', 'Ontem teve festa lá em casa. O Zoom e o Torajo vieram.', 'A gente não te chamou porque...', '...sei lá. Você é meio esquisito, Wrick.', 'Mas hoje você foi legal! Hihi!']] },
          { run: () => { a.friendFace(1); a.music.stop(2.5); } },
          { wait: 2.8 },
          // Eri chega na beirada
          { run: () => a.friendWalk(edge + 4, 22) },
          { until: (a) => a.friend.mode === 'idle' },
          { wait: 1 },
          // aparecem 2 opções
          {
            run: () => {
              // escolha 1: empurrar (ajudar)
              // escolha 2: ficar quieto (deixar cair)
              const dialog = {
                name: null, color: '#ffffff', lines: ['O Eri está na beirada...', 'O que você faz?'],
                choices: [
                  { text: 'Ei, você está na beirada!', onSelect: (a2) => {
                      // caminho feliz
                      a2.say({ text: '* Você avisa o Eri.', style: 'typed', dur: 2, size: 8, cps: 10, color: '#ffffff' });
                      setTimeout(() => {
                        a2.friendWalk(edge - 30, 40);
                        a2.friendSay('Ah! Obrigado, Wrick!');
                      }, 2100);
                      setTimeout(() => a2.say({ text: '* O Eri deu um pulo de alegria!', style: 'typed', dur: 3, size: 8, cps: 10, color: '#ffd84a' }), 4500);
                      setTimeout(() => a2.say({ text: '* Você se sente bem.', style: 'typed', dur: 2.5, size: 8, cps: 10, color: '#b8ff2e' }), 8000);
                      setTimeout(() => a2.flag('eriSalvo', true), 11000);
                      setTimeout(() => a2.flag('easterEggGaster', true), 11500);
                      setTimeout(() => a2.complete('MISSÃO CONCLUÍDA!', { from: 3, to: 3 }), 12000);
                    } },
                  { text: 'Ficar quieto...', onSelect: (a2) => {
                      // caminho triste
                      a2.say({ text: '...', style: 'center', dur: 2, size: 8, color: '#ffffff' });
                      setTimeout(() => a2.say({ text: 'Você não disse nada.', style: 'center', dur: 2, size: 8, color: '#ffffff' }), 2100);
                      setTimeout(() => {
                        // Eri cai
                        const f = a2.friend;
                        a2.friendLook('scared');
                        f.x = edge + 2;
                        a2.friendSay('AH!');
                        a2.friendFall(30, () => {
                          a2.sfx('crack'); a2.shake(0.3, 2);
                          a2.friend.cracked = true;
                          a2.burst(f.x + 6, f.y + 11, 14, ['#fff7e8', '#ffcf3a', '#ffffff'], 60);
                        });
                      }, 4200);
                      setTimeout(() => a2.flag('eriMorto', true), 7000);
                      setTimeout(() => {
                        a2.seq([
                          { wait: 2.5 },
                          ...a2.laughSteps(1),
                          { talk: ['stick', ['Ops.', 'Ele escorregou.']] },
                          { wait: 0.6 },
                          { fade: [1, 1.5] }, { wait: 1.8 },
                          { run: () => a2.complete('MISSÃO CONCLUÍDA?', { from: 3, to: 2 }) },
                        ], { blocking: true });
                      }, 7200);
                    } },
                ],
              };
              a.dialog(dialog.name, dialog.lines, null, { color: dialog.color, choices: dialog.choices });
            },
          },
        ], { blocking: true });
      } },
    ],
  },

  // ===== MISSÃO 2 — O FOGUETE DO ZOOM =====
  {
    name: 'O FOGUETE DO ZOOM', theme: 'launch', friend: 'zoom', item: 'gear', secrets: true,
    friendWait: 'ei, Wrick! aqui!',
    map: joinScreens([
      ['....................','....................','....................','....................','....................','....................','....................','.............o......','............===.....','.P...S..T......b....','####################','####################'],
      ['....................','....................','....................','....................','....................','............o.......','..........=====.....','....................','.....===............','..N.............N...','#######...##########','#######...##########'],
      ['....................','....................','....................','...BBBBBBBBBBBBB....','...BBBBBBBBBBBBB....','....................','....................','...........o........','.......BB..BB.......','..c...BBB..BBB..f...','####################','####################'],
      ['....................','....................','....................','....................','...............o....','..............===...','..........===.......','......===...........','....................','..N....Y............','#############...####','#############...####'],
      ['....................','....................','....................','....................','....................','....................','.........o..........','........===.........','....................','..f...S.......^^..N.','####################','####################'],
      ['....................','....................','....................','....................','....................','....................','....................','....................','....................','..c..S.......K......','####################','####################'],
    ]),
    npcs: [
      { name: 'PIPO', color: '#ff9ecf', lines: ['Oi, Zoom!', '...e oi, você.'] },
      { name: 'TUTI', color: '#7fd0ff', lines: ['Você vai na festa do Zoom?', 'Ah. Não? Que pena.'] },
      { name: '???', color: '#c9b3ff', mode: 'stare', lines: ['cadê o ovinho?'] },
      napstablookTalk(['um foguete...', 'tão alto...']),
    ],
    signs: [
      { lines: ['BASE ESPACIAL DO ZOOM', 'Proibido mexer no foguete!'] },
      { lines: ['FESTA NO FOGUETE DO ZOOM!', 'Sábado. Todo mundo convidado!', '(menos o esquisito)'] },
    ],
    scribbles: [
      { x: 560, y: 60, text: 'ninguém me chama', alpha: 0.3 },
      { x: 1290, y: 50, text: 'eu sorrio. eu sempre sorrio.', alpha: 0.3 },
    ],
    friendTalk: [
      ['Esse foguete vai até a lua!', 'Eu tô treinando faz um tempão.'],
      ['O Eri não respondeu minhas mensagens.', 'Estranho, né?'],
      ['Na festa de ontem a gente brincou de astronauta!', '...ops. Esquece que eu falei da festa.'],
      ['Wrick... por que você tá me olhando assim?'],
    ],
    props: [
      { kind: 'rocket', state: 'broken', lift: 0, liftV: 0, tilt: 0,
        onUse: (a, k) => {
          if (a.stars < a.starsTotal) {
            a.seq([{ talk: ['zoom', ['Ainda faltam peças, Wrick!', 'A gente achou ' + a.stars + ' de ' + a.starsTotal + '.']] }]);
            return;
          }
          k.locked = true;
          const rx = k.x + 8;
          const explode = () => {
            const ex = rx + Math.sin(k.tilt) * 10, ey = k.y + 16 - 4 - k.lift - 24;
            k.state = 'gone'; k.crew = false;
            a.flash(0.3); a.sfx('boom'); a.shake(1.4, 4);
            a.burst(ex, ey, 46, ['#ffd84a', '#ff8a2a', '#ffffff', '#9a9a9a', '#5a5a5a'], 130);
            for (let i = 0; i < 9; i++) a.debris({ kind: 'panel', color: i % 3 ? '#f4f4f4' : '#ff8a2a', x: ex + Math.random() * 10 - 5, y: ey, vx: Math.random() * 160 - 80, vy: -Math.random() * 140, vr: Math.random() * 12 - 6 });
            a.debris({ kind: 'helmet', x: ex, y: ey, vx: -42, vy: -130, vr: -5 });
          };
          a.seq([
            { run: () => { a.friendWalk(rx - 30, 50); a.walkTo(rx - 56, 60); } },
            { until: (a) => a.friend.mode === 'idle' && a.player.autoX == null },
            { run: () => { a.face(1); } },
            { talk: ['zoom', ['Todas as peças! Wrick, você é demais!', 'Agora... só tem um probleminha.', 'Só cabe UM no foguete.', 'Eu ia levar o Eri. Mas ele escorregou, né?', 'Então eu vou sozinho!', 'Desculpa, Wrick. Você nunca foi muito... do grupo.']] },
            { talk: ['stick', ['Tudo bem, Zoom.', 'Deixa que eu aperto o último parafuso pra você.']] },
            { run: () => a.walkTo(rx - 12, 50) },
            { until: (a) => a.player.autoX == null },
            { run: () => { a.face(1); a.player.interactT = 0.4; a.sfx('clank'); } }, { wait: 0.45 },
            { run: () => { a.player.interactT = 0.4; a.sfx('clank'); } }, { wait: 0.45 },
            { run: () => { a.player.interactT = 0.4; a.sfx('clank'); k.state = 'fixed'; a.burst(rx, k.y - 12, 8, ['#ffffff', '#c4c8d4'], 40); } },
            { wait: 0.7 },
            { say: 'sobrouUm' },
            { talk: ['stick', ['Pronto.']] },
            { run: () => { a.walkTo(rx - 56, 50); a.friendWalk(rx, 40, () => { a.friendMode('hidden'); k.crew = true; a.sfx('door'); }); } },
            { until: (a) => a.friend.mode === 'hidden' && a.player.autoX == null },
            { run: () => a.face(1) },
            { wait: 0.8 },
            { talk: ['zoom', ['Tchau, Wrick!', 'Eu trago uma pedrinha da lua pra você!', '...talvez.']] },
            { run: () => a.music.stop(1) }, { wait: 1.2 },
            ...countdown(a),
            { run: () => { a.say({ text: 'DECOLAR!', style: 'center', dur: 1.2, size: 16, color: '#ffd84a' }); a.sfx('beep', 1320); a.sfx('rumble', 4); k.state = 'launch'; k.liftV = 4; k.liftA = 26; a.shake(2.5, 1); } },
            { until: () => k.lift > 46 },
            { run: () => { a.sfx('sputter'); a.debris({ kind: 'gear', x: rx + 3, y: k.y + 12 - k.lift - 14, vx: -18, vy: 10, vr: 7 }); k.liftA = -6; k.tiltV = 0.38; } },
            { until: () => k.lift > 72 || k.liftV < 4 },
            { wait: 0.4 },
            { run: explode },
            { wait: 3 },
            ...a.laughSteps(2),
            { talk: ['stick', ['Ele queria ir sozinho.', 'Agora ele foi.']] },
            { wait: 0.6 },
            { run: () => a.flag('zoomMorto', true) },
            // ===== BATALHA COM O ZOOM =====
            { wait: 1.5 },
            { run: () => { a.say({ text: '...', style: 'center', dur: 2, size: 8, color: '#ffffff' }); } },
            { run: () => { a.say({ text: 'VOCÊ MATOU O PRIMO DELE.', style: 'flash', dur: 1.2, size: 8, color: '#ff3347' }); } },
            { wait: 2.5 },
            { run: () => { a.battle.startZoomBattle(a); } },
          ], { blocking: true });
        } },
    ],
    onStart: (a) => {
      a.music.play('rocket');
      a.seq([
        { wait: 0.4 },
        { talk: ['zoom', ['Oi, Wrick! Meu foguete quebrou!', 'As peças caíram pelo caminho todo.', 'Me ajuda a achar as 5 peças?']] },
        { talk: ['zoom', ['Ah... cadê o Eri? Ele ia vir também.']] },
        { talk: ['stick', ['Ele escorregou.']] },
        { talk: ['zoom', ['...', 'Tá. Vamos lá, então.']] },
      ]);
    },
    events: [
      { x: 30, run: (a) => a.say('riemDeMim') },
      { x: 66, run: (a) => a.seq([
        { run: () => { a.music.set({ wobble: 60, detune: -50, drop: 0.2, rate: 0.92 }); a.sfx('static'); } },
        { wait: 0.5 },
        { say: 'esquisito' },
        { wait: 2.4 },
        { run: () => a.music.reset() },
      ]) },
      { x: 86, run: (a) => a.say('sorrioPraEles') },
    ],
  },

  // ===== MISSÃO 3 — A VILA DAS FRUTAS =====
  {
    name: 'A VILA DAS FRUTAS', theme: 'dusk', friend: 'torajo', item: 'berry', secrets: true,
    friendWait: 'Wrick?! não me deixa sozinho!',
    map: joinScreens([
      ['....................','....................','....................','....................','....................','....................','....................','..........o.........','.........===........','.P..S....T.....T.f..','####################','####################'],
      ['....................','....................','....................','....................','....................','.............o......','............===.....','.......===..........','..o.................','.....T....^^....T...','####################','####################'],
      ['....................','....................','....................','....................','....................','....................','........o...........','.......===....o.....','.............===....','..N...........b..Y..','######...###########','######...###########'],
      ['....................','....................','....................','....................','....................','...........o........','..........===.......','.....===.......===..','....................','.c....^^...T...^^...','####################','####################'],
      ['....................','....................','....................','....................','....................','....................','.........o..........','.......=====........','....................','..T...^^^.....^^..T.','####################','####################'],
      ['....................','....................','....................','....................','....................','....................','....................','....................','..........N.........','.c..S.....K....U....','####################','####################'],
      ['....................','....................','....................','....................','....................','....................','....................','....................','....................','..U...........U...U.','####################','####################'],
    ]),
    npcs: [
      { name: 'MIMI', color: '#ffd06a', mode: 'stare', lines: ['Não vai pra vila.', 'Tem uma coisa lá embaixo.'] },
      napstablookTalk(['escureceu...', 'aconteceu alguma coisa aqui?']),
    ],
    signs: [
      { lines: ['CAMINHO DA VILA DAS FRUTAS →'] },
      { lines: ['VILA DAS FRUTAS', 'População: 48'] },
    ],
    props: [{ kind: 'arch', noInteract: true }],
    scribbles: [
      { x: 640, y: 58, text: 'eu sou o melhor amigo deles', alpha: 0.35, color: '#ff9aa6' },
      { x: 1560, y: 66, text: 'eles só não sabem ainda', alpha: 0.35, color: '#ff9aa6' },
    ],
    friendTalk: [
      ['Pega as frutinhas!', 'A vovó Pera faz geleia com elas.'],
      ['Cuidado com essa coisa preta no chão.', 'Ela não tava aqui antes.'],
      ['Wrick... você sabia da festa, né?', 'Eu falei pra chamarem você. Juro.', '...mais ou menos.'],
      ['Por que você tá tão quieto?'],
    ],
    onStart: (a) => {
      a.music.play('dusk');
      a.seq([
        { wait: 0.4 },
        { talk: ['torajo', ['Wrick! Que bom que você veio comigo.', 'Eu preciso voltar pra Vila das Frutas antes de escurecer.', 'Minha família tá me esperando!']] },
        { talk: ['torajo', ['Ei... cadê o Eri e o Zoom?', 'Ninguém responde.']] },
        { talk: ['stick', ['Eles viajaram.']] },
        { talk: ['torajo', ['Sem me chamar?']] },
        { talk: ['stick', ['Dói, né?']] },
        { talk: ['torajo', ['...', 'Vamos logo.']] },
      ]);
    },
    events: [
      { x: 24, run: (a) => a.say('nuncaSorriram') },
      { x: 50, run: (a) => a.seq([
        { run: () => a.grin(true) },
        { talk: ['torajo', ['Wrick...', 'Por que você tá sorrindo assim?']] },
        { run: () => a.grin(false) },
        { wait: 0.4 },
        { talk: ['stick', ['Sorrindo? Eu?']] },
      ], { blocking: true }) },
      { x: 70, run: (a) => { a.say('melhorAmigo'); a.shadow({ x: a.camX + 340, y: 150, vx: -280, dur: 1.4, alpha: 0.5 }); } },
      { x: 92, run: (a) => a.say('dentroDeMim') },
      { x: 104, run: (a) => a.music.set({ detune: -30, drop: 0.15 }) },
      { x: 122, w: 4, run: (a) => {
        const gx = 129 * 16 + 8, gy = 10 * 16;
        a.seq([
          { run: () => { a.walkTo(gx - 52, 50); a.friendWalk(gx - 22, 45); } },
          { until: (a) => a.friend.mode === 'idle' && a.player.autoX == null },
          { run: () => a.face(1) },
          { talk: ['torajo', ['Chegamos! A Vila das Frutas!', '...', 'Cadê todo mundo?', 'Mamãe? Vovó Pera?']] },
          { run: () => { a.music.stop(2); a.friendLook('sad'); } },
          { wait: 1.5 },
          { run: () => a.friendWalk(gx, 22) },
          { until: (a) => a.friend.mode === 'idle' },
          { wait: 1 },
          { talk: ['torajo', ['As casas estão todas vazias, Wrick.', 'Tem uma coisa preta no chão...']] },
          { run: () => { a.drone(true, 0.05); a.gooStart(gx, gy); a.gooSet({ target: 14, speed: 0.6 }); a.friendLook('scared'); a.friendFace(-1); } },
          { wait: 2.2 },
          { run: () => { a.gooSet({ target: 22, tendrils: 18 }); const f = a.friend; f.mode = 'sink'; f.sinkSpd = 0.06; f.shake = true; a.heartbeat(1.4); } },
          { say: 'meAjuda' }, { wait: 2.2 },
          { talk: ['torajo', ['WRICK! TÁ ME PUXANDO!', 'Por que você tá só olhando?!']] },
          { run: () => a.grin(true) },
          { talk: ['stick', ['Porque vocês também só olhavam.', 'Toda vez que eu queria brincar.']] },
          { run: () => { a.friend.sinkSpd = 0.25; } },
          { until: (a) => a.friend.sink >= 1 },
          { run: () => { a.friendMode('hidden'); a.friend.shake = false; a.gooSet({ target: 10, tendrils: 0, leaf: true, speed: 0.3 }); a.heartbeat(0); a.sfx('goo'); } },
          { wait: 3 },
          ...a.laughSteps(3),
          { run: () => { a.black(1); a.drone(false); } },
          { wait: 1.5 },
          { say: 'amoMeusAmigos' }, { wait: 2.8 },
          { say: 'odeioMeusAmigos' }, { wait: 3.8 },
          // ===== EASTER EGG: SE MATOU ZOOM E ERI, TORAJO DÁ FLOWEY =====
          { run: () => {
            if (a.flag('zoomMorto') && a.flag('eriMorto')) {
              a.say({ text: '* Você matou todos os seus amigos.', style: 'typed', dur: 3.5, size: 8, cps: 10, color: '#ff3347' });
              setTimeout(() => a.say({ text: '* Só sobrou o Torajo.', style: 'typed', dur: 3, size: 8, cps: 10, color: '#ffffff' }), 4000);
              setTimeout(() => a.say({ text: 'Torajo: Você matou eles.', style: 'center', dur: 3, size: 8, color: '#a6ec5a' }), 7500);
              setTimeout(() => a.say({ text: 'Torajo: Você e eu...', style: 'center', dur: 3, size: 8, color: '#a6ec5a' }), 10800);
              setTimeout(() => a.say({ text: 'Torajo: Dupla perfeita ou desequilibrada.', style: 'center', dur: 4, size: 8, color: '#a6ec5a' }), 14000);
              setTimeout(() => a.say({ text: '* EASTER EGG DESBLOQUEADO: FLOWEY', style: 'typed', dur: 4, size: 8, cps: 8, color: '#ffd84a' }), 18500);
              setTimeout(() => a.flag('easterEggFlowey', true), 23000);
              setTimeout(() => a.complete('MISSÃO CONCLUÍDA?', { from: 1, to: 0 }), 23500);
            } else {
              setTimeout(() => a.complete('MISSÃO CONCLUÍDA?', { from: 1, to: 0 }), 100);
            }
          } },
        ], { blocking: true });
      } },
    ],
  },

  // ===== DEPOIS — SOZINHO =====
  {
    name: 'SOZINHO', nameGlitch: 'E SEUS AMIGOS', label: 'DEPOIS', hudLabel: '...',
    theme: 'alone', secrets: true,
    map: joinScreens([
      ['....................','....................','....................','....................','....................','....................','....................','....................','....................','.P....N.....N.....N.','####################','####################'],
      ['....................','....................','....................','BBBBBBBBBBBBBBBBBBBB','....................','....................','....................','....................','..........N.........','....K.....K.....K...','####################','####################'],
      ['....................','....................','....................','BBBBBBBBBBBBBBBBBBBB','...................B','...................B','...................B','...................B','...................B','........K..........B','####################','####################'],
    ]),
    regions: [{ type: 'room', x1: 20, x2: 58, y1: 4, y2: 9 }],
    npcs: [
      { name: 'ERI', sheet: 'eri', mode: 'ghost', lines: ['...', 'a gente tinha medo de você, Wrick.'] },
      { name: 'ZOOM', sheet: 'zoom', mode: 'ghost', lines: ['era só falar com a gente.'] },
      { name: 'TORAJO', sheet: 'torajo', mode: 'ghost', lines: ['você sorria o tempo todo.', 'até quando ninguém tava olhando.'] },
      napstablookTalk(['você ainda tá aqui...', 'todo mundo foi embora...']),
    ],
    props: [
      { kind: 'photo', onUse: (a) => a.dialog(null, ['Uma foto do grupo.', 'Eri, Zoom e Torajo, sorrindo.', 'Do lado deles tem um buraco recortado.', 'Do tamanho do Wrick.']) },
      { kind: 'invite', onUse: (a) => a.dialog(null, ['Um convite cor-de-rosa.', '"FESTA DO ZOOM! Convidados: Eri, Torajo..."', '"NÃO chamar o Wrick. Ele é estranho."', 'A letra é do Eri.'], () => a.flag('convite', true)) },
      { kind: 'crayons', onUse: (a) => a.dialog(null, ['Desenhos de giz de cera.', 'Wrick e seus amigos, de mãos dadas.', 'Wrick e seus amigos, na lua.', 'No último, os amigos têm um X no lugar dos olhos.']) },
      { kind: 'mirror', once: true, glow: 40, onUse: (a) => a.seq([
        { talk: [null, ['Um espelho.', 'O Wrick do espelho está sorrindo.', 'O Wrick de verdade não está.']] },
        { wait: 0.8 },
        { run: () => a.say({ text: '* Apesar de tudo, ainda é você.', style: 'typed', dur: 5, size: 8, cps: 8 }) },
        { wait: 5.5 },
        { run: () => { a.music.stop(0.5); a.drone(false); a.heartbeat(0.8); } },
        { wait: 1.2 },
        { say: 'deixaramDeFora' }, { wait: 3.4 },
        { say: 'deixeiDeFora' }, { wait: 3.9 },
        { run: () => { a.black(1); a.heartbeat(0); } },
        { wait: 2.6 },
        { run: () => a.endGame() },
      ], { blocking: true }) },
    ],
    events: [
      { x: 21, run: (a) => a.say({ text: 'casa.', style: 'subtle', dur: 1.4, alpha: 0.35, shadow: false }) },
    ],
    update(a, dt) {
      if (a.flag('convite') && !a.flag('susto') && a.tileX() <= 26 && a.player.vx < -20) { a.flag('susto', true); a.scare(); }
    },
    onStart: (a) => { a.music.play('musicbox'); a.drone(true, 0.04); },
  },
];
