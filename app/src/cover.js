// cover.js — the poster engine of Vice Cover Studio.
// Draws a multi-panel GTA-style poster cover onto any 2D canvas: angled panels with white
// keylines, the user's own photos cropped inside them, a Vice City colour grade, and big
// condensed caption lettering. Pure canvas, no libraries, no network: everything the cover
// needs is drawn here or loaded from the app's own files.

/** The three post sizes the studio exports, in pixels. */
export const POSTER_SIZES = [
  { id: 'square', label: 'Square 1080 × 1080', width: 1080, height: 1080 },
  { id: 'portrait', label: 'Portrait 1080 × 1350', width: 1080, height: 1350 },
  { id: 'wide', label: 'Wide 1920 × 1080', width: 1920, height: 1080 },
];

/** Colour grades: a canvas filter for the photos plus translucent washes laid over them. */
export const COLOUR_GRADES = [
  {
    id: 'vice-sunset', name: 'Vice Sunset',
    filter: 'saturate(1.28) contrast(1.09) brightness(1.03)',
    washTop: 'rgba(58, 0, 92, 0.20)', washBottom: 'rgba(255, 45, 120, 0.30)',
    glow: 'rgba(255, 138, 61, 0.14)',
  },
  {
    id: 'neon-nights', name: 'Neon Nights',
    filter: 'saturate(1.38) contrast(1.14) hue-rotate(-10deg) brightness(0.99)',
    washTop: 'rgba(96, 0, 168, 0.26)', washBottom: 'rgba(0, 200, 255, 0.22)',
    glow: 'rgba(255, 0, 170, 0.12)',
  },
  {
    id: 'golden-hour', name: 'Golden Hour',
    filter: 'saturate(1.16) contrast(1.05) sepia(0.28) brightness(1.06)',
    washTop: 'rgba(120, 52, 0, 0.10)', washBottom: 'rgba(255, 166, 38, 0.28)',
    glow: 'rgba(255, 190, 80, 0.16)',
  },
  {
    id: 'midnight-noir', name: 'Midnight Noir',
    filter: 'saturate(0.52) contrast(1.22) brightness(0.92)',
    washTop: 'rgba(8, 8, 38, 0.30)', washBottom: 'rgba(0, 0, 0, 0.42)',
    glow: 'rgba(70, 90, 255, 0.10)',
  },
  {
    id: 'true-colour', name: 'True Colour',
    filter: 'saturate(1.05) contrast(1.03)',
    washTop: 'rgba(0, 0, 0, 0.05)', washBottom: 'rgba(0, 0, 0, 0.10)',
    glow: 'rgba(255, 255, 255, 0.04)',
  },
];

/** Panel polygons in unit-square coordinates. Neighbouring panels share every edge exactly,
 *  so the collage tiles the canvas with no gaps. `tall` serves square and portrait posters,
 *  `wide` the landscape one. */
export const POSTER_LAYOUTS = [
  {
    id: 'cover-story', name: 'Cover Story · 5 panels',
    tall: [
      [[0, 0], [0.60, 0], [0.50, 0.46], [0, 0.52]],
      [[0.60, 0], [1, 0], [1, 0.34], [0.50, 0.46]],
      [[1, 0.34], [1, 0.66], [0.58, 0.72], [0.50, 0.46]],
      [[0, 0.52], [0.50, 0.46], [0.58, 0.72], [0.52, 1], [0, 1]],
      [[0.58, 0.72], [1, 0.66], [1, 1], [0.52, 1]],
    ],
    wide: [
      [[0, 0], [0.42, 0], [0.38, 0.55], [0.36, 1], [0, 1]],
      [[0.42, 0], [0.72, 0], [0.68, 0.52], [0.38, 0.55]],
      [[0.38, 0.55], [0.68, 0.52], [0.66, 1], [0.36, 1]],
      [[0.72, 0], [1, 0], [1, 0.48], [0.68, 0.52]],
      [[0.68, 0.52], [1, 0.48], [1, 1], [0.66, 1]],
    ],
  },
  {
    id: 'newsstand', name: 'Newsstand · 4 bands',
    tall: [
      [[0, 0], [1, 0], [1, 0.36], [0, 0.48]],
      [[0, 0.48], [1, 0.36], [1, 0.70], [0.55, 0.78], [0, 0.86]],
      [[0, 0.86], [0.55, 0.78], [0.48, 1], [0, 1]],
      [[0.55, 0.78], [1, 0.70], [1, 1], [0.48, 1]],
    ],
    wide: [
      [[0, 0], [1, 0], [1, 0.34], [0, 0.46]],
      [[0, 0.46], [1, 0.34], [1, 0.68], [0.55, 0.76], [0, 0.84]],
      [[0, 0.84], [0.55, 0.76], [0.48, 1], [0, 1]],
      [[0.55, 0.76], [1, 0.68], [1, 1], [0.48, 1]],
    ],
  },
  {
    id: 'hero-solo', name: 'Hero Solo · 2 panels',
    tall: [
      [[0, 0], [1, 0], [1, 0.78], [0, 0.90]],
      [[0, 0.90], [1, 0.78], [1, 1], [0, 1]],
    ],
    wide: [
      [[0, 0], [0.78, 0], [0.70, 1], [0, 1]],
      [[0.78, 0], [1, 0], [1, 1], [0.70, 1]],
    ],
  },
];

