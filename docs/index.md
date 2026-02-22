# Dokumentacja portalu d-w.pl

> **Dla Claude Code**: Czytaj TYLKO ten plik na start sesji. Siegaj do konkretnych dokumentow tylko gdy potrzebujesz szczegolowych informacji.

## Informacje ogolne

| Klucz | Wartosc |
|-------|---------|
| Nazwa | d-w.pl — Kalendarium Poludniowej Wielkopolski |
| Stack | Next.js 16.1.6 + React 19 + Supabase + Tailwind CSS v4 + TypeScript 5 |
| Katalog projektu | `/Users/malgo1/APP/dw-portal/` |
| Supabase project ID | `jypywxllbigwvpvauqjo` (wspoldzielony z wkaliszu.pl) |
| Supabase Storage | bucket `event-photos` (publiczny odczyt, upload dla zalogowanych) |
| GitHub | `PinkElephantTom/dw-portal` |
| Vercel project | `dw-portal` (team: `tomekskorzewski-5310s-projects`) |
| Production URL | `dw-portal-sand.vercel.app` (docelowo: `d-w.pl`) |
| Kolor glowny | `#b50926` (ciemna czerwien, oryginalna barwa d-w.pl) |
| Fonty | Oswald (naglowki) + Roboto (tekst) — identyczne z wkaliszu.pl |
| Dev server port | `3002` (zeby nie kolidowac z wkaliszu na 3001 i kavke na 3000) |

## Czym jest d-w.pl

Codzienne kalendarium wydarzen historycznych z Poludniowej Wielkopolski. Uzytkownik wchodzi na strone i widzi liste wydarzen z dzisiejszego dnia. Moze nawigowac po datach za pomoca kalendarza lub strzalek.

Strona oryginalna dziala pod adresem https://d-w.pl na hostingu hitme.net.pl (PHP + MySQL). Ten projekt to jej **przepisanie na Next.js + Supabase**.

## Projekt siostrzany — wkaliszu.pl

Portal d-w.pl **wspoldzieli projekt Supabase** z portalem wkaliszu.pl (portal regionalny Kalisza).

| | d-w.pl | wkaliszu.pl |
|--|--------|-------------|
| Katalog | `/Users/malgo1/APP/dw-portal/` | `/Users/malgo1/APP/wkaliszu-portal/` |
| GitHub | `PinkElephantTom/dw-portal` | `PinkElephantTom/wkaliszu-portal` |
| Kolor glowny | `#b50926` | `#b91c1c` (red-700) |
| Tabele Supabase | `dw_events`, `dw_photos` | `articles`, `events`, `places`, `profiles`... |
| Dev port | 3002 | 3001 |

Tabele d-w.pl maja prefix `dw_` i nie koliduja z tabelami wkaliszu.

**Zasada**: edytuj TYLKO pliki w `/Users/malgo1/APP/dw-portal/`. Nigdy nie modyfikuj plikow wkaliszu-portal z sesji d-w.pl.

## Szybki start

```bash
cd /Users/malgo1/APP/dw-portal
PORT=3002 npm run dev   # http://localhost:3002
npm run build           # produkcyjny build
```

## Baza danych (Supabase)

Dwie tabele z prefixem `dw_`:

### dw_events
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | BIGSERIAL PK | Identyfikator |
| description | TEXT NOT NULL | Opis wydarzenia |
| event_date | VARCHAR(10) | Data w formacie "YYYY-MM-DD" |
| created_at | TIMESTAMPTZ | Data dodania |
| updated_at | TIMESTAMPTZ | Data modyfikacji (auto-trigger) |

### dw_photos
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | BIGSERIAL PK | Identyfikator |
| event_id | BIGINT FK → dw_events | Wydarzenie |
| url | TEXT NOT NULL | URL zdjecia |
| title | TEXT | Tytul |
| author | TEXT | Autor |
| source | TEXT | Zrodlo |
| created_at | TIMESTAMPTZ | Data dodania |

### dw_admin_users
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | UUID PK → auth.users | Powiazanie z kontem Supabase Auth |
| email | TEXT NOT NULL | Email admina |
| display_name | TEXT | Wyswietlana nazwa |
| role | TEXT NOT NULL | `admin` lub `editor` |
| created_at | TIMESTAMPTZ | Data dodania |

