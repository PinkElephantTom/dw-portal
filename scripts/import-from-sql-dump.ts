/**
 * Import script: SQL dump (wkaliszu_dw25.sql) → Supabase (dw_events + dw_photos)
 *
 * Parses phpMyAdmin SQL export file and imports data into Supabase.
 *
 * Prerequisites:
 * 1. SQL dump file at ./wkaliszu_dw25.sql
 * 2. Supabase tables created (run 001_create_dw_tables.sql in Dashboard SQL Editor)
 * 3. .env.local with SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage: npx tsx scripts/import-from-sql-dump.ts
 */

import 'dotenv/config'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local explicitly
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jypywxllbigwvpvauqjo.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const SQL_FILE = resolve(__dirname, '..', 'wkaliszu_dw25.sql')
const BATCH_SIZE = 500

// ───────────────────────────────────────────────
// SQL Parser — extracts INSERT rows from SQL dump
// ───────────────────────────────────────────────

interface RawEvent {
  id: number
  desc: string
  date: string
}

interface RawPhoto {
  id: number
  src: string
  title: string
  author: string
  source: string
  id_event: number
}

/**
 * Parse a MySQL string value, handling escaped quotes and backslashes.
 * Input: the content between outer single quotes (without the quotes themselves).
 */
function unescapeMysql(s: string): string {
  return s
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
}

/**
 * Parse a single VALUES tuple like: (123, 'some text', 'value')
 * Returns array of raw string/number values.
 * Handles: escaped quotes inside strings, commas inside strings, numbers.
 */
function parseTuple(tuple: string): string[] {
  const values: string[] = []
  let i = 0
  const len = tuple.length

  while (i < len) {
    // Skip whitespace and commas
    while (i < len && (tuple[i] === ' ' || tuple[i] === ',' || tuple[i] === '\t')) i++
    if (i >= len) break

    if (tuple[i] === "'") {
      // String value — find matching close quote
      i++ // skip opening quote
      let value = ''
      while (i < len) {
        if (tuple[i] === '\\' && i + 1 < len) {
          // Escaped character — keep the escape sequence for unescapeMysql
          value += tuple[i] + tuple[i + 1]
          i += 2
        } else if (tuple[i] === "'") {
          // Check for '' (double single quote escape)
          if (i + 1 < len && tuple[i + 1] === "'") {
            value += "\\'"
            i += 2
          } else {
            i++ // skip closing quote
            break
          }
        } else {
          value += tuple[i]
          i++
        }
      }
      values.push(unescapeMysql(value))
    } else if (tuple[i] === '-' || (tuple[i] >= '0' && tuple[i] <= '9')) {
      // Numeric value
      let num = ''
      while (i < len && tuple[i] !== ',' && tuple[i] !== ')' && tuple[i] !== ' ') {
        num += tuple[i]
        i++
      }
      values.push(num.trim())
    } else if (tuple.substring(i, i + 4) === 'NULL') {
      values.push('')
      i += 4
    } else {
      i++ // skip unknown char
    }
  }

  return values
}

/**
 * Extract all INSERT INTO `tableName` rows from SQL dump.
 * Returns array of parsed tuples.
 */
function extractInserts(sql: string, tableName: string): string[][] {
  const rows: string[][] = []

  // Match INSERT INTO `tableName` (...) VALUES blocks
  const insertRegex = new RegExp(
    `INSERT INTO \`${tableName}\`.*?VALUES\\s*`,
    'gi'
  )

  let match: RegExpExecArray | null
  while ((match = insertRegex.exec(sql)) !== null) {
    // After VALUES, we need to find all tuples until ;
    let pos = match.index + match[0].length

    while (pos < sql.length) {
      // Skip whitespace
      while (pos < sql.length && (sql[pos] === ' ' || sql[pos] === '\n' || sql[pos] === '\r')) pos++

      if (sql[pos] !== '(') break // No more tuples

      // Find matching closing paren, respecting strings
      pos++ // skip (
      let depth = 1
      let tupleContent = ''
      while (pos < sql.length && depth > 0) {
        if (sql[pos] === '\\' && pos + 1 < sql.length) {
          tupleContent += sql[pos] + sql[pos + 1]
          pos += 2
          continue
        }
        if (sql[pos] === "'") {
          tupleContent += sql[pos]
          pos++
          // Inside string — find close
          while (pos < sql.length) {
            if (sql[pos] === '\\' && pos + 1 < sql.length) {
              tupleContent += sql[pos] + sql[pos + 1]
              pos += 2
            } else if (sql[pos] === "'") {
              tupleContent += sql[pos]
              pos++
              if (pos < sql.length && sql[pos] === "'") {
                // Doubled quote
                tupleContent += sql[pos]
                pos++
              } else {
                break
              }
            } else {
              tupleContent += sql[pos]
              pos++
            }
          }
          continue
        }
        if (sql[pos] === '(') depth++
        if (sql[pos] === ')') depth--
        if (depth > 0) {
          tupleContent += sql[pos]
        }
        pos++
      }

      const parsed = parseTuple(tupleContent)
      if (parsed.length > 0) {
        rows.push(parsed)
      }

      // Skip , or ; after tuple
      while (pos < sql.length && (sql[pos] === ',' || sql[pos] === ';' || sql[pos] === '\n' || sql[pos] === '\r' || sql[pos] === ' ')) {
        if (sql[pos] === ';') {
          pos++
          break
        }
        pos++
      }
    }
  }

  return rows
}

