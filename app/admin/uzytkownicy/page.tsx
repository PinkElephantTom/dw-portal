import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import AdminUserManager from '@/components/admin/AdminUserManager'
import type { Metadata } from 'next'
import type { DwAdminUser } from '@/types/database'

export const metadata: Metadata = {
  title: 'Administratorzy — Admin',
}

export default async function AdminUsersPage() {
  const supabase = await createClient()

  // Check if current user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: currentAdmin } = await supabase
    .from('dw_admin_users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!currentAdmin || currentAdmin.role !== 'admin') {
    return (
      <div className="max-w-2xl">
        <h1 className="font-heading text-2xl font-bold text-[#1d1d1b] mb-4">Administratorzy</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          Nie masz uprawnień do zarządzania administratorami. Wymagana rola: <strong>admin</strong>.
        </div>
      </div>
    )
  }

  // Fetch all admin users
  const { data: admins } = await supabase
    .from('dw_admin_users')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Users size={24} className="text-gray-400" />
        <h1 className="font-heading text-2xl font-bold text-[#1d1d1b]">Administratorzy</h1>
      </div>

      <AdminUserManager
        admins={(admins as DwAdminUser[]) || []}
        currentUserId={user.id}
      />
    </div>
  )
}
