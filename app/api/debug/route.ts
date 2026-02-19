import { NextResponse } from 'next/server'

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?
        process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NOT SET',
    },
  }

  // Try direct fetch to Supabase REST API (bypass SSR client)
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      diagnostics.supabase_direct = 'SKIPPED: env vars not set'
    } else {
      const res = await fetch(
        `${url}/rest/v1/dw_events?event_date=like.%25-02-19&select=id,description&limit=2`,
        {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
          },
          cache: 'no-store',
        }
      )
      const data = await res.json()
      diagnostics.supabase_direct = {
        status: res.status,
        count: Array.isArray(data) ? data.length : 0,
        sample: Array.isArray(data) && data[0] ? data[0].description?.substring(0, 50) : null,
      }
    }
  } catch (err) {
    diagnostics.supabase_direct = { error: String(err) }
  }

  // Try SSR client (same as page.tsx uses)
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('dw_events')
      .select('id, description')
      .like('event_date', '%-02-19')
      .limit(2)

    diagnostics.supabase_ssr = {
      error: error ? error.message : null,
      count: data ? data.length : 0,
      sample: data && data[0] ? data[0].description?.substring(0, 50) : null,
    }
  } catch (err) {
    diagnostics.supabase_ssr = { error: String(err) }
  }

  return NextResponse.json(diagnostics, {
    headers: { 'Cache-Control': 'no-store' }
  })
}
