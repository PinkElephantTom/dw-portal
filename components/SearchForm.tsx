'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export default function SearchForm({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim().length >= 3) {
      router.push(`/szukaj?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj wydarzeń historycznych..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:border-[#b50926] transition-colors"
          autoFocus
        />
      </div>
      <button
        type="submit"
        className="px-6 py-3 bg-[#b50926] hover:bg-[#8f071e] text-white font-heading text-sm uppercase tracking-wider transition-colors cursor-pointer"
      >
        Szukaj
      </button>
    </form>
  )
}
