import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd-w.pl',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  async redirects() {
    return [
      // ==============================================
      // Przekierowania ze starej strony d-w.pl
      // 88 linków z Wikipedii + inne źródła zewnętrzne
      // ==============================================

      // /event.php?ev=ID → /wydarzenie/ID (62 linki z Wikipedii)
      {
        source: '/event.php',
        has: [{ type: 'query', key: 'ev', value: '(?<id>\\d+)' }],
        destination: '/wydarzenie/:id',
        permanent: true,
      },

      // /index.php?data=MM-DD → /?data=MM-DD (9 linków z Wikipedii)
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'data', value: '(?<data>.+)' }],
        destination: '/?data=:data',
        permanent: true,
      },

      // /index.php (bez parametrów) → /
      {
        source: '/index.php',
        destination: '/',
        permanent: true,
      },

      // /szukaj.php?t=QUERY → /szukaj?q=QUERY (6 linków z Wikipedii)
      {
        source: '/szukaj.php',
        has: [{ type: 'query', key: 't', value: '(?<query>.+)' }],
        destination: '/szukaj?q=:query',
        permanent: true,
      },

      // /szukaj.php (bez parametrów) → /szukaj
      {
        source: '/szukaj.php',
        destination: '/szukaj',
        permanent: true,
      },

      // Stare podstrony z epoki Joomla (6 linków z Wikipedii)
      {
        source: '/galerie/:slug*.html',
        destination: '/',
        permanent: false, // 302 — treść nie istnieje w nowej wersji
      },
      {
        source: '/felietony/:slug*.html',
        destination: '/',
        permanent: false,
      },
      {
        source: '/fotorelacja/:slug*.html',
        destination: '/',
        permanent: false,
      },
      {
        source: '/kalisz/:slug*.html',
        destination: '/',
        permanent: false,
      },

      // Inne stare pliki PHP → strona główna
      {
        source: '/dodaj.php',
        destination: '/',
        permanent: true,
      },
      {
        source: '/wkaliszu.php',
        destination: '/',
        permanent: true,
      },
      {
        source: '/setting.php',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
