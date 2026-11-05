export type GuideCategory = 'Empezá acá' | 'Destinos' | 'Itinerarios' | 'Planificá';
export interface GuideChapter {
  id: string;
  title: string;
  category: GuideCategory;
  eyebrow: string;
  intro: string;
  image?: string;
  imageAlt?: string;
  imageCaption?: string;
  duration: string;
  location: string;
  highlights: string[];
  sections: { title: string; body: string }[];
  tip: { title: string; body: string };
  mapQuery?: string;
  sources: { label: string; url: string }[];
}