/** Looks up a size, grade or layout by id, falling back to the first entry. */
export function byId(list, id) {
  return list.find((item) => item.id === id) ?? list[0];
}

/** The panel polygons (unit coordinates) for a layout at a poster's aspect ratio. */
export function panelPolygons(layout, width, height) {
  return (width >= height * 1.1 ? layout.wide : layout.tall);
}

/** A fresh cover state: the default demo scene, ready to edit. */
export function createCoverState() {
  return {
    sizeId: 'square',
    layoutId: 'cover-story',
    gradeId: 'vice-sunset',
    title: 'SUNSET BANDIT',
    tagline: 'VICE COVER STUDIO PRESENTS',
    spread: false,
    panels: [
      { photoId: 'boulevard', zoom: 1, dx: 0, dy: 0 },
      { photoId: 'highway', zoom: 1, dx: 0, dy: 0 },
      { photoId: 'speedboat', zoom: 1, dx: 0, dy: 0 },
      { photoId: 'pier', zoom: 1, dx: 0, dy: 0 },
      { photoId: 'highway', zoom: 1.15, dx: 0, dy: 0 },
    ],
  };
}

/** Traces a unit-coordinate polygon onto the context, scaled to the canvas. */
function tracePolygon(ctx, poly, width, height) {
  ctx.beginPath();
  poly.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x * width, y * height);
    else ctx.lineTo(x * width, y * height);
  });
  ctx.closePath();
}

/** The axis-aligned bounding box of a unit polygon, in pixels. */
function polygonBox(poly, width, height) {
  const xs = poly.map(([x]) => x * width);
  const ys = poly.map(([, y]) => y * height);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  return { x: x0, y: y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 };
}

/** True when a pixel point falls inside a unit-coordinate polygon. */
export function pointInPolygon(px, py, poly, width, height) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = [poly[i][0] * width, poly[i][1] * height];
    const [xj, yj] = [poly[j][0] * width, poly[j][1] * height];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Draws one palm-tree silhouette: a leaning trunk and a crown of arcing fronds. */
function drawPalmSilhouette(ctx, x, y, scale, flip) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip * scale, scale);
  ctx.strokeStyle = 'rgba(16, 6, 24, 0.88)';
  ctx.fillStyle = 'rgba(16, 6, 24, 0.88)';
  ctx.lineCap = 'round';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(10, -52, 30, -96);
  ctx.stroke();
  ctx.lineWidth = 5;
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.08 + (i / 7) * 0.95);
    const reach = 62 + (i % 3) * 9;
    ctx.beginPath();
    ctx.moveTo(30, -96);
    ctx.quadraticCurveTo(
      30 + Math.cos(a) * reach * 0.6, -96 - Math.sin(a) * reach * 0.75 - 12,
      30 + Math.cos(a) * reach, -96 - Math.sin(a) * reach * 0.55 + 16,
    );
    ctx.stroke();
  }
  ctx.restore();
}