**Stan bazy**: 5721 wydarzen + 4462 zdjecia (pelny import z produkcji).

**RLS**: Publiczny odczyt (SELECT) wlaczony. Zapis przez funkcje `is_dw_admin()` / `is_dw_admin_role()` (SECURITY DEFINER, unikaja rekurencji RLS). Usuwanie wydarzen — tylko admin.

**Glowne query**: `WHERE event_date LIKE '%-MM-DD'` — szuka wydarzen po dniu i miesiacu, ignorujac rok.

**Zdjecia**: Stare URL-e wskazuja na `https://d-w.pl/upload/...` (oryginalny serwer). Nowe zdjecia uploadowane na Supabase Storage (bucket `event-photos`).

Migracje SQL:
- `supabase/migrations/001_create_dw_tables.sql` — schemat tabel dw_events + dw_photos
- `supabase/migrations/002_admin_users.sql` — tabela dw_admin_users + polityki RLS

## Strony

### Publiczne (grupa `(public)/`)

| Route | Plik | Opis |
|-------|------|------|
| `/` | `app/(public)/page.tsx` | Kalendarium dnia — duza data, lista wydarzen, kalendarz sidebar |
| `/?data=MM-DD` | j.w. | Kalendarium na konkretny dzien |
| `/wydarzenie/[id]` | `app/(public)/wydarzenie/[id]/page.tsx` | Szczegoly wydarzenia + galeria zdjec z lightboxem |
| `/szukaj` | `app/(public)/szukaj/page.tsx` | Wyszukiwarka pelnotekstowa |
| `/szukaj?q=QUERY` | j.w. | Wyniki wyszukiwania |

### Panel admina (`/admin`)

| Route | Plik | Opis |
|-------|------|------|
| `/admin/login` | `app/admin/login/page.tsx` | Logowanie (Supabase Auth, email + haslo) |
| `/admin` | `app/admin/page.tsx` | Dashboard — statystyki, ostatnie zmiany |
| `/admin/wydarzenia` | `app/admin/wydarzenia/page.tsx` | Lista wydarzen z paginacja i wyszukiwaniem |
| `/admin/wydarzenia/nowe` | `app/admin/wydarzenia/nowe/page.tsx` | Dodawanie wydarzenia + upload zdjec po zapisie |
| `/admin/wydarzenia/[id]` | `app/admin/wydarzenia/[id]/page.tsx` | Edycja wydarzenia + zarzadzanie zdjeciami |
| `/admin/uzytkownicy` | `app/admin/uzytkownicy/page.tsx` | Zarzadzanie administratorami (tylko rola admin) |

**Middleware** (`middleware.ts`): chroni trasy `/admin/*` — niezalogowani sa przekierowywani na `/admin/login`.

**Layouty**:
- `app/layout.tsx` — root layout (fonty, globalne style)
- `app/(public)/layout.tsx` — publiczny layout z Header + Footer
- `app/admin/layout.tsx` — admin layout z ciemnym sidebarem + topbar z logoutem

**Server Actions** (`app/admin/actions.ts`):
- `createEvent`, `updateEvent`, `deleteEvent` — CRUD wydarzen
- `addPhoto` (po URL), `uploadPhotoFile` (upload na Supabase Storage), `updatePhoto`, `deletePhoto`

**API Route** (`app/api/admin/users/route.ts`): POST/PATCH/DELETE uzytkownikow (wymaga service role key).

**Role**: `admin` (pelne uprawnienia + zarzadzanie userami) i `editor` (CRUD bez usuwania wydarzen).

## Komponenty

### Publiczne

| Komponent | Plik | Opis |
|-----------|------|------|
| Header | `components/layout/Header.tsx` | 65px sticky, burger, logo, live search z dropdownem |
| Footer | `components/layout/Footer.tsx` | Ciemny #1d1d1b, logo, linki |
| CalendarWidget | `components/CalendarWidget.tsx` | Kalendarz miesieczny (sidebar) |
| EventItem | `components/EventItem.tsx` | Karta wydarzenia z rokiem i zdjeciami |
| PhotoGallery | `components/PhotoGallery.tsx` | Galeria zdjec z lightboxem (object-contain + zoom) |
| DatePicker | `components/DatePicker.tsx` | Selecty dzien/miesiac (fallback) |
| SearchForm | `components/SearchForm.tsx` | Formularz wyszukiwania na stronie /szukaj |

