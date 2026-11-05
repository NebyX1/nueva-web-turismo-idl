import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { journeyStops } from '../data/journeyStops';
import type { JourneyPhase, JourneyScene } from '../three/journeyScene';
import { createJourneyModeTransition, CURTAIN_TIMINGS, REDUCED_CURTAIN_TIMINGS, type CurtainStage, type JourneyMode } from '../lib/journeyModeTransition';
import '../styles/journey.css';

function ModeIcon({ night }: { night: boolean }) {
  return night ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 13.1A8.7 8.7 0 0 1 10.9 3.2 8.8 8.8 0 1 0 20.8 13.1Z"/><path d="m17 3 .6 1.8L19.5 5l-1.9.6L17 7.5l-.6-1.9L14.5 5l1.9-.2Z"/></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>;
}

export default function JourneyHero() {
  const host = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const scene = useRef<JourneyScene | null>(null);
  const about = useRef<HTMLDialogElement>(null);
  const route = useRef<HTMLElement>(null);
  const pausedRef = useRef(false);
  const modeRef = useRef<JourneyMode>('day');
  const curtainRef = useRef<CurtainStage>('idle');
  const modeTransition = useRef<ReturnType<typeof createJourneyModeTransition> | null>(null);
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState<JourneyPhase>('Acercándonos');
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [paused, setPaused] = useState(false);
  const [mode, setMode] = useState<JourneyMode>('day');
  const [curtain, setCurtain] = useState<CurtainStage>('idle');
  const [curtainMode, setCurtainMode] = useState<JourneyMode>('night');
  const [curtainReduced, setCurtainReduced] = useState(false);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const stop = journeyStops[active];
  const changingMode = curtain !== 'idle';

  function syncPause() {
    scene.current?.setPaused(pausedRef.current || Boolean(about.current?.open) || curtainRef.current !== 'idle');
  }

  useEffect(() => {
    let cancelled = false;
    setPortalHost(document.body);
    try {
      if (localStorage.getItem('lavalleja:journey-mode') === 'night') { modeRef.current = 'night'; setMode('night'); }
    } catch { /* The tour also works when browser storage is unavailable. */ }
    modeTransition.current = createJourneyModeTransition({
      onStage(stage, targetMode) {
        curtainRef.current = stage; setCurtain(stage); setCurtainMode(targetMode); syncPause();
      },
      applyMode(nextMode) {
        modeRef.current = nextMode; setMode(nextMode); scene.current?.setMode(nextMode);
        try { localStorage.setItem('lavalleja:journey-mode', nextMode); } catch { /* Optional preference. */ }
      },
      onError(error) { console.warn('The journey lighting could not change.', error); },
    });
    const initialPause = document.documentElement.classList.contains('motion-paused') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    pausedRef.current = initialPause; setPaused(initialPause);
    const motion = (event: Event) => {
      const reduced = Boolean((event as CustomEvent<{ reduced: boolean }>).detail.reduced);
      pausedRef.current = reduced; setPaused(reduced); syncPause();
    };
    const replay = () => { if (curtainRef.current === 'idle') scene.current?.replay(); };
    document.addEventListener('lavalleja:motion', motion);
    document.addEventListener('lavalleja:journey-replay', replay);
    void import('../three/journeyScene').then(({ createJourneyScene }) => {
      if (cancelled || !host.current) return;
      try {
        scene.current = createJourneyScene(host.current, {
          onStop: setActive, onPhase: setPhase,
          onProgress: value => progress.current?.style.setProperty('--journey-progress', String(value)),
          onReady: () => setReady(true),
          onUnavailable: () => { setUnavailable(true); setReady(false); },
        }, modeRef.current);
        syncPause();
      } catch (error) {
        console.warn('The 3D journey could not start.', error);
        setUnavailable(true);
      }
    }).catch(error => { console.warn('The 3D journey could not load.', error); if (!cancelled) setUnavailable(true); });
    return () => { cancelled = true; modeTransition.current?.dispose(); modeTransition.current = null; scene.current?.dispose(); scene.current = null; document.removeEventListener('lavalleja:motion', motion); document.removeEventListener('lavalleja:journey-replay', replay); };
  }, []);

  useEffect(() => {
    const nav = route.current, button = nav?.querySelector<HTMLElement>('[aria-current="step"]');
    if (nav && button && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: button.offsetLeft - nav.clientWidth / 2 + button.clientWidth / 2, behavior: paused ? 'instant' : 'smooth' });
  }, [active, paused]);

  useEffect(() => {
    if (!changingMode) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [changingMode]);

  function choose(index: number) {
    if (curtainRef.current !== 'idle') return;
    index = (index + journeyStops.length) % journeyStops.length;
    if (scene.current && !unavailable) scene.current.select(index);
    else setActive(index);
  }
  function openGuide() {
    if (curtainRef.current !== 'idle') return;
    document.dispatchEvent(new CustomEvent('lavalleja:chapter', { detail: { id: stop.guideChapter || stop.id } }));
    document.querySelector('#guia')?.scrollIntoView({ behavior: paused ? 'instant' : 'smooth' });
  }
  function toggleMode() {
    if (curtainRef.current !== 'idle') return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setCurtainReduced(reduced);
    modeTransition.current?.start(modeRef.current === 'night' ? 'day' : 'night', reduced);
  }
  const timings = curtainReduced ? REDUCED_CURTAIN_TIMINGS : CURTAIN_TIMINGS;

  return <div data-mode={mode} data-curtain-stage={curtain} className={`journey-experience${ready ? ' journey-ready' : ''}${unavailable ? ' journey-unavailable' : ''}`}>
    {stop.image && <img className="journey-poster" id="hero-photo" src={stop.image} alt={stop.imageAlt} fetchPriority="high"/>}
    <div ref={host} id="hero-canvas" className="journey-canvas" aria-hidden="true"/>
    <div className="journey-night-fallback" aria-hidden="true"><span/></div>
    <div className="journey-vignette" aria-hidden="true"/>
    <div className="journey-masthead"><span>URUGUAY. HACIA ADENTRO.</span><span className="journey-masthead-actions"><span>UN RECORRIDO POR LAVALLEJA</span><i/><span>3D</span><button type="button" className="journey-theme-toggle" role="switch" aria-label="Modo nocturno" aria-checked={mode === 'night'} aria-disabled={curtain !== 'idle'} title={mode === 'night' ? 'Cambiar a modo diurno' : 'Cambiar a modo nocturno'} onClick={toggleMode}><ModeIcon night={mode === 'night'}/><span>{mode === 'night' ? 'Noche' : 'Día'}</span></button></span></div>
    <div className="journey-intro"><p>EL PAISAJE ES SOLO EL COMIENZO.</p><h1 id="journey-title">Enamorate<br/>de Lavalleja.</h1></div>
    <div className="journey-caption" key={stop.id}>
      <div className="journey-caption-meta"><span>{String(active + 1).padStart(2, '0')} / {String(journeyStops.length).padStart(2, '0')}</span><span>{stop.eyebrow}</span></div>
      <h2 aria-live="polite" aria-atomic="true">{stop.name}</h2>
      <p>{stop.description}</p>
      {stop.id === 'monasterio' ? <a href="https://budismo.com.uy/" target="_blank" rel="noopener noreferrer" className="journey-link">Consultá el templo <span>↗</span></a> : <button className="journey-link" onClick={openGuide}>Conocé este lugar <span>↗</span></button>}
      {stop.note && <small className="journey-stop-note">{stop.note}</small>}
    </div>
    <div className="journey-camera-state"><span className="journey-live-dot"/>{paused ? 'Recorrido en pausa · Arrastrá para explorar' : phase}</div>
    <div className="journey-control-row">
      <div className="journey-arrows"><button aria-label="Lugar anterior" onClick={() => choose(active - 1)}>←</button><button aria-label="Lugar siguiente" onClick={() => choose(active + 1)}>→</button></div>
      <button className="journey-about" onClick={() => { if (curtainRef.current === 'idle') { about.current?.showModal(); syncPause(); } }}>Acerca del recorrido <span>ⓘ</span></button>
    </div>
    <nav ref={route} className="journey-route" style={{ '--journey-stop-count': journeyStops.length } as CSSProperties} aria-label="Paradas del recorrido tridimensional">
      {journeyStops.map((item, index) => <button key={item.id} onClick={() => choose(index)} aria-current={index === active ? 'step' : undefined}><span className="journey-route-number">{String(index + 1).padStart(2, '0')}</span><span>{item.name}<small>{item.label}</small></span><i/></button>)}
    </nav>
    <div ref={progress} className="journey-timeline" aria-hidden="true"><span/></div>
    {!ready && !unavailable && <p className="journey-loading" role="status">Preparando tu recorrido…</p>}
    {unavailable && <p className="journey-loading" role="status">Vista fotográfica · Elegí una parada para seguir explorando.</p>}
    <dialog ref={about} className="journey-dialog" onClose={syncPause} onClick={event => { if (event.target === about.current) about.current.close(); }}>
      <div className="journey-about-content"><button className="journey-dialog-close" onClick={() => about.current?.close()} aria-label="Cerrar información del recorrido">×</button><p className="journey-dialog-eyebrow">OTRA FORMA DE MIRAR EL TERRITORIO</p><h2>Un viaje en tres dimensiones.</h2><p>Estos modelos se construyeron observando fotografías de los lugares: sus siluetas, materiales y detalles característicos. El relieve y las distancias se adaptaron para conectar las paradas en una sola escena.</p><p>Para organizar una visita, consultá la guía y la información vigente de cada lugar.</p><h3>Las paradas y sus fuentes</h3>{journeyStops.map(item => <section key={item.id}><h4>{item.name}</h4>{item.note && <p>{item.note}</p>}{item.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a>)}</section>)}<p className="journey-research-date">Referencias consultadas en noviembre de 2026.</p></div>
    </dialog>
    <span className="journey-mode-announcement" role="status" aria-live="polite">{curtain === 'presenting' ? (curtainMode === 'night' ? 'Modo nocturno. Lavalleja bajo las estrellas.' : 'Modo diurno. Lavalleja a cielo abierto.') : ''}</span>
    {portalHost && curtain !== 'idle' && createPortal(<div className="journey-curtain" data-stage={curtain} data-reduced-motion={curtainReduced} aria-hidden="true" style={{ '--curtain-close': `${timings.close}ms`, '--curtain-open': `${timings.open}ms` } as CSSProperties}>
      <div className="journey-curtain-panel journey-curtain-left"/><div className="journey-curtain-panel journey-curtain-right"/>
      <div className="journey-curtain-title"><span>LAVALLEJA</span><ModeIcon night={curtainMode === 'night'}/><p>{curtainMode === 'night' ? 'Bajo las estrellas.' : 'A cielo abierto.'}</p><small>{curtainMode === 'night' ? 'EL RECORRIDO NOCTURNO' : 'EL RECORRIDO DIURNO'}</small></div>
    </div>, portalHost)}
  </div>;
}
