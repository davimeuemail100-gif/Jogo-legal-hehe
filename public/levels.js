/* =====================================================================
   MISSÕES — mapas desenhados em texto + falas + cenas
   ---------------------------------------------------------------------
   Cada missão é feita de "telas" de 20 colunas x 12 linhas, coladas lado
   a lado. Cada caractere é um bloco de 16x16 pixels.

   LEGENDA DO MAPA
     .  ar                      #  terra com grama (sólido)
     B  pedra / tijolo (sólido) =  plataforma (atravessa por baixo)
     ~  plataforma "bugada" (some logo depois que você pisa)
     ^  espinhos (na missão 3 viram poças de gosma preta — matam igual)
     o  item da missão (ovo, peça ou frutinha — veja "item")
     P  início do Stick         c  checkpoint
     N  NPC     S  placa        K  objeto (foguete, espelho, foto...)
     T  árvore  Y  árvore com rosto  H  casa  f  flor  b  arbusto
     R  celeiro L  cerca        U  casinha de fruta

   CAMPOS DE CADA MISSÃO
     friend:     'eri' | 'zoom' | 'torajo'  → o amigo que segue o Stick
     item:       'egg' | 'gear' | 'berry'   → o que se coleta
     friendTalk: o que o amigo diz quando você aperta E perto dele
                 (uma conversa por vez; a última se repete)
     friendWait: o que ele grita se você for longe demais

   EVENTOS
     events: [{ x, w, once, when(a), run(a) }] → dispara na coluna x.
     update(a, dt) roda todo quadro · onStart(a)

   A "API" (a) — veja game.js:
     a.say(...) · a.music.play/stop/set/reset · a.sfx(nome) · a.drone(on, vol)
     a.heartbeat(batidas/s) · a.glitch · a.shake · a.flash · a.scare()
     a.seq([...passos], { blocking: true })  — passos:
        { wait: s } { until: (a) => cond } { say: 'chave' } { run: (a) => ... }
        { black: 0..1 } { fade: [alvo, segundos] } { talk: ['eri', ['linhas']] }
     Stick:  a.walkTo(x, vel) · a.face(±1) · a.grin(true/false) · a.laughSteps(1..3)
     Amigo:  a.friendWalk(x, vel, aoChegar) · a.friendLook('scared'|'sad'|null)
             a.friendFace(±1) · a.friendFall(vx, aoCair) · a.friendMode('hidden')
             a.friendSay('texto')
     Gosma:  a.gooStart(x, chãoY) · a.gooSet({ target, tendrils, leaf })
     Fim:    a.complete('MISSÃO CONCLUÍDA!', { from: 3, to: 2 }) · a.endGame()
   ===================================================================== */

// Cola várias telas (arrays de 12 linhas) em um único mapa.
function joinScreens(screens) {
  const rows = [];
  for (let r = 0; r < 12; r++) rows.push(screens.map((s) => s[r]).join(''));
  return rows;
}

// Contagem regressiva do foguete.
const countdown = (a) => ['3', '2', '1'].flatMap((n, i) => [
  { run: () => { a.say({ text: n, style: 'center', dur: 0.9, size: 24 }); a.sfx('beep', 660 + i * 110); } },
  { wait: 1 },
]);