### Admin

| Komponent | Plik | Opis |
|-----------|------|------|
| AdminSidebar | `components/admin/AdminSidebar.tsx` | Responsywna nawigacja boczna (ciemny motyw) |
| EditEventForm | `components/admin/EditEventForm.tsx` | Formularz edycji wydarzenia |
| PhotoManager | `components/admin/PhotoManager.tsx` | Upload zdjec (drag & drop / URL), edycja metadanych, usuwanie |
| DeleteEventButton | `components/admin/DeleteEventButton.tsx` | Usuwanie z dwuetapowym potwierdzeniem |
| AdminUserManager | `components/admin/AdminUserManager.tsx` | Zarzadzanie rolami i kontami adminow |

## Nawigacja (Header)

Uproszczona struktura:

**Desktop (md+):**
```
[Burger]  [Logo d-w.pl]  ........  [🔍 wyszukaj w kalendarium]
```

**Mobile:**
```
[Burger]     [Logo]     [🔍]
```

- **Burger menu** (dropdown): Kalendarium, Dzisiejsze wydarzenia, Szukaj w kalendarium
- **Live search**: wyniki pojawiaja sie w trakcie pisania (debounce 300ms, max 8 wynikow), klik → strona wydarzenia, "Zobacz wszystkie wyniki" → /szukaj
- **Mobile**: ikona lupy → nawigacja do /szukaj

## Galeria zdjec (PhotoGallery)

- Na stronie wydarzenia zdjecia wyswietlane jako `object-contain` (cale, bez przycinania)
- Klik na zdjecie otwiera lightbox (pelen ekran, czarne tlo)
- Nawigacja: strzalki ← →, klawiatura (Escape, ArrowLeft, ArrowRight)
- Licznik (np. "3 / 10"), podpis (tytul, autor, zrodlo)

## Styl wizualny

Identyczny z wkaliszu.pl poza kolorem:
- **Header**: 65px, bialy, burger animowany (3 linie → X), logo, inline search
- **Footer**: ciemny `#1d1d1b`, `border-t-4` czerwony, logo + linki
- **Karty**: `rounded-sm`, bez cienia, `border border-gray-200`
- **Naglowki**: Oswald uppercase, `tracking-wider`
- **Przyciski**: `bg-[#b50926]`, Oswald uppercase

## Import danych z MySQL

Baza produkcyjna `wkaliszu_dw25` na hitme.net.pl (MariaDB 10.6.24).

### Skrypt importu z SQL dump

```bash
cd /Users/malgo1/APP/dw-portal
npx tsx scripts/import-from-sql-dump.ts
```

Plik: `scripts/import-from-sql-dump.ts` — parsuje SQL dump (`wkaliszu_dw25.sql`) i importuje do Supabase:
- Parsuje INSERT INTO z obsługa escaped quotes, stringow z przecinkami
- Batch insert (500 na batch) dla events i photos
- Buduje mape ID (stary MySQL → nowy Supabase) do polaczen FK
- Filtruje test photos (id_event <= 0, pusty src)
- Konwertuje URL: `upload/x.jpg` → `https://d-w.pl/upload/x.jpg`
- Wymaga `SUPABASE_SERVICE_ROLE_KEY` w `.env.local`

**Wynik importu**: 5721/5721 events, 4462/4491 photos (29 pominiętych — brak pasujacego eventu).

### Stary skrypt (Docker)

Plik: `scripts/import-from-mysql.ts` — wymaga Docker z kontenerem MySQL d-w.pl. Nie dziala na tym Macu.

## Oryginalna strona PHP

Pliki oryginalnej strony d-w.pl (PHP):
- Katalog: `/Users/malgo1/APP/d-w.pl/`
- Dokumentacja techniczna: `/Users/malgo1/APP/d-w.pl/docs/OPIS-TECHNICZNY.md`
- Hosting: `/Users/malgo1/APP/d-w.pl/docs/HOSTINGI.md`
- Roadmap PHP: `/Users/malgo1/APP/d-w.pl/ROADMAP.md`

