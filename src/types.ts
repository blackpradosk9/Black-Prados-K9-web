export interface Booking {
  id?: string;
  name: string;
  phone: string;
  location: string;
  dogName: string;
  service: string;
  message: string;
  time: string;
  source?: 'modal' | 'contact';
}

export interface Feedback {
  id?: string;
  name: string;
  service: string;
  rating: number;
  text: string;
  time: string;
}

export interface GalleryImage {
  id?: string;
  url: string;
  label: string;
}

export interface SiteContent {
  [key: string]: any;
}

export interface CustomPanelItem {
  id: string;
  title: string;
  desc: string;
  icon?: string;
  tag?: string;
  price?: string;
}

export interface CustomPanel {
  id: string;
  type: 'banner' | 'features' | 'testimonials' | 'cards' | 'richText';
  title: string;
  subtitle?: string;
  badge?: string;
  content?: string;
  bgStyle?: 'default' | 'dark' | 'accent' | 'card';
  items?: CustomPanelItem[];
}

