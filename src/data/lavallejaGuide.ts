import type { GuideChapter, GuideCategory } from './guideTypes';
import { destinationChapters } from './guideDestinations';
import { planningChapters } from './guidePlanning';

export const guideCategories: GuideCategory[] = ['Empezá acá', 'Destinos', 'Itinerarios', 'Planificá'];
const welcome: GuideChapter = {
  id: 'bienvenida', title: 'Explorá Lavalleja.', category: 'Empezá acá',
  eyebrow: 'SENTITE UN EXPLORADOR',
  intro: 'Abrí este cuaderno y seguí tu curiosidad. Hay un Uruguay que se descubre entre sierras, caminos de tierra y sobremesas largas. Desde Minas hasta los pueblos del interior de Lavalleja, la invitación es mirar de cerca, caminar con tiempo y vivir la experiencia.',
  image: '/media/c809a84c8bead525.webp', imageAlt: 'El cerro Arequita se eleva sobre el paisaje rural de Lavalleja', imageCaption: 'Cerro Arequita · Lavalleja, Uruguay',
  duration: 'De un día a una semana', location: 'Lavalleja · Uruguay',
  highlights: ['Sierras y naturaleza', 'Pueblos con historia', 'Escapadas a tu medida'],
  sections: [
    { title: 'Una guía para salir a explorar', body: 'Encontrá qué hacer en cada destino, cómo combinar las visitas y qué conviene resolver antes de salir. Minas puede ser tu base para recorrer el sur del departamento; Villa Serrana invita a quedarse entre las sierras. Hacia el interior, las pequeñas localidades suman historias, paisajes rurales y otra manera de viajar.' },
    { title: 'Elegí tu forma de viajar', body: 'Para una primera visita, empezá por los destinos y elegí uno o dos por jornada. Si preferís un recorrido armado, abrí los itinerarios de uno, dos o tres días. En Planificá tenés transporte, alojamiento, sabores, accesibilidad y recomendaciones para disfrutar del campo con cuidado. Los tiempos propuestos son orientativos: ajustalos al clima, tu movilidad y las condiciones del lugar.' },
    { title: 'Leé, guardá y volvé', body: 'Abrí el índice para buscar un lugar o un tema. Podés guardar capítulos como favoritos, cambiar el tamaño del texto y ampliar la guía a pantalla completa. Tu última página y tus favoritos se recuerdan en este navegador. Cada capítulo incluye fuentes para consultar la información del lugar antes del viaje.' },
  ],
  tip: { title: 'Dejá lugar para lo inesperado', body: 'Reservá las actividades que lo requieran y evitá llenar el día de traslados. Una caminata corta, una comida tranquila y un atardecer pueden ser un gran viaje.' },
  sources: [{ label: 'Intendencia de Lavalleja · Turismo', url: 'https://www.gub.uy/intendencia-lavalleja/turismo' }],
};
export const guideChapters: GuideChapter[] = [welcome, ...destinationChapters, ...planningChapters];
