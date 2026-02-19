import type { Metadata } from 'next'
import { Oswald, Roboto } from 'next/font/google'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import './globals.css'

const oswald = Oswald({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700'],
  variable: '--font-oswald',
})

const roboto = Roboto({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
})

export const metadata: Metadata = {
  title: {
    default: 'D-W.PL — Kalendarium Południowej Wielkopolski',
    template: '%s | D-W.PL',
  },
  description: 'Kalendarium Południowej Wielkopolski — wydarzenia historyczne z każdego dnia.',
  keywords: ['Kalisz', 'Wielkopolska', 'kalendarium', 'historia', 'wydarzenia historyczne'],
  openGraph: {
    title: 'D-W.PL — Kalendarium Południowej Wielkopolski',
    description: 'Kalendarium Południowej Wielkopolski — wydarzenia historyczne z każdego dnia.',
    locale: 'pl_PL',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pl">
      <body className={`${oswald.variable} ${roboto.variable} font-sans antialiased bg-gray-50 text-gray-900`}>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
