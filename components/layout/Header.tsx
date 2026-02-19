'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SearchResult {
  id: number
  description: string
  event_date: string
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  // Close burger menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  // Close search results on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showResults])

  // Live search with debounce
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setResults([])
      setShowResults(false)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('dw_events')
        .select('id, description, event_date')
        .ilike('description', `%${q.trim()}%`)
        .order('event_date', { ascending: true })
        .limit(8)

      setResults(data || [])
      setShowResults(true)
    } catch {
      setResults([])
    }
    setIsSearching(false)
  }, [])

  function handleInputChange(value: string) {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length >= 3) {
      setIsSearching(true)
      debounceRef.current = setTimeout(() => doSearch(value), 300)
    } else {
      setResults([])
      setShowResults(false)
      setIsSearching(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim().length >= 3) {
      setShowResults(false)
      router.push(`/szukaj?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  function handleResultClick() {
    setShowResults(false)
    setSearchQuery('')
  }

  // Extract year from event_date
  function extractYear(date: string): string | null {
    const m = date.match(/^(\d{4})/)
    return m ? m[1] : null
  }

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-200">
      {/* Single row — 65px */}
      <div className="relative h-[65px] max-w-7xl mx-auto px-4 flex items-center">

        {/* ===== LEFT: Burger ===== */}
        <div className="flex items-center shrink-0" ref={dropdownRef}>
          {/* Burger — animated 3 lines → X */}
          <button
            className="relative w-[30px] h-[22px] flex flex-col justify-between cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span className={`block h-[3px] w-full bg-[#1d1d1b] transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-[9.5px]' : ''}`} />
            <span className={`block h-[3px] w-full bg-[#1d1d1b] transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-[3px] w-full bg-[#1d1d1b] transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-[9.5px]' : ''}`} />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute top-full left-0 right-0 md:right-auto md:w-[260px] bg-[#b50926] z-50 shadow-lg">
              <Link
                href="/"
                className="flex items-center gap-2.5 px-5 py-3 font-heading text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8f071e] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Calendar className="w-4 h-4" />
                Kalendarium
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2.5 px-5 py-3 font-heading text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8f071e] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Calendar className="w-4 h-4" />
                Dzisiejsze wydarzenia
              </Link>
              <Link
                href="/szukaj"
                className="flex items-center gap-2.5 px-5 py-3 font-heading text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8f071e] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Search className="w-4 h-4" />
                Szukaj w kalendarium
              </Link>
            </div>
          )}
        </div>

        {/* ===== Logo ===== */}
        <div className="ml-4 shrink-0">
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="D-W.PL"
              width={200}
              height={59}
              className="h-[40px] w-auto"
              priority
            />
          </Link>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ===== RIGHT: Search ===== */}
        <div className="flex items-center shrink-0">
          {/* Mobile: search icon → link to /szukaj */}
          <Link
            href="/szukaj"
            className="md:hidden flex items-center justify-center w-10 h-10 text-[#1d1d1b] hover:text-[#b50926] transition-colors"
            aria-label="Szukaj"
          >
            <Search className="w-5 h-5" />
          </Link>

          {/* Desktop: inline search with live results */}
          <div className="hidden md:block relative" ref={searchRef}>
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => { if (results.length > 0) setShowResults(true) }}
                  placeholder="wyszukaj w kalendarium"
                  className="w-[260px] lg:w-[320px] pl-9 pr-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:border-[#b50926] transition-colors"
                />
              </div>
              <button type="submit" className="sr-only">Szukaj</button>
            </form>

            {/* Live search results dropdown */}
            {showResults && (
              <div className="absolute top-full right-0 mt-1 w-[400px] lg:w-[480px] bg-white border border-gray-200 shadow-lg rounded-sm z-50 max-h-[70vh] overflow-y-auto">
                {isSearching && results.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-400">Szukam...</div>
                )}

                {!isSearching && results.length === 0 && searchQuery.trim().length >= 3 && (
                  <div className="px-4 py-3 text-sm text-gray-400">Brak wyników dla „{searchQuery}"</div>
                )}

                {results.map((event) => {
                  const year = extractYear(event.event_date)
                  return (
                    <Link
                      key={event.id}
                      href={`/wydarzenie/${event.id}`}
                      className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      onClick={handleResultClick}
                    >
                      <div className="flex gap-2 items-start">
                        {year && (
                          <span className="shrink-0 font-heading text-sm font-bold text-[#b50926]">
                            {year}
                          </span>
                        )}
                        <p className="text-sm text-gray-700 line-clamp-2">{event.description}</p>
                      </div>
                    </Link>
                  )
                })}

                {results.length > 0 && (
                  <Link
                    href={`/szukaj?q=${encodeURIComponent(searchQuery.trim())}`}
                    className="block px-4 py-3 text-center text-sm font-semibold text-[#b50926] hover:bg-gray-50 transition-colors border-t border-gray-200"
                    onClick={handleResultClick}
                  >
                    Zobacz wszystkie wyniki →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
