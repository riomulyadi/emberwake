// Emberwake hands itself in: a Node 22 program (standard library only, no build
// step) that copies the game and its screenshots into /output and writes the
// dossier the judge reads, with make.fun's own browser game library.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The game itself is the game/ folder beside this file: plain static files a
// desktop browser loads offline (game/index.html and its ES modules, no library
// and no network request).

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Copy a file or folder from the repository into the output directory. */
function copyInto(source, destination) {
  cpSync(source, destination, { recursive: true });
}

/** The dossier's own caps, from the scorer's gate.json: only text_max_bytes shapes the bytes. */
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

mkdirSync(out, { recursive: true });
copyInto(join(here, 'game'), join(out, 'game'));

mkdirSync(join(out, 'screenshots'), { recursive: true });
const screenshots = join(here, 'screenshots');
if (existsSync(screenshots)) {
  for (const entry of readdirSync(screenshots)) {
    const path = join(screenshots, entry);
    if (statSync(path).isFile()) copyInto(path, join(out, 'screenshots', entry));
  }
}

writeFileSync(join(out, 'dossier.json'), buildDossier(out, CAPS));
