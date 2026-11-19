// shots.js — fixed scenes for screenshots and screenshotting.
// A `?shot=cover` or `?shot=editor` query rebuilds a named scene from query parameters
// (size, layout, grade, title, tagline, panels, spread, select), so the studio's
// screenshots always show the real app and the real covers it exports. Once the scene is
// painted, window.__shotReady is set and window.__exportCoverPNG returns the cover's PNG.

/** Applies a shot scene to the editor and marks the page ready for its screenshot. */
export async function runShotMode(editor, query) {
  const state = editor.state;
  if (query.get('size')) state.sizeId = query.get('size');
  if (query.get('layout')) state.layoutId = query.get('layout');
  if (query.get('grade')) state.gradeId = query.get('grade');
  if (query.get('title')) state.title = query.get('title');
  if (query.get('tagline')) state.tagline = query.get('tagline');
  if (query.get('spread') === '1') state.spread = true;

  await editor.boot();

  const panels = query.get('panels');
  if (panels) {
    panels.split(',').forEach((photoId, i) => {
      if (state.panels[i] && editor.photosById.has(photoId)) {
        state.panels[i].photoId = photoId;
        const zoom = Number(query.get(`z${i}`));
        if (zoom > 0) state.panels[i].zoom = zoom;
        const dx = Number(query.get(`dx${i}`));
        if (dx) state.panels[i].dx = dx;
        const dy = Number(query.get(`dy${i}`));
        if (dy) state.panels[i].dy = dy;
      }
    });
  }

  if (query.get('shot') === 'cover') document.body.classList.add('shot-cover');
  editor.fitPreviewCanvas();
  editor.renderPickers();
  editor.renderTray();
  editor.redraw();
  if (query.get('select')) editor.selectPanel(Number(query.get('select')) || 0);

  window.__exportCoverPNG = () => editor.exportCoverDataURL();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
