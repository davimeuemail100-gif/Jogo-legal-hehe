# Stick e Seus Amigos

Continuação de **O Mundinho de Stick**. Jogo de plataforma 2D em pixel art,
fofo por fora, com um terror psicológico que cresce aos poucos.

O Stick ajuda três amigos, um por missão:

1. **Os Ovos do Eri**: colher ovos na fazendinha do Eri (um ovo).
2. **O Foguete do Zoom**: achar as 5 peças do foguete do Zoom (um astronauta laranja).
3. **A Vila das Frutas**: levar o Torajo (uma maçã verde) de volta para casa.
4. **Depois**: um epílogo curto.

## Como jogar

Abra `index.html` no navegador (Chrome, Edge, Firefox...). Não precisa instalar nada.

| Tecla | Ação |
|---|---|
| A / D ou ← / → | andar |
| W / Espaço | pular |
| E | falar, interagir |
| Esc | pausa |

No celular aparecem botões de toque.

## Arquivos

```
index.html     página do jogo
style.css      moldura escura em volta da tela
config.js      física, dificuldade, CORES de cada missão, nomes e cores dos personagens
sprites.js     pixel art do Stick, dos amigos e dos itens (desenhada em texto)
audio.js       músicas e efeitos (gerados por código, sem arquivos de som)
messages.js    as mensagens de terror (os pensamentos do Stick)
levels.js      os mapas, falas e cenas de cada missão
world.js       cenário: terreno, árvores, celeiro, casinhas de fruta, fundos
game.js        o motor: física, amigo que segue, cenas, desenho, telas
assets/        pasta pronta para imagens e sons de verdade, se quiser trocar
```

## O que editar

- **Falas dos amigos**: em `levels.js`, procure `friendTalk` (o que dizem quando você aperta E perto deles) e os blocos `talk: ['eri', [...]]` dentro das cenas.
- **Mensagens de terror**: `messages.js`. Cada uma tem texto, estilo (centro, canto, piscar, digitada...) e duração.
- **Mapas**: `levels.js`. Cada missão é feita de telas de 20x12 caracteres. A legenda está no topo do arquivo.
- **Visual dos personagens**: `sprites.js`. Cada letra é uma cor da paleta `SPRITE_PALETTE`.
- **Velocidade, pulo, dificuldade**: `config.js`.
- **Cores das missões**: `THEMES` em `config.js`.

## Testar rápido

- Coloque `?fase=2` no fim do endereço para começar direto na missão 2.
- No console do navegador (F12): `StickDebug.go(2)` pula para a missão 3 (a contagem começa em 0).
- `localStorage.removeItem('stick_amigos_fim')` faz o jogo "esquecer" que você terminou.
