'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { Search, Calendar } from 'lucide-react'

const mainNav = [
  { name: 'Kalendarium', href: '/' },
  { name: 'Szukaj', href: '/szukaj' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-200">
      {/* Single row — 65px */}
      <div className="relative h-[65px] max-w-7xl mx-auto px-4 flex items-center">

        {/* ===== LEFT: Burger + Desktop nav ===== */}
        <div className="flex items-center shrink-0" ref={dropdownRef}>
          {/* Burger — animated 3 lines → X */}
          <button
            className="relative w-[30px] h-[22px] flex flex-col justify-between mr-4 cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span className={`block h-[3px] w-full bg-[#1d1d1b] transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-[9.5px]' : ''}`} />
            <span className={`block h-[3px] w-full bg-[#1d1d1b] transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-[3px] w-full bg-[#1d1d1b] transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-[9.5px]' : ''}`} />
          </button>

          {/* Desktop nav links — beside burger */}
          <nav className="hidden lg:flex items-center gap-5">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-heading text-sm font-semibold uppercase tracking-wide text-[#1d1d1b] hover:text-[#b50926] transition-colors whitespace-nowrap"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute top-full left-0 right-0 lg:left-0 lg:right-auto lg:w-[240px] bg-[#b50926] z-50 shadow-lg">
              {/* Nav links — shown in dropdown on mobile/tablet only */}
              <div className="lg:hidden">
                {mainNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-5 py-3 font-heading text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8f071e] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="border-t border-white/20" />
              </div>
              {/* Common options */}
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

        {/* ===== CENTER: Logo ===== */}
        <div className="flex-1 flex justify-center lg:justify-start lg:ml-5">
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="D-W.PL"
              width={200}
              height={59}
              className="h-[45px] w-auto"
              priority
            />
          </Link>
        </div>

        {/* ===== RIGHT: Actions ===== */}
        <div className="flex items-center shrink-0">
          {/* Search */}
          <Link
            href="/szukaj"
            className="flex items-center gap-1.5 px-3 h-[65px] text-[#1d1d1b] hover:text-[#b50926] transition-colors"
            aria-label="Szukaj"
          >
            <Search className="w-5 h-5" />
            <span className="hidden xl:inline font-heading text-sm uppercase tracking-wide">Szukaj</span>
          </Link>

          {/* Calendar — desktop only, with vertical borders */}
          <Link
            href="/"
            className="hidden md:flex items-center gap-1.5 px-4 h-[65px] border-l border-r border-gray-200 text-[#1d1d1b] hover:text-[#b50926] transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span className="font-heading text-sm uppercase tracking-wide">Kalendarium</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