const LEVELS = [
  /* ================================================================
     MISSÃO 1 — OS OVOS DO ERI  (100% fofo... até o fim)
     ================================================================ */
  {
    name: 'OS OVOS DO ERI',
    theme: 'farm',
    friend: 'eri',
    item: 'egg',
    secrets: false,
    friendWait: 'me espera!',
    map: joinScreens([
      [ // tela 1 — a fazendinha
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '..........o.........',
        '.........===........',
        '.P..S.f....L.L..R...',
        '####################',
        '####################',
      ],
      [ // tela 2
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '.............o......',
        '............===.....',
        '.......o............',
        '......===.......o...',
        '..N.f.......L.L.....',
        '####################',
        '####################',
      ],
      [ // tela 3 — buraquinhos
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '.........o..........',
        '....o...===....o....',
        '...===.........==...',
        '.b........T.......f.',
        '#####..#######..####',
        '#####..#######..####',
      ],
      [ // tela 4
        '....................',
        '....................',
        '....................',
        '....................',
        '..............o.....',
        '.............===....',
        '.........o..........',
        '........===.........',
        '....o...............',
        '.c.....N.....Y...f..',
        '####################',
        '####################',
      ],
      [ // tela 5 — a casa do Eri
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '...........o........',
        '..........===.......',
        '....o...........o...',
        '..H...f..........b..',
        '########...#########',
        '########...#########',
      ],
      [ // tela 6 — o morro (de onde se vê a fazendinha toda)
        '....................',
        '....................',
        '....................',
        '....................',
        '..........o.........',
        '....................',
        '.......#######......',
        '....o.########......',
        '....##########......',
        '.c..##########...f..',
        '####################',
        '####################',
      ],
    ]),
    npcs: [
      { name: 'PINTINHO', sheet: 'chick', lines: ['Piu!', 'Piu piu!'] },
      { name: 'PINTINHO', sheet: 'chick', mode: 'stare', lines: ['...', 'piu.'] },
    ],
    signs: [
      { lines: ['FAZENDINHA DO ERI', 'Amigos bem-vindos:', 'Zoom, Torajo e...', '(tem um nome riscado aqui)'] },
    ],
    friendTalk: [
      ['Cuidado com os buracos, Stick!', 'Ovo quebrado não tem conserto. Hihi!'],
      ['Sabia que eu já fui pintinho?', 'Mentira. Eu sou um ovo. Hihi!'],
      ['O Zoom vai levar a gente pra lua um dia!', '...a gente quem? Ah. Eu e o Torajo.'],
      ['Você tá quietinho, Stick.', 'Tá tudo bem?'],
    ],
    onStart: (a) => {
      a.music.play('farm');
      a.seq([
        { wait: 0.4 },
        { talk: ['eri', ['STICK! Você veio!', 'Hoje é dia de colher os ovos da fazendinha!',
          'Me ajuda? Depois a gente toma suco!', '...quer dizer, eu, o Zoom e o Torajo. Mas você pode ajudar!']] },
        { wait: 3 },
        { say: 'quisDizer' },
      ], { blocking: false });
    },
    events: [
      // Um pensamento. Rápido demais.
      { x: 47, run: (a) => a.say('naoMeChamam') },
      // ---------- O MORRO ----------
      { x: 106, w: 4, run: (a) => {
        const edge = 114 * 16; // a borda do morro
        a.seq([
          { run: () => { a.walkTo(edge - 46, 50); a.friendWalk(edge - 10, 45); } },
          { until: (a) => a.friend.mode === 'idle' && a.player.autoX == null },
          { run: () => { a.friendFace(-1); a.face(1); } },
          { talk: ['eri', ['Olha, Stick! Dá pra ver a fazendinha inteira daqui!', 'Obrigado por me ajudar com os ovos!']] },
          { talk: ['eri', ['Ah... posso te contar uma coisa?', 'Ontem teve festa lá em casa. O Zoom e o Torajo vieram.',
            'A gente não te chamou porque...', '...sei lá. Você é meio esquisito, Stick.', 'Mas hoje você foi legal! Hihi!']] },
          { run: () => { a.friendFace(1); a.music.stop(2.5); } }, // o Eri olha a paisagem
          { wait: 2.8 },
          { run: () => a.walkTo(edge - 22, 18) },               // o Stick chega perto. Devagar.
          { until: (a) => a.player.autoX == null },
          { wait: 1 },
          { black: 1 }, { run: () => a.sfx('thud') },
          { wait: 0.7 },
          { run: () => {
            const f = a.friend;
            a.friendLook('scared');
            f.x = edge + 2;
            a.friendSay('AH!');
            a.friendFall(30, () => {
              a.sfx('crack'); a.shake(0.3, 2);
              a.friend.cracked = true;
              a.burst(a.friend.x + 6, a.friend.y + 11, 14, ['#fff7e8', '#ffcf3a', '#ffffff'], 60);
            });
          } },
          { black: 0 },
          { until: (a) => a.friend.cracked },
          { wait: 2.8 },
          ...a.laughSteps(1),
          { talk: ['stick', ['Ops.', 'Ele escorregou.']] },
          { wait: 0.8 },
          { fade: [1, 1.5] }, { wait: 1.8 },
          { run: () => a.complete('MISSÃO CONCLUÍDA!', { from: 3, to: 2 }) },
        ], { blocking: true });
      } },
    ],
  },

  /* ================================================================
     MISSÃO 2 — O FOGUETE DO ZOOM
     ================================================================ */
  {
    name: 'O FOGUETE DO ZOOM',
    theme: 'launch',
    friend: 'zoom',
    item: 'gear',
    secrets: true,
    friendWait: 'ei, Stick! aqui!',
    map: joinScreens([
      [ // tela 1
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '.............o......',
        '............===.....',
        '.P...S..T......b....',
        '####################',
        '####################',
      ],
      [ // tela 2
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '............o.......',
        '..........=====.....',
        '....................',
        '.....===............',
        '..N.............N...',
        '#######...##########',
        '#######...##########',
      ],
      [ // tela 3 — pilares
        '....................',
        '....................',
        '....................',
        '...BBBBBBBBBBBBB....',
        '...BBBBBBBBBBBBB....',
        '....................',
        '....................',
        '...........o........',
        '.......BB..BB.......',
        '..c...BBB..BBB..f...',
        '####################',
        '####################',
      ],
      [ // tela 4 — escadinha
        '....................',
        '....................',
        '....................',
        '....................',
        '...............o....',
        '..............===...',
        '..........===.......',
        '......===...........',
        '....................',
        '..N....Y............',
        '#############...####',
        '#############...####',
      ],
      [ // tela 5
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '.........o..........',
        '........===.........',
        '....................',
        '..f...S.......^^..b.',
        '####################',
        '####################',
      ],
      [ // tela 6 — a base de lançamento
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '..c........K........',
        '####################',
        '####################',
      ],
    ]),
    npcs: [
      { name: 'PIPO', color: '#ff9ecf', lines: ['Oi, Zoom!', '...e oi, você.'] },
      { name: '???', color: '#c9b3ff', mode: 'stare', lines: ['cadê o ovinho?'] },
      { name: 'TUTI', color: '#7fd0ff', lines: ['Você vai na festa do Zoom?', 'Ah. Não? Que pena.'] },
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
      ['Stick... por que você tá me olhando assim?'],
    ],
    props: [
      { kind: 'rocket', state: 'broken', lift: 0, liftV: 0, tilt: 0,
        onUse: (a, k) => {
          if (a.stars < a.starsTotal) {
            a.seq([{ talk: ['zoom', ['Ainda faltam peças, Stick!', 'A gente achou ' + a.stars + ' de ' + a.starsTotal + '.']] }]);
            return;
          }
          k.locked = true;
          const rx = k.x + 8;
          const explode = () => {
            const ex = rx + Math.sin(k.tilt) * 10, ey = k.y + 16 - 4 - k.lift - 24;
            k.state = 'gone'; k.crew = false;
            a.flash(0.3); a.sfx('boom'); a.shake(1.4, 4);
            a.burst(ex, ey, 46, ['#ffd84a', '#ff8a2a', '#ffffff', '#9a9a9a', '#5a5a5a'], 130);
            for (let i = 0; i < 9; i++) {
              a.debris({ kind: 'panel', color: i % 3 ? '#f4f4f4' : '#ff8a2a', x: ex + Math.random() * 10 - 5, y: ey,
                vx: Math.random() * 160 - 80, vy: -Math.random() * 140, vr: Math.random() * 12 - 6 });
            }
            a.debris({ kind: 'helmet', x: ex, y: ey, vx: -42, vy: -130, vr: -5 });
          };
          a.seq([
            { run: () => { a.friendWalk(rx - 30, 50); a.walkTo(rx - 56, 60); } },
            { until: (a) => a.friend.mode === 'idle' && a.player.autoX == null },
            { run: () => { a.face(1); } },
            { talk: ['zoom', ['Todas as peças! Stick, você é demais!', 'Agora... só tem um probleminha.', 'Só cabe UM no foguete.',
              'Eu ia levar o Eri. Mas ele escorregou, né?', 'Então eu vou sozinho!', 'Desculpa, Stick. Você nunca foi muito... do grupo.']] },
            { talk: ['stick', ['Tudo bem, Zoom.', 'Deixa que eu aperto o último parafuso pra você.']] },
            { run: () => a.walkTo(rx - 12, 50) },
            { until: (a) => a.player.autoX == null },
            { run: () => { a.face(1); a.player.interactT = 0.4; a.sfx('clank'); } }, { wait: 0.45 },
            { run: () => { a.player.interactT = 0.4; a.sfx('clank'); } }, { wait: 0.45 },
            { run: () => { a.player.interactT = 0.4; a.sfx('clank'); k.state = 'fixed'; a.burst(rx, k.y - 12, 8, ['#ffffff', '#c4c8d4'], 40); } },
            { wait: 0.7 },
            { say: 'sobrouUm' },
            { talk: ['stick', ['Pronto.']] },
            { run: () => {
              a.walkTo(rx - 56, 50);
              a.friendWalk(rx, 40, () => { a.friendMode('hidden'); k.crew = true; a.sfx('door'); });
            } },
            { until: (a) => a.friend.mode === 'hidden' && a.player.autoX == null },
            { run: () => a.face(1) },
            { wait: 0.8 },
            { talk: ['zoom', ['Tchau, Stick!', 'Eu trago uma pedrinha da lua pra você!', '...talvez.']] },
            { run: () => a.music.stop(1) }, { wait: 1.2 },
            ...countdown(a),
            { run: () => {
              a.say({ text: 'DECOLAR!', style: 'center', dur: 1.2, size: 16, color: '#ffd84a' });
              a.sfx('beep', 1320); a.sfx('rumble', 4);
              k.state = 'launch'; k.liftV = 4; k.liftA = 26; a.shake(2.5, 1);
            } },
            { until: () => k.lift > 46 },
            { run: () => { // alguma coisa se soltou
              a.sfx('sputter');
              a.debris({ kind: 'gear', x: rx + 3, y: k.y + 12 - k.lift - 14, vx: -18, vy: 10, vr: 7 });
              k.liftA = -6; k.tiltV = 0.38;
            } },
            { until: () => k.lift > 72 || k.liftV < 4 },
            { wait: 0.4 },
            { run: explode },
            { wait: 3 },
            ...a.laughSteps(2),
            { talk: ['stick', ['Ele queria ir sozinho.', 'Agora ele foi.']] },
            { wait: 0.6 },
            { fade: [1, 1.5] }, { wait: 1.8 },
            { run: () => a.complete('MISSÃO CONCLUÍDA!', { from: 2, to: 1 }) },
          ], { blocking: true });
        } },
    ],
    onStart: (a) => {
      a.music.play('rocket');
      a.seq([
        { wait: 0.4 },
        { talk: ['zoom', ['Oi, Stick! Meu foguete quebrou!', 'As peças caíram pelo caminho todo.', 'Me ajuda a achar as 5 peças?']] },
        { talk: ['zoom', ['Ah... cadê o Eri? Ele ia vir também.']] },
        { talk: ['stick', ['Ele escorregou.']] },
        { talk: ['zoom', ['...', 'Tá. Vamos lá, então.']] },
      ]);
    },
    events: [
      { x: 30, run: (a) => a.say('riemDeMim') },
      // A música entorta e um pensamento pisca.
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

  /* ================================================================
     MISSÃO 3 — A VILA DAS FRUTAS
     ================================================================ */
  {
    name: 'A VILA DAS FRUTAS',
    theme: 'dusk',
    friend: 'torajo',
    item: 'berry',
    secrets: true,
    friendWait: 'Stick?! não me deixa sozinho!',
    map: joinScreens([
      [ // tela 1
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '..........o.........',
        '.........===........',
        '.P..S....T.....T.f..',
        '####################',
        '####################',
      ],
      [ // tela 2 — a primeira gosma
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '.............o......',
        '............===.....',
        '.......===..........',
        '..o.................',
        '.....T....^^....T...',
        '####################',
        '####################',
      ],
      [ // tela 3
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '........o...........',
        '.......===....o.....',
        '.............===....',
        '..N...........b..Y..',
        '######...###########',
        '######...###########',
      ],
      [ // tela 4
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '...........o........',
        '..........===.......',
        '.....===.......===..',
        '....................',
        '.c....^^...T...^^...',
        '####################',
        '####################',
      ],
      [ // tela 5
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '.........o..........',
        '.......=====........',
        '....................',
        '..T...^^^.....^^..T.',
        '####################',
        '####################',
      ],
      [ // tela 6 — a entrada da vila
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '..........o.........',
        '.c..S.....K....U....',
        '####################',
        '########
