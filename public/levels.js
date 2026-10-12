/* =====================================================================
   MISSÕES — WRICK E SEUS AMIGOS
   ===================================================================== */

function joinScreens(screens) {
  const rows = [];
  for (let r = 0; r < 12; r++) {
    rows.push(screens.map((s) => s[r]).join(''));
  }
  return rows;
}

const countdown = (a) => [
  { run: () => { a.say({ text: '3', style: 'center', dur: 0.9, size: 24 }); a.sfx('beep', 660); } },
  { wait: 1 },
  { run: () => { a.say({ text: '2', style: 'center', dur: 0.9, size: 24 }); a.sfx('beep', 770); } },
  { wait: 1 },
  { run: () => { a.say({ text: '1', style: 'center', dur: 0.9, size: 24 }); a.sfx('beep', 880); } },
  { wait: 1 },
];

const floweyTalk = {
  name: 'FLOWEY',
  sheet: 'chick',
  color: '#ffd84a',
  lines: [
    'Howdy! Eu sou FLOWEY.',
    'FLOWEY, a FLOR!',
    'Quer ouvir minha musica? Ela e bem legal!',
  ],
  choices: [
    {
      text: 'Sim, quero ouvir!',
      onSelect: (a) => {
        a.music.play('flowey');
        a.say({ text: 'Toma! Minha musica especial!', style: 'center', dur: 2.5, size: 8, color: '#ffd84a' });
        setTimeout(() => a.say({ text: 'Ela me ajuda a ficar... animado.', style: 'center', dur: 2.5, size: 8, color: '#ffd84a' }), 2600);
        setTimeout(() => a.say({ text: 'Anima a todos, ne? Hihi.', style: 'flash', dur: 1.5, size: 8, color: '#ffffff' }), 5200);
      },
    },
    {
      text: 'Nao, obrigado.',
      onSelect: (a) => {
        a.sfx('flowey_laugh');
        a.say({ text: 'Ah. Que pena.', style: 'center', dur: 2, size: 8, color: '#ffffff' });
        setTimeout(() => a.say({ text: 'Ta. Se cuida, Wrick.', style: 'center', dur: 2, size: 8, color: '#ffffff' }), 2100);
        setTimeout(() => a.scare(), 4200);
      },
    },
  ],
};

function napstablookTalk(extra) {
  return {
    name: 'NAPSTABLOOK',
    color: '#e8e8f0',
    mode: 'ghost',
    lines: (extra || []).concat([
      'oh no...',
      'eu sou o napstablook...',
      'eu fiz uma musica...',
      'quer ouvir? ...talvez...',
    ]),
    choices: [
      {
        text: 'Sim, quero ouvir.',
        onSelect: (a) => {
          a.music.play('napstablook');
          a.say({ text: '...', style: 'center', dur: 1.5, size: 8, color: '#e8e8f0' });
          setTimeout(() => a.say({ text: '...obrigado...', style: 'center', dur: 2.5, size: 8, color: '#e8e8f0' }), 1600);
          setTimeout(() => a.say({ text: 'ninguem nunca quer ouvir...', style: 'center', dur: 3, size: 8, color: '#e8e8f0' }), 4200);
          setTimeout(() => a.say({ text: 'voce e legal, Wrick.', style: 'center', dur: 2.5, size: 8, color: '#e8e8f0' }), 7300);
        },
      },
      {
        text: 'Nao, obrigado.',
        onSelect: (a) => {
          a.say({ text: 'ah...', style: 'center', dur: 1.2, size: 8, color: '#e8e8f0' });
          setTimeout(() => a.say({ text: 'tudo bem...', style: 'center', dur: 1.8, size: 8, color: '#e8e8f0' }), 1300);
          setTimeout(() => a.say({ text: 'eu ja esperava...', style: 'center', dur: 2.5, size: 8, color: '#e8e8f0' }), 3100);
          setTimeout(() => a.say({ text: 'desculpa...', style: 'center', dur: 2, size: 8, color: '#e8e8f0' }), 5700);
        },
      },
    ],
  };
}

