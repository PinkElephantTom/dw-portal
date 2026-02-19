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

Codzienne kalendarium wydarzen historycznych z Poludniowej Wielkopolski. Uzytkownik wchodzi na strone i widzi liste wydarzen z dzisiejszego dnia. Moze nawigowac po datach za pomoca kalendarza lub strzalek ‹ ›.

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

**RLS**: Publiczny odczyt (SELECT) wlaczony. Zapis wymaga service role.

**Glowne query**: `WHERE event_date LIKE '%-MM-DD'` — szuka wydarzen po dniu i miesiacu, ignorujac rok.

Migracja SQL: `supabase/migrations/001_create_dw_tables.sql`

## Strony

| Route | Plik | Opis |
|-------|------|------|
| `/` | `app/page.tsx` | Kalendarium dnia — duza data, lista wydarzen, kalendarz sidebar |
| `/?data=MM-DD` | j.w. | Kalendarium na konkretny dzien |
| `/wydarzenie/[id]` | `app/wydarzenie/[id]/page.tsx` | Szczegoly wydarzenia + galeria zdjec |
| `/szukaj` | `app/szukaj/page.tsx` | Wyszukiwarka pelnotekstowa |
| `/szukaj?q=QUERY` | j.w. | Wyniki wyszukiwania |

## Komponenty

| Komponent | Plik | Opis |
|-----------|------|------|
| Header | `components/layout/Header.tsx` | 65px, burger, logo d-w.pl, nav, szukaj |
| Footer | `components/layout/Footer.tsx` | Ciemny #1d1d1b, logo, linki |
| CalendarWidget | `components/CalendarWidget.tsx` | Kalendarz miesięczny (sidebar) |
| EventItem | `components/EventItem.tsx` | Karta wydarzenia z rokiem i zdjęciami |
| DatePicker | `components/DatePicker.tsx` | Selecty dzien/miesiac (fallback) |
| SearchForm | `components/SearchForm.tsx` | Formularz wyszukiwania |

## Styl wizualny

Identyczny z wkaliszu.pl poza kolorem:
- **Header**: 65px, bialy, burger animowany (3 linie → X), logo po srodku, akcje po prawej
- **Footer**: ciemny `#1d1d1b`, `border-t-4` czerwony, logo + linki
- **Karty**: `rounded-sm`, bez cienia, `border border-gray-200`
- **Naglowki**: Oswald uppercase, `tracking-wider`
- **Przyciski**: `bg-[#b50926]`, Oswald uppercase

## Import danych z MySQL

Oryginal d-w.pl uzywa MySQL (baza `c6dw`). Skrypt importu:

```bash
# Wymaga: Docker z d-w.pl (docker compose up)
cd /Users/malgo1/APP/dw-portal
npx tsx scripts/import-from-mysql.ts
```

Skrypt czyta z Docker MySQL → wstawia do Supabase.
Aktualnie zaimportowano: **6 wydarzen testowych + 1 zdjecie** (lokalna baza).
Pelna baza produkcyjna (serwer hitme.net.pl) — do zaimportowania.

## Oryginalna strona PHP

Pliki oryginalnej strony d-w.pl (PHP):
- Katalog: `/Users/malgo1/APP/d-w.pl/`
- Dokumentacja techniczna: `/Users/malgo1/APP/d-w.pl/docs/OPIS-TECHNICZNY.md`
- Hosting: `/Users/malgo1/APP/d-w.pl/docs/HOSTINGI.md`
- Roadmap PHP: `/Users/malgo1/APP/d-w.pl/ROADMAP.md`

## TODO

- [ ] Import pelnej bazy produkcyjnej z hitme.net.pl
- [ ] Panel admina (dodawanie/edycja wydarzen)
- [ ] Logowanie admina (Supabase Auth)
- [ ] Przeniesc domene d-w.pl na Vercel
- [ ] Upload i migracja ~4885 zdjec z produkcji
- [ ] SEO: meta tagi, Open Graph, sitemap
