# Plan wdrożenia panelu administracyjnego — D-W.PL

## Stan obecny

Portal D-W.PL to publiczne kalendarium historyczne (Next.js 16 + Supabase + Tailwind CSS 4).
Baza danych zawiera **5721 wydarzeń** i **4462 zdjęć**. Aktualnie:

- Brak systemu autentykacji
- Brak ról użytkowników
- Brak interfejsu do zarządzania treścią
- Dane modyfikowane wyłącznie przez skrypty importu z kluczem service role
- RLS: publiczny odczyt dla wszystkich, zapis wymaga service role

---

## Architektura rozwiązania

Panel administracyjny będzie żył w podścieżce `/admin` z osobnym layoutem (bez publicznego
Header/Footer). Autentykacja przez **Supabase Auth** (email + hasło). Autoryzacja przez
tabelę `dw_admin_users` + polityki RLS.

```
app/
├── (public)/              ← grupa tras publicznych (istniejące strony)
│   ├── layout.tsx         ← Header + Footer (przeniesiony z app/layout.tsx)
│   ├── page.tsx           ← strona główna
│   ├── szukaj/
│   └── wydarzenie/[id]/
├── admin/                 ← panel administracyjny
│   ├── layout.tsx         ← AdminLayout (sidebar, topbar, guard sesji)
│   ├── page.tsx           ← Dashboard (statystyki, ostatnie zmiany)
│   ├── login/page.tsx     ← Strona logowania (poza guardem)
│   ├── wydarzenia/
│   │   ├── page.tsx       ← Lista wydarzeń z filtrowaniem/paginacją
│   │   ├── nowe/page.tsx  ← Formularz dodawania
│   │   └── [id]/page.tsx  ← Formularz edycji + zarządzanie zdjęciami
│   └── uzytkownicy/
│       └── page.tsx       ← Zarządzanie administratorami
├── layout.tsx             ← Root layout (fonty, globalne style, BEZ Header/Footer)
└── globals.css
```

---

## Fazy wdrożenia

### Faza 1 — Fundament: Autentykacja i ochrona tras

**1.1. Migracja bazy danych — tabela administratorów**

Nowy plik: `supabase/migrations/002_admin_users.sql`

```sql
-- Tabela administratorów powiązana z Supabase Auth
CREATE TABLE IF NOT EXISTS dw_admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'editor'
    CHECK (role IN ('admin', 'editor')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE dw_admin_users ENABLE ROW LEVEL SECURITY;

-- Tylko admini widzą listę administratorów
CREATE POLICY "admin_users_read" ON dw_admin_users
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM dw_admin_users)
  );

-- Polityki zapisu dla dw_events (INSERT, UPDATE, DELETE)
CREATE POLICY "dw_events_admin_insert" ON dw_events
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM dw_admin_users)
  );

CREATE POLICY "dw_events_admin_update" ON dw_events
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM dw_admin_users)
  );

CREATE POLICY "dw_events_admin_delete" ON dw_events
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM dw_admin_users WHERE role = 'admin')
  );

-- Polityki zapisu dla dw_photos
CREATE POLICY "dw_photos_admin_insert" ON dw_photos
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM dw_admin_users)
  );

CREATE POLICY "dw_photos_admin_update" ON dw_photos
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM dw_admin_users)
  );

CREATE POLICY "dw_photos_admin_delete" ON dw_photos
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM dw_admin_users)
  );
```

Role:
- **admin** — pełne uprawnienia (CRUD + usuwanie + zarządzanie użytkownikami)
- **editor** — dodawanie i edycja wydarzeń/zdjęć (bez usuwania wydarzeń)

**1.2. Supabase Auth — konfiguracja**

- Włączyć email provider w Supabase Dashboard → Authentication → Providers
- Wyłączyć rejestrację publiczną (admin dodaje użytkowników ręcznie)
- Pierwszego admina dodać przez Supabase Dashboard lub skrypt seed

**1.3. Middleware Next.js — ochrona tras `/admin`**

Nowy plik: `middleware.ts` (root projektu)

```typescript
// Przechwytuje /admin/* (oprócz /admin/login)
// Sprawdza sesję Supabase Auth
// Brak sesji → redirect do /admin/login
// Odświeżanie tokenów przez cookies
```

Wykorzystuje `@supabase/ssr` createServerClient w middleware (wzorzec z dokumentacji Supabase).

**1.4. Reorganizacja layoutów**

