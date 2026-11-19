// Vice Cover Studio — the make.fun entry program (Node 22, standard library only).
// The app itself is the plain static site in app/: open app/index.html in a desktop
// browser and it runs offline, turning a photo and a caption into a GTA-style poster
// cover and exporting it as a PNG. This program hands the entry in: it copies app/ and
// screenshots/ into the output directory and writes dossier.json there with the kit's
// own buildDossier, so the judge reads exactly the app and screenshots that ship.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps are the scorer's own for this bounty: the dossier text cap shapes the bytes,
// the rest refuse anything the gate would refuse (over 4 screenshots or one over
// 256 KiB, over 993 files or 48 MiB under app/, a path over 1000 bytes).
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
