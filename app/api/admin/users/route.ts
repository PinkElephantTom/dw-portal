import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Helper: verify current user is admin
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: adminUser } = await supabase
    .from('dw_admin_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!adminUser || adminUser.role !== 'admin') return null
  return user
}

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST — Create new admin user
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Brak uprawnień.' }, { status: 403 })
  }

  const { email, password, display_name, role } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email i hasło są wymagane.' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Hasło musi mieć min. 8 znaków.' }, { status: 400 })
  }

  if (role && !['admin', 'editor'].includes(role)) {
    return NextResponse.json({ error: 'Nieprawidłowa rola.' }, { status: 400 })
  }

  const serviceClient = getServiceClient()

  // Create auth user
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Insert into dw_admin_users
  const { error: insertError } = await serviceClient
    .from('dw_admin_users')
    .insert({
      id: authData.user.id,
      email,
      display_name: display_name || null,
      role: role || 'editor',
    })

  if (insertError) {
    // Rollback: delete auth user
    await serviceClient.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: insertError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, userId: authData.user.id })
}

// PATCH — Change user role
export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Brak uprawnień.' }, { status: 403 })
  }

  const { userId, role } = await request.json()

  if (!userId || !['admin', 'editor'].includes(role)) {
    return NextResponse.json({ error: 'Nieprawidłowe dane.' }, { status: 400 })
  }

  const serviceClient = getServiceClient()

  const { error } = await serviceClient
    .from('dw_admin_users')
    .update({ role })
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

// DELETE — Remove admin user
export async function DELETE(request: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Brak uprawnień.' }, { status: 403 })
  }

  const { userId } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'Brak ID użytkownika.' }, { status: 400 })
  }

  if (userId === admin.id) {
    return NextResponse.json({ error: 'Nie możesz usunąć własnego konta.' }, { status: 400 })
  }

  const serviceClient = getServiceClient()

  // Delete from dw_admin_users (cascade from auth.users will also handle it)
  const { error: deleteDbError } = await serviceClient
    .from('dw_admin_users')
    .delete()
    .eq('id', userId)

  if (deleteDbError) {
    return NextResponse.json({ error: deleteDbError.message }, { status: 400 })
  }

  // Delete auth user
  const { error: deleteAuthError } = await serviceClient.auth.admin.deleteUser(userId)

  if (deleteAuthError) {
    return NextResponse.json({ error: deleteAuthError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
