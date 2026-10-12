/* =====================================================================
   MENSAGENS DE TERROR — sistema reutilizável
   ---------------------------------------------------------------------
   Neste jogo, as mensagens são o que o Stick pensa de verdade.
   Na frente dos amigos ele sorri. Aqui, não.

   Para mostrar uma mensagem em qualquer evento de fase:
       a.say('naoMeChamam')                  // usa o registro abaixo
       a.say('naoMeChamam', { dur: 5 })      // sobrescreve opções
       a.say({ text: 'oi.', style: 'flash' }) // mensagem avulsa

   Estilos (style):
     'center'  → centro da tela, aparece e some suavemente
     'flash'   → pisca rapidíssimo (o jogador fica em dúvida se viu)
     'corner'  → num canto (corner: 'tl' | 'tr' | 'bl' | 'br')
     'subtle'  → texto pequeno e apagado num ponto aleatório da tela
     'world'   → escrito NO cenário (x, y em pixels do mundo)
     'scatter' → várias cópias espalhadas, trocando de lugar
     'typed'   → digitado letra por letra (cps = letras/segundo)

   Outras opções:
     dur (segundos) · size (8, 16, 24) · color · alpha
     flicker (tremula) · jitter (letras tremem) · shake (tela treme)
     glitch (segundos de glitch na tela) · sound ('static', 'whisper',
     'glitch', 'stinger', 'laugh'...) · once (só aparece uma vez por jogo)
     shadow: false (sem sombra — mais discreto)
   ===================================================================== */

const MESSAGES = {
  // ---- Missão 1: o Eri (quase nada... quase) ----
  quisDizer:   { text: 'ele disse "quer dizer".', style: 'subtle', dur: 1.3, size: 8, alpha: 0.3, shadow: false },
  naoMeChamam: { text: 'eles nunca me chamam.', style: 'flash', dur: 0.45, size: 8, color: '#ffffff' },

  // ---- Missão 2: o Zoom ----
  esquisito:     { text: 'EU NÃO SOU ESQUISITO.', style: 'flash', dur: 0.8, size: 16, color: '#ffffff', glitch: 0.3, sound: 'static' },
  riemDeMim:     { text: 'eles riem quando eu saio', style: 'subtle', dur: 1.6, size: 8, alpha: 0.35, shadow: false },
  sorrioPraEles: { text: 'eu sorrio pra eles.', style: 'corner', corner: 'br', dur: 2.4, size: 8, alpha: 0.55, shadow: false },
  sobrouUm:      { text: 'sobrou um parafuso.', style: 'corner', corner: 'bl', dur: 2.6, size: 8, alpha: 0.6, shadow: false },
  queriaSozinho: { text: 'ele queria ir sozinho.', style: 'center', dur: 2.6, size: 8, color: '#ffffff' },

  // ---- Missão 3: o Torajo ----
  nuncaSorriram:  { text: 'eles nunca sorriram pra mim', style: 'subtle', dur: 1.6, size: 8, alpha: 0.4, flicker: true, shadow: false },
  melhorAmigo:    { text: 'EU SOU O MELHOR AMIGO DELES.', style: 'scatter', dur: 0.4, size: 8, count: 6, sound: 'glitch' },
  dentroDeMim:    { text: 'isso que tem no chão sou eu por dentro', style: 'corner', corner: 'tl', dur: 2.8, size: 8, alpha: 0.5, shadow: false },
  meAjuda:        { text: 'STICK! ME AJUDA!', style: 'center', dur: 1.8, size: 16, color: '#ffffff', jitter: true, shake: 1.2 },
  amoMeusAmigos:  { text: 'EU AMO MEUS AMIGOS.', style: 'center', dur: 2.4, size: 8, color: '#ffffff' },
  odeioMeusAmigos:{ text: 'EU ODEIO MEUS AMIGOS.', style: 'center', dur: 3.2, size: 16, color: '#ff3347', jitter: true, shake: 1.5, glitch: 0.4, sound: 'stinger' },

  // ---- Depois ----
  deixaramDeFora: { text: 'ELES ME DEIXARAM DE FORA.', style: 'center', dur: 3.0, size: 8, color: '#ffffff' },
  deixeiDeFora:   { text: 'ENTÃO EU DEIXEI ELES DE FORA.', style: 'center', dur: 3.4, size: 8, color: '#ff9aa6', jitter: true },
  querSerAmigo:   { text: 'VOCÊ QUER SER MEU AMIGO?', style: 'typed', dur: 99999, size: 8, cps: 6 },

  // ---- Segredos (o jogo percebe o jogador) ----
  porQueParou:    { text: 'POR QUE VOCÊ PAROU?', style: 'center', dur: 2.4, size: 8, alpha: 0.9, flicker: true },
  tentandoDeNovo: { text: 'VOCÊ ESTÁ TENTANDO DE NOVO?', style: 'corner', corner: 'bl', dur: 2.6, size: 8, alpha: 0.85 },
  euTambemTentei: { text: 'eu tentei ser amigo deles.', style: 'corner', corner: 'bl', dur: 2.8, size: 8, alpha: 0.6, shadow: false },
};
                   
