import type { EvidenceSource } from '../../gianna-backend/frontend/src/types';
import { stripCitationMarkers } from '../../gianna-backend/frontend/src/presentation';

export type GiannaAnswer = {
  answer: string;
  sources: EvidenceSource[];
  needsWebPermission: boolean;
};

export function giannaApiUrl(path: string, base = import.meta.env.PUBLIC_GIANNA_API_BASE || ''): string {
  if (!base.trim()) return path;
  const url = new URL(base.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
    || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('PUBLIC_GIANNA_API_BASE debe ser un origen HTTP(S), sin /api ni credenciales.');
  }
  return `${url.origin}${path}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSource(value: unknown): value is EvidenceSource {
  return isObject(value) && typeof value.title === 'string'
    && (value.url === undefined || typeof value.url === 'string')
    && (value.source_refs === undefined || (Array.isArray(value.source_refs)
      && value.source_refs.every(ref => typeof ref === 'string' || typeof ref === 'number')));
}

export function sourceUrl(source: EvidenceSource): string | undefined {
  const candidate = source.url || source.source_refs?.find(ref => typeof ref === 'string' && /^https?:\/\//i.test(ref));
  if (typeof candidate !== 'string') return undefined;
  try {
    const url = new URL(candidate);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export async function askGianna(question: string, sessionId: string, generationId: string, signal: AbortSignal): Promise<GiannaAnswer> {
  const response = await fetch(giannaApiUrl('/api/ask-text'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      question, session_id: sessionId, conversation_id: sessionId,
      generation_id: generationId, turn_id: generationId, source: 'human',
    }),
  });
  if (response.status === 429) throw new Error('RATE_LIMITED');
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('BACKEND_UNAVAILABLE');
  }
  const data: unknown = await response.json();
  if (!isObject(data)) throw new Error('INVALID_RESPONSE');
  if (!response.ok) throw new Error(typeof data.error_code === 'string' ? data.error_code : 'BACKEND_UNAVAILABLE');
  if (data.generation_id !== generationId) throw new Error('INVALID_RESPONSE');
  if (data.state === 'ASKING_WEB_PERMISSION') return { answer: '', sources: [], needsWebPermission: true };
  if (data.state === 'INTERRUPTED') throw new Error('INTERRUPTED');
  if (typeof data.answer !== 'string' || !data.answer.trim()) throw new Error('INVALID_RESPONSE');
  const sources = Array.isArray(data.evidence) && data.evidence.length ? data.evidence : data.searched_sources ?? [];
  if (!Array.isArray(sources) || !sources.every(isSource)) throw new Error('INVALID_RESPONSE');
  const answer = stripCitationMarkers(data.answer);
  if (!answer) throw new Error('INVALID_RESPONSE');
  return { answer, sources, needsWebPermission: false };
}

export function giannaError(reason: unknown, timedOut = false): string {
  if (timedOut) return 'La consulta demoró más de lo previsto. Podés volver a intentarlo.';
  const code = reason instanceof Error ? reason.message : '';
  const messages: Record<string, string> = {
    LLM_UNAVAILABLE: 'Gianna no pudo conectar con su modelo de inteligencia artificial. Intentá nuevamente más tarde.',
    RAG_INDEX_UNAVAILABLE: 'La guía de Gianna todavía no está lista. Intentá nuevamente más tarde.',
    ANSWER_TIMEOUT: 'La consulta demoró más de lo previsto. Podés volver a intentarlo.',
    INVALID_RESPONSE: 'Gianna recibió una respuesta inválida del servidor. Podés volver a intentarlo.',
    INTERRUPTED: 'La consulta fue interrumpida. Podés volver a intentarlo.',
    RATE_LIMITED: 'Enviaste varias consultas seguidas. Esperá un minuto antes de intentar nuevamente.',
  };
  return messages[code] || 'No pude conectar con Gianna. Revisá tu conexión o intentá nuevamente más tarde.';
}
