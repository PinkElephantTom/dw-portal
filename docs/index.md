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
| Production URL | `dw-portal.vercel.app` (docelowo: `d-w.pl`) |
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
- [ ] Migracja ~4462 istniejacych zdjec z d-w.pl/upload/ do Supabase Storage
- [ ] Przeniesc domene d-w.pl na Vercel
- [ ] SEO: meta tagi, Open Graph, sitemap
- [ ] Polskie znaki w URL-ach (slug zamiast ID)
