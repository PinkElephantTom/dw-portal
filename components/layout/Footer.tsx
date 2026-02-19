import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#1d1d1b] text-gray-400 mt-12 border-t-4 border-[#b50926]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Top: Logo + description */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <Link href="/" className="inline-block mb-2">
              <Image
                src="/images/logo-fb.png"
                alt="D-W.PL"
                width={180}
                height={53}
                className="h-10 w-auto opacity-80 hover:opacity-100 transition-opacity"
              />
            </Link>
            <p className="text-sm text-gray-500 max-w-sm">
              Kalendarium Południowej Wielkopolski — wydarzenia historyczne z każdego dnia.
            </p>
          </div>

          {/* Links row */}
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Kalendarium</Link>
            <Link href="/szukaj" className="hover:text-white transition-colors">Szukaj</Link>
            <span className="text-gray-600">|</span>
            <a href="https://wkaliszu.pl" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">wkaliszu.pl</a>
          </nav>
        </div>

        {/* Bottom: Copyright */}
        <div className="border-t border-gray-800 pt-4 text-xs text-gray-600 flex flex-col md:flex-row justify-between items-center gap-2">
          <p>&copy; {currentYear} D-W.PL. Wszelkie prawa zastrzeżone.</p>
          <p>Kalendarium Południowej Wielkopolski</p>
        </div>
      </div>
    </footer>
  )
}