## Przekierowania starych URL-i (next.config.ts)

Konfiguracja `redirects()` w `next.config.ts` zapewnia kompatybilnosc z 88 linkami z Wikipedii i innych zrodel zewnetrznych:

| Stary URL (d-w.pl) | Nowy URL | Kod | Liczba linkow z Wikipedii |
|---------------------|----------|-----|---------------------------|
| `/event.php?ev=ID` | `/wydarzenie/ID` | 301 | 62 |
| `/index.php?data=MM-DD` | `/?data=MM-DD` | 301 | 9 |
| `/index.php` | `/` | 301 | — |
| `/szukaj.php?t=QUERY` | `/szukaj?q=QUERY` | 301 | 6 |
| `/galerie/*.html` | `/` | 302 | 2 |
| `/felietony/*.html` | `/` | 302 | 1 |
| `/fotorelacja/*.html` | `/` | 302 | 2 |
| `/kalisz/*.html` | `/` | 302 | 1 |
| `/dodaj.php`, `/wkaliszu.php`, `/setting.php` | `/` | 301 | — |

Stare podstrony Joomla maja 302 (temporary) zamiast 301, bo tresc nie istnieje w nowej wersji. Przekierowania dzialaja na poziomie Vercel edge (szybko, bez obciazania aplikacji).

Warianty hostow: `http://d-w.pl`, `http://www.d-w.pl`, `https://d-w.pl`, `https://www.d-w.pl` — wszystkie beda obslugiwane po konfiguracji domeny.

## SEO

Kompleksowa optymalizacja SEO zaimplementowana w projekcie.

### Pliki SEO

| Plik | Rola |
|------|------|
| `app/layout.tsx` | `metadataBase`, globalne OG/Twitter, canonical, robots |
| `app/(public)/page.tsx` | `generateMetadata()` — dynamiczne title/description per date + JSON-LD WebSite |
| `app/(public)/wydarzenie/[id]/page.tsx` | `generateMetadata()` — OG article z obrazkiem + JSON-LD Article + BreadcrumbList |
| `app/(public)/szukaj/page.tsx` | `robots: { index: false, follow: true }` — noindex |
| `app/sitemap.ts` | Dynamiczny `/sitemap.xml` z Supabase |
| `app/robots.ts` | `/robots.txt` — Allow /, Disallow /admin/ i /api/ |

### metadataBase

```ts
metadataBase: new URL('https://d-w.pl')
```

Ustawiony w root layout. Dzieki temu wszystkie relatywne URL-e w OG images, canonical, alternates sa automatycznie rozwiazywane na `https://d-w.pl/...`. Wazne: na sandboxie (`dw-portal-sand.vercel.app`) meta tagi juz wskazuja na `d-w.pl` — to zamierzone zachowanie.

### Open Graph i Twitter Cards

**Globalne** (root layout): domyslne OG z logo `logo-fb.png`, locale `pl_PL`, siteName `D-W.PL`.

**Strona glowna** (`generateMetadata`): dynamiczny tytul per date, np. "22 lutego — Kalendarium Poludniowej Wielkopolski".

**Strona wydarzenia** (`generateMetadata`):
- `og:type = article`
- `og:image` = pierwsze zdjecie wydarzenia (jesli istnieje), fallback na globalne logo
- `twitter:card = summary_large_image`
- `canonical` = `/wydarzenie/{id}`

### Structured Data (JSON-LD)

Strona glowna zawiera JSON-LD `WebSite` z `SearchAction`:
```json
{ "@type": "WebSite", "potentialAction": { "@type": "SearchAction", "target": "https://d-w.pl/szukaj?q={search_term_string}" } }
```
Umozliwia wyszukiwanie bezposrednio z wynikow Google (sitelinks search box).

Strona wydarzenia zawiera:
- JSON-LD `Article` (headline, datePublished, publisher, image)
- JSON-LD `BreadcrumbList` (Kalendarium > Data > Wydarzenie)

### Sitemap (`app/sitemap.ts`)

