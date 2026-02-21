'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Shield, ShieldCheck, Trash2 } from 'lucide-react'
import type { DwAdminUser } from '@/types/database'

interface Props {
  admins: DwAdminUser[]
  currentUserId: string
}

export default function AdminUserManager({ admins, currentUserId }: Props) {
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  async function handleAddUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAddError('')
    setAddLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password'),
        display_name: formData.get('display_name'),
        role: formData.get('role'),
      }),
    })

    const data = await res.json()
    setAddLoading(false)

    if (!res.ok) {
      setAddError(data.error || 'Wystąpił błąd.')
    } else {
      setShowAddForm(false)
      form.reset()
      router.refresh()
    }
  }

  async function handleChangeRole(userId: string, newRole: 'admin' | 'editor') {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    })

    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || 'Błąd zmiany roli.')
    }
  }

  async function handleDelete(userId: string) {
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })

    setConfirmDeleteId(null)

    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || 'Błąd usuwania użytkownika.')
    }
  }

  return (
    <div>
      {/* Admin list */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 w-28">Rola</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 w-32">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-gray-800 font-medium">{admin.email}</p>
                    {admin.display_name && (
                      <p className="text-xs text-gray-400">{admin.display_name}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {admin.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded">
                      <ShieldCheck size={12} />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                      <Shield size={12} />
                      Edytor
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {admin.id === currentUserId ? (
                    <span className="text-xs text-gray-400">To Ty</span>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleChangeRole(admin.id, admin.role === 'admin' ? 'editor' : 'admin')}
                        className="text-xs text-gray-600 hover:text-[#b50926] transition-colors"
                        title={`Zmień na ${admin.role === 'admin' ? 'edytora' : 'admina'}`}
                      >
                        {admin.role === 'admin' ? 'Zmień na edytora' : 'Zmień na admina'}
                      </button>
                      {confirmDeleteId === admin.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(admin.id)}
                            className="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded"
                          >
                            Tak
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                          >
                            Nie
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(admin.id)}
                          className="p-1 text-red-400 hover:text-red-600 transition-colors"
                          title="Usuń administratora"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add new admin */}
      {showAddForm ? (
        <form
          onSubmit={handleAddUser}
          className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Hasło tymczasowe *
              </label>
              <input
                id="password"
                name="password"
                type="text"
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa wyświetlana
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Rola
              </label>
              <select
                id="role"
                name="role"
                defaultValue="editor"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent"
              >
                <option value="editor">Edytor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {addError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {addError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={addLoading}
              className="inline-flex items-center gap-2 px-3 py-2 bg-[#b50926] hover:bg-[#8f071e] disabled:bg-gray-400 text-white text-xs font-heading font-semibold uppercase tracking-wider rounded-md transition-colors"
            >
              {addLoading ? 'Dodawanie...' : 'Dodaj administratora'}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setAddError('') }}
              className="px-3 py-2 text-xs font-heading font-semibold uppercase tracking-wider text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Anuluj
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-heading font-semibold uppercase tracking-wider text-[#b50926] border border-[#b50926] hover:bg-[#b50926] hover:text-white rounded-md transition-colors"
        >
          <UserPlus size={14} />
          Dodaj administratora
        </button>
      )}
    </div>
  )
}