- `app/layout.tsx` — root layout: fonty, globalne style, `<html>`, `<body>`. **Bez** Header/Footer.
- `app/(public)/layout.tsx` — nowa grupa tras: dodaje Header + Footer. Przeniesienie istniejących
  stron (`page.tsx`, `szukaj/`, `wydarzenie/`) do `app/(public)/`.
- `app/admin/layout.tsx` — AdminLayout: sidebar z nawigacją, topbar z nazwą zalogowanego
  użytkownika i przyciskiem wylogowania.

**1.5. Strona logowania**

`app/admin/login/page.tsx`:
- Formularz: email + hasło
- Wywołanie `supabase.auth.signInWithPassword()`
- Po sukcesie → redirect do `/admin`
- Obsługa błędów (nieprawidłowe dane, konto nieaktywne)

---

### Faza 2 — CRUD wydarzeń

**2.1. Lista wydarzeń (`app/admin/wydarzenia/page.tsx`)**

- Tabela z kolumnami: ID, data, opis (skrócony), liczba zdjęć, akcje
- Paginacja (50 na stronę)
- Filtrowanie po dacie (zakres), wyszukiwanie po opisie
- Sortowanie po dacie / ID
- Przyciski: Edytuj, Usuń (z potwierdzeniem), Dodaj nowe

**2.2. Formularz dodawania (`app/admin/wydarzenia/nowe/page.tsx`)**

- Pola: data wydarzenia (date picker), opis (textarea)
- Walidacja: data wymagana, opis wymagany (min. 10 znaków)
- Po zapisie → redirect do edycji (gdzie można dodać zdjęcia)

**2.3. Formularz edycji (`app/admin/wydarzenia/[id]/page.tsx`)**

- Te same pola co dodawanie, z wczytanymi danymi
- Sekcja zdjęć poniżej:
  - Lista istniejących zdjęć (miniatura + URL + tytuł + autor + źródło)
  - Usuwanie zdjęcia (z potwierdzeniem)
  - Dodawanie nowego zdjęcia (URL + opcjonalnie tytuł/autor/źródło)
- Zapis przez `supabase.from('dw_events').update()`

**2.4. Server Actions**

Plik: `app/admin/actions.ts`

```typescript
'use server'

export async function createEvent(formData: FormData) { ... }
export async function updateEvent(id: number, formData: FormData) { ... }
export async function deleteEvent(id: number) { ... }
export async function addPhoto(eventId: number, formData: FormData) { ... }
export async function deletePhoto(id: number) { ... }
```

Każda akcja:
1. Tworzy klienta Supabase z sesją użytkownika
2. Waliduje dane wejściowe
3. Wykonuje operację na bazie
4. Zwraca wynik (sukces/błąd)
5. `revalidatePath()` dla odświeżenia cache

---

### Faza 3 — Upload zdjęć do Supabase Storage

**3.1. Bucket w Supabase Storage**

- Nazwa: `dw-photos`
- Polityka: publiczny odczyt, zapis tylko dla zalogowanych administratorów
- Struktura: `dw-photos/{event_id}/{filename}`

**3.2. Komponent uploadu**

- Drag & drop lub kliknięcie do wyboru pliku
- Podgląd przed uploadem
- Walidacja: typ (JPEG/PNG/WebP), rozmiar (max 5 MB)
- Upload do Supabase Storage → zapis URL w `dw_photos`
- Alternatywnie: zachowanie obecnego pola URL (dla zdjęć z `d-w.pl/upload/`)

**3.3. Opcja: Podanie URL zamiast uploadu**

- Zachowanie kompatybilności z istniejącymi zdjęciami hostowanymi na `d-w.pl`
- Przełącznik w formularzu: "Upload pliku" / "Podaj URL"

---

### Faza 4 — Dashboard i zarządzanie użytkownikami

**4.1. Dashboard (`app/admin/page.tsx`)**

- Statystyki: łączna liczba wydarzeń, zdjęć, wydarzeń bez zdjęć
- Ostatnio dodane/edytowane wydarzenia (10 najnowszych wg `updated_at`)
- Szybkie akcje: Dodaj wydarzenie, Szukaj

**4.2. Zarządzanie administratorami (`app/admin/uzytkownicy/page.tsx`)**

Dostępne tylko dla roli `admin`:

- Lista administratorów (email, rola, data dodania)
- Dodawanie nowego administratora:
  - Podanie email + hasło tymczasowe
  - `supabase.auth.admin.createUser()` (wymaga service role — przez API route)
  - Wpis w `dw_admin_users`
