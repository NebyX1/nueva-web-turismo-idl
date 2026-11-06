import type { JourneyStop } from '../three/types';
import { journeyRoute } from './journeyRoute';
import type { JourneyStopId } from './journeyRoute';

const stopCatalog: Record<JourneyStopId, Omit<JourneyStop, 'id'>> = {
  'arequita': {
    name: 'Cerro Arequita y Naciente del Santa Lucía', navName: 'Arequita y Santa Lucía',
    heading: { title: 'Cerro Arequita', subtitle: 'y Naciente del Santa Lucía' },
    eyebrow: 'DONDE LA PIEDRA SE ENCUENTRA CON EL AGUA', label: 'Río, roca y monte',
    description: 'Paredones de piedra, monte nativo y el alto Santa Lucía a sus pies. El agua corre entre las sierras, con destellos y pequeñas señales de vida.',
    note: 'La naciente está en Cerro Pelado. Aquí se recrea el tramo del río que acompaña al Arequita.',
    image: '/media/c809a84c8bead525.webp', imageAlt: 'Cerro Arequita entre campos y monte nativo',
    sources: [
      { label: 'Ministerio de Ambiente · Parque Nacional Arequita y alto Santa Lucía', url: 'https://www.gub.uy/ministerio-ambiente/politicas-y-gestion/parque-nacional-arequita' },
      { label: 'Camping Arequita · Río Santa Lucía y naciente en Cerro Pelado', url: 'https://campingarequita.uy/senti-lavalleja/' },
    ],
  },
  'verdun': { name: 'Cerro del Verdún', eyebrow: 'UN HORIZONTE PARA CONTEMPLAR', label: 'Paisaje y santuario', description: 'El camino asciende hasta el santuario: un encuentro entre la devoción, el cielo y las sierras.', image: '/media/47b01b08f4f063e2.webp', imageAlt: 'Cerro y santuario del Verdún', sources: [{ label: 'Turismo de Lavalleja', url: 'https://www.gub.uy/intendencia-lavalleja/turismo' }] },
  'cerro-artigas': { name: 'Cerro Artigas', eyebrow: 'MINAS, DESDE OTRA PERSPECTIVA', label: 'Memoria y ciudad', description: 'El monumento ecuestre, rodeado por los pabellones de Uruguay, Artigas y los Treinta y Tres Orientales. Abajo, Minas se abre entre las sierras.', image: '', imageAlt: '', sources: [{ label: 'Ministerio de Turismo · Lavalleja', url: 'https://uruguaynatural.com/es/places/7016/' }] },
  'minas-sign': { name: 'Letras de Minas', eyebrow: 'EL NOMBRE SE VUELVE PAISAJE', label: 'La Coronilla', description: 'Las grandes letras blancas se recortan sobre la ladera rocosa de La Coronilla. Un nuevo hito en la entrada a Minas.', image: '', imageAlt: '', guideChapter: 'minas', sources: [{ label: 'Intendencia · Letras monumentales de Minas', url: 'https://www.gub.uy/intendencia-lavalleja/institucional/normativa/resolucion-n-2425024' }, { label: 'El Observador · Fotografías del cartel terminado', url: 'https://www.elobservador.com.uy/nacional/letras-gigantes-minas-tuvieron-visita-concurrida-este-feriado-no-laborable-del-18-julio-n6009130' }] },
  'plaza-libertad': { name: 'Plaza Libertad', eyebrow: 'EL CORAZÓN DE MINAS', label: 'Agua y patrimonio', description: 'Entre palmeras y agua en movimiento, Lavalleja a caballo marca el centro de la plaza. El paseo abre una vista hacia la catedral, al fondo del callejón.', image: '', imageAlt: '', guideChapter: 'minas', sources: [{ label: 'OPP · Remodelación de Plaza Libertad', url: 'https://www.opp.gub.uy/es/noticias/minas-celebro-la-remodelacion-de-su-plaza-historica' }, { label: 'Intendencia · Turismo de Lavalleja', url: 'https://www.gub.uy/intendencia-lavalleja/turismo' }] },
  'monasterio': { name: 'Monasterio budista', eyebrow: 'CHAGDUD GONPA SENGUE DZONG', label: 'Arquitectura y contemplación', description: 'Piedra local, galerías y cubiertas doradas. Una arquitectura singular en el paisaje de Aguas Blancas.', image: '', imageAlt: '', note: 'El templo informa cierre por reformas. Consultá su reapertura antes de planificar una visita.', sources: [{ label: 'Chagdud Gonpa · Sitio oficial', url: 'https://budismo.com.uy/' }] },
  'villa-serrana': { name: 'Villa Serrana', eyebrow: 'ARQUITECTURA QUE HABITA EL PAISAJE', label: 'Otro ritmo', description: 'El Ventorrillo, las casas y los pliegues del terreno: una manera de construir que invita a quedarse.', image: '/media/ac1362ec4809d96d.webp', imageAlt: 'Paisaje de Villa Serrana', sources: [{ label: 'MEC · Patrimonio histórico de Lavalleja', url: 'https://www.gub.uy/ministerio-educacion-cultura/sites/ministerio-educacion-cultura/files/2022-10/LAVALLEJA.pdf' }] },
  'penitente': { name: 'Salto del Penitente', eyebrow: 'EL AGUA ENCUENTRA SU CAMINO', label: 'Agua y piedra', description: 'Una caída entre paredes rocosas, una pequeña poza y el sonido del agua en medio de las sierras.', image: '/media/b19eab6a8f7a395a.webp', imageAlt: 'Cascada del Salto del Penitente', sources: [{ label: 'Parque Salto del Penitente', url: 'https://saltodelpenitente.com/' }] },
  'salus': { name: 'Reserva Natural Salus', eyebrow: 'ENTRAR AL VERDE', label: 'Monte y manantiales', description: 'El recorrido baja al monte: senderos entre árboles y la fuente que forma parte de la memoria del lugar.', image: '/media/eab864301ac501f8.webp', imageAlt: 'Camino arbolado de la Reserva Natural Salus', sources: [{ label: 'Reserva Natural Salus · Sitio oficial', url: 'https://reservanaturalsalus.com.uy/' }] },
};

export const journeyStops: JourneyStop[] = journeyRoute.map(({ id }) => ({ id, ...stopCatalog[id] }));
