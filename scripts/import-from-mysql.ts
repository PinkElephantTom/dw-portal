/**
 * Import script: MySQL (d-w.pl Docker) → Supabase (dw_events + dw_photos)
 *
 * Prerequisites:
 * 1. Docker containers running (docker compose up)
 * 2. Supabase tables created (run 001_create_dw_tables.sql in Dashboard SQL Editor)
 * 3. .env.local with SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage: npx tsx scripts/import-from-mysql.ts
 */

import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jypywxllbigwvpvauqjo.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

interface MysqlEvent {
  id: number
  desc: string
  date: string
}

interface MysqlPhoto {
  id: number
  src: string
  title: string
  author: string
  source: string
  id_event: number
}

function queryMysql<T>(sql: string): T[] {
  const result = execSync(
    `docker exec dw-mysql mysql -u c6dw -plocaldev123 c6dw -N -e "${sql.replace(/"/g, '\\"')}"`,
    { encoding: 'utf-8' }
  ).trim()

  if (!result) return []

  return result.split('\n').map(row => {
    const cols = row.split('\t')
    return cols as unknown as T
  })
}

async function main() {
  console.log('=== d-w.pl MySQL → Supabase Import ===\n')

  // 1. Fetch events from MySQL
  console.log('Fetching events from MySQL...')
  const rawEvents = execSync(
    `docker exec dw-mysql mysql -u c6dw -plocaldev123 c6dw -N -e "SELECT id, \\\`desc\\\`, date FROM events ORDER BY id"`,
    { encoding: 'utf-8' }
  ).trim()

  const events: MysqlEvent[] = rawEvents.split('\n').filter(Boolean).map(row => {
    const [id, desc, date] = row.split('\t')
    return { id: parseInt(id), desc, date }
  })

  console.log(`  Found ${events.length} events`)

  // 2. Fetch photos from MySQL
  console.log('Fetching photos from MySQL...')
  const rawPhotos = execSync(
    `docker exec dw-mysql mysql -u c6dw -plocaldev123 c6dw -N -e "SELECT id, src, title, author, source, id_event FROM photos WHERE id_event > 0 ORDER BY id"`,
    { encoding: 'utf-8' }
  ).trim()

  const photos: MysqlPhoto[] = rawPhotos ? rawPhotos.split('\n').filter(Boolean).map(row => {
    const [id, src, title, author, source, id_event] = row.split('\t')
    return { id: parseInt(id), src, title, author, source, id_event: parseInt(id_event) }
  }) : []

  console.log(`  Found ${photos.length} photos`)

  // 3. Clear existing data in Supabase
  console.log('\nClearing existing Supabase data...')
  await supabase.from('dw_photos').delete().neq('id', 0)
  await supabase.from('dw_events').delete().neq('id', 0)
  console.log('  Done')

  // 4. Insert events
  console.log('\nInserting events into Supabase...')
  const eventIdMap = new Map<number, number>() // old MySQL id → new Supabase id

  for (const event of events) {
    const { data, error } = await supabase
      .from('dw_events')
      .insert({
        description: event.desc,
        event_date: event.date,
      })
      .select('id')
      .single()

    if (error) {
      console.error(`  Error inserting event ${event.id}: ${error.message}`)
      continue
    }

    eventIdMap.set(event.id, data.id)
    console.log(`  Event ${event.id} → ${data.id} (${event.date})`)
  }

  // 5. Insert photos
  if (photos.length > 0) {
    console.log('\nInserting photos into Supabase...')
    for (const photo of photos) {
      const newEventId = eventIdMap.get(photo.id_event)
      if (!newEventId) {
        console.warn(`  Skipping photo ${photo.id} — no matching event ${photo.id_event}`)
        continue
      }

      // Photo URL: original uses relative paths like "img/photo.jpg"
      // In Supabase, we'll store full URLs or paths that the frontend can resolve
      const photoUrl = photo.src.startsWith('http')
        ? photo.src
        : `https://d-w.pl/${photo.src}` // Point to production server for now

      const { error } = await supabase
        .from('dw_photos')
        .insert({
          event_id: newEventId,
          url: photoUrl,
          title: photo.title || null,
          author: photo.author || null,
          source: photo.source || null,
        })

      if (error) {
        console.error(`  Error inserting photo ${photo.id}: ${error.message}`)
      } else {
        console.log(`  Photo ${photo.id} → event ${newEventId}`)
      }
    }
  }

  // 6. Summary
  console.log('\n=== Import Complete ===')
  console.log(`  Events: ${eventIdMap.size}/${events.length}`)
  console.log(`  Photos: ${photos.length}`)
  console.log('\nVerify at: https://supabase.com/dashboard/project/jypywxllbigwvpvauqjo/editor')
}

main().catch(console.error)
