# FotoBudka Frontend

Frontend aplikacji FotoBudka napisany w React, TypeScript i Tailwind CSS. Zawiera panel fotografa, widoki klienta do wyboru zdjęć i pobierania ZIP oraz publiczne portfolio fotografa.

## Spis treści

- [Opis projektu](#opis-projektu)
- [Główne funkcje](#główne-funkcje)
- [Stack](#stack)
- [Struktura projektu](#struktura-projektu)
- [Wymagania](#wymagania)
- [Konfiguracja środowiska](#konfiguracja-środowiska)
- [Uruchomienie lokalne](#uruchomienie-lokalne)
- [Build](#build)
- [Routing](#routing)
- [Architektura frontendu](#architektura-frontendu)
- [API i auth](#api-i-auth)
- [Upload plików](#upload-plików)
- [Publiczne portfolio](#publiczne-portfolio)
- [Smoke test](#smoke-test)
- [Znane follow-upy](#znane-follow-upy)

## Opis projektu

FotoBudka obsługuje pełny flow sesji zdjęciowej:

1. Fotograf loguje się przez Google.
2. Fotograf tworzy sesję i ustawia cennik.
3. Fotograf wgrywa zdjęcia do selekcji.
4. Klient wchodzi kodem albo linkiem.
5. Klient wybiera zdjęcia i dodaje notatki.
6. Fotograf potwierdza płatność manualną.
7. Fotograf wgrywa finalne zdjęcia.
8. System generuje ZIP.
9. Klient pobiera gotową paczkę.
10. Fotograf może też publikować publiczne galerie portfolio.

Frontend obejmuje panel fotografa, klientowy widok sesji, publiczne portfolio oraz landing page.

## Główne funkcje

- Landing page z wejściem klienta kodem i wyróżnionymi galeriami.
- Login fotografa przez backendowe Google OAuth.
- Panel fotografa z AppShell i nawigacją: Sesje, Portfolio, Profil.
- Dashboard sesji z filtrami i wyszukiwaniem.
- Tworzenie sesji i wyświetlenie kodu/linku klienta.
- Regeneracja kodu/linku.
- Upload zdjęć source przez presigned URL.
- Status processingu zdjęć.
- Klientowy grid proofów z wyborem i notatkami.
- Submit wyboru z podsumowaniem ceny.
- Widok fotografa z listą wybranych zdjęć i notatkami.
- Mark paid.
- Upload finali pod wybrane zdjęcia.
- Generowanie ZIP.
- Pobieranie ZIP przez klienta.
- Profil fotografa i publiczne galerie portfolio.
- Featured public galleries na stronie głównej.
- Sonner toasts.
- React Query cache i invalidacje.

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack React Query
- Sonner
- Fetch API
- reCAPTCHA v2 checkbox

## Struktura projektu

Przykładowy układ:

```txt
src/
  components/
    layout/
    ui/
  features/
    auth/
    client-access/
    client-delivery/
    client-selection/
    finals/
    photographer-selection/
    portfolio/
    profile/
    sessions/
    uploads/
  layouts/
    AppShell.tsx
  lib/
    api/
    config/
    notifications/
    query/
    utils/
  pages/
    ClientDownloadPage.tsx
    ClientEntryPage.tsx
    ClientSessionPage.tsx
    ClientTokenAccessPage.tsx
    GalleryDetailPage.tsx
    PortfolioPage.tsx
    PublicGalleryPage.tsx
    PublicHomePage.tsx
    PublicPhotographerPage.tsx
    SessionDetailPage.tsx
    SessionsPage.tsx
  App.tsx
  main.tsx
```

Konwencje:

- każda domena ma własny folder w `features`,
- `api.ts` odpowiada za fetch i normalizację odpowiedzi,
- `hooks.ts` odpowiada za React Query,
- komponenty domenowe są w `features/<domain>/components`,
- strony są w `src/pages`,
- layout panelu fotografa jest w `src/layouts/AppShell.tsx`,

## Wymagania

- Node.js
- npm
- działający backend FotoBudka
- domena/API URL dla środowiska produkcyjnego
- reCAPTCHA site key

## Konfiguracja środowiska

Plik `.env` albo zmienne środowiskowe Netlify:

```env
VITE_API_BASE_URL=https://fotobudka-api.mmozoluk.com
VITE_RECAPTCHA_SITE_KEY=<recaptcha-site-key>
```

W dev może to być np.:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_RECAPTCHA_SITE_KEY=<dev-site-key>
```

Zmienne `VITE_*` są wbudowywane w aplikację w czasie builda. Po zmianie envów na Netlify trzeba zrobić nowy deploy.

## Uruchomienie lokalne

Instalacja zależności:

```bash
npm install
```

Start dev servera:

```bash
npm run dev
```

Domyślnie Vite uruchomi aplikację na:

```txt
http://localhost:5173
```

Backend musi mieć ustawione:

```env
FRONTEND_ORIGIN=http://localhost:5173
```

jeśli testujesz lokalnie z cookies i CORS.

## Build

```bash
npm run build
```

Podgląd produkcyjnego builda lokalnie:

```bash
npm run preview
```

## Routing

Najważniejsze trasy:

```txt
/                                      - landing page
/login                                 - login fotografa
/client                                - wejście klienta kodem
/s/:token                              - wejście klienta linkiem
/client/session/:sessionId             - klientowy wybór zdjęć
/client/session/:sessionId/download    - pobieranie ZIP

/app                                   - panel fotografa
/app/sessions                          - lista sesji
/app/sessions/:sessionId               - szczegóły sesji
/app/portfolio                         - galerie portfolio
/app/portfolio/:galleryId              - szczegóły galerii
/app/profile                           - profil fotografa

/:username                             - publiczny profil fotografa
/:username/:gallerySlug                - publiczna galeria
```

Szerokie route'y publiczne `/:username` i `/:username/:gallerySlug` muszą być na końcu konfiguracji React Router, żeby nie przechwytywały tras `/login`, `/client`, `/app` i `/s/:token`.

## Architektura frontendu

### API client

API client jest oparty o `fetch`. Requesty do backendu muszą wysyłać cookies, bo auth fotografa i klienta działa przez HttpOnly cookies.

Typowe wymaganie:

```ts
credentials: "include";
```

Błędy API są mapowane na `ApiError` i obsługiwane przez toasty.

### React Query

Query keys są trzymane centralnie w:

```txt
src/lib/query/keys.ts
```

Domeny korzystają z hooków, np.:

```txt
useSessionsQuery
useSessionQuery
useGalleriesQuery
usePublicPhotographerQuery
usePublicGalleryQuery
useClientPhotosInfiniteQuery
```

### UI

Wspólne komponenty UI:

```txt
Button
Input
Textarea
Modal
Spinner
EmptyState
```

Kolory i design tokens są zdefiniowane w Tailwind/CSS jako klasy, żeby używać ich w całej aplikacji spójnie.

## API i auth

### Fotograf

Fotograf loguje się przez:

```txt
GET /api/auth/google/login
```

Backend przeprowadza OAuth flow, ustawia HttpOnly cookie i frontend może pobrać profil przez endpointy `/api/me/...`.

Frontend nie przechowuje JWT w `localStorage`.

### Klient

Klient nie ma konta. Wchodzi przez:

```txt
POST /api/client/access/by-code
GET  /api/client/access/by-token/{token}
```

Po poprawnym wejściu backend ustawia klientowe HttpOnly cookie, a dalsze endpointy klienta działają już po tym cookie.

CAPTCHA jest pokazywana po odpowiedzi `captcha_required`.

## Upload plików

Upload plików działa przez presigned URL:

1. Front pyta backend o presign.
2. Backend zwraca `PutURL` i identyfikatory plików.
3. Front wysyła plik bezpośrednio do object storage.
4. Front woła endpoint `complete` na backendzie.
5. Backend/worker wykonują dalsze operacje.

Używane flow:

```txt
source photos:
POST /api/sessions/{sessionId}/photos/presign
PUT  PutURL
POST /api/sessions/{sessionId}/photos/{photoId}/complete

portfolio photos:
POST /api/galleries/{galleryId}/photos/presign
PUT  PutURL
POST /api/galleries/{galleryId}/photos/{photoId}/complete

final photos:
POST /api/sessions/{sessionId}/finals/presign
PUT  PutURL
POST /api/sessions/{sessionId}/finals/{finalId}/complete
```

Nie logować i nie zapisywać ręcznie:

- `PutURL`,
- `ObjectKey`,
- signed `ImageURL`,
- signed `CoverURL`,
- signed `DownloadURL`.

## Publiczne portfolio

Portfolio obejmuje:

```txt
/app/profile                 - edycja profilu
/app/portfolio               - zarządzanie galeriami
/app/portfolio/:galleryId    - zdjęcia galerii
/:username                   - publiczny profil
/:username/:gallerySlug      - publiczna galeria
```

Na stronie głównej wyświetlane są featured public galleries:

```txt
GET /api/public/galleries/featured?limit=4
```

Na backendzie są to aktualnie losowo wybrane publiczne galerie z co najmniej jednym zdjęciem.

## Smoke test

Po deployu sprawdź:

```txt
[ ] / ładuje landing page
[ ] featured galleries pobierają się z API
[ ] /login działa i Google OAuth działa
[ ] /client działa
[ ] błędny kod wywołuje CAPTCHA po progu prób
[ ] fotograf loguje się i widzi /app/sessions
[ ] profil fotografa zapisuje się
[ ] publiczny profil /:username działa
[ ] tworzenie galerii działa
[ ] upload zdjęcia do galerii działa
[ ] publiczna galeria działa
[ ] tworzenie sesji działa
[ ] upload source działa
[ ] worker generuje proof z watermarkiem
[ ] klient wchodzi kodem/linkiem
[ ] klient wybiera zdjęcia i submituje
[ ] fotograf widzi wybór i notatki
[ ] mark paid działa
[ ] upload finali działa
[ ] generate ZIP działa
[ ] klient pobiera ZIP
[ ] refresh bezpośrednio na trasach React Router nie daje 404
```

## Follow-upy

Nieblokujące MVP:

- virtualizacja gridu przy 500-800 zdjęciach,
- dalsze optymalizacje infinite scroll,
- drag&drop polish w uploaderach,
- lepsze bulk actions dla zdjęć,
- e-maile do klienta po utworzeniu sesji i po gotowym ZIP,
- płatności online,
- bardziej rozbudowane portfolio,
- lepsza obsługa dużych galerii publicznych.
