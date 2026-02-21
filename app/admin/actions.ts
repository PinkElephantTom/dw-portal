'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ─── Events ────────────────────────────────────────────────

export async function createEvent(formData: FormData) {
  const description = formData.get('description') as string
  const eventDate = formData.get('event_date') as string

  if (!description || description.trim().length < 10) {
    return { error: 'Opis musi mieć co najmniej 10 znaków.' }
  }
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return { error: 'Data jest wymagana (format: RRRR-MM-DD).' }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji.' }

  const { data, error } = await supabase
    .from('dw_events')
    .insert({ description: description.trim(), event_date: eventDate })
    .select('id')
    .single()

  if (error) return { error: `Błąd zapisu: ${error.message}` }

  revalidatePath('/')
  revalidatePath('/admin/wydarzenia')
  redirect(`/admin/wydarzenia/${data.id}`)
}

export async function updateEvent(id: number, formData: FormData) {
  const description = formData.get('description') as string
  const eventDate = formData.get('event_date') as string

  if (!description || description.trim().length < 10) {
    return { error: 'Opis musi mieć co najmniej 10 znaków.' }
  }
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return { error: 'Data jest wymagana (format: RRRR-MM-DD).' }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji.' }

  const { error } = await supabase
    .from('dw_events')
    .update({ description: description.trim(), event_date: eventDate })
    .eq('id', id)

  if (error) return { error: `Błąd zapisu: ${error.message}` }

  revalidatePath('/')
  revalidatePath('/admin/wydarzenia')
  revalidatePath(`/admin/wydarzenia/${id}`)
  revalidatePath(`/wydarzenie/${id}`)

  return { success: true }
}

export async function deleteEvent(id: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji.' }

  const { error } = await supabase
    .from('dw_events')
    .delete()
    .eq('id', id)

  if (error) return { error: `Błąd usuwania: ${error.message}` }

  revalidatePath('/')
  revalidatePath('/admin/wydarzenia')
  redirect('/admin/wydarzenia')
}

// ─── Photos ────────────────────────────────────────────────

export async function addPhoto(formData: FormData) {
  const eventId = Number(formData.get('event_id'))
  const url = (formData.get('url') as string)?.trim()
  const title = (formData.get('title') as string)?.trim() || null
  const author = (formData.get('author') as string)?.trim() || null
  const source = (formData.get('source') as string)?.trim() || null

  if (!eventId) return { error: 'Brak ID wydarzenia.' }
  if (!url) return { error: 'URL zdjęcia jest wymagany.' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji.' }

  const { error } = await supabase
    .from('dw_photos')
    .insert({ event_id: eventId, url, title, author, source })

  if (error) return { error: `Błąd zapisu: ${error.message}` }

  revalidatePath(`/admin/wydarzenia/${eventId}`)
  revalidatePath(`/wydarzenie/${eventId}`)
  revalidatePath('/')

  return { success: true }
}

export async function deletePhoto(id: number, eventId: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji.' }

  const { error } = await supabase
    .from('dw_photos')
    .delete()
    .eq('id', id)

  if (error) return { error: `Błąd usuwania: ${error.message}` }

  revalidatePath(`/admin/wydarzenia/${eventId}`)
  revalidatePath(`/wydarzenie/${eventId}`)
  revalidatePath('/')

  return { success: true }
}
