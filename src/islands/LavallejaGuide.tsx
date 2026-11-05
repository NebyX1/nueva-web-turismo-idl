import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { guideCategories, guideChapters } from '../data/lavallejaGuide';
import type { GuideCategory } from '../data/guideTypes';
import ThreeGuideBook, { type BookHandle, type BookPosition } from './ThreeGuideBook';
import '../styles/guide.css';

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    book: <><path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Z"/><path d="M12 6v14"/></>,
    expand: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><path d="m3 3 6 6m12-6-6 6M3 21l6-6m12 6-6-6"/></>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    menu: <><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></>,
    left: <path d="m14 6-6 6 6 6M8 12h13"/>,
    right: <path d="m10 6 6 6-6 6M3 12h13"/>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z"/>,
    pin: <><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    external: <><path d="M14 3h7v7m0-7L10 14"/><path d="M10 3H3v18h18v-7"/></>,
    mountain: <><path d="m2 19 7-12 4 7 3-5 6 10H2Z"/><path d="m7 10 2 2 2-2"/></>,
    check: <path d="m5 12 4 4L20 5"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
const number = (n: number) => String(n).padStart(2, '0');
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function LavallejaGuide() {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [bookPosition, setBookPosition] = useState<BookPosition | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GuideCategory | 'Todos'>('Todos');
  const [savedOnly, setSavedOnly] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [textSize, setTextSize] = useState(1);
  const [ready, setReady] = useState(false);
  const [initialPageOffset, setInitialPageOffset] = useState(0);
  const reader = useRef<HTMLDivElement>(null);
  const book = useRef<BookHandle>(null);
  const page = useRef<HTMLDivElement>(null);
  const expandButton = useRef<HTMLButtonElement>(null);
  const indexButton = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const nativeFullscreen = useRef(false);
  const chapter = guideChapters[index];
  const isSaved = saved.includes(chapter.id);

  function goTo(next: number) {
    const target = Math.max(0, Math.min(guideChapters.length - 1, next));
    if (book.current) book.current.goToChapter(target);
    else setIndex(target);
    setIndexOpen(false);
    setTextOpen(false);
  }
  function closeReader() {
    setExpanded(false);
    setIndexOpen(false);
    setTextOpen(false);
    if (document.fullscreenElement === reader.current) void document.exitFullscreen().catch(() => {});
    nativeFullscreen.current = false;
    requestAnimationFrame(() => expandButton.current?.focus({ preventScroll: true }));
  }
  function openReader() {
    setExpanded(true);
    const request = reader.current?.requestFullscreen;
    if (request) void request.call(reader.current).then(() => { nativeFullscreen.current = true; }).catch(() => {
      // The viewport reader also works on browsers without the Fullscreen API.
    });
  }

  useEffect(() => {
    try {
      const previous = localStorage.getItem('lavalleja.guide.chapter');
      const previousIndex = guideChapters.findIndex(item => item.id === previous);
      if (previousIndex >= 0) setIndex(previousIndex);
      const previousPage = Number(localStorage.getItem('lavalleja.guide.page-offset'));
      if (Number.isInteger(previousPage) && previousPage >= 0) setInitialPageOffset(previousPage);
      const bookmarks: unknown = JSON.parse(localStorage.getItem('lavalleja.guide.saved') || '[]');
      if (Array.isArray(bookmarks)) setSaved(bookmarks.filter((id): id is string => typeof id === 'string'));
      const size = Number(localStorage.getItem('lavalleja.guide.size'));
      if (size >= 0.9 && size <= 1.5) setTextSize(size);
    } catch { /* Reading remains available if local storage is disabled. */ }
    setReady(true);
    const fromLegacy = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      const aliases: Record<string, string> = { cuervos: 'arequita', 'sabores-locales': 'sabores', 'datos-utiles': 'preparar' };
      const chapterIndex = guideChapters.findIndex(item => item.id === (aliases[detail.id] || detail.id));
      if (chapterIndex >= 0) goTo(chapterIndex);
    };
    document.addEventListener('lavalleja:chapter', fromLegacy);
    return () => document.removeEventListener('lavalleja:chapter', fromLegacy);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem('lavalleja.guide.chapter', chapter.id);
      localStorage.setItem('lavalleja.guide.saved', JSON.stringify(saved));
      localStorage.setItem('lavalleja.guide.size', String(textSize));
      if (bookPosition) localStorage.setItem('lavalleja.guide.page-offset', String(bookPosition.chapterPage - 1));
    } catch { /* Optional browser-local preferences. */ }
  }, [chapter.id, saved, textSize, ready, bookPosition]);
  useEffect(() => { page.current?.scrollTo({ top: 0 }); }, [index]);
  useEffect(() => { if (indexOpen) search.current?.focus({ preventScroll: true }); }, [indexOpen]);
  useEffect(() => {
    if (textOpen) reader.current?.querySelector<HTMLButtonElement>('.lg-close-text')?.focus();
  }, [textOpen]);
  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const background: { element: HTMLElement; inert: boolean }[] = [];
    let branch: HTMLElement | null = reader.current;
    while (branch?.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          background.push({ element: sibling, inert: sibling.inert }); sibling.inert = true;
        }
      }
      branch = branch.parentElement;
      if (branch === document.body) break;
    }
    reader.current?.querySelector<HTMLButtonElement>('.lg-close-reader')?.focus();
    const fullscreenChanged = () => { if (nativeFullscreen.current && !document.fullscreenElement) closeReader(); };
    document.addEventListener('fullscreenchange', fullscreenChanged);
    return () => {
      document.body.style.overflow = previousOverflow;
      background.forEach(({ element, inert }) => { element.inert = inert; });
      document.removeEventListener('fullscreenchange', fullscreenChanged);
    };
  }, [expanded]);

  const filtered = guideChapters.map((item, i) => ({ ...item, index: i })).filter(item =>
    (category === 'Todos' || item.category === category) && (!savedOnly || saved.includes(item.id)) &&
    normalize([item.title, item.intro, item.location, ...item.highlights, ...item.sections.map(section => section.title + ' ' + section.body)].join(' ')).includes(normalize(query))
  );

  return <section className="lg-section" id="guia" aria-labelledby="lg-title">
    <div className="lg-heading">
      <p className="lg-eyebrow">UN CUADERNO PARA VIAJAR · URUGUAY</p>
      <h2 id="lg-title"><em>Explorá</em> Lavalleja.</h2>
      <p>Sentite un explorador. Viví la experiencia.</p>
      <div className="lg-edition"><span>{guideChapters.length} CAPÍTULOS</span><span>GUÍA ILUSTRADA</span><span>EDICIÓN 2026</span></div>
    </div>
    <div ref={reader} className={`lg-reader${expanded ? ' lg-expanded' : ''}`} role={expanded ? 'dialog' : 'region'} aria-modal={expanded || undefined} aria-label="Guía turística de Lavalleja" onKeyDown={event => {
      if (event.key === 'Escape') {
        if (indexOpen) { setIndexOpen(false); indexButton.current?.focus(); }
        else if (textOpen) { setTextOpen(false); reader.current?.querySelector<HTMLButtonElement>('.lg-read-text')?.focus(); }
        else if (expanded) closeReader();
      }
      const editing = (event.target as HTMLElement).closest('input, select, textarea, summary, a');
      if (!editing && !indexOpen && !textOpen && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
        event.preventDefault(); if (event.key === 'ArrowRight') book.current?.next(); else book.current?.prev();
      }
      if ((expanded || indexOpen || textOpen) && event.key === 'Tab') {
        const scope = indexOpen ? reader.current?.querySelector('#lg-index') : textOpen ? reader.current?.querySelector('#lg-transcript') : reader.current;
        const focusable = Array.from(scope?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select, summary, [tabindex="0"]') || []).filter(element => element.getClientRects().length > 0 && !element.closest('[inert]') && element.tabIndex >= 0);
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
      <header className="lg-toolbar">
        <div className="lg-brand"><Icon name="mountain" size={26}/><span>EXPLORÁ LAVALLEJA<small>CUADERNO DE VIAJE</small></span></div>
        <div className="lg-tools">
          <button ref={indexButton} className={`lg-tool ${indexOpen ? 'lg-active' : ''}`} onClick={() => { setIndexOpen(!indexOpen); setTextOpen(false); }} aria-expanded={indexOpen} aria-controls="lg-index"><Icon name="menu"/><span>Índice</span></button>
          <button className="lg-tool lg-read-text" onClick={() => { setTextOpen(!textOpen); setIndexOpen(false); }} aria-label="Leer capítulo" aria-expanded={textOpen} aria-controls="lg-transcript"><Icon name="book"/><span>Leer capítulo</span></button>
          <span className="lg-tool-divider"/>
          <div className="lg-text-tools" aria-label="Tamaño del texto"><button aria-label="Reducir tamaño del texto" disabled={textSize <= 0.9} onClick={() => setTextSize(size => Math.max(0.9, +(size - 0.1).toFixed(1)))}>A−</button><button aria-label="Aumentar tamaño del texto" disabled={textSize >= 1.5} onClick={() => setTextSize(size => Math.min(1.5, +(size + 0.1).toFixed(1)))}>A+</button></div>
          {expanded ? <button className="lg-tool lg-expand lg-close-reader" onClick={closeReader}><Icon name="close"/><span>Cerrar</span></button> : <button ref={expandButton} className="lg-tool lg-expand" onClick={openReader}><Icon name="expand"/><span>Pantalla completa</span></button>}
        </div>
      </header>
      <div className="lg-reading-area">
        <div className="lg-book-area" inert={indexOpen || textOpen}>
          {ready ? <ThreeGuideBook ref={book} initialChapter={index} initialPageOffset={initialPageOffset} textScale={textSize} onPosition={position => { setBookPosition(position); setIndex(position.chapterIndex); }}/> : <div className="lg-book-placeholder" aria-hidden="true"><span>LAVALLEJA</span></div>}
        </div>
        {textOpen && <div className="lg-text-layer">
          <button className="lg-text-scrim" tabIndex={-1} aria-label="Volver al libro" onClick={() => { setTextOpen(false); reader.current?.querySelector<HTMLButtonElement>('.lg-read-text')?.focus(); }}/>
          <aside className="lg-transcript" id="lg-transcript" role="dialog" aria-modal="true" aria-label={`Ficha del capítulo: ${chapter.title}`}>
            <div className="lg-transcript-header"><span>CAPÍTULO {number(index + 1)} / {number(guideChapters.length)}</span><button className="lg-tool lg-close-text" onClick={() => { setTextOpen(false); reader.current?.querySelector<HTMLButtonElement>('.lg-read-text')?.focus(); }}><Icon name="close" size={18}/><span>Volver al libro</span></button></div>
            <div ref={page} className="lg-page-scroll" tabIndex={0} role="region" aria-label={`Lectura: ${chapter.title}`} style={{ '--lg-text-scale': textSize } as CSSProperties}>
              <article className="lg-article" key={chapter.id}>
                <p className="lg-kicker">{chapter.eyebrow}</p><h3>{chapter.title}</h3><p className="lg-intro">{chapter.intro}</p>
                <div className="lg-facts"><span><Icon name="pin" size={16}/>{chapter.location}</span><span><Icon name="clock" size={16}/>{chapter.duration}</span></div>
                <div className="lg-highlights">{chapter.highlights.map(item => <span key={item}>{item}</span>)}</div>
                {chapter.sections.map(section => <section className="lg-text-section" key={section.title}><h4>{section.title}</h4><p>{section.body}</p></section>)}
                <aside className="lg-tip"><Icon name="book" size={21}/><div><strong>{chapter.tip.title}</strong><p>{chapter.tip.body}</p></div></aside>
                {chapter.mapQuery && <a className="lg-map-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(chapter.mapQuery)}`} target="_blank" rel="noopener noreferrer"><Icon name="pin" size={18}/>Ubicar en el mapa<Icon name="external" size={14}/></a>}
                <details className="lg-sources" open><summary>Fuentes y consulta antes de viajar</summary><p>Información consultada en noviembre de 2026. Confirmá aperturas, accesos, tarifas y reservas con el lugar antes de salir.</p>{chapter.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<Icon name="external" size={13}/></a>)}<a href="/guide-illustrations.html" target="_blank" rel="noopener noreferrer">El cuaderno ilustrado · Sobre las láminas<Icon name="external" size={13}/></a></details>
                <p className="lg-endmark" aria-hidden="true">✳</p>
              </article>
            </div>
          </aside>
        </div>}
        {indexOpen && <div className="lg-index-layer">
          <button className="lg-index-scrim" tabIndex={-1} aria-label="Cerrar índice" onClick={() => { setIndexOpen(false); indexButton.current?.focus(); }}/>
          <aside id="lg-index" className="lg-index" role="dialog" aria-modal="true" aria-label="Índice de la guía">
            <div className="lg-index-heading"><div><p className="lg-kicker">ELEGÍ TU PRÓXIMA AVENTURA</p><h3>Rumbos por descubrir.</h3></div><button className="lg-icon-button" aria-label="Cerrar índice" onClick={() => { setIndexOpen(false); indexButton.current?.focus(); }}><Icon name="close"/></button></div>
            <label className="lg-search"><Icon name="search" size={18}/><input ref={search} type="search" placeholder="Buscá un lugar o una idea…" aria-label="Buscar en la guía" value={query} onChange={event => setQuery(event.target.value)}/></label>
            <div className="lg-filter-row" aria-label="Filtrar capítulos">{(['Todos', ...guideCategories] as const).map(item => <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
            <button className={`lg-favorites-filter${savedOnly ? ' lg-selected' : ''}`} aria-pressed={savedOnly} onClick={() => setSavedOnly(!savedOnly)}><Icon name="bookmark" size={15}/>Mis favoritos <span>{saved.length}</span></button>
            <p className="lg-results" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'capítulo' : 'capítulos'}</p>
            <div className="lg-index-list">{filtered.length ? guideCategories.map(group => {
              const items = filtered.filter(item => item.category === group);
              return items.length > 0 && <div className="lg-index-group" key={group}><h4>{group}</h4>{items.map(item => <button key={item.id} onClick={() => { goTo(item.index); requestAnimationFrame(() => reader.current?.querySelector<HTMLElement>('.lg-book-surface')?.focus({ preventScroll: true })); }} aria-current={item.index === index ? 'page' : undefined}><span>{number(item.index + 1)}</span><div>{item.title}<small>{item.location}</small></div><Icon name="right" size={17}/></button>)}</div>;
            }) : <div className="lg-empty"><Icon name="search" size={32}/><h4>{savedOnly ? 'Todavía no hay favoritos que coincidan.' : 'Probá con otro camino.'}</h4><p>Buscá por destino, actividad o tema, o restablecé los filtros para ver toda la guía.</p><button onClick={() => { setQuery(''); setCategory('Todos'); setSavedOnly(false); }}>Ver todos los capítulos</button></div>}</div>
          </aside>
        </div>}
      </div>
      <footer className="lg-navigation" inert={indexOpen || textOpen}>
        <button className="lg-nav-button" disabled={!bookPosition || bookPosition.busy || bookPosition.pageIndex === 0} onClick={() => book.current?.prev()} aria-label="Página anterior"><Icon name="left"/><span>Anterior</span></button>
        <div className="lg-position" aria-live="polite" aria-atomic="true"><span><strong>{bookPosition ? bookPosition.singlePage ? number(bookPosition.pageIndex + 1) : `${number(bookPosition.pageIndex + 1)}–${number(bookPosition.pageIndex + 2)}` : '01–02'}</strong><i>/</i>{bookPosition?.pageCount ?? '…'}</span><small>{chapter.title} · Capítulo {number(index + 1)} de {guideChapters.length}</small></div>
        <button className="lg-nav-button lg-next" disabled={!bookPosition || bookPosition.busy || bookPosition.pageIndex >= bookPosition.pageCount - (bookPosition.singlePage ? 1 : 2)} onClick={() => book.current?.next()} aria-label="Página siguiente"><span>Siguiente</span><Icon name="right"/></button>
      </footer>
      <div className="lg-chapter-dock" inert={indexOpen || textOpen}><p>{bookPosition?.singlePage ? 'Deslizá o usá las flechas para pasar de página.' : 'Arrastrá una hoja o usá las flechas para seguir leyendo.'}</p><button className={`lg-save${isSaved ? ' lg-saved' : ''}`} onClick={() => setSaved(items => isSaved ? items.filter(id => id !== chapter.id) : [...items, chapter.id])} aria-pressed={isSaved} aria-label={isSaved ? 'Quitar capítulo de favoritos' : 'Guardar capítulo en favoritos'}><Icon name={isSaved ? 'check' : 'bookmark'} size={16}/><span>{isSaved ? 'Capítulo guardado' : 'Guardar capítulo'}</span></button></div>
    </div>
    <div className="lg-below"><p><Icon name="book" size={18}/><strong>{guideChapters.length} capítulos.</strong> Un cuaderno, muchos caminos.</p><span>Tu última página se guarda en este navegador.</span></div>
    <noscript><p className="lg-noscript">Activá JavaScript para recorrer los capítulos y usar el lector a pantalla completa. También podés consultar <a href="https://www.gub.uy/intendencia-lavalleja/turismo">Turismo de Lavalleja</a>.</p></noscript>
  </section>;
}