const LEVELS = [
  /* ===== MISSAO 1 — OS OVOS DO ERI ===== */
  {
    name: 'OS OVOS DO ERI',
    theme: 'farm',
    friend: 'eri',
    item: 'egg',
    secrets: false,
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
    signs: [
      { lines: ['FAZENDINHA DO ERI', 'Amigos bem-vindos:', 'Zoom, Torajo e...', '(tem um nome riscado aqui)'] },
    ],
    friendTalk: [
      ['Cuidado com os buracos, Wrick!', 'Ovo quebrado nao tem conserto. Hihi!'],
      ['Sabia que eu ja fui pintinho?', 'Mentira. Eu sou um ovo. Hihi!'],
      ['O Zoom vai levar a gente pra lua um dia!', '...a gente quem? Ah. Eu e o Torajo.'],
      ['Voce ta quietinho, Wrick.', 'Ta tudo bem?'],
    ],
    onStart: (a) => {
      a.music.play('farm');
      a.seq([
        { wait: 0.4 },
        { talk: ['eri', ['WRICK! Voce veio!', 'Hoje e dia de colher os ovos da fazendinha!', 'Me ajuda? Depois a gente toma suco!', '...quer dizer, eu, o Zoom e o Torajo. Mas voce pode ajudar!']] },
        { wait: 3 },
        { say: 'quisDizer' },
      ], { blocking: false });
    },
    events: [
      { x: 47, run: (a) => a.say('naoMeChamam') },
      {
        x: 104,
        w: 4,
        run: (a) => {
          const edge = 112 * 16;
          a.seq([
            { run: () => { a.walkTo(edge - 46, 50); a.friendWalk(edge - 4, 45); } },
            { until: (a) => a.friend.mode === 'idle' && a.player.autoX == null },
            { run: () => { a.friendFace(-1); a.face(1); } },
            { talk: ['eri', ['Olha, Wrick! Da pra ver a fazendinha inteira daqui!', 'Obrigado por me ajudar com os ovos!']] },
            { talk: ['eri', ['Ah... posso te contar uma coisa?', 'Ontem teve festa la em casa. O Zoom e o Torajo vieram.', 'A gente nao te chamou porque...', '...sei la. Voce e meio esquisito, Wrick.', 'Mas hoje voce foi legal! Hihi!']] },
            { run: () => { a.friendFace(1); a.music.stop(2.5); } },
            { wait: 2.8 },
            { run: () => a.friendWalk(edge + 2, 22) },
            { until: (a) => a.friend.mode === 'idle' },
            { wait: 1 },
            {
              run: () => {
                a.dialog(null, ['O Eri esta na beirada...', 'O que voce faz?'], null, {
                  color: '#ffffff',
                  choices: [
                    {
                      text: 'Ei! Cuidado com a beirada!',
                      onSelect: (a2) => {
                        a2.say({ text: '* Voce avisa o Eri.', style: 'typed', dur: 2, size: 8, cps: 10, color: '#ffffff' });
                        setTimeout(() => { a2.friendWalk(edge - 30, 40); a2.friendSay('Ah! Obrigado, Wrick!'); }, 2100);
                        setTimeout(() => a2.say({ text: '* O Eri deu um pulo de alegria!', style: 'typed', dur: 3, size: 8, cps: 10, color: '#ffd84a' }), 4500);
                        setTimeout(() => a2.say({ text: '* Voce se sente bem.', style: 'typed', dur: 2.5, size: 8, cps: 10, color: '#b8ff2e' }), 8000);
                        setTimeout(() => { a2.flag('eriSalvo', true); a2.flag('easterEggGaster', true); }, 11000);
                        setTimeout(() => a2.complete('MISSAO CONCLUIDA!', { from: 3, to: 3 }), 11500);
                      },
                    },
                    {
                      text: 'Ficar quieto...',
                      onSelect: (a2) => {
                        a2.say({ text: '...', style: 'center', dur: 2, size: 8, color: '#ffffff' });
                        setTimeout(() => a2.say({ text: 'Voce nao disse nada.', style: 'center', dur: 2, size: 8, color: '#ffffff' }), 2100);
                        setTimeout(() => {
                          const f = a2.friend;
                          a2.friendLook('scared');
                          f.x = edge + 4;
                          a2.friendSay('AH!');
                          a2.friendFall(30, () => {
                            a2.sfx('crack');
                            a2.shake(0.3, 2);
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
                            { fade: [1, 1.5] },
                            { wait: 1.8 },
                            { run: () => a2.complete('MISSAO CONCLUIDA?', { from: 3, to: 2 }) },
                          ], { blocking: true });
                        }, 7200);
                      },
                    },
                    {
                      text: 'Empurrar ele...',
                      onSelect: (a2) => {
                        a2.say({ text: '* Voce empurra o Eri.', style: 'typed', dur: 2.5, size: 8, cps: 10, color: '#ff3347' });
                        setTimeout(() => {
                          const f = a2.friend;
                          f.x = edge + 6;
                          a2.friendSay('WRICK?!');
                          a2.friendFall(50, () => {
                            a2.sfx('crack');
                            a2.shake(0.4, 3);
                            a2.friend.cracked = true;
                            a2.burst(f.x + 6, f.y + 11, 20, ['#fff7e8', '#ffcf3a', '#ffffff', '#ff3347'], 80);
                          });
                        }, 2600);
                        setTimeout(() => a2.grin(true), 4600);
                        setTimeout(() => a2.flag('eriMorto', true), 5000);
                        setTimeout(() => {
                          a2.seq([
                            { wait: 2.5 },
                            ...a2.laughSteps(2),
                            { talk: ['stick', ['Agora sim.', 'Sem testemunhas.']] },
                            { wait: 0.6 },
                            { fade: [1, 1.5] },
                            { wait: 1.8 },
                            { run: () => a2.complete('MISSAO CONCLUIDA?', { from: 3, to: 1 }) },
                          ], { blocking: true });
                        }, 5200);
                      },
                    },
                  ],
                });
              },
            },
          ], { blocking: true });
        },
      },
    ],
  },

  /* ===== MISSAO 2 — O FOGUETE DO ZOOM ===== */
  {
    name: 'O FOGUETE DO ZOOM',
    theme: 'launch',
    friend: 'zoom',
    item: 'gear',
    secrets: true,
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
      { name: 'PIPO', color: '#ff9ecf', lines: ['Oi, Zoom!', '...e oi, voce.'] },
      { name: 'TUTI', color: '#7fd0ff', lines: ['Voce vai na festa do Zoom?', 'Ah. Nao? Que pena.'] },
      { name: '???', color: '#c9b3ff', mode: 'stare', lines: ['cade o ovinho?'] },
      napstablookTalk(['um foguete...', 'tao alto...']),
    ],
    signs: [
      { lines: ['BASE ESPACIAL DO ZOOM', 'Proibido mexer no foguete!'] },
      { lines: ['FESTA NO FOGUETE DO ZOOM!', 'Sabado. Todo mundo convidado!', '(menos o esquisito)'] },
    ],
    scribbles: [
      { x: 560, y: 60, text: 'ninguem me chama', alpha: 0.3 },
      { x: 1290, y: 50, text: 'eu sorrio. eu sempre sorrio.', alpha: 0.3 },
    ],
    friendTalk: [
      ['Esse foguete vai ate a lua!', 'Eu to treinando faz um tempao.'],
      ['O Eri nao respondeu minhas mensagens.', 'Estranho, ne?'],
      ['Na festa de ontem a gente brincou de astronauta!', '...ops. Esquece que eu falei da festa.'],
      ['Wrick... por que voce ta me olhando assim?'],
    ],
    props: [
      {
        kind: 'rocket',
        state: 'broken',
        lift: 0,
        liftV: 0,
        tilt: 0,
        onUse: (a, k) => {
          if (a.stars < a.starsTotal) {
            a.seq([{ talk: ['zoom', ['Ainda faltam pecas, Wrick!', 'A gente achou ' + a.stars + ' de ' + a.starsTotal + '.']] }]);
            return;
          }
          k.locked = true;
          const rx = k.x + 8;
          a.seq([
            { run: () => { a.friendWalk(rx - 30, 50); a.walkTo(rx - 56, 60); } },
            { until: (a) => a.friend.mode === 'idle' && a.player.autoX == null },
            { run: () => { a.face(1); } },
            { talk: ['zoom', ['Todas as pecas! Wrick, voce e demais!', 'Sobrou um parafuso...']] },
            { talk: ['zoom', ['Aperta pra mim? Eu seguro o foguete.']] },
            { run: () => { a.walkTo(rx - 12, 50); } },
            { until: (a) => a.player.autoX == null },
            { run: () => { a.face(1); a.player.interactT = 0.4; a.sfx('clank'); } },
            { wait: 0.45 },
            { run: () => { a.player.interactT = 0.4; a.sfx('clank'); } },
            { wait: 0.45 },
            { run: () => { a.player.interactT = 0.4; a.sfx('clank'); k.state = 'fixed'; a.burst(rx, k.y - 12, 8, ['#ffffff', '#c4c8d4'], 40); } },
            { wait: 0.8 },
            { talk: ['zoom', ['Pronto! Wrick, voce e o melhor!', 'Sobe comigo! Vamos pra lua!']] },
            { run: () => { a.walkTo(rx - 40, 50); a.friendWalk(rx, 40, () => { a.friendMode('hidden'); k.crew = true; a.sfx('door'); }); } },
            { until: (a) => a.friend.mode === 'hidden' && a.player.autoX == null },
            { run: () => { a.face(1); a.player.autoX = rx - 40; } },
            { until: (a) => a.player.autoX == null },
            { run: () => { a.say({ text: '* VOCES DOIS SUBIRAM!', style: 'typed', dur: 3, size: 8, cps: 10, color: '#ffd84a' }); a.player.autoX = rx - 30; } },
            { until: (a) => a.player.autoX == null },
            { run: () => { a.player.autoX = rx - 20; } },
            { until: (a) => a.player.autoX == null },
            { run: () => { a.player.autoX = rx - 10; } },
            { until: (a) => a.player.autoX == null },
            { run: () => { a.say({ text: '* Wrick entrou no foguete!', style: 'typed', dur: 2.5, size: 8, cps: 10, color: '#b8ff2e' }); a.player.visible = false; } },
            { wait: 0.5 },
            ...countdown(a),
            { run: () => { a.say({ text: 'DECOLAR!', style: 'center', dur: 1.2, size: 16, color: '#ffd84a' }); a.sfx('beep', 1320); a.sfx('rumble', 4); k.state = 'launch'; k.liftV = 4; k.liftA = 26; a.shake(2.5, 1); } },
            { until: () => k.lift > 46 },
            { run: () => { a.sfx('sputter'); a.debris({ kind: 'gear', x: rx + 3, y: k.y + 12 - k.lift - 14, vx: -18, vy: 10, vr: 7 }); k.liftA = -6; k.tiltV = 0.38; } },
            { until: () => k.lift > 72 || k.liftV < 4 },
            { wait: 0.4 },
            { run: () => { const ex = rx + Math.sin(k.tilt) * 10; const ey = k.y + 16 - 4 - k.lift - 24; k.state = 'gone'; k.crew = false; a.flash(0.3); a.sfx('boom'); a.shake(1.4, 4); a.burst(ex, ey, 46, ['#ffd84a', '#ff8a2a', '#ffffff', '#9a9a9a', '#5a5a5a'], 130); } },
            { wait: 3 },
            { run: () => { a.black(1); } },
            { wait: 1.5 },
            { say: 'sobrouUm' },
            { wait: 2.5 },
            { say: 'queriaSozinho' },
            { wait: 2.5 },
            { run: () => { a.flag('zoomMorto', true); a.complete('MISSAO CONCLUIDA?', { from: 2, to: 1 }); } },
          ], { blocking: true });
        },
      },
    ],
    onStart: (a) => {
      a.music.play('rocket');
      a.seq([
        { wait: 0.4 },
        { talk: ['zoom', ['Oi, Wrick! Meu foguete quebrou!', 'As pecas cairam pelo caminho todo.', 'Me ajuda a achar as 5 pecas?']] },
        { talk: ['zoom', ['Ah... cade o Eri? Ele ia vir tambem.']] },
        { talk: ['stick', ['Ele ta no morro.']] },
        { talk: ['zoom', ['...', 'Ta. Vamos la, entao.']] },
      ]);
    },
    events: [
      { x: 30, run: (a) => a.say('riemDeMim') },
      {
        x: 66,
        run: (a) => a.seq([
          { run: () => { a.music.set({ wobble: 60, detune: -50, drop: 0.2, rate: 0.92 }); a.sfx('static'); } },
          { wait: 0.5 },
          { say: 'esquisito' },
          { wait: 2.4 },
          { run: () => a.music.reset() },
        ]),
      },
      { x: 86, run: (a) => a.say('sorrioPraEles') },
    ],
  },

  /* ===== MISSAO 3 — A VILA DAS FRUTAS ===== */
  {
    name: 'A VILA DAS FRUTAS',
    theme: 'dusk',
    friend: 'torajo',
    item: 'berry',
    secrets: true,
    friendWait: 'Wrick?! nao me deixa sozinho!',
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
      { name: 'MIMI', color: '#ffd06a', mode: 'stare', lines: ['Nao vai pra vila.', 'Tem uma coisa la embaixo.'] },
      napstablookTalk(['escureceu...', 'aconteceu alguma coisa aqui?']),
    ],
    signs: [
      { lines: ['CAMINHO DA VILA DAS FRUTAS'] },
      { lines: ['VILA DAS FRUTAS', 'Populacao: 48'] },
    ],
    props: [{ kind: 'arch', noInteract: true }],
    scribbles: [
      { x: 640, y: 58, text: 'eu sou o melhor amigo deles', alpha: 0.35, color: '#ff9aa6' },
      { x: 1560, y: 66, text: 'eles so nao sabem ainda', alpha: 0.35, color: '#ff9aa6' },
    ],
    friendTalk: [
      ['Pega as frutinhas!', 'A vovo Pera faz geleia com elas.'],
      ['Cuidado com essa coisa preta no chao.', 'Ela nao tava aqui antes.'],
      ['Wrick... voce sabia da festa, ne?', 'Eu falei pra chamarem voce. Juro.', '...mais ou menos.'],
      ['Por que voce ta tao quieto?'],
    ],
    onStart: (a) => {
      a.music.play('dusk');
      a.seq([
        { wait: 0.4 },
        { talk: ['torajo', ['Wrick! Que bom que voce veio comigo.', 'Eu preciso voltar pra Vila das Frutas antes de escurecer.', 'Minha familia ta me esperando!']] },
        { talk: ['torajo', ['Ei... cade o Eri e o Zoom?', 'Ninguem responde.']] },
        { talk: ['stick', ['Eles viajaram.']] },
        { talk: ['torajo', ['Sem me chamar?']] },
        { talk: ['stick', ['Doi, ne?']] },
        { talk: ['torajo', ['...', 'Vamos logo.']] },
      ]);
    },
    events: [
      { x: 24, run: (a) => a.say('nuncaSorriram') },
      {
        x: 50,
        run: (a) => a.seq([
          { run: () => a.grin(true) },
          { talk: ['torajo', ['Wrick...', 'Por que voce ta sorrindo assim?']] },
          { run: () => a.grin(false) },
          { wait: 0.4 },
          { talk: ['stick', ['Sorrindo? Eu?']] },
        ], { blocking: true }),
      },
      { x: 70, run: (a) => { a.say('melhorAmigo'); a.shadow({ x: a.camX + 340, y: 150, vx: -280, dur: 1.4, alpha: 0.5 }); } },
      { x: 92, run: (a) => a.say('dentroDeMim') },
      { x: 104, run: (a) => a.music.set({ detune: -30, drop: 0.15 }) },
      {
        x: 122,
        w: 4,
        run: (a) => {
          const gx = 129 * 16 + 8;
          const gy = 10 * 16;
          a.seq([
            { run: () => { a.walkTo(gx - 52, 50); a.friendWalk(gx - 22, 45); } },
            { until: (a) => a.friend.mode === 'idle' && a.player.autoX == null },
            { run: () => a.face(1) },
            { talk: ['torajo', ['Chegamos! A Vila das Frutas!', '...', 'Cade todo mundo?', 'Mamae? Vovo Pera?']] },
            { run: () => { a.music.stop(2); a.friendLook('sad'); } },
            { wait: 1.5 },
            { run: () => a.friendWalk(gx, 22) },
            { until: (a) => a.friend.mode === 'idle' },
            { wait: 1 },
            { talk: ['torajo', ['As casas estao todas vazias, Wrick.', 'Tem uma coisa preta no chao...']] },
            { run: () => { a.drone(true, 0.05); a.gooStart(gx, gy); a.gooSet({ target: 14, speed: 0.6 }); a.friendLook('scared'); a.friendFace(-1); } },
            { wait: 2.2 },
            { run: () => { a.gooSet({ target: 22, tendrils: 18 }); const f = a.friend; f.mode = 'sink'; f.sinkSpd = 0.06; f.shake = true; a.heartbeat(1.4); } },
            { say: 'meAjuda' },
            { wait: 2.2 },
            { talk: ['torajo', ['WRICK! TA ME PUXANDO!', 'Por que voce ta so olhando?!']] },
            { run: () => a.grin(true) },
            { talk: ['stick', ['Porque voces tambem so olhavam.', 'Toda vez que eu queria brincar.']] },
            { run: () => { a.friend.sinkSpd = 0.25; } },
            { until: (a) => a.friend.sink >= 1 },
            { run: () => { a.friendMode('hidden'); a.friend.shake = false; a.gooSet({ target: 10, tendrils: 0, leaf: true, speed: 0.3 }); a.heartbeat(0); a.sfx('goo'); } },
            { wait: 3 },
            ...a.laughSteps(3),
            { run: () => { a.black(1); a.drone(false); } },
            { wait: 1.5 },
            { say: 'amoMeusAmigos' },
            { wait: 2.8 },
            { say: 'odeioMeusAmigos' }, 
            { wait: 3.8 },
            { wait: 2 },
{ run: () => { a.black(0); a.sfx('stinger'); a.shake(1.5, 3); a.glitch(0.8, 1.5); } },
{ wait: 1.5 },
{ run: () => { a.say({ text: '* ...', style: 'typed', dur: 2, size: 8, cps: 10, color: '#ffffff' }); } },
{ wait: 2.5 },
{ run: () => { a.say({ text: '* Voce sente algo estranho...', style: 'typed', dur: 3, size: 8, cps: 10, color: '#ff3347' }); } },
{ wait: 3.5 },
{ run: () => { a.sfx('heartbeat'); } },
{ wait: 0.4 },
{ run: () => { a.sfx('heartbeat'); } },
{ wait: 0.4 },
{ run: () => { a.sfx('heartbeat'); a.drone(true, 0.08); } },
{ wait: 2 },
{ run: () => { a.black(1); } },
{ wait: 1.5 },
{ run: () => { a.battle.startSansBattle(); } },
{ until: () => !window.Battle.active },
{ wait: 1 },
{ run: () => a.complete('FINAL RUIM', { from: 0, to: 0 }) },
          ], { blocking: true });
        },
      },
    ],
  },

  /* ===== DEPOIS — FINAL BOM ===== */
  {
    name: 'DEPOIS',
    nameGlitch: 'E SEUS AMIGOS',
    label: 'DEPOIS',
    hudLabel: '...',
    theme: 'farm',
    secrets: false,
    map: joinScreens([
      ['....................','....................','....................','....................','....................','....................','....................','....................','....................','.P..................','####################','####################'],
      ['....................','....................','....................','....................','....................','....................','....................','....................','....................','....N.........N.....','####################','####################'],
    ]),
    npcs: [
      { name: 'ERI', sheet: 'eri', lines: ['WRICK!!!', 'Voce venceu o Torajo!', 'Eu sabia que voce conseguia!', 'Voce e o melhor amigo do mundo!'] },
      { name: 'ZOOM', sheet: 'zoom', lines: ['Ei, Wrick!', 'Eu voltei da lua so pra te ver.', 'Voce e um heroi!', 'Toma, uma pedrinha da lua!'] },
    ],
    props: [
      {
        kind: 'mirror',
        once: true,
        glow: 40,
        onUse: (a) => a.seq([
          { talk: [null, ['Um espelho.', 'O Wrick do espelho esta sorrindo.', 'O Wrick de verdade tambem esta.']] },
          { wait: 0.8 },
          { run: () => a.say({ text: '* Finalmente, um final feliz.', style: 'typed', dur: 4, size: 8, cps: 8, color: '#ffd84a' }) },
          { wait: 4.5 },
          { run: () => a.say({ text: '* Voce tem amigos de verdade agora.', style: 'typed', dur: 4, size: 8, cps: 8, color: '#b8ff2e' }) },
          { wait: 4.5 },
          { run: () => { a.music.stop(0.5); } },
          { wait: 1 },
          { run: () => a.endGame() },
        ], { blocking: true }),
      },
    ],
    events: [
      { x: 21, run: (a) => a.say({ text: 'em casa.', style: 'subtle', dur: 1.4, alpha: 0.4, shadow: false }) },
    ],
    onStart: (a) => {
      a.music.play('farm');
      a.say({ text: '* FIM BOM DESBLOQUEADO', style: 'typed', dur: 3, size: 8, cps: 10, color: '#ffd84a' });
    },
  },
];
