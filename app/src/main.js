// main.js — boots Vice Cover Studio.
// Loads the poster lettering first so the first paint already uses it, then either opens
// the editor or, when the URL carries a `?shot=` scene, rebuilds that scene for a
// screenshot (./shots.js). Everything runs from the app's own files, offline.

import { createEditor } from './editor.js';
import { runShotMode } from './shots.js';

const editor = createEditor();
const query = new URLSearchParams(location.search);

try {
  await document.fonts.load('100px "Poster Black"');
  await document.fonts.load('40px "Poster Bold"');
  await document.fonts.ready;
} catch { /* the fallback lettering still draws */ }

if (query.get('shot')) {
  await runShotMode(editor, query);
} else {
  await editor.boot();
}
