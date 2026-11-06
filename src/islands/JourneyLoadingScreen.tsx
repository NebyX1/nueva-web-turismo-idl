import { useEffect, useId, useRef } from 'react';
import '../styles/journey-loading.css';

export interface JourneyLoadingState {
  slow: boolean;
  failed: boolean;
}

function WelcomeLandscape() {
  const id = useId();
  return <div className="journey-welcome-landscape" aria-hidden="true">
    <svg viewBox="0 0 400 290" fill="none">
      <defs>
        <linearGradient id={`${id}-sky`} x1="200" y1="18" x2="200" y2="250" gradientUnits="userSpaceOnUse"><stop stopColor="#97b7ad"/><stop offset=".62" stopColor="#dce1bd"/><stop offset="1" stopColor="#eed9a3"/></linearGradient>
        <radialGradient id={`${id}-glow`}><stop stopColor="#fff4ca" stopOpacity=".8"/><stop offset="1" stopColor="#fff4ca" stopOpacity="0"/></radialGradient>
        <linearGradient id={`${id}-hill`} x1="250" y1="145" x2="140" y2="263" gradientUnits="userSpaceOnUse"><stop stopColor="#577f64"/><stop offset="1" stopColor="#1d4b3d"/></linearGradient>
        <linearGradient id={`${id}-trail`} x1="201" y1="164" x2="210" y2="259" gradientUnits="userSpaceOnUse"><stop stopColor="#e8ddb1" stopOpacity=".35"/><stop offset="1" stopColor="#f2e5b8"/></linearGradient>
        <clipPath id={`${id}-window`}><circle cx="200" cy="135" r="116"/></clipPath>
      </defs>
      <ellipse cx="200" cy="274" rx="76" ry="3" fill="#071f1b" opacity=".22"/>
      <circle cx="200" cy="135" r="128" stroke="#d6d3a1" strokeOpacity=".17" strokeWidth=".7"/>
      <circle className="journey-welcome-orbit" cx="200" cy="135" r="128" pathLength="1" stroke="#e6dba9" strokeWidth="1.3" strokeLinecap="round" strokeDasharray=".13 .87"/>
      <g clipPath={`url(#${id}-window)`}>
        <path fill={`url(#${id}-sky)`} d="M76 12h248v248H76z"/>
        <g className="journey-welcome-sun">
          <circle cx="229" cy="104" r="79" fill={`url(#${id}-glow)`}/>
          <circle cx="229" cy="104" r="31" fill="#f8e9b7"/>
          <circle cx="229" cy="104" r="39" stroke="#fbefc7" strokeOpacity=".38" strokeWidth=".6"/>
        </g>
        <g className="journey-welcome-clouds" stroke="#f5f0da" strokeOpacity=".5" strokeWidth=".7" strokeLinecap="round"><path d="M107 83h42m-27 5h37m90-29h32m-18 5h26"/></g>
        <path d="M65 181c33-8 51-48 84-38 23 6 35-32 62-23 26 8 35-17 58-7 20 8 40 35 73 34v119H65Z" fill="#91aa83"/>
        <path d="M65 199c35-24 54-7 83-24 28-17 37-42 66-33 25 8 46 38 69 27 23-11 40-7 59 3v94H65Z" fill="#709171"/>
        <path className="journey-welcome-hill" d="M65 190c39-12 69-6 101 15 19 13 37 3 54-9 38-27 75-52 122-27v97H65Z" fill={`url(#${id}-hill)`}/>
        <path d="M65 231c44-22 75-4 104 7 43 15 79-36 111-43 24-5 44-1 62 10v61H65Z" fill="#245443"/>
        <path d="M204 161c-22 16 39 24 13 42-23 16-72 15-31 39 10 6 21 12 28 23" stroke={`url(#${id}-trail)`} strokeWidth="2.4" strokeLinecap="round"/>
        <path className="journey-welcome-path" d="M204 161c-22 16 39 24 13 42-23 16-72 15-31 39 10 6 21 12 28 23" pathLength="1" stroke="#fff0bd" strokeWidth="3" strokeLinecap="round" strokeDasharray=".08 .92"/>
        <path d="M65 254c31-15 66-11 91 3m93-4c21-12 58-18 93-5v18H65Z" fill="#173e32"/>
        <g className="journey-welcome-birds" stroke="#365c4d" strokeWidth="1.4" strokeLinecap="round"><path d="M139 104q5-5 10 0 5-5 10 0m5-13q4-4 8 0 4-4 8 0"/></g>
      </g>
      <g className="journey-welcome-botanical" stroke="#b9c8a0" strokeWidth=".8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M99 248c-20-12-35-29-41-52m18 33c-18-1-23-8-25-15 12 1 20 6 25 15Zm-10-16c-15-4-19-11-18-18 10 4 17 10 18 18Zm-6-17c-10-6-11-13-8-20 6 6 10 13 8 20Zm17 34c-1-15 4-23 10-27 3 11 0 19-10 27Zm-11-18c0-13 4-20 9-22 3 10 0 17-9 22Z"/>
        <path d="M301 248c20-12 35-29 41-52m-18 33c18-1 23-8 25-15-12 1-20 6-25 15Zm10-16c15-4 19-11 18-18-10 4-17 10-18 18Zm6-17c10-6 11-13 8-20-6 6-10 13-8 20Zm-17 34c1-15-4-23-10-27-3 11 0 19 10 27Zm11-18c0-13-4-20-9-22-3 10 0 17 9 22Z"/>
      </g>
      <path className="journey-welcome-spark" d="m330 54 2.5 7.5L340 64l-7.5 2.5L330 74l-2.5-7.5L320 64l7.5-2.5Z" fill="#e5dbaa"/>
      <circle cx="66" cy="110" r="2" fill="#c9d4b5" opacity=".6"/>
    </svg>
  </div>;
}