Dynamiczny XML generowany przez Next.js. Zawiera:
- `/` — strona glowna, priority 1.0, changeFrequency daily
- 366 stron dziennych (`/?data=01-01` do `/?data=12-31`) — priority 0.8, monthly
- Wszystkie wydarzenia z `dw_events` (`/wydarzenie/{id}`) — priority 0.6, yearly, z `lastModified` z pola `updated_at`

Dane pobierane z Supabase w momencie generowania. Na Vercel generowany dynamicznie (server-rendered).

### robots.txt (`app/robots.ts`)

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: https://d-w.pl/sitemap.xml
```

### Noindex

Strona wyszukiwania (`/szukaj`) ma `robots: { index: false, follow: true }` — Google nie indeksuje stron wynikow, ale podaza za linkami na nich.

### Wazne zasady

- **Nie modyfikuj `next.config.ts` redirects** — 88 linkow z Wikipedii zalezy od tych przekierowan
- **`metadataBase` musi wskazywac na `https://d-w.pl`** — zmiana zlamie wszystkie OG URL-e
- **JSON-LD URL-e sa hardcoded na `https://d-w.pl`** — jesli domena sie zmieni, trzeba zaktualizowac tez JSON-LD w page.tsx i wydarzenie/[id]/page.tsx
- **Sitemap BASE_URL** w `app/sitemap.ts` — tez hardcoded, zmiana domeny wymaga aktualizacji

## TODO

- [x] Import pelnej bazy produkcyjnej z hitme.net.pl (5721 wydarzen + 4462 zdjecia)
- [x] Live search w headerze (debounce, dropdown z wynikami)
- [x] Galeria zdjec z lightboxem (object-contain, zoom, nawigacja)
- [x] Uproszczona nawigacja (burger + logo + search)
- [x] Panel admina — logowanie Supabase Auth, middleware, layout z sidebarem
- [x] CRUD wydarzen — lista z paginacja/wyszukiwaniem, dodawanie, edycja, usuwanie
- [x] Upload zdjec na Supabase Storage (drag & drop, podglad, walidacja formatu/rozmiaru)
- [x] Edycja metadanych zdjec (tytul, autor, zrodlo) — inline w PhotoManager
- [x] Dodawanie zdjec po URL (kompatybilnosc z istniejacymi linkami d-w.pl)
- [x] Dashboard admina — statystyki, ostatnie zmiany
- [x] Zarzadzanie administratorami (role admin/editor)
- [x] RLS: funkcje SECURITY DEFINER (is_dw_admin, is_dw_admin_role) — bez rekurencji
- [x] Przekierowania starych URL-i d-w.pl (88 linkow z Wikipedii, konfiguracja w next.config.ts)
- [ ] Migracja ~4462 istniejacych zdjec z d-w.pl/upload/ do Supabase Storage
- [ ] **Podpiecie domeny d-w.pl pod Vercel** (w krotcej przyszlosci):
  1. Vercel: Settings → Domains → dodac `d-w.pl`
  2. Dodac `www.d-w.pl` z redirectem na `d-w.pl`
  3. Zmienic DNS u rejestratora domeny (Vercel pokaze jakie rekordy ustawic: A + CNAME)
- [x] SEO: metadataBase, Open Graph, Twitter Cards, JSON-LD, sitemap.xml, robots.txt
- [ ] Polskie znaki w URL-ach (slug zamiast ID)

### Nowe funkcjonalnosci (pomysly)

- [ ] Wyszukiwanie po roku / zakresie lat
- [ ] Kategorie wydarzen (polityka, kultura, sport, religia...)
- [ ] Mapa — lokalizacje wydarzen na mapie regionu
- [ ] API rozbudowane — wiecej endpointow (np. losowe wydarzenie, wydarzenia z zakresu dat)
- [ ] Newsletter — codziennie email z wydarzeniami dnia
- [ ] Integracja z mediami spolecznosciowymi — auto-posting wydarzen dnia
- [ ] System komentarzy / uzupelnien od czytelnikow
- [ ] Wersja wielojezyczna (angielska, niemiecka)
- [ ] Strona "Ten dzien w historii" z rozbudowana prezentacja
