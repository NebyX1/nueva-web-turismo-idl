import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { guideChapters } from '../data/lavallejaGuide';
import { bookPageText, paginateGuide, paintBookPage, paintGuideSpread, type BookPlan, type OriginalBook } from '../lib/guidebook';

export interface BookPosition {
  chapterIndex: number;
  pageIndex: number;
  pageCount: number;
  chapterPage: number;
  chapterPages: number;
  singlePage: boolean;
  busy: boolean;
}
export interface BookHandle {
  next(): void;
  prev(): void;
  goToChapter(index: number): void;
}
interface Props {
  initialChapter: number;
  initialPageOffset: number;
  textScale: number;
  onPosition(position: BookPosition): void;
}

/** Hosts the original Three.js mesh and page deformation from tourism.js. */
const ThreeGuideBook = forwardRef<BookHandle, Props>(function ThreeGuideBook({ initialChapter, initialPageOffset, textScale, onPosition }, ref) {
  const canvasHost = useRef<HTMLDivElement>(null);
  const engine = useRef<OriginalBook | null>(null);
  const planRef = useRef<BookPlan | null>(null);
  const currentPage = useRef(0);
  const desiredPage = useRef(0);
  const currentChapter = useRef(initialChapter);
  const currentOffset = useRef(initialPageOffset);
  const singlePage = useRef(false);
  const busy = useRef(false);
  const queuedPage = useRef<number | null>(null);
  const onPositionRef = useRef(onPosition);
  onPositionRef.current = onPosition;
  const navigateRef = useRef<(page: number) => void>(() => {});
  const [plan, setPlan] = useState<BookPlan | null>(null);
  const [position, setPosition] = useState<BookPosition | null>(null);
  const [mode, setMode] = useState<'loading' | 'three' | 'fallback'>('loading');
  const [fallbackImages, setFallbackImages] = useState<string[]>([]);

  function publish(page: number, turning = false) {
    const bookPlan = planRef.current;
    if (!bookPlan) return;
    const chapterIndex = bookPlan.spreads[Math.floor(page / 2)].chapterIndex;
    currentChapter.current = chapterIndex;
    currentOffset.current = page - bookPlan.chapterStarts[chapterIndex];
    const nextChapterStart = bookPlan.chapterStarts[chapterIndex + 1] ?? bookPlan.pageCount;
    const next = {
      chapterIndex, pageIndex: page, pageCount: bookPlan.pageCount,
      chapterPage: page - bookPlan.chapterStarts[chapterIndex] + 1,
      chapterPages: nextChapterStart - bookPlan.chapterStarts[chapterIndex],
      singlePage: singlePage.current, busy: turning,
    };
    setPosition(next);
    onPositionRef.current(next);
  }

  function navigate(page: number) {
    const bookPlan = planRef.current;
    if (!bookPlan) return;
    if (busy.current) { queuedPage.current = page; return; }
    const target = Math.max(0, Math.min(bookPlan.pageCount - (singlePage.current ? 1 : 2), page));
    const aligned = singlePage.current ? target : Math.floor(target / 2) * 2;
    if (aligned === currentPage.current) return;
    desiredPage.current = aligned;
    if (!engine.current || Math.floor(aligned / 2) === Math.floor(currentPage.current / 2)) {
      currentPage.current = aligned;
      engine.current?.setView(singlePage.current ? aligned % 2 ? 1 : -1 : 0);
      publish(aligned);
    } else {
      busy.current = true;
      publish(currentPage.current, true);
      engine.current.setView(singlePage.current ? aligned % 2 ? 1 : -1 : 0);
      engine.current.goTo(Math.floor(aligned / 2));
    }
  }
  navigateRef.current = navigate;

  useImperativeHandle(ref, () => ({
    next() { navigateRef.current(currentPage.current + (singlePage.current ? 1 : 2)); },
    prev() { navigateRef.current(currentPage.current - (singlePage.current ? 1 : 2)); },
    goToChapter(index) {
      const first = planRef.current?.chapterStarts[index];
      if (first !== undefined) navigateRef.current(first);
    },
  }), []);

  useEffect(() => {
    let cancelled = false;
    let starting = false;
    let started = false;
    const host = canvasHost.current;
    if (!host) return;
    const media = window.matchMedia('(max-width: 640px)');
    singlePage.current = media.matches;
    const resized = () => {
      singlePage.current = media.matches;
      if (!singlePage.current) currentPage.current = Math.floor(currentPage.current / 2) * 2;
      engine.current?.setView(singlePage.current ? currentPage.current % 2 ? 1 : -1 : 0);
      publish(currentPage.current, busy.current);
    };
    const unavailable = () => { engine.current = null; busy.current = false; setMode('fallback'); publish(currentPage.current); };
    const motionChanged = (event: Event) => engine.current?.setReducedMotion(Boolean((event as CustomEvent<{ reduced: boolean }>).detail.reduced));
    async function start() {
      if (starting || started || cancelled) return;
      starting = true;
      await Promise.all([
        document.fonts.load('500 68px "Cormorant Garamond"'),
        document.fonts.load('600 68px "Cormorant Garamond"'),
        document.fonts.load('italic 500 54px "Cormorant Garamond"'),
      ]);
      await document.fonts.ready;
      if (cancelled) return;
      const bookPlan = paginateGuide(guideChapters, textScale);
      planRef.current = bookPlan;
      setPlan(bookPlan);
      const chapterStart = bookPlan.chapterStarts[currentChapter.current] ?? 0;
      const chapterEnd = bookPlan.chapterStarts[currentChapter.current + 1] ?? bookPlan.pageCount;
      let first = chapterStart + Math.min(currentOffset.current, chapterEnd - chapterStart - 1);
      if (!singlePage.current) first = Math.floor(first / 2) * 2;
      currentPage.current = desiredPage.current = first;
      const original = window.LAVALLEJA_GUIDE_BOOK;
      // Script readiness can arrive before or after React hydration.
      if (!original) { starting = false; publish(first); return; }
      started = true;
      const created = original.create({
        container: host!, chapters: bookPlan.spreads, initialIndex: Math.floor(first / 2),
        pageView: singlePage.current ? first % 2 ? 1 : -1 : 0,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('motion-paused'),
        renderSpread: paintGuideSpread,
        onNavigate(direction) { navigateRef.current(currentPage.current + direction * (singlePage.current ? 1 : 2)); },
        onChapterChange(spread) {
          currentPage.current = Math.floor(desiredPage.current / 2) === spread ? desiredPage.current : spread * 2;
          busy.current = false;
          publish(currentPage.current);
          if (queuedPage.current !== null) {
            const target = queuedPage.current; queuedPage.current = null;
            navigateRef.current(target);
          }
        },
      });
      engine.current = created;
      busy.current = false;
      setMode(created ? 'three' : 'fallback');
      publish(first);
    }
    const scriptReady = () => { void start(); };
    const loadingDeadline = window.setTimeout(() => {
      if (!cancelled && !engine.current && planRef.current) setMode('fallback');
    }, 5000);
    host.addEventListener('guidebook:unavailable', unavailable);
    document.addEventListener('lavalleja:book-ready', scriptReady);
    document.addEventListener('lavalleja:motion', motionChanged);
    media.addEventListener('change', resized);
    void start();
    return () => {
      cancelled = true;
      window.clearTimeout(loadingDeadline);
      engine.current?.dispose(); engine.current = null; busy.current = false;
      queuedPage.current = null;
      host.removeEventListener('guidebook:unavailable', unavailable);
      document.removeEventListener('lavalleja:book-ready', scriptReady);
      document.removeEventListener('lavalleja:motion', motionChanged);
      media.removeEventListener('change', resized);
    };
  }, [textScale]);

  useEffect(() => {
    if (mode !== 'fallback' || !plan || !position) return;
    let cancelled = false;
    const spread = plan.spreads[Math.floor(position.pageIndex / 2)];
    const images = new Map<string, HTMLImageElement>();
    const loading: HTMLImageElement[] = [];
    function render() {
      if (cancelled) return;
      setFallbackImages([spread.left, spread.right].map(page => {
        const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1110;
        const ctx = canvas.getContext('2d');
        if (ctx) paintBookPage(ctx, page, images);
        return canvas.toDataURL('image/png');
      }));
    }
    void Promise.all(spread.images.map(src => new Promise<void>(resolve => {
      const image = new Image(); loading.push(image);
      image.onload = () => { images.set(src, image); resolve(); };
      image.onerror = () => resolve();
      image.src = src;
    }))).then(render);
    return () => { cancelled = true; loading.forEach(image => { image.onload = null; image.onerror = null; }); };
  }, [mode, plan, position?.pageIndex]);

  const spread = plan && position ? plan.spreads[Math.floor(position.pageIndex / 2)] : null;
  const visiblePages = spread ? position?.singlePage ? [position.pageIndex % 2 ? spread.right : spread.left] : [spread.left, spread.right] : [];
  return <div className="lg-book-surface" tabIndex={0} role="region" aria-label="Libro turístico en tres dimensiones. Usá las flechas para pasar las páginas." aria-busy={position?.busy || mode === 'loading'}>
    <div ref={canvasHost} className="lg-three-canvas" aria-hidden="true" />
    {mode === 'loading' && <div className="lg-book-loading" role="status"><div><strong>LAVALLEJA</strong><span>Preparando tu guía…</span></div><div><span>Un viaje.<br/>Muchas historias.</span></div></div>}
    {mode === 'fallback' && <div className={`lg-book-fallback${position?.singlePage ? ' lg-book-single' : ''}`} aria-hidden="true">{fallbackImages.map((src, i) => (!position?.singlePage || i === position.pageIndex % 2) && <img key={i} src={src} alt=""/>)}</div>}
    <div className="lg-sr-only" aria-live="polite" aria-atomic="true">{visiblePages.map(page => <p key={page.number}>Página {page.number}. {bookPageText(page)}</p>)}</div>
  </div>;
});
export default ThreeGuideBook;
