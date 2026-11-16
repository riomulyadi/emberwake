# emberwake

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/riomulyadi/emberwake/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/riomulyadi/emberwake/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Emberwake is a top-down survival game about holding a lantern through eight
waves of night. You steer a small wick of light; embers are drawn to it and
close in, and anything that reaches you puts your flame out. Gather the light
motes for charge, spend it on a core burst that snuffs a ring of embers at
once, and raise a shield when they get too close. Between waves the night
offers you three boons and you take one. Every wave runs shorter than the
last, and every wave is harder. Hold all eight and dawn breaks.

## How to play

| Key | What it does |
| --- | --- |
| `W` `A` `S` `D` / arrow keys | steer the wick |
| `Space` | core burst — snuffs every ember inside the ring, costs charge |
| `Shift` | shield — burns whatever touches it for a moment, costs charge |
| `1` `2` `3` | take one of the three boons offered between waves |
| `R` | start another night from the end screen |

Collect motes to fill the core, and snuff embers in quick succession to build
the combo multiplier — a burst that takes three embers at once is worth three
times what three separate ones are. The three kinds of ember are told apart by
shape: a **cinder** is a four-pointed shard, a **coal** is a heavy cracked
hexagon that takes three hits and breaks into two cinders, and a **spark** is a
thin fast comet. They are violet and magenta against the night; the wick is
the one warm thing on the field.

The boons change how the wick plays: a wider burst, a faster shield, a core
that fills quicker, a cheaper burst, slower embers that score more, a wick
that turns faster, a longer reach for motes, or one more life. Which one you
take is the difference between a night you hold and one you do not.

Everything is drawn in code: there are no images, no fonts and no audio files,
so the game is a handful of ES modules and runs offline from any static server.

## Run it

```sh
node serve.ts
```

Then open <http://localhost:8080>. The game itself is `game/` — plain static
files with no build step, so any static file server will do.

To hand it in as an entry, the program at the root copies the game and its
screenshots into the output directory and writes the dossier make.fun's judge
reads:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

| Path | What is in it |
| --- | --- |
| `game/index.html` | the page the browser opens |
| `game/src/config.js` | every number the game balances on |
| `game/src/entities.js` | what the player, embers, motes and sparks are |
| `game/src/boons.js` | the things you can carry between waves |
| `game/src/game.js` | the rules: movement, waves, scoring, collision |
| `game/src/render.js` | the field and the things on it |
| `game/src/hud.js` | the score, the wave, the charge and the two abilities |
| `game/src/screens.js` | the title, the loss and the dawn |
| `game/src/input.js` | the keyboard |
| `game/src/audio.js` | the sounds, made with the Web Audio API |
| `game/src/rng.js` | the seeded random source |
| `game/src/shots.js` | the scripted frames the screenshots are taken from |
| `game/src/main.js` | the canvas and the loop |
| `main.ts` | the program that hands the entry in |
| `serve.ts` | a small static server for local play |
| `tools/` | the scripts used to shoot the screenshots and check the balance |

---

<sub>Entered on [make.fun](https://make.fun/?ref=e1rsse1g&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
