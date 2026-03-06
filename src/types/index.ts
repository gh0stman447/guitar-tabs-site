export interface Tab {
  id: string
  title: string
  difficulty: string
  price: number
  description: string
  photo_url: string
  pdf_url: string
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
