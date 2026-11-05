import type { GuideChapter } from '../data/guideTypes';
import { chapterDesign, type ChapterDesign, type PostcardPhoto } from '../data/bookletDesign';

export interface BookLine {
  text: string;
  x: number;
  y: number;
  size: number;
  weight: number;
  color: string;
  family: 'display' | 'body';
  width: number;
  bottom: number;
}
export interface BookPage {
  kind: 'cover' | 'welcome' | 'photo' | 'text' | 'notes';
  template: 'opener' | 'cards' | 'landscape' | 'columns';
  chapter: GuideChapter;
  chapterIndex: number;
  number: number;
  lines: BookLine[];
  design: ChapterDesign;
}
export interface BookSpread {
  chapterIndex: number;
  chapterId: string;
  image?: string;
  images: string[];
  left: BookPage;
  right: BookPage;
}
export interface BookPlan { spreads: BookSpread[]; chapterStarts: number[]; pageCount: number }
export interface SpreadPainting {
  left: CanvasRenderingContext2D;
  right: CanvasRenderingContext2D;
  spread: BookSpread;
  index: number;
  width: number;
  height: number;
  image: HTMLImageElement | null;
  images: Map<string, HTMLImageElement>;
}
export interface OriginalBook {
  goTo(index: number): void;
  next(): void;
  prev(): void;
  setView(side: -1 | 0 | 1): void;
  setReducedMotion(reduced: boolean): void;
  dispose(): void;
}
declare global {
  interface Window {
    LAVALLEJA_GUIDE_BOOK?: {
      create(options: {
        container: HTMLElement;
        chapters: BookSpread[];
        initialIndex: number;
        pageView: -1 | 0 | 1;
        reducedMotion: boolean;
        renderSpread(painting: SpreadPainting): void;
        onChapterChange(index: number): void;
        onNavigate(direction: number): void;
      }): OriginalBook | null;
    };
  }
}

const BODY = '"DM Sans", Arial, sans-serif';
const DISPLAY = '"Cormorant Garamond", Georgia, serif';
const WIDTH = 1024, HEIGHT = 1110;
const INK = '#394751';
const pad = (value: number) => String(value).padStart(2, '0');
interface Region { x: number; y: number; width: number; bottom: number }
function regions(template: BookPage['template']): Region[] {
  if (template === 'columns') return [{ x: 76, y: 470, width: 412, bottom: 1010 }, { x: 535, y: 470, width: 412, bottom: 1010 }];
  if (template === 'landscape') return [{ x: 76, y: 464, width: 872, bottom: 1008 }];
  return [{ x: 76, y: 158, width: 872, bottom: 710 }];
}

export function wrapBookText(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean), lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (ctx.measureText(word).width > width) {
      if (line) { lines.push(line); line = ''; }
      let part = '';
      for (const letter of word) {
        if (part && ctx.measureText(part + letter).width > width) { lines.push(part); part = ''; }
        part += letter;
      }
      line = part;
    } else {
      const candidate = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(candidate).width > width) { lines.push(line); line = word; }
      else line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Print layouts have measured text regions; overflow continues on the next leaf. */
