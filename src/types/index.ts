declare global {
  interface Window {
    ym?: (counterId: number, method: string, ...args: unknown[]) => void;
  }
}

export const FORMATS = ['pdf', 'gp5', 'gpx', 'mp3'] as const;
export type TabFileFormat = (typeof FORMATS)[number];

export interface TabFiles {
  pdf?: boolean;
  gp5?: boolean;
  gpx?: boolean;
  mp3?: boolean;
}

export interface Tab {
  id: string;
  title_ru: string;
  title_en: string;
  difficulty: string;
  price: number;
  description_ru: string;
  description_en: string;
  photo_url: string;
  files: TabFiles;
  purchase_count: number;
  youtube_url?: string;
}

export function getTabTitle(tab: Tab, locale: string): string {
  return locale === 'en' ? tab.title_en : tab.title_ru;
}

export function getTabDescription(tab: Tab, locale: string): string {
  return locale === 'en' ? tab.description_en : tab.description_ru;
}

export interface Customer {
  id: string;
  created_at: string;
  firstname: string;
  email: string;
  newsletter: boolean;
}

export interface Purchase {
  id: string;
  created_at: string;
  customer_id: string;
  tab_id: string | null;
  tab_ids: string[] | null;
  amount: number;
  payment_id: string | null;
  status: string;
  resend_email_id: string | null;
  email_status: string | null;
  receipt_url: string | null;
}
