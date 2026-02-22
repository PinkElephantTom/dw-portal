import type { Metadata } from 'next'
import { Oswald, Roboto } from 'next/font/google'
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
  metadataBase: new URL('https://d-w.pl'),
  title: {
    default: 'D-W.PL — Kalendarium Południowej Wielkopolski',
    template: '%s | D-W.PL',
  },
  description: 'Kalendarium Południowej Wielkopolski — wydarzenia historyczne z każdego dnia. Odkryj historię Kalisza, Ostrowa Wielkopolskiego i regionu.',
  keywords: ['Kalisz', 'Wielkopolska', 'kalendarium', 'historia', 'wydarzenia historyczne', 'południowa Wielkopolska', 'Ostrów Wielkopolski', 'dzieje regionu'],
  openGraph: {
    title: 'D-W.PL — Kalendarium Południowej Wielkopolski',
    description: 'Kalendarium Południowej Wielkopolski — wydarzenia historyczne z każdego dnia.',
    locale: 'pl_PL',
    type: 'website',
    siteName: 'D-W.PL',
    images: [{ url: '/images/logo-fb.png', width: 1200, height: 630, alt: 'Kalendarium Południowej Wielkopolski' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'D-W.PL — Kalendarium Południowej Wielkopolski',
    description: 'Kalendarium Południowej Wielkopolski — wydarzenia historyczne z każdego dnia.',
    images: ['/images/logo-fb.png'],
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
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
        {children}
      </body>
    </html>
  )
}
