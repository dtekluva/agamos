export type User = { id: number; email: string; full_name: string; phone?: string; email_verified?: boolean; is_claimed?: boolean; kyc_status?: 'none' | 'pending' | 'verified' | 'rejected' } | null

export interface Gift {
  id: number
  registry: number
  title: string
  description: string
  image_url: string
  display_image: string | null
  category: string
  target_amount: string
  allow_partial: boolean
  is_cash_fund: boolean
  show_progress: boolean
  sort_order: number
  archived: boolean
  amount_raised: number
  pct_funded: number
  remaining: number
  fully_funded: boolean
}

export interface StoryMoment {
  id: number
  registry: number
  title: string
  date: string | null
  description: string
  image_url: string
  display_image: string | null
  sort_order: number
}

export interface GalleryImage {
  id: number
  registry: number
  image_url: string
  display_image: string | null
  caption: string
  sort_order: number
}

export interface Tribute {
  id: number
  registry: number
  name: string
  message: string
  created_at: string
}

export interface GuestUpload {
  id: number
  registry: number
  display_media: string
  media_type: 'image' | 'video'
  uploader_name: string
  caption: string
  created_at: string
}

export interface Registry {
  id: number
  slug: string
  event_type: string
  partner_one_name: string
  partner_two_name: string
  organiser_name: string
  display_name: string
  couple_names: string
  is_memorial: boolean
  event_date: string | null
  years_celebrated: number | null
  turning_age: number | null
  venue: string
  city: string
  cover_image_url: string
  cover: string | null
  hero_message: string
  our_story: string
  show_story: boolean
  show_timeline: boolean
  show_gallery: boolean
  show_event_details: boolean
  show_registry: boolean
  show_tributes: boolean
  show_guest_uploads: boolean
  guest_uploads_allow_video: boolean
  theme: string
  currency: string
  published: boolean
  bank_name?: string
  bank_code?: string
  account_number?: string
  account_name?: string
  total_raised: number
  total_withdrawn?: number
  available_balance: number
  gifts: Gift[]
  moments: StoryMoment[]
  gallery: GalleryImage[]
  tributes: Tribute[]
  guest_uploads: GuestUpload[]
}

export interface Contribution {
  id: number
  gift: number
  gift_title: string
  guest_name: string
  display_name: string
  message: string
  is_anonymous: boolean
  amount: string
  status: string
  thanked: boolean
  reference: string
  created_at: string
  paid_at: string | null
}
