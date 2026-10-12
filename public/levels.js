/* =====================================================================
   MISSÕES — mapas desenhados em texto
   LEGENDA DO MAPA
     .  ar          #  terra com grama (sólido)   B  pedra (sólido)
     =  plataforma  ~  plataforma bugada          ^  espinhos
     o  item        P  início    c  checkpoint    F  bandeira
     N  NPC    S  placa    K  objeto
     T  árvore  Y  árvore com rosto  H  casa  f  flor  b  arbusto
     R  celeiro  L  cerca  U  casinha de fruta
   ===================================================================== */

function joinScreens(screens) {
  const rows = [];
  for (let r = 0; r < 12; r++) rows.push(screens.map((s) => s[r]).join(''));
  return rows;
}

const LEVELS = [
  /* ============ MISSÃO 1 — OS OVOS DO ERI ============ */
  {
    name: 'OS OVOS DO ERI',
    theme: 'farm',
    friend: 'eri',
    item: 'egg',
    secrets: false,
    friendWait: 'me espera!',
    map: joinScreens([
      [
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '..........o.........',
        '.........===........',
        '....................',
        '....o...............',
        '.P.S......T..H.f....',
        '####################',
        '####################',
      ],
      [
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '......o.......o.....',
        '.....===.....===....',
        '....................',
        '...N......N.........',
        '..c....f.......b....',
        '####.......#########',
        '####.......#########',
      ],
      [
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '..........o.........',
        '.........===........',
        '....................',
        '.....o..............',
        '..c.....S...R.......',
        '####################',
        '####################',
      ],
    ]),
    npcs: [
      { name: 'PINTINHO', sheet: 'chick', lines: ['Piu!', 'Piu piu!'] },
      { name: 'PINTINHO', sheet: 'chick', mode: 'stare', lines: ['...', 'piu.'] },
    ],
    signs: [
      { lines: ['FAZENDINHA DO ERI', 'Amigos bem-vindos!'] },
      { lines: ['Cuidado com os buracos.'] },
    ],
    friendTalk: [
      ['Cuidado com os buracos, Wrick!'],
      ['Ovo quebrado não tem conserto.'],
      ['Obrigado por me ajudar!'],
    ],
    onStart: (a) => {
      if (a.music) a.music.play('farm');
    },
    events: [],
  },

  /* ============ MISSÃO 2 — O FOGUETE DO ZOOM ============ */
  {
    name: 'O FOGUETE DO ZOOM',
    theme: 'launch',
    friend: 'zoom',
    item: 'gear',
    secrets: true,
    friendWait: 'ei, Wrick! aqui!',
    map: joinScreens([
      [
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
      [
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
      [
        '....................',
        '....................',
        '....................',
        '....................',
        '...............o....',
        '..............===...',
        '..........===.......',
        '......===...........',
        '....................',
        '..N....Y......K.....',
        '####################',
        '####################',
      ],
    ]),
    npcs: [
      { name: 'PIPO', color: '#ff9ecf', lines: ['Oi, Zoom!'] },
      { name: 'TUTI', color: '#7fd0ff', lines: ['Boa sorte com o foguete!'] },
    ],
    signs: [
      { lines: ['BASE ESPACIAL DO ZOOM', 'Proibido mexer no foguete!'] },
    ],
    props: [
      { kind: 'rocket', state: 'broken', lift: 0, liftV: 0, tilt: 0, noInteract: false },
    ],
    friendTalk: [
      ['Esse foguete vai até a lua!'],
      ['Ainda faltam peças!'],
      ['Wrick... obrigado por ajudar.'],
    ],
    onStart: (a) => {
      if (a.music) a.music.play('rocket');
    },
    events: [],
  },

  /* ============ MISSÃO 3 — A VILA DAS FRUTAS ============ */
  {
    name: 'A VILA DAS FRUTAS',
    theme: 'dusk',
    friend: 'torajo',
    item: 'berry',
    secrets: true,
    friendWait: 'Wrick?! não me deixa!',
    map: joinScreens([
      [
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
      [
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
      [
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
      [
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
        '####################',
      ],
    ]),
    npcs: [
      { name: 'MIMI', color: '#ffd06a', mode: 'stare', lines: ['Não vai pra vila.', 'Tem uma coisa lá embaixo.'] },
    ],
    signs: [
      { lines: ['CAMINHO DA VILA DAS FRUTAS →'] },
      { lines: ['VILA DAS FRUTAS', 'População: 48'] },
    ],
    props: [
      { kind: 'arch', noInteract: true },
    ],
    friendTalk: [
      ['Pega as frutinhas!'],
      ['Cuidado com essa coisa preta no chão.'],
      ['Wrick... tá tudo bem?'],
    ],
    onStart: (a) => {
      if (a.music) a.music.play('dusk');
    },
    events: [],
  },

  /* ============ DEPOIS — SOZINHO ============ */
  {
    name: 'SOZINHO',
    nameGlitch: 'E SEUS AMIGOS',
    label: 'DEPOIS',
    hudLabel: '...',
    theme: 'alone',
    secrets: true,
    map: joinScreens([
      [
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '.P....N.....N.....N.',
        '####################',
        '####################',
      ],
      [
        '....................',
        '....................',
        '....................',
        'BBBBBBBBBBBBBBBBBBBB',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....K.....K.....K...',
        '####################',
        '####################',
      ],
      [
        '....................',
        '....................',
        '....................',
        'BBBBBBBBBBBBBBBBBBBB',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '........K...........',
        '####################',
        '####################',
      ],
    ]),
    regions: [{ type: 'room', x1: 20, x2: 58, y1: 4, y2: 9 }],
    npcs: [
      { name: 'ERI', sheet: 'eri', mode: 'ghost', lines: ['...', 'a gente tinha medo de você, Wrick.'] },
      { name: 'ZOOM', sheet: 'zoom', mode: 'ghost', lines: ['era só falar com a gente.'] },
      { name: 'TORAJO', sheet: 'torajo', mode: 'ghost', lines: ['você sorria o tempo todo.', 'até quando ninguém tava olhando.'] },
    ],
    props: [
      { kind: 'photo', onUse: (a) => a.dialog(null, ['Uma foto do grupo.', 'Eri, Zoom e Torajo.', 'Do lado tem um buraco recortado.']) },
      { kind: 'invite', onUse: (a) => a.dialog(null, ['Um convite cor-de-rosa.', '"NÃO chamar o Wrick."', 'A letra é do Eri.']) },
      { kind: 'crayons', onUse: (a) => a.dialog(null, ['Desenhos de giz de cera.', 'No último, os amigos têm um X no lugar dos olhos.']) },
      { kind: 'mirror', once: true, glow: 40, onUse: (a) => a.seq([
        { talk: [null, ['Um espelho.', 'O Wrick do espelho está sorrindo.', 'O Wrick de verdade não está.']] },
        { wait: 2 },
        { run: () => a.endGame() },
      ], { blocking: true }) },
    ],
    events: [],
    onStart: (a) => {
      if (a.music) a.music.play('musicbox');
      if (a.drone) a.drone(true, 0.04);
    },
  },
];
