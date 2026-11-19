// editor.js — the studio floor of Vice Cover Studio.
// Wires the page around cover.js: a photo tray (the built-in demo photos plus the visitor's
// own, read locally with FileReader and never uploaded), panel selection with drag and zoom
// on the live canvas, layout / grade / caption / size controls, and the PNG export.

import {
  POSTER_SIZES, COLOUR_GRADES, POSTER_LAYOUTS,
  byId, panelPolygons, createCoverState, drawPosterCover, pointInPolygon,
} from './cover.js';

/** The demo photos the studio ships, in tray order. */
export const SAMPLE_PHOTOS = [
  { id: 'boulevard', name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'highway', name: 'Highway', src: 'samples/highway.jpg' },
  { id: 'pier', name: 'Pier', src: 'samples/pier.jpg' },
  { id: 'speedboat', name: 'Speedboat', src: 'samples/speedboat.jpg' },
];

const PREVIEW_MAX = 1000;

/** Loads an image from a URL or data URL, resolving once it can be drawn. */
export function loadPhotoImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Creates the editor against the page's elements and returns its working API. */
export function createEditor() {
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const status = document.getElementById('statusLine');
  const state = createCoverState();
  const photos = [];
  const photosById = new Map();
  let selectedPanel = 0;
  let laidOut = [];

  const size = () => byId(POSTER_SIZES, state.sizeId);
  const layout = () => byId(POSTER_LAYOUTS, state.layoutId);

  function registerPhoto(photo) {
    photos.push(photo);
    photosById.set(photo.id, photo);
  }

  /** Keeps the panel list the same length as the current layout, reusing assignments. */
  function normalizePanels() {
    const count = panelPolygons(layout(), size().width, size().height).length;
    while (state.panels.length < count) {
      const photo = photos[state.panels.length % Math.max(1, photos.length)];
      state.panels.push({ photoId: photo ? photo.id : null, zoom: 1, dx: 0, dy: 0 });
    }
    state.panels.length = count;
    if (selectedPanel >= count) selectedPanel = 0;
  }

  /** Redraws the live preview and the selection outline of the chosen panel. */
  function redraw() {
    normalizePanels();
    laidOut = drawPosterCover(ctx, canvas.width, canvas.height, state, photosById);
    const chosen = laidOut[selectedPanel];
    if (chosen && !document.body.classList.contains('shot-cover')) {
      ctx.save();
      ctx.beginPath();
      chosen.poly.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x * canvas.width, y * canvas.height);
        else ctx.lineTo(x * canvas.width, y * canvas.height);
      });
      ctx.closePath();
      ctx.setLineDash([14, 10]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#00e5ff';
      ctx.stroke();
      ctx.restore();
    }
    renderPanelList();
  }

  /** Fits the preview canvas to the chosen post size, capped for the screen. */
  function fitPreviewCanvas() {
    const { width, height } = size();
    const scale = Math.min(1, PREVIEW_MAX / Math.max(width, height));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
  }

  // ---- photo tray -------------------------------------------------------

  const tray = document.getElementById('photoTray');

  function renderTray() {
    tray.replaceChildren();
    photos.forEach((photo) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tray-photo';
      button.title = `Put ${photo.name} in panel ${selectedPanel + 1}`;
      const img = document.createElement('img');
      img.src = photo.url;
      img.alt = '';
      const label = document.createElement('span');
      label.textContent = photo.name;
      button.append(img, label);
      button.addEventListener('click', () => assignPhotoToPanel(photo.id, selectedPanel));
      tray.append(button);
    });
  }

  /** Puts a photo into a panel and redraws. */
  function assignPhotoToPanel(photoId, panelIndex) {
    normalizePanels();
    state.panels[panelIndex].photoId = photoId;
    selectedPanel = panelIndex;
    redraw();
  }

  /** Reads the visitor's own photo files locally and adds them to the tray. */
  async function addUserPhotos(fileList) {
    for (const file of fileList) {
      const url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const img = await loadPhotoImage(url);
      const id = `user-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      registerPhoto({ id, name: file.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'My photo', img, url, user: true });
    }
    renderTray();
    if (photos.length) assignPhotoToPanel(photos[photos.length - 1].id, selectedPanel);
    say(`${fileList.length} photo${fileList.length > 1 ? 's' : ''} added — they never leave this browser.`);
  }

  // ---- panel list -------------------------------------------------------

  const panelList = document.getElementById('panelList');

  function renderPanelList() {
    if (!panelList) return;
    panelList.replaceChildren();
    state.panels.forEach((panel, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'panel-chip' + (i === selectedPanel ? ' is-selected' : '');
      const photo = panel.photoId ? photosById.get(panel.photoId) : null;
      button.textContent = `Panel ${i + 1} · ${photo ? photo.name : 'Sunset art'}`;
      button.addEventListener('click', () => {
        selectedPanel = i;
        redraw();
      });
      panelList.append(button);
    });
  }

  // ---- canvas interaction ------------------------------------------------

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  let drag = null;

  canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    const hit = laidOut.findIndex(({ poly }) => pointInPolygon(point.x, point.y, poly, canvas.width, canvas.height));
    if (hit >= 0) selectedPanel = hit;
    const panel = state.panels[selectedPanel];
    if (!panel) return;
    drag = { x: event.clientX, y: event.clientY, dx: panel.dx, dy: panel.dy };
    canvas.setPointerCapture(event.pointerId);
    redraw();
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const panel = state.panels[selectedPanel];
    const box = state.spread
      ? { w: canvas.width, h: canvas.height }
      : laidOut[selectedPanel]?.box ?? { w: canvas.width, h: canvas.height };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    panel.dx = drag.dx + ((event.clientX - drag.x) * scaleX) / box.w;
    panel.dy = drag.dy + ((event.clientY - drag.y) * scaleY) / box.h;
    redraw();
  });

  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('pointercancel', () => { drag = null; });

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const panel = state.panels[selectedPanel];
    if (!panel) return;
    panel.zoom = Math.min(4, Math.max(1, panel.zoom * Math.exp(-event.deltaY * 0.0012)));
    zoomSlider.value = String(panel.zoom);
    redraw();
  }, { passive: false });

  canvas.addEventListener('dblclick', () => {
    if (!photos.length) return;
    const panel = state.panels[selectedPanel];
    const index = photos.findIndex((photo) => photo.id === panel.photoId);
    assignPhotoToPanel(photos[(index + 1) % photos.length].id, selectedPanel);
  });

  // ---- controls -----------------------------------------------------------

  const zoomSlider = document.getElementById('zoomRange');
  zoomSlider.addEventListener('input', () => {
    const panel = state.panels[selectedPanel];
    if (!panel) return;
    panel.zoom = Number(zoomSlider.value);
    redraw();
  });

  document.getElementById('resetPanel').addEventListener('click', () => {
    const panel = state.panels[selectedPanel];
    if (!panel) return;
    panel.zoom = 1;
    panel.dx = 0;
    panel.dy = 0;
    zoomSlider.value = '1';
    redraw();
  });

  document.getElementById('spreadToggle').addEventListener('change', (event) => {
    state.spread = event.target.checked;
    redraw();
  });

  document.getElementById('photoInput').addEventListener('change', (event) => {
    if (event.target.files.length) addUserPhotos([...event.target.files]);
    event.target.value = '';
  });

  const titleInput = document.getElementById('captionTitle');
  const taglineInput = document.getElementById('captionTagline');
  titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
  taglineInput.addEventListener('input', () => { state.tagline = taglineInput.value; redraw(); });

  /** Builds a row of picker buttons for layouts, grades or sizes. */
  function buildPicker(elementId, items, currentId, onPick, swatch) {
    const host = document.getElementById(elementId);
    host.replaceChildren();
    items.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'picker-chip' + (item.id === currentId ? ' is-selected' : '');
      button.textContent = item.name ?? item.label;
      if (swatch) {
        const chip = document.createElement('i');
        chip.className = 'swatch';
        chip.style.background = swatch(item);
        button.prepend(chip);
      }
      button.addEventListener('click', () => onPick(item.id));
      host.append(button);
    });
  }

  function renderPickers() {
    buildPicker('layoutPicker', POSTER_LAYOUTS, state.layoutId, (id) => {
      state.layoutId = id;
      normalizePanels();
      renderPickers();
      redraw();
    });
    buildPicker('gradePicker', COLOUR_GRADES, state.gradeId, (id) => {
      state.gradeId = id;
      renderPickers();
      redraw();
    }, (grade) => `linear-gradient(160deg, ${grade.washTop}, ${grade.washBottom})`);
    buildPicker('sizePicker', POSTER_SIZES, state.sizeId, (id) => {
      state.sizeId = id;
      fitPreviewCanvas();
      renderPickers();
      redraw();
    });
  }

  // ---- export ---------------------------------------------------------------

  /** Renders the cover at full post size on an offscreen canvas. */
  function renderExportCanvas() {
    const { width, height } = size();
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    drawPosterCover(offscreen.getContext('2d'), width, height, state, photosById);
    return offscreen;
  }

  /** The exported PNG of the current cover, as a data URL (used by export and shots). */
  function exportCoverDataURL() {
    return renderExportCanvas().toDataURL('image/png');
  }

  document.getElementById('exportButton').addEventListener('click', () => {
    renderExportCanvas().toBlob((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `vice-cover-${size().width}x${size().height}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 4000);
      say(`Saved vice-cover-${size().width}x${size().height}.png — ready to post.`);
    }, 'image/png');
  });

  function say(message) {
    status.textContent = message;
  }

  // ---- boot -------------------------------------------------------------------

  /** Loads the demo photos, builds the controls and paints the first cover. */
  async function boot() {
    for (const sample of SAMPLE_PHOTOS) {
      const img = await loadPhotoImage(sample.src);
      registerPhoto({ ...sample, img, url: sample.src, user: false });
    }
    fitPreviewCanvas();
    renderTray();
    renderPickers();
    redraw();
  }

  return {
    state, photos, photosById,
    boot, redraw, renderTray, renderPickers, fitPreviewCanvas,
    assignPhotoToPanel, exportCoverDataURL,
    selectPanel(index) { selectedPanel = index; redraw(); },
    get selectedPanel() { return selectedPanel; },
  };
}
