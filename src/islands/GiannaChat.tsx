import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConversationMessage } from '../../gianna-backend/frontend/src/types';
import { askGianna, giannaApiUrl, giannaError, sourceUrl } from '../lib/giannaApi';
import '../styles/gianna.css';

const avatar = '/media/137ff3d8d4cde96e.png';
const suggestions = [
  ['Un fin de semana', 'Tengo un fin de semana. ¿Qué me recomendás?'],
  ['Bajar un cambio', '¿Qué puedo hacer en Villa Serrana?'],
  ['Dormir y comer', '¿Dónde puedo dormir y comer?'],
];

export default function GiannaChat() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const session = useRef('');
  const active = useRef<AbortController | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [ready, setReady] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState('');
  const [consent, setConsent] = useState('');
  const busy = !!status;

  const send = useCallback(async (question: string) => {
    question = question.trim();
    if (!question || active.current) return;
    if (question.length > 4000) {
      setError('El mensaje no puede superar los 4000 caracteres.');
      return;
    }
    session.current ||= crypto.randomUUID();
    const sessionId = session.current;
    const generationId = crypto.randomUUID();
    const controller = new AbortController();
    active.current = controller;
    const isCurrent = () => active.current === controller && session.current === sessionId;
    setText('');
    setError('');
    setRetry('');
    setConsent('');
    setStatus('Buscando en la guía de Lavalleja…');
    setMessages(previous => [...previous, {
      id: generationId, role: 'user', content: question, timestamp: new Date().toISOString(),
    }]);
    const timeout = window.setTimeout(() => controller.abort(), 90000);
    let progressTimer: number | undefined;
    let progressWarning = false;
    const pollProgress = async () => {
      try {
        const params = new URLSearchParams({ session_id: sessionId, generation_id: generationId });
        const response = await fetch(giannaApiUrl(`/api/turn-progress?${params}`), { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error(`Progreso de Gianna: HTTP ${response.status}`);
        const progress: unknown = await response.json();
        if (isCurrent() && typeof progress === 'object' && progress !== null
          && 'state' in progress && progress.state === 'WEB_SEARCHING') setStatus('Buscando fuentes actuales en la web…');
      } catch (reason) {
        if (!controller.signal.aborted && !progressWarning) {
          console.warn('No se pudo consultar el progreso de Gianna; la consulta principal sigue en curso.', reason);
          progressWarning = true;
        }
      }
      if (isCurrent() && !controller.signal.aborted) progressTimer = window.setTimeout(pollProgress, 600);
    };
    void pollProgress();
    try {
      const result = await askGianna(question, sessionId, generationId, controller.signal);
      if (!isCurrent()) return;
      if (result.needsWebPermission) {
        setConsent(question);
      } else {
        setMessages(previous => [...previous, {
          id: `${generationId}-answer`, role: 'assistant', content: result.answer,
          sources: result.sources, timestamp: new Date().toISOString(),
        }]);
        setReady(true);
      }
    } catch (reason) {
      if (!isCurrent()) return;
      console.error('La consulta a Gianna falló.', reason);
      setError(giannaError(reason, controller.signal.aborted));
      setRetry(question);
    } finally {
      window.clearTimeout(timeout);
      if (progressTimer !== undefined) window.clearTimeout(progressTimer);
      if (isCurrent()) {
        active.current = null;
        controller.abort();
        setStatus('');
        input.current?.focus();
      }
    }
  }, []);

  const show = useCallback((question?: string) => {
    document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(item => {
      if (item !== dialog.current) item.close();
    });
    if (!dialog.current?.open) dialog.current?.showModal();
    setOpen(true);
    input.current?.focus();
    if (question) void send(question);
  }, [send]);

  const reset = () => {
    active.current?.abort();
    active.current = null;
    session.current = crypto.randomUUID();
    setMessages([]);
    setStatus('');
    setError('');
    setRetry('');
    setConsent('');
    setText('');
    input.current?.focus();
  };

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail: unknown = event instanceof CustomEvent ? event.detail : undefined;
      show(typeof detail === 'string' ? detail : undefined);
    };
    document.addEventListener('gianna:open', onOpen);
    return () => {
      document.removeEventListener('gianna:open', onOpen);
      active.current?.abort();
    };
  }, [show]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const check = async () => {
      try {
        const response = await fetch(giannaApiUrl('/api/ready'), { signal: controller.signal, cache: 'no-store' });
        const data: unknown = await response.json();
        if (!controller.signal.aborted) setReady(response.ok && typeof data === 'object' && data !== null
          && 'status' in data && data.status === 'ready');
      } catch (reason) {
        if (!controller.signal.aborted) {
          console.warn('Gianna no está disponible.', reason);
          setReady(false);
        }
      }
    };
    void check();
    const timer = window.setInterval(check, 30000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [open]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages, status, error, consent]);

  return <>
    <button className="gianna-launcher" id="gianna-launcher" onClick={() => show()} aria-label="Abrir conversación con Gianna Turismo">
      <span className="gianna-launcher-label">¿Armamos tu viaje?</span>
      <span className="gianna-launcher-avatar"><img src={avatar} alt="" width="56" height="56" /><span /></span>
    </button>
    <dialog ref={dialog} id="gianna-dialog" className="modal gianna-dialog" aria-labelledby="gianna-dialog-title" onClose={() => setOpen(false)}>
      <div className="modal-box gianna-panel">
        <header className="gianna-chat-header">
          <img src={avatar} width="48" height="48" alt="Avatar de Gianna" />
          <div><h2 id="gianna-dialog-title">Gianna <span>TURISMO</span></h2><p>Tu compañera para descubrir Lavalleja</p></div>
          <button className="circle-button" onClick={() => dialog.current?.close()} aria-label="Cerrar Gianna">×</button>
        </header>
        <div className="gianna-connection" role="status">
          <span>{ready === null ? 'Comprobando conexión…' : ready ? 'Conectada a la guía de Lavalleja' : 'Gianna no está disponible. Intentá nuevamente más tarde.'}</span>
          <button type="button" className="text-link" onClick={reset}>Nueva conversación</button>
        </div>
        <div ref={log} className="chat-messages" id="chat-messages" role="log" aria-live="polite" aria-label="Conversación con Gianna" aria-busy={busy}>
          {!messages.length && <div className="chat-message assistant"><h3>Hola, soy Gianna.</h3><p>¿Qué te gustaría vivir en Lavalleja? Contame cuánto tiempo tenés o qué tipo de paseo te mueve.</p></div>}
          {messages.map(message => <div key={message.id} className={`chat-message ${message.role}`}>
            <p className="gianna-message-text">{message.content}</p>
            {!!message.sources?.length && <details><summary>Fuentes para ampliar ({message.sources.length})</summary>
              {message.sources.map((source, index) => {
                const url = sourceUrl(source);
                return <div key={index}>{url ? <a href={url} target="_blank" rel="noopener noreferrer">{source.title}</a> : <strong>{source.title}</strong>}
                  {source.consulted_only && <p>Fuente consultada; no confirma un evento vigente.</p>}
                </div>;
              })}
            </details>}
          </div>)}
          {busy && <div className="chat-message assistant" role="status">{status}</div>}
          {error && <div className="gianna-error" role="alert"><p>{error}</p>{retry && <button type="button" className="text-link" onClick={() => void send(retry)} disabled={busy}>Reintentar</button>}</div>}
          {consent && <div className="chat-message assistant"><p>No tengo ese dato actualizado. ¿Querés que lo busque en la web?</p>
            <button type="button" className="chat-action" onClick={() => void send(`${consent.slice(0, 3980)} buscá en la web`)}>Buscar en la web</button>
            <button type="button" className="chat-action" onClick={() => setConsent('')}>No, gracias</button>
          </div>}
        </div>
        {!messages.length && <div className="chat-suggestions">{suggestions.map(([label, question]) =>
          <button key={label} type="button" disabled={busy} onClick={() => void send(question)}>{label}</button>)}</div>}
        <form id="gianna-form" className="chat-compose" onSubmit={event => { event.preventDefault(); void send(text); }}>
          <label className="sr-only" htmlFor="gianna-input">Tu mensaje a Gianna</label>
          <textarea ref={input} id="gianna-input" className="input" value={text} onChange={event => setText(event.target.value)}
            placeholder="¿Qué te gustaría vivir?" maxLength={4000} rows={2} onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void send(text);
              }
            }} />
          <button type="submit" className="chat-send" disabled={busy || !text.trim()} aria-label="Enviar mensaje">↑</button>
        </form>
        <p className="chat-fineprint">Tus mensajes se envían a Gianna y a su proveedor de IA. No compartas datos personales. Confirmá horarios y reservas con cada prestador.</p>
      </div>
      <form method="dialog" className="modal-backdrop"><button aria-label="Cerrar conversación">Cerrar</button></form>
    </dialog>
  </>;
}
