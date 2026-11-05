import type { GuideChapter } from './guideTypes';

export type GuidePlace = 'arequita' | 'serrana' | 'penitente' | 'minas' | 'verdun' | 'salus' | 'aguas' | 'marco' | 'solis' | 'zapican' | 'artigas' | 'mariscala' | 'varela' | 'batlle' | 'piraraja';
export interface PostcardPhoto {
  src: string;
  label: string;
  place: GuidePlace;
}
export interface ChapterDesign {
  title: string;
  tagline: string;
  accent: string;
  paper: string;
  photos: PostcardPhoto[];
}
const photos: Record<string, PostcardPhoto> = {
  arequita: { src: '/media/explorer/arequita.webp', label: 'Cerro Arequita', place: 'arequita' },
  'arequita-roquedo': { src: '/media/explorer/arequita-roquedo.webp', label: 'Arequita · El roquedo', place: 'arequita' },
  'arequita-monte': { src: '/media/explorer/arequita-monte.webp', label: 'Arequita · Monte al pie del cerro', place: 'arequita' },
  serrana: { src: '/media/explorer/villa-serrana.webp', label: 'Villa Serrana', place: 'serrana' },
  penitente: { src: '/media/explorer/penitente.webp', label: 'Salto del Penitente', place: 'penitente' },
  minas: { src: '/media/explorer/minas.webp', label: 'Minas · Plaza Libertad', place: 'minas' },
  verdun: { src: '/media/explorer/verdun.webp', label: 'Cerro del Verdún', place: 'verdun' },
  salus: { src: '/media/explorer/salus.webp', label: 'Reserva Natural Salus', place: 'salus' },
  aguas: { src: '/media/explorer/aguas-blancas.webp', label: 'Aguas Blancas', place: 'aguas' },
  marco: { src: '/media/explorer/marco-de-los-reyes.webp', label: 'Marco de los Reyes', place: 'marco' },
  solis: { src: '/media/explorer/solis-mataojo.webp', label: 'Solís de Mataojo', place: 'solis' },
  acceso: { src: '/media/explorer/solis-acceso.webp', label: 'Acceso a Solís de Mataojo', place: 'solis' },
  zapican: { src: '/media/explorer/zapican.webp', label: 'Campo de Zapicán', place: 'zapican' },
  artigas: { src: '/media/explorer/cerro-artigas.webp', label: 'Cerro Artigas · Minas', place: 'artigas' },
  mariscala: { src: '/media/explorer/mariscala.webp', label: 'Mariscala', place: 'mariscala' },
  varela: { src: '/media/explorer/jose-pedro-varela.webp', label: 'José Pedro Varela', place: 'varela' },
  batlle: { src: '/media/explorer/batlle-y-ordonez.webp', label: 'José Batlle y Ordóñez', place: 'batlle' },
  piraraja: { src: '/media/explorer/piraraja.webp', label: 'Pirarajá', place: 'piraraja' },
};
// Geographic scope is separate from art direction so an accidental cross-chapter
// asset assignment fails validation instead of silently showing another place.
const chapterPlaces: Record<string, readonly GuidePlace[]> = {
  bienvenida: ['arequita', 'serrana', 'penitente'],
  minas: ['minas'], 'cerro-artigas': ['artigas'], verdun: ['verdun'], arequita: ['arequita'],
  'villa-serrana': ['serrana'], penitente: ['penitente'], salus: ['salus'],
  'marco-de-los-reyes': ['marco'], 'aguas-blancas': ['aguas'], solis: ['solis'],
  mariscala: ['mariscala'], varela: ['varela'], batlle: ['batlle'], piraraja: ['piraraja'], zapican: ['zapican'],
  geoparque: ['arequita', 'salus', 'aguas'],
  'un-dia': ['minas', 'salus', 'verdun'], 'dos-dias': ['serrana', 'penitente', 'marco'],
  'tres-dias': ['penitente', 'arequita', 'minas'],
};
type DesignBrief = { title: string; tagline: string; accent?: string; photos: string[] };
const briefs: Record<string, DesignBrief> = {
  bienvenida: { title: 'LAVALLEJA', tagline: 'Viví la experiencia.', photos: ['arequita', 'serrana', 'penitente'] },
  minas: { title: 'MINAS', tagline: 'Historias que se viven.', accent: '#aa654d', photos: ['minas'] },
  'cerro-artigas': { title: 'CERRO\nARTIGAS', tagline: 'La ciudad cambia de perspectiva.', photos: ['artigas'] },
  verdun: { title: 'CERRO DEL\nVERDÚN', tagline: 'Un horizonte para contemplar.', accent: '#61755c', photos: ['verdun'] },
  arequita: { title: 'AREQUITA', tagline: 'Lo inmenso, más cerca.', photos: ['arequita', 'arequita-roquedo', 'arequita-monte'] },
  'villa-serrana': { title: 'VILLA\nSERRANA', tagline: 'Un lugar. Otro ritmo.', photos: ['serrana'] },
  penitente: { title: 'SALTO DEL\nPENITENTE', tagline: 'La naturaleza suena así.', photos: ['penitente'] },
  salus: { title: 'RESERVA\nSALUS', tagline: 'Entrá al verde.', accent: '#477461', photos: ['salus'] },
  'marco-de-los-reyes': { title: 'MARCO DE\nLOS REYES', tagline: 'El paisaje también es el camino.', accent: '#a66a4a', photos: ['marco'] },
  'aguas-blancas': { title: 'AGUAS\nBLANCAS', tagline: 'Dejá que el día fluya.', photos: ['aguas'] },
  solis: { title: 'SOLÍS DE\nMATAOJO', tagline: 'La cultura encuentra su paisaje.', accent: '#a77546', photos: ['solis', 'acceso'] },
  mariscala: { title: 'MARISCALA', tagline: 'Una pausa, otra historia.', accent: '#9b7546', photos: ['mariscala'] },
  varela: { title: 'JOSÉ PEDRO\nVARELA', tagline: 'El norte tiene su propio ritmo.', accent: '#8b764a', photos: ['varela'] },
  batlle: { title: 'BATLLE Y\nORDÓÑEZ', tagline: 'Seguir el hilo de la memoria.', accent: '#ae6c51', photos: ['batlle'] },
  piraraja: { title: 'PIRARAJÁ', tagline: 'El tiempo de encontrarse.', accent: '#88734f', photos: ['piraraja'] },
  zapican: { title: 'ZAPICÁN', tagline: 'El interior se cuenta despacio.', accent: '#9d7949', photos: ['zapican'] },
  geoparque: { title: 'MANANTIALES\nSERRANOS', tagline: 'La Tierra tiene mucho que contar.', photos: ['arequita', 'salus', 'aguas'] },
  'un-dia': { title: 'UN DÍA.\nMIL RECUERDOS.', tagline: 'Minas y una escapada.', photos: ['minas', 'salus', 'verdun'] },
  'dos-dias': { title: 'UN FIN\nDE SEMANA.', tagline: 'Dos días entre sierras.', photos: ['serrana', 'penitente', 'marco'] },
  'tres-dias': { title: 'TRES DÍAS.\nA TU MANERA.', tagline: 'Ciudad, naturaleza y caminos.', photos: ['penitente', 'arequita', 'minas'] },
  'como-llegar': { title: 'LA RUTA\nES TUYA.', tagline: 'El viaje empieza en el camino.', photos: [] },
  'cuando-venir': { title: 'TODAS LAS\nESTACIONES.', tagline: 'Una mochila. Muchas posibilidades.', accent: '#a77546', photos: [] },
  sabores: { title: 'SABOR\nA LAVALLEJA.', tagline: 'También se viaja con la sobremesa.', accent: '#b27052', photos: [] },
  'donde-dormir': { title: 'QUEDATE\nUN POCO MÁS.', tagline: 'Encontrá tu forma de descansar.', photos: [] },
  'en-familia': { title: 'UN VIAJE\nPARA TODOS.', tagline: 'El mejor ritmo es el de tu grupo.', accent: '#587b65', photos: [] },
  'turismo-responsable': { title: 'DEJÁ SOLO\nTUS HUELLAS.', tagline: 'Cuidar también es una forma de viajar.', accent: '#587b65', photos: [] },
  preparar: { title: 'TODO LISTO\nPARA SALIR.', tagline: 'Lo esencial, a mano.', photos: [] },
};

export function chapterDesign(chapter: GuideChapter): ChapterDesign {
  const brief = briefs[chapter.id] || { title: chapter.title.toUpperCase(), tagline: chapter.eyebrow, photos: [] };
  const allowed = chapterPlaces[chapter.id] || [];
  const plates = brief.photos.map(key => {
    const plate = photos[key];
    if (!plate || !allowed.includes(plate.place)) throw new Error(`Ilustración fuera del capítulo: ${chapter.id} / ${key}`);
    return plate;
  });
  return { ...brief, accent: brief.accent ? '#776c53' : '#4c6573', paper: '#f5ecd4', photos: plates };
}