async function main() {
  console.log('=== d-w.pl SQL Dump → Supabase Import ===\n')

  // 1. Read SQL file
  console.log(`Reading SQL dump: ${SQL_FILE}`)
  const sql = readFileSync(SQL_FILE, 'utf-8')
  console.log(`  File size: ${(sql.length / 1024 / 1024).toFixed(2)} MB`)

  // 2. Parse events
  console.log('\nParsing events...')
  const rawEvents = extractInserts(sql, 'events')
  const events: RawEvent[] = rawEvents.map(row => ({
    id: parseInt(row[0]),
    desc: row[1],
    date: row[2],
  }))
  console.log(`  Found ${events.length} events`)

  // 3. Parse photos
  console.log('Parsing photos...')
  const rawPhotos = extractInserts(sql, 'photos')
  const photos: RawPhoto[] = rawPhotos
    .map(row => ({
      id: parseInt(row[0]),
      src: row[1],
      title: row[2],
      author: row[3],
      source: row[4],
      id_event: parseInt(row[5]),
    }))
    .filter(p => p.id_event > 0 && p.src !== '') // Skip test photos and empty src
  console.log(`  Found ${rawPhotos.length} total, ${photos.length} valid (with event + src)`)

  // 4. Clear existing Supabase data
  console.log('\nClearing existing Supabase data...')
  const { error: delPhotosErr } = await supabase.from('dw_photos').delete().neq('id', 0)
  if (delPhotosErr) console.error('  Error deleting photos:', delPhotosErr.message)
  const { error: delEventsErr } = await supabase.from('dw_events').delete().neq('id', 0)
  if (delEventsErr) console.error('  Error deleting events:', delEventsErr.message)
  console.log('  Done')

  // 5. Insert events in batches
  console.log(`\nInserting ${events.length} events (batch size: ${BATCH_SIZE})...`)
  const eventIdMap = new Map<number, number>() // old MySQL id → new Supabase id
  let insertedEvents = 0
  let failedEvents = 0

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(events.length / BATCH_SIZE)

    const insertData = batch.map(e => ({
      description: e.desc,
      event_date: e.date,
    }))

    const { data, error } = await supabase
      .from('dw_events')
      .insert(insertData)
      .select('id')

    if (error) {
      console.error(`  Batch ${batchNum}/${totalBatches} FAILED: ${error.message}`)
      failedEvents += batch.length
      continue
    }

    // Map old IDs to new IDs (order is preserved)
    if (data) {
      for (let j = 0; j < batch.length && j < data.length; j++) {
        eventIdMap.set(batch[j].id, data[j].id)
      }
    }

    insertedEvents += batch.length
    process.stdout.write(`  Batch ${batchNum}/${totalBatches}: ${insertedEvents} events inserted\r`)
  }
  console.log(`\n  Events inserted: ${insertedEvents}, failed: ${failedEvents}`)

  // 6. Insert photos in batches
  console.log(`\nInserting ${photos.length} photos (batch size: ${BATCH_SIZE})...`)
  let insertedPhotos = 0
  let skippedPhotos = 0
  let failedPhotos = 0

  for (let i = 0; i < photos.length; i += BATCH_SIZE) {
    const batch = photos.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(photos.length / BATCH_SIZE)

    const insertData: Array<{
      event_id: number
      url: string
      title: string | null
      author: string | null
      source: string | null
    }> = []

    for (const photo of batch) {
      const newEventId = eventIdMap.get(photo.id_event)
      if (!newEventId) {
        skippedPhotos++
        continue
      }

      const url = photo.src.startsWith('http')
        ? photo.src
        : `https://d-w.pl/${photo.src}`

      insertData.push({
        event_id: newEventId,
        url,
        title: photo.title || null,
        author: photo.author || null,
        source: photo.source || null,
      })
    }

    if (insertData.length === 0) continue

    const { error } = await supabase
      .from('dw_photos')
      .insert(insertData)

    if (error) {
      console.error(`  Batch ${batchNum}/${totalBatches} FAILED: ${error.message}`)
      failedPhotos += insertData.length
      continue
    }

    insertedPhotos += insertData.length
    process.stdout.write(`  Batch ${batchNum}/${totalBatches}: ${insertedPhotos} photos inserted\r`)
  }
  console.log(`\n  Photos inserted: ${insertedPhotos}, skipped: ${skippedPhotos}, failed: ${failedPhotos}`)

  // 7. Summary
  console.log('\n=== Import Complete ===')
  console.log(`  Events: ${insertedEvents}/${events.length}`)
  console.log(`  Photos: ${insertedPhotos}/${photos.length}`)
  console.log(`  ID Map entries: ${eventIdMap.size}`)
  console.log('\nVerify at: https://supabase.com/dashboard/project/jypywxllbigwvpvauqjo/editor')
  console.log('Or locally: http://localhost:3002/?data=01-01')
}

main().catch(console.error)
