export type TabFileFormat = 'pdf' | 'gp5' | 'gpx' | 'mp3'

export interface TabFiles {
  pdf?: string
  gp5?: string
  gpx?: string
  mp3?: string
}

export interface Tab {
  id: string
  title: string
  difficulty: string
  price: number
  description: string
  photo_url: string
  files: TabFiles
  purchase_count: number
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