export function paginateGuide(chapters: GuideChapter[], scale = 1): BookPlan {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) throw new Error('Canvas text measurement is unavailable.');
  const pages: BookPage[] = [], chapterStarts: number[] = [];
  chapters.forEach((chapter, chapterIndex) => {
    chapterStarts.push(pages.length);
    const design = chapterDesign(chapter), chapterPages: BookPage[] = [];
    const makePage = (kind: BookPage['kind'], template: BookPage['template'] = 'opener'): BookPage => ({ kind, template, chapter, chapterIndex, number: 0, lines: [], design });
    chapterPages.push(makePage(chapterIndex === 0 ? 'cover' : 'photo'));
    if (chapterIndex === 0) chapterPages.push(makePage('welcome'));
    let page = makePage('text'), pageRegions = regions('opener'), regionIndex = 0, y = pageRegions[0].y, textPageIndex = 0;
    function advance() {
      if (regionIndex + 1 < pageRegions.length) { regionIndex++; y = pageRegions[regionIndex].y; return; }
      chapterPages.push(page); textPageIndex++;
      const template = (['columns', 'cards', 'landscape'] as const)[(textPageIndex - 1) % 3];
      page = makePage('text', template); pageRegions = regions(template); regionIndex = 0; y = pageRegions[0].y;
    }
    function add(text: string, size = 30, weight = 400, color = INK, leading = 1.5, before = 0, after = 17, family: BookLine['family'] = 'body', keep = 0, maxWidth?: number) {
      let remaining = text.trim();
      let firstLine = true;
      const initial = pageRegions[regionIndex];
      if (page.lines.length && y + before + size * scale * leading + keep > initial.bottom) advance();
      else y += before;
      while (remaining) {
        let region = pageRegions[regionIndex];
        const px = size * scale * (region.width < 500 && family === 'body' ? .94 : 1), lineHeight = px * leading;
        y = Math.max(y, region.y - 30 + px * .85);
        if (firstLine) {
          const previous = page.lines.at(-1);
          if (previous && previous.x === region.x) y = Math.max(y, previous.y + previous.size * .3 + px * .85);
        }
        if (y + px * .25 > region.bottom) { advance(); continue; }
        ctx!.font = `${weight} ${px}px ${family === 'display' ? DISPLAY : BODY}`;
        const width = Math.min(region.width, maxWidth ?? region.width);
        const lines = wrapBookText(ctx!, remaining, width);
        const available = Math.max(1, Math.floor((region.bottom - y - px * .25) / lineHeight) + 1);
        const fitting = lines.slice(0, available);
        fitting.forEach(line => {
          page.lines.push({ text: line, x: region.x, y, size: px, weight, color, family, width, bottom: region.bottom });
          y += lineHeight;
        });
        firstLine = false;
        remaining = lines.slice(fitting.length).join(' ');
        if (remaining) advance();
      }
      y += after;
    }
    add(chapter.eyebrow.toUpperCase(), 19, 500, design.accent, 1.4, 0, 27);
    add(chapter.title, 84, 500, design.accent, 1.06, 0, 27, 'display', 0, 872);
    add(chapter.intro, 28, 400, INK, 1.48, 0, 24);
    add(chapter.location, 23, 500, design.accent, 1.45, 0, 9);
    add(`TIEMPO SUGERIDO · ${chapter.duration}`, 21, 400, '#667575', 1.45, 0, 18);
    add(chapter.highlights.join('  /  '), 23, 500, design.accent, 1.45, 0, 22);
    chapter.sections.forEach(section => {
      add(section.title.toUpperCase(), 39, 600, design.accent, 1.08, 23, 13, 'display', 80 * scale);
      add(section.body);
    });
    add(chapter.tip.title.toUpperCase(), 37, 600, design.accent, 1.12, 25, 13, 'display', 70 * scale);
    add(chapter.tip.body, 28);
    add('ANTES DE VIAJAR', 34, 600, design.accent, 1.15, 24, 13, 'display', 50);
    chapter.sources.forEach(source => add(source.label, 23, 400, '#667575', 1.45, 0, 7));
    add('Encontrá los enlaces y el mapa en «Leer capítulo». Confirmá accesos, horarios y reservas antes de salir.', 23, 400, '#667575', 1.45, 13, 0);
    if (page.lines.length) chapterPages.push(page);
    if (chapterPages.length % 2) chapterPages.push(makePage('notes'));
    chapterPages.forEach(item => { item.number = pages.length + 1; pages.push(item); });
  });
  const spreads: BookSpread[] = [];
  for (let i = 0; i < pages.length; i += 2) {
    const left = pages[i], right = pages[i + 1];
    const images = [...new Set([left, right].flatMap(page => page.design.photos.map(photo => photo.src)))];
    spreads.push({ chapterIndex: left.chapterIndex, chapterId: left.chapter.id, image: left.design.photos[0]?.src, images, left, right });
  }
  return { spreads, chapterStarts, pageCount: pages.length };
}

