export interface DwEvent {
  id: number
  description: string
  event_date: string // format: "MM-DD" or "YYYY-MM-DD" — depends on migration
  year: number | null
  created_at: string
  updated_at: string
}

export interface DwPhoto {
  id: number
  event_id: number
  url: string
  title: string | null
  author: string | null
  source: string | null
  created_at: string
}

// Event with photos joined
export interface DwEventWithPhotos extends DwEvent {
  photos: DwPhoto[]
}

export interface DwAdminUser {
  id: string
  email: string
  display_name: string | null
  role: 'admin' | 'editor'
  created_at: string
}
