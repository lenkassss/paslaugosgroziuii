export type ScrapedPreviewItem = {
  externalId?: string;
  title: string;
  description: string;
  html?: string;
  price?: number;
  images: string[];
  brand?: string;
  category?: string;
  stock?: number;
  volume?: string;
  inci?: string;
  url?: string;
};
