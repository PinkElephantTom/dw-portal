# Dokumentacja portalu d-w.pl

> **Dla Claude Code**: Czytaj TYLKO ten plik na start sesji. Siegaj do konkretnych dokumentow tylko gdy potrzebujesz szczegolowych informacji.

## Informacje ogolne

| Klucz | Wartosc |
|-------|---------|
| Nazwa | d-w.pl — Kalendarium Poludniowej Wielkopolski |
| Stack | Next.js 16.1.6 + React 19 + Supabase + Tailwind CSS v4 + TypeScript 5 |
| Katalog projektu | `/Users/malgo1/APP/dw-portal/` |
| Supabase project ID | `jypywxllbigwvpvauqjo` (wspoldzielony z wkaliszu.pl) |
| GitHub | `PinkElephantTom/dw-portal` |
| Vercel project | `dw-portal` (team: `tomekskorzewski-5310s-projects`) |
| Production URL | `dw-portal.vercel.app` (docelowo: `d-w.pl`) |
| Kolor glowny | `#b50926` (ciemna czerwien, oryginalna barwa d-w.pl) |
| Fonty | Oswald (naglowki) + Roboto (tekst) — identyczne z wkaliszu.pl |
| Dev server port | `3002` (zeby nie kolidowac z wkaliszu na 3000) |

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
| Dev port | 3002 | 3000 |

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

**Stan bazy**: 5721 wydarzen + 4462 zdjecia (pelny import z produkcji).

**RLS**: Publiczny odczyt (SELECT) wlaczony. Zapis wymaga service role.

**Glowne query**: `WHERE event_date LIKE '%-MM-DD'` — szuka wydarzen po dniu i miesiacu, ignorujac rok.

**Zdjecia**: URL-e wskazuja na `https://d-w.pl/upload/...` (oryginalny serwer). Docelowo do przeniesienia na Supabase Storage.

Migracja SQL: `supabase/migrations/001_create_dw_tables.sql`

## Strony

| Route | Plik | Opis |
|-------|------|------|
| `/` | `app/page.tsx` | Kalendarium dnia — duza data, lista wydarzen, kalendarz sidebar |
| `/?data=MM-DD` | j.w. | Kalendarium na konkretny dzien |
| `/wydarzenie/[id]` | `app/wydarzenie/[id]/page.tsx` | Szczegoly wydarzenia + galeria zdjec z lightboxem |
| `/szukaj` | `app/szukaj/page.tsx` | Wyszukiwarka pelnotekstowa |
| `/szukaj?q=QUERY` | j.w. | Wyniki wyszukiwania |

## Komponenty

| Komponent | Plik | Opis |
|-----------|------|------|
| Header | `components/layout/Header.tsx` | 65px sticky, burger, logo, live search z dropdownem |
| Footer | `components/layout/Footer.tsx` | Ciemny #1d1d1b, logo, linki |
| CalendarWidget | `components/CalendarWidget.tsx` | Kalendarz miesieczny (sidebar) |
| EventItem | `components/EventItem.tsx` | Karta wydarzenia z rokiem i zdjeciami |
| PhotoGallery | `components/PhotoGallery.tsx` | Galeria zdjec z lightboxem (object-contain + zoom) |
| DatePicker | `components/DatePicker.tsx` | Selecty dzien/miesiac (fallback) |
| SearchForm | `components/SearchForm.tsx` | Formularz wyszukiwania na stronie /szukaj |

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
- [ ] Panel admina (dodawanie/edycja wydarzen)
- [ ] Logowanie admina (Supabase Auth)
- [ ] Przeniesc domene d-w.pl na Vercel
- [ ] Upload i migracja ~4462 zdjec do Supabase Storage (zamiast linkow do d-w.pl)
- [ ] SEO: meta tagi, Open Graph, sitemap
- [ ] Polskie znaki w URL-ach (slug zamiast ID)