export default function JourneyLoadingScreen({ state, onRetry, onContinue }: {
  state: JourneyLoadingState;
  onRetry(): void;
  onContinue(): void;
}) {
  const screen = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const node = screen.current;
    if (!node) return;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Isolate the complete page, including navigation outside this React island.
    const inerted: HTMLElement[] = [];
    let branch: HTMLElement | null = node;
    while (branch?.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling instanceof HTMLElement && sibling !== branch && !sibling.inert) {
          sibling.inert = true; inerted.push(sibling);
        }
      }
      if (branch.parentElement === document.body) break;
      branch = branch.parentElement;
    }
    heading.current?.focus({ preventScroll: true });
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const buttons = [...node.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      if (!buttons.length) { event.preventDefault(); heading.current?.focus(); return; }
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    };
    node.addEventListener('keydown', trapFocus);
    return () => {
      node.removeEventListener('keydown', trapFocus);
      inerted.forEach(element => { element.inert = false; });
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement && previousFocus !== document.body && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      } else document.querySelector<HTMLElement>('#journey-title')?.focus({ preventScroll: true });
    };
  }, []);

  return <div ref={screen} className="journey-start-screen" role="dialog" aria-modal="true" aria-labelledby="journey-start-title" aria-describedby="journey-start-status" data-failed={state.failed}>
    <div className="journey-start-atmosphere" aria-hidden="true"><span/><span/><span/></div>
    <div className="journey-start-contours" aria-hidden="true">
      <svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice"><g fill="none" stroke="currentColor"><path d="M-100 690c260-230 390 190 720-80s540-50 880-340"/><path d="M-100 730c260-230 390 190 720-80s540-50 880-340"/><path d="M-100 770c260-230 390 190 720-80s540-50 880-340"/><path d="M-100 810c260-230 390 190 720-80s540-50 880-340"/></g></svg>
    </div>
    <div className="journey-start-brand"><svg viewBox="0 0 48 30" aria-hidden="true"><path d="M2 25 14 9l8 8L32 3l14 22M10 25l8-8m9 8 6-8 6 8"/></svg><span>LAVALLEJA</span></div>
    <span className="journey-start-edition">TURISMO · URUGUAY</span>
    <div className="journey-start-content">
      <WelcomeLandscape/>
      <h2 ref={heading} tabIndex={-1} id="journey-start-title"><span>{state.failed ? 'LAS SIERRAS SIGUEN ESPERÁNDOTE' : 'BIENVENIDOS A'}</span><em>Lavalleja.</em></h2>
      <p className="journey-start-description">{state.failed ? 'El recorrido no pudo abrirse. Podés volver a intentarlo o seguir descubriendo Lavalleja.' : <>Un respiro entre sierras.<br/>Dejá que el paisaje te sorprenda.</>}</p>
      <div className="journey-start-status" id="journey-start-status" role="status" aria-live="polite" aria-atomic="true">
        {!state.failed && <span className="journey-welcome-loader" aria-hidden="true"><i/></span>}
        <span>{state.failed ? 'Podés explorar el sitio sin el recorrido.' : state.slow ? 'Gracias por esperar. Estamos preparando tu bienvenida.' : 'Preparando tu bienvenida…'}</span>
      </div>
      {state.failed && <div className="journey-start-actions">
        <button type="button" onClick={onRetry} className="journey-start-retry">Volver a intentar <span aria-hidden="true">↻</span></button>
        <button type="button" onClick={onContinue} className="journey-start-skip">Entrar al sitio <span aria-hidden="true">↗</span></button>
      </div>}
    </div>
    <footer className="journey-start-footer"><span>URUGUAY, HACIA ADENTRO.</span><span>HAY QUE VIVIRLO.</span></footer>
  </div>;
}