/** The painted backdrop an empty panel shows: sunset sky, low sun and palm silhouettes. */
function drawSunsetBackdrop(ctx, box, grade, seed) {
  const sky = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
  sky.addColorStop(0, '#3d1154');
  sky.addColorStop(0.45, '#a01c5e');
  sky.addColorStop(0.78, '#ff5e3a');
  sky.addColorStop(1, '#ffb347');
  ctx.fillStyle = sky;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  const sunX = box.x + box.w * (0.3 + (seed % 3) * 0.2);
  const sunY = box.y + box.h * 0.62;
  const sunR = Math.min(box.w, box.h) * 0.20;
  const sun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 1.9);
  sun.addColorStop(0, 'rgba(255, 236, 170, 0.95)');
  sun.addColorStop(0.35, 'rgba(255, 176, 92, 0.55)');
  sun.addColorStop(1, 'rgba(255, 120, 80, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 0.52, 0, Math.PI * 2);
  ctx.fill();
  const ground = box.y + box.h;
  drawPalmSilhouette(ctx, box.x + box.w * 0.16, ground, Math.min(box.w, box.h) / 210, 1);
  drawPalmSilhouette(ctx, box.x + box.w * 0.88, ground, Math.min(box.w, box.h) / 260, -1);
  ctx.fillStyle = grade.washBottom;
  ctx.fillRect(box.x, box.y, box.w, box.h);
}

/** Draws a photo inside a frame rectangle: cover-fit, then the panel's zoom and drag offset. */
function drawPhotoInFrame(ctx, img, frame, zoom, dx, dy, filter) {
  const scale = Math.max(frame.w / img.naturalWidth, frame.h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const x = frame.x + frame.w / 2 + dx * frame.w - dw / 2;
  const y = frame.y + frame.h / 2 + dy * frame.h - dh / 2;
  ctx.save();
  if (filter) ctx.filter = filter;
  ctx.drawImage(img, x, y, dw, dh);
  ctx.restore();
}

/** Lays a grade's washes over one panel: a vertical tint and a warm centre glow. */
function applyGradeWash(ctx, box, grade) {
  const wash = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  wash.addColorStop(1, grade.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const r = Math.max(box.w, box.h) * 0.75;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  glow.addColorStop(0, grade.glow);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(box.x, box.y, box.w, box.h);
}

/** Strokes one panel's border: the poster's white keyline fenced by black pinstripes. */
function strokePanelBorder(ctx, poly, width, height) {
  const unit = Math.min(width, height);
  tracePolygon(ctx, poly, width, height);
  ctx.strokeStyle = '#120c14';
  ctx.lineWidth = unit * 0.016;
  ctx.lineJoin = 'round';
  ctx.stroke();
  tracePolygon(ctx, poly, width, height);
  ctx.strokeStyle = '#fdfdf8';
  ctx.lineWidth = unit * 0.0075;
  ctx.stroke();
}

/** Splits the caption into at most two balanced lines that fit the poster's width. */
function wrapCaption(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2) return [text];
  let best = [text];
  let bestScore = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const score = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
    if (score < bestScore) {
      bestScore = score;
      best = [a, b];
    }
  }
  return bestScore <= maxWidth ? best : [text];
}

/** The caption block: a letterspaced tagline over the big condensed title, gradient-filled,
 *  black-outlined, with a hard magenta drop shadow and a neon rule above it. */
function drawCaptionLettering(ctx, width, height, state) {
  const title = (state.title || '').trim().toUpperCase();
  const tagline = (state.tagline || '').trim().toUpperCase();
  const cx = width / 2;
  const base = height * 0.972;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  let titleSize = height * 0.118;
  const setTitleFont = () => {
    ctx.font = `${titleSize}px "Poster Black", "Arial Narrow", Impact, sans-serif`;
  };
  setTitleFont();
  let lines = wrapCaption(ctx, title, width * 0.93);
  while (lines.some((line) => ctx.measureText(line).width > width * 0.93) && titleSize > 14) {
    titleSize *= 0.94;
    setTitleFont();
    lines = wrapCaption(ctx, title, width * 0.93);
  }
  const lineHeight = titleSize * 0.94;
  const titleTop = base - lineHeight * lines.length;

  if (tagline) {
    const tagSize = Math.max(13, height * 0.027);
    ctx.font = `${tagSize}px "Poster Bold", "Arial Narrow", sans-serif`;
    try { ctx.letterSpacing = `${tagSize * 0.34}px`; } catch { /* older engines */ }
    ctx.fillStyle = '#ffe9a8';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = tagSize * 0.35;
    ctx.shadowOffsetY = tagSize * 0.08;
    ctx.fillText(tagline, cx, titleTop - titleSize * 0.34);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* older engines */ }
    const ruleY = titleTop - titleSize * 0.52;
    const rule = ctx.createLinearGradient(width * 0.24, 0, width * 0.76, 0);
    rule.addColorStop(0, 'rgba(0, 229, 255, 0)');
    rule.addColorStop(0.25, '#00e5ff');
    rule.addColorStop(0.5, '#ff2d78');
    rule.addColorStop(0.75, '#ff8a3d');
    rule.addColorStop(1, 'rgba(255, 179, 71, 0)');
    ctx.fillStyle = rule;
    ctx.fillRect(width * 0.24, ruleY, width * 0.52, Math.max(2, height * 0.004));
  }

  if (title) {
    setTitleFont();
    const fill = ctx.createLinearGradient(0, titleTop, 0, base);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(0.55, '#fff3d6');
    fill.addColorStop(1, '#ffc46b');
    lines.forEach((line, i) => {
      const y = titleTop + lineHeight * (i + 1) - titleSize * 0.16;
      ctx.save();
      ctx.translate(cx, y);
      ctx.transform(1, 0, -0.055, 1, 0, 0);
      ctx.fillStyle = '#d10f63';
      ctx.fillText(line, titleSize * 0.045, titleSize * 0.055);
      ctx.lineWidth = titleSize * 0.17;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#171019';
      ctx.strokeText(line, 0, 0);
      ctx.fillStyle = fill;
      ctx.fillText(line, 0, 0);
      ctx.restore();
    });
  }
  ctx.restore();
}

