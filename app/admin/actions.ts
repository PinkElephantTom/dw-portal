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

  return { success: true, id: data.id }
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

  // Get photo URL before deleting (to clean up storage)
  const { data: photo } = await supabase
    .from('dw_photos')
    .select('url')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('dw_photos')
    .delete()
    .eq('id', id)

  if (error) return { error: `Błąd usuwania: ${error.message}` }

  // Clean up Supabase Storage file if applicable
  if (photo?.url?.includes('supabase.co/storage')) {
    try {
      const path = photo.url.split('/event-photos/')[1]
      if (path) {
        await supabase.storage.from('event-photos').remove([decodeURIComponent(path)])
      }
    } catch {
      // Ignore storage cleanup errors
    }
  }

  revalidatePath(`/admin/wydarzenia/${eventId}`)
  revalidatePath(`/wydarzenie/${eventId}`)
  revalidatePath('/')

  return { success: true }
}

// ─── Photo metadata update ─────────────────────────────────

export async function updatePhoto(photoId: number, eventId: number, formData: FormData) {
  const title = (formData.get('title') as string)?.trim() || null
  const author = (formData.get('author') as string)?.trim() || null
  const source = (formData.get('source') as string)?.trim() || null

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji.' }

  const { error } = await supabase
    .from('dw_photos')
    .update({ title, author, source })
    .eq('id', photoId)

  if (error) return { error: `Błąd zapisu: ${error.message}` }

  revalidatePath(`/admin/wydarzenia/${eventId}`)
  revalidatePath(`/wydarzenie/${eventId}`)
  revalidatePath('/')

  return { success: true }
}

// ─── Photo file upload (Supabase Storage) ───────────────────

export async function uploadPhotoFile(formData: FormData) {
  const eventId = Number(formData.get('event_id'))
  const file = formData.get('file') as File
  const title = (formData.get('title') as string)?.trim() || null
  const author = (formData.get('author') as string)?.trim() || null
  const source = (formData.get('source') as string)?.trim() || null

  if (!eventId) return { error: 'Brak ID wydarzenia.' }
  if (!file || file.size === 0) return { error: 'Plik jest wymagany.' }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Dozwolone formaty: JPG, PNG, WebP, GIF.' }
  }

  if (file.size > 10 * 1024 * 1024) {
    return { error: 'Maksymalny rozmiar pliku: 10 MB.' }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji.' }

  // Generate unique filename
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${eventId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

  // Upload to Supabase Storage
  const buffer = Buffer.from(await file.arrayBuffer())
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('event-photos')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { error: `Błąd uploadu: ${uploadError.message}` }
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('event-photos')
    .getPublicUrl(uploadData.path)

  // Insert photo record
  const { error: dbError } = await supabase
    .from('dw_photos')
    .insert({
      event_id: eventId,
      url: urlData.publicUrl,
      title,
      author,
      source,
    })

  if (dbError) return { error: `Błąd zapisu: ${dbError.message}` }

  revalidatePath(`/admin/wydarzenia/${eventId}`)
  revalidatePath(`/wydarzenie/${eventId}`)
  revalidatePath('/')

  return { success: true }
}
