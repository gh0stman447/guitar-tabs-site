export type TabFileFormat = 'pdf' | 'gp5' | 'gpx' | 'mp3'

export interface TabFiles {
  pdf?: string
  gp5?: string
  gpx?: string
  mp3?: string
}

export interface Tab {
  id: string
  title_ru: string
  title_en: string
  difficulty: string
  price: number
  description_ru: string
  description_en: string
  photo_url: string
  files: TabFiles
  purchase_count: number
  youtube_url?: string
}

export function getTabTitle(tab: Tab, locale: string): string {
  return locale === 'en' ? tab.title_en : tab.title_ru
}

export function getTabDescription(tab: Tab, locale: string): string {
  return locale === 'en' ? tab.description_en : tab.description_ru
}

export interface Customer {
  id: string
  name: string
  email: string
  subscribed: boolean
}

export interface Purchase {
  id: string
  customer_id: string
  tab_id: string
  paid_at: string
}