/** The studio's round seal in the top-left corner: a star in a double ring, drawn fresh. */
function drawStudioSeal(ctx, width, height) {
  const unit = Math.min(width, height);
  const cx = unit * 0.085;
  const cy = unit * 0.085;
  const r = unit * 0.052;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(18, 10, 22, 0.82)';
  ctx.fill();
  ctx.lineWidth = unit * 0.004;
  ctx.strokeStyle = '#fdfdf8';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.lineWidth = unit * 0.0022;
  ctx.strokeStyle = '#ff2d78';
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r * 0.52 : r * 0.23;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffc46b';
  ctx.fill();
  ctx.restore();
}

/** Draws the whole cover onto ctx at width × height and returns the laid-out panels
 *  (unit polygons with their pixel boxes) for the editor's hit-testing. */
export function drawPosterCover(ctx, width, height, state, photosById) {
  const grade = byId(COLOUR_GRADES, state.gradeId);
  const layout = byId(POSTER_LAYOUTS, state.layoutId);
  const polys = panelPolygons(layout, width, height);

  ctx.fillStyle = '#1c0b28';
  ctx.fillRect(0, 0, width, height);

  const laidOut = polys.map((poly, i) => {
    const box = polygonBox(poly, width, height);
    const panel = state.panels[i] ?? { photoId: null, zoom: 1, dx: 0, dy: 0 };
    ctx.save();
    tracePolygon(ctx, poly, width, height);
    ctx.clip();
    const photo = panel.photoId ? photosById.get(panel.photoId) : null;
    if (state.spread && state.panels[0]?.photoId && photosById.get(state.panels[0].photoId)) {
      const hero = photosById.get(state.panels[0].photoId);
      const frame = { x: 0, y: 0, w: width, h: height };
      drawPhotoInFrame(ctx, hero.img, frame, state.panels[0].zoom, state.panels[0].dx, state.panels[0].dy, grade.filter);
    } else if (photo) {
      drawPhotoInFrame(ctx, photo.img, box, panel.zoom, panel.dx, panel.dy, grade.filter);
    } else {
      drawSunsetBackdrop(ctx, box, grade, i);
    }
    applyGradeWash(ctx, box, grade);
    ctx.restore();
    return { poly, box, panel };
  });

  laidOut.forEach(({ poly }) => strokePanelBorder(ctx, poly, width, height));

  ctx.strokeStyle = '#120c14';
  ctx.lineWidth = Math.min(width, height) * 0.02;
  ctx.strokeRect(0, 0, width, height);
  ctx.strokeStyle = '#fdfdf8';
  ctx.lineWidth = Math.min(width, height) * 0.008;
  ctx.strokeRect(0, 0, width, height);

  const shade = ctx.createLinearGradient(0, height * 0.68, 0, height);
  shade.addColorStop(0, 'rgba(10, 4, 16, 0)');
  shade.addColorStop(1, 'rgba(10, 4, 16, 0.38)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, height * 0.68, width, height * 0.32);

  drawCaptionLettering(ctx, width, height, state);
  drawStudioSeal(ctx, width, height);
  return laidOut;
}
