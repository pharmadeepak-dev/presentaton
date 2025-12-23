
export interface Slide {
  id: string;
  type: 'image' | 'pdf';
  url: string;
  thumbnailUrl?: string;
  name: string;
  order: number;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  slides: Slide[];
  createdAt: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  assignedBrandIds: string[];
  savedSlideIds?: string[];
}

export type ViewState = 'dashboard' | 'doctors' | 'brands' | 'presentation' | 'editor';