function rule(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, color = '#4c65734a') {
  ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
}
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size = 20, weight = 400) {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px ${BODY}`; ctx.fillText(text, x, y);
}
function script(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color; ctx.font = `italic 500 ${size}px ${DISPLAY}`; ctx.fillText(text, x, y);
}
function displayLines(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, size: number, color: string, leading = 1.01): number {
  ctx.fillStyle = color; ctx.font = `500 ${size}px ${DISPLAY}`;
  const lines = text.split('\n').flatMap(line => wrapBookText(ctx, line, width));
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * size * leading));
  return lines.length * size * leading;
}
function fittedTitle(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, height: number, size: number, color: string) {
  while (size > 48) {
    ctx.font = `500 ${size}px ${DISPLAY}`;
    const lines = text.split('\n').flatMap(line => wrapBookText(ctx, line, width));
    if (lines.length * size * 1.02 <= height) break;
    size -= 2;
  }
  return displayLines(ctx, text, x, y, width, size, color, 1.02);
}
/** The generated plates keep their complete composition, with paper margins intact. */
function illustration(ctx: CanvasRenderingContext2D, plate: PostcardPhoto, images: Map<string, HTMLImageElement>, x: number, y: number, w: number, h: number, framed = false) {
  ctx.save();
  if (framed) { ctx.fillStyle = '#f5ecd4'; ctx.fillRect(x, y, w, h); }
  const img = images.get(plate.src);
  if (img) {
    const ratio = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * ratio, dh = img.naturalHeight * ratio;
    if (!framed) ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }
  ctx.restore();
  if (framed) {
    ctx.strokeStyle = '#f5ecd48c'; ctx.lineWidth = 1;
    ctx.strokeRect(x - 7, y - 7, w + 14, h + 14);
  }
}
function compass(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1;
  for (const scale of [.72, .81]) { ctx.beginPath(); ctx.arc(0, 0, radius * scale, 0, Math.PI * 2); ctx.stroke(); }
  for (let i = 0; i < 8; i++) {
    ctx.save(); ctx.rotate(i * Math.PI / 4);
    const long = i % 2 ? radius * .6 : radius;
    ctx.beginPath(); ctx.moveTo(0, -long); ctx.lineTo(radius * .095, 0); ctx.lineTo(0, long * .25); ctx.closePath();
    if (i % 2 === 0) ctx.fill(); else ctx.stroke(); ctx.restore();
  }
  ctx.textAlign = 'center'; label(ctx, 'N', 0, -radius - 13, color, 17); ctx.textAlign = 'left'; ctx.restore();
}
function sprig(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.strokeStyle = color; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(0, 90); ctx.bezierCurveTo(5, 45, 25, 10, 33, -40); ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const sy = 66 - i * 15, sx = (90 - sy) * .2, sign = i % 2 ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.bezierCurveTo(sx + sign * 40, sy - 4, sx + sign * 38, sy - 36, sx, sy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + sign * 27, sy - 20); ctx.stroke();
  }
  ctx.restore();
}
function paperBase(ctx: CanvasRenderingContext2D, color = '#f5ecd4') {
  ctx.fillStyle = color; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  // Subtle, deterministic flecks give the canvas paper a printed, tactile finish.
  ctx.fillStyle = '#655e4320';
  for (let i = 0; i < 650; i++) {
    const x = (i * 137.31) % WIDTH, y = (i * 83.73) % HEIGHT;
    ctx.fillRect(x, y, i % 3 ? .65 : 1.2, .6);
  }
}
function footer(ctx: CanvasRenderingContext2D, page: BookPage, light = false) {
  const color = light ? '#eee3c7' : '#6b7b7d';
  rule(ctx, 76, 1035, 872, light ? '#e8dec542' : '#4c657332');
  label(ctx, 'EXPLORÁ LAVALLEJA', 76, 1072, color, 15);
  ctx.textAlign = 'center'; script(ctx, 'Cuaderno de viaje', 512, 1072, 23, color);
  ctx.textAlign = 'right'; label(ctx, pad(page.number), 948, 1072, color, 18); ctx.textAlign = 'left';
}
function paper(ctx: CanvasRenderingContext2D, page: BookPage) {
  paperBase(ctx, page.design.paper);
  label(ctx, 'CUADERNO DE CAMPO / ' + page.chapter.category.toUpperCase(), 76, 77, page.design.accent, 16);
  ctx.textAlign = 'right'; label(ctx, 'LÁMINA ' + pad(page.chapterIndex + 1), 948, 77, page.design.accent, 16); ctx.textAlign = 'left';
  rule(ctx, 76, 103, 872);
}
function caption(ctx: CanvasRenderingContext2D, plate: PostcardPhoto, x: number, y: number, width: number, color: string, number?: number) {
  ctx.fillStyle = color; ctx.font = `italic 500 24px ${DISPLAY}`;
  const text = `${number ? `Fig. ${number}. ` : ''}${plate.label}`;
  wrapBookText(ctx, text, width).forEach((line, i) => ctx.fillText(line, x, y + i * 25));
}
function fieldMemo(ctx: CanvasRenderingContext2D, page: BookPage, x: number, y: number, width: number, color: string, size = 27) {
  page.chapter.highlights.slice(0, 3).forEach((item, index) => {
    const top = y + index * size * 2.8;
    label(ctx, pad(index + 1), x, top, color, 16);
    ctx.fillStyle = color; ctx.font = `400 ${size}px ${BODY}`;
    wrapBookText(ctx, item, width - 44).forEach((line, i) => ctx.fillText(line, x + 44, top + i * size * 1.25));
  });
}
/** Planning pages use a compass and their own checklist, never a borrowed place. */
function planningPlate(ctx: CanvasRenderingContext2D, page: BookPage, color: string, compact = false) {
  const cy = compact ? 270 : 664;
  compass(ctx, 247, cy, compact ? 79 : 110, color);
  fieldMemo(ctx, page, 435, cy - (compact ? 70 : 85), 490, color, compact ? 25 : 29);
  if (!compact) script(ctx, 'Prepará tu propia experiencia.', 77, 885, 38, color);
}
function fieldPlates(ctx: CanvasRenderingContext2D, page: BookPage, images: Map<string, HTMLImageElement>) {
  rule(ctx, 76, 745, 872);
  label(ctx, page.design.photos.length ? 'APUNTES DEL LUGAR' : 'EN TU CUADERNO', 76, 777, page.design.accent, 15);
  script(ctx, 'Seguí tu curiosidad.', 690, 777, 29, page.design.accent);
  if (!page.design.photos.length) {
    page.chapter.highlights.slice(0, 3).forEach((item, index) => {
      const x = 78 + index * 299;
      script(ctx, pad(index + 1), x, 850, 49, page.design.accent);
      ctx.fillStyle = page.design.accent; ctx.font = `400 24px ${BODY}`;
      wrapBookText(ctx, item, 257).forEach((line, i) => ctx.fillText(line, x, 902 + i * 32));
    });
    return;
  }
  if (page.design.photos.length === 1) {
    const plate = page.design.photos[0];
    illustration(ctx, plate, images, 65, 793, 510, 193);
    caption(ctx, plate, 78, 1010, 500, page.design.accent, 1);
    fieldMemo(ctx, page, 604, 836, 342, page.design.accent, 22);
    return;
  }
  const cards = page.design.photos.length === 2 ? [{ x: 65, w: 439 }, { x: 523, w: 439 }] : [{ x: 65, w: 303 }, { x: 372, w: 303 }, { x: 679, w: 283 }];
  cards.forEach((card, index) => {
    const plate = page.design.photos[index];
    illustration(ctx, plate, images, card.x, 794, card.w, 169);
    caption(ctx, plate, card.x + 12, 989, card.w - 24, page.design.accent, index + 1);
  });
}
function drawCover(ctx: CanvasRenderingContext2D, page: BookPage, images: Map<string, HTMLImageElement>) {
  paperBase(ctx);
  label(ctx, 'URUGUAY / UN CUADERNO PARA VIAJAR', 76, 84, '#4c6573', 18);
  rule(ctx, 76, 112, 872);
  script(ctx, 'Explorá', 76, 235, 113, '#4c6573');
  fittedTitle(ctx, 'LAVALLEJA', 68, 375, 900, 170, 150, '#425d6c');
  illustration(ctx, page.design.photos[0], images, 18, 390, 988, 490);
  script(ctx, 'Viví la experiencia.', 77, 936, 54, '#4c6573');
  label(ctx, 'SIERRAS, PUEBLOS Y CAMINOS POR DESCUBRIR', 79, 985, '#69766f', 17);
  compass(ctx, 888, 922, 49, '#7d806a');
  footer(ctx, page);
}
function drawHero(ctx: CanvasRenderingContext2D, page: BookPage, images: Map<string, HTMLImageElement>) {
  if (page.kind === 'cover') { drawCover(ctx, page, images); return; }
  const dark = page.chapterIndex % 3 === 1;
  const bg = dark ? '#647b87' : page.design.paper, ink = dark ? '#f5ecd4' : page.design.accent;
  paperBase(ctx, bg);
  label(ctx, page.chapter.category.toUpperCase() + ' / LAVALLEJA', 76, 80, ink, 17);
  rule(ctx, 76, 111, 872, dark ? '#f5ecd460' : '#4c65734a');
  ctx.textAlign = 'right'; script(ctx, pad(page.chapterIndex + 1), 944, 206, 77, dark ? '#e9dfc08c' : '#4c65736b'); ctx.textAlign = 'left';
  const title = page.design.title.replace(/\.$/, '');
  fittedTitle(ctx, title, 70, 258, 804, 279, 123, ink);
  const plate = page.design.photos[0];
  if (plate) {
    illustration(ctx, plate, images, 66, 456, 892, 439, dark);
    caption(ctx, plate, 80, 936, 790, ink, 1);
  } else planningPlate(ctx, page, ink);
  script(ctx, page.design.tagline, 78, 997, 36, ink);
  footer(ctx, page, dark);
}
function drawWelcome(ctx: CanvasRenderingContext2D, page: BookPage, images: Map<string, HTMLImageElement>) {
  paper(ctx, page);
  label(ctx, 'LA AVENTURA EMPIEZA CON UNA MIRADA', 76, 157, page.design.accent, 18);
  displayLines(ctx, 'Sentite un\nexplorador.', 71, 270, 880, 116, page.design.accent, .95);
  ctx.fillStyle = INK; ctx.font = `400 28px ${BODY}`;
  const intro = 'Mirá de cerca. Tomá el camino que te dé curiosidad. Entre sierras, pueblos y arroyos, cada página es una invitación a vivir Lavalleja con todos los sentidos.';
  wrapBookText(ctx, intro, 790).forEach((line, i) => ctx.fillText(line, 79, 465 + i * 43));
  illustration(ctx, page.design.photos[1], images, 55, 663, 462, 298);
  illustration(ctx, page.design.photos[2], images, 518, 663, 462, 298);
  caption(ctx, page.design.photos[1], 80, 985, 416, page.design.accent, 2);
  caption(ctx, page.design.photos[2], 537, 985, 410, page.design.accent, 3);
  sprig(ctx, 901, 524, .7, '#77856b7a');
  footer(ctx, page);
}
function drawNotes(ctx: CanvasRenderingContext2D, page: BookPage, images: Map<string, HTMLImageElement>) {
  paper(ctx, page);
  label(ctx, 'TU BITÁCORA / ESTE CAPÍTULO', 76, 161, page.design.accent, 18);
  displayLines(ctx, 'Detenete a mirar.\nQuedate un poco.', 72, 265, 860, 102, page.design.accent, 1);
  const plate = page.design.photos.at(-1);
  if (plate) {
    illustration(ctx, plate, images, 45, 437, 934, 402);
    caption(ctx, plate, 78, 869, 866, page.design.accent);
  } else planningPlate(ctx, page, page.design.accent);
  script(ctx, page.design.tagline, 77, 936, 36, page.design.accent);
  label(ctx, 'Volvé al índice para elegir tu próximo capítulo.', 79, 987, INK, 23);
  compass(ctx, 894, 944, 43, '#7d806a');
  footer(ctx, page);
}
export function paintBookPage(ctx: CanvasRenderingContext2D, page: BookPage, images: Map<string, HTMLImageElement>) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  if (page.kind === 'cover' || page.kind === 'photo') { drawHero(ctx, page, images); return; }
  if (page.kind === 'welcome') { drawWelcome(ctx, page, images); return; }
  if (page.kind === 'notes') { drawNotes(ctx, page, images); return; }
  paper(ctx, page);
  if (page.template === 'opener' || page.template === 'cards') fieldPlates(ctx, page, images);
  else {
    const plate = page.design.photos[page.template === 'columns' ? 0 : 1] || page.design.photos[0];
    if (plate) {
      illustration(ctx, plate, images, 76, 131, 872, 260);
      caption(ctx, plate, 78, 421, 800, page.design.accent);
    } else planningPlate(ctx, page, page.design.accent, true);
    rule(ctx, 76, 430, 872);
    if (page.template === 'columns') { ctx.strokeStyle = '#4c657330'; ctx.beginPath(); ctx.moveTo(511, 470); ctx.lineTo(511, 1008); ctx.stroke(); }
  }
  page.lines.forEach(line => { ctx.fillStyle = line.color; ctx.font = `${line.weight} ${line.size}px ${line.family === 'display' ? DISPLAY : BODY}`; ctx.fillText(line.text, line.x, line.y); });
  footer(ctx, page);
}
export function paintGuideSpread({ left, right, spread, images }: SpreadPainting) {
  paintBookPage(left, spread.left, images); paintBookPage(right, spread.right, images);
}
export function bookPageText(page: BookPage): string {
  if (page.kind === 'text') return page.lines.map(line => line.text).join(' ');
  if (page.kind === 'notes') return `Tu bitácora: ${page.chapter.title}. ${page.design.tagline}. Volvé al índice para elegir tu próximo capítulo.`;
  if (page.kind === 'cover' || page.kind === 'welcome') return 'Explorá Lavalleja. Sentite un explorador. Viví la experiencia. Guía ilustrada de sierras, pueblos y caminos.';
  return `${page.chapter.title}. ${page.design.tagline}. Ilustraciones: ${page.design.photos.map(plate => plate.label).join(', ')}.`;
}