- Zmiana roli (admin ↔ editor)
- Usuwanie administratora

**4.3. API Route dla operacji admin**

`app/api/admin/users/route.ts`:
- POST — tworzenie nowego użytkownika (wymaga service role key, bo Supabase Auth admin API)
- Weryfikacja, czy wywołujący ma rolę `admin`

---

### Faza 5 — Usprawnienia i bezpieczeństwo

**5.1. Komponenty UI admina**

Wspólne komponenty wielokrotnego użytku:
- `components/admin/AdminSidebar.tsx` — nawigacja boczna
- `components/admin/DataTable.tsx` — tabela z paginacją i sortowaniem
- `components/admin/FormField.tsx` — pola formularza ze stylami i walidacją
- `components/admin/ConfirmDialog.tsx` — dialog potwierdzenia usunięcia
- `components/admin/Toast.tsx` — powiadomienia o sukcesie/błędzie

**5.2. Zabezpieczenia**

- Walidacja danych wejściowych server-side (Server Actions)
- CSRF: wbudowane w Next.js Server Actions
- Rate limiting: Supabase wbudowany rate limit na Auth
- Sanityzacja opisu (zabezpieczenie przed XSS przy wyświetlaniu)
- Audit log: kolumna `updated_at` na wydarzeniach (już istnieje)

**5.3. Responsywność panelu admina**

- Sidebar chowany na mobile (hamburger menu)
- Tabele responsywne (card layout na małych ekranach)
- Formularze full-width na mobile

---

## Podsumowanie zmian w plikach

### Nowe pliki

| Plik | Opis |
|------|------|
| `supabase/migrations/002_admin_users.sql` | Tabela administratorów + polityki RLS |
| `middleware.ts` | Ochrona tras `/admin` |
| `app/(public)/layout.tsx` | Layout publiczny z Header/Footer |
| `app/admin/layout.tsx` | Layout admina z sidebar |
| `app/admin/page.tsx` | Dashboard |
| `app/admin/login/page.tsx` | Strona logowania |
| `app/admin/actions.ts` | Server Actions (CRUD) |
| `app/admin/wydarzenia/page.tsx` | Lista wydarzeń |
| `app/admin/wydarzenia/nowe/page.tsx` | Dodawanie wydarzenia |
| `app/admin/wydarzenia/[id]/page.tsx` | Edycja wydarzenia + zdjęcia |
| `app/admin/uzytkownicy/page.tsx` | Zarządzanie administratorami |
| `app/api/admin/users/route.ts` | API: tworzenie użytkowników (service role) |
| `components/admin/AdminSidebar.tsx` | Nawigacja boczna |
| `components/admin/DataTable.tsx` | Tabela z paginacją |
| `components/admin/ConfirmDialog.tsx` | Dialog potwierdzenia |
| `components/admin/Toast.tsx` | Powiadomienia |

### Modyfikowane pliki

| Plik | Zmiana |
|------|--------|
| `app/layout.tsx` | Usunięcie Header/Footer (przeniesione do grupy publicznej) |
| `types/database.ts` | Dodanie `DwAdminUser` interface |
| `lib/supabase/server.ts` | Bez zmian (już obsługuje cookies/sesje) |

### Przeniesione pliki (do grupy `(public)`)

| Z | Do |
|---|-----|
| `app/page.tsx` | `app/(public)/page.tsx` |
| `app/szukaj/page.tsx` | `app/(public)/szukaj/page.tsx` |
| `app/wydarzenie/[id]/page.tsx` | `app/(public)/wydarzenie/[id]/page.tsx` |

---

## Kolejność implementacji

```
Faza 1 → Faza 2 → Faza 3 → Faza 4 → Faza 5
  │          │         │         │         │
  │          │         │         │         └─ UI, bezpieczeństwo, testy
  │          │         │         └─ Dashboard, zarządzanie userami
  │          │         └─ Upload zdjęć do Storage
  │          └─ CRUD wydarzeń i zdjęć
  └─ Auth, middleware, layouty, login
```

Każda faza jest niezależnie wdrażalna — po Fazie 1+2 system jest już użyteczny.

---

## Wymagania wstępne (przed rozpoczęciem implementacji)

1. Włączyć Email Auth w Supabase Dashboard
2. Wyłączyć publiczną rejestrację w Supabase Dashboard
3. Uruchomić migrację `002_admin_users.sql`
4. Utworzyć pierwszego admina w Supabase Dashboard (Auth → Create User) + wpis w `dw_admin_users`
