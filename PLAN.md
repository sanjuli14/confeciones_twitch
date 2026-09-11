# Consultorio del Amor — Plan de Implementación

## Resumen Ejecutivo

Web App Angular 22 standalone para streams en vivo. 3 vistas: formulario del viewer, panel de moderación (protegido con auth), y overlay para OBS. Supabase Realtime para sincronizar todo.

---

## Orden de Implementación

```
1 Env ──► 2 Tailwind ──► 3 Core ──► 4 SQL ──► 5 Auth ──► 6 Guard ──► 7 Viewer ──► 8 Admin ──► 9 Overlay ──► 10 Routing ──► 11 SSR
```

---

## Paso 1 — Environment Setup

```bash
ng generate environments
```

**Archivos:** `src/environments/environment.ts`, `src/environments/environment.development.ts`

Contiene `supabaseUrl` y `supabaseAnonKey`.

---

## Paso 2 — Tailwind CSS v4 + Tema Neon/Dark

```bash
npm i tailwindcss @tailwindcss/postcss postcss
```

**Archivos:** `.postcssrc.json`, `src/styles.css`, `src/app/app.html` (solo `<router-outlet />`), `src/app/app.css`

**Tokens:**
| Token | Color | Uso |
|---|---|---|
| `--color-heart` | `#ff2e88` | Rosa principal |
| `--color-leaf` | `#20e08a` | Verde |
| `--color-flame` | `#ff6a3d` | Naranja |
| `--color-night` | `#0b0716` | Fondo |
| `--color-panel` | `#17102a` | Fondo paneles |
| `--color-neon` | `#a78bfa` | Brand |

---

## Paso 3 — Core

**Archivos:**
- `src/app/core/models/types.ts`
- `src/app/core/services/supabase.service.ts`
- `src/app/core/services/live-state.service.ts`
- `src/app/core/utils/text.ts` — `splitParagraphs()`

**Modelo Confession:**
```ts
interface Confession {
  id: string;
  created_at: string;
  title: string;
  body: string;
  category: string;
  nickname: string;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  is_highlighted: boolean;    // true = confesión activa en pantalla
  revealed_paragraphs: number; // cuántos párrafos se han mostrado
  overlay_paused: boolean;    // overlay congelado
}
```

**CATEGORIES:**
```ts
const CATEGORIES = [
  { id: 'amor', label: '💔 Amor' },
  { id: 'desamor', label: '🫣 Confesión vergonzosa' },
  { id: 'redflag', label: '🚩 ¿Es una Red Flag?' },
  { id: 'norespondido', label: '💖 Amor no correspondido' },
  { id: 'toxico', label: '😈 Secreto tóxico' },
] as const;
```

---

## Paso 4 — SQL Supabase

```sql
-- 1. Tipo ENUM
CREATE TYPE confession_status AS ENUM ('pending', 'approved', 'rejected', 'archived');

-- 2. Tabla confessions (todo en una tabla)
CREATE TABLE public.confessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title VARCHAR(120) NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    nickname VARCHAR(50) DEFAULT 'Anónimo',
    status confession_status DEFAULT 'pending' NOT NULL,
    is_highlighted BOOLEAN DEFAULT false NOT NULL,
    revealed_paragraphs SMALLINT NOT NULL DEFAULT 1,
    overlay_paused BOOLEAN NOT NULL DEFAULT false
);

-- 3. RLS
ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon insert confessions" ON public.confessions
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon read approved" ON public.confessions
  FOR SELECT TO anon USING (status = 'approved');
CREATE POLICY "auth full confessions" ON public.confessions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.confessions;
```

---

## Paso 5 — AuthService

**Archivo:** `src/app/core/services/auth.service.ts`

- `user` signal, `initialized` signal
- `login(email, password)`, `logout()`, `ensureSession()`
- `onAuthStateChange` actualiza signal

---

## Paso 6 — Auth Guard

**Archivo:** `src/app/core/guards/auth.guard.ts`

`CanMatchFn` → si no autenticado, redirect a `/admin/login`.

---

## Paso 7 — Viewer (`/enviar`)

**Archivos:**
- `src/app/features/viewer/viewer.routes.ts`
- `src/app/features/viewer/pages/submit/submit.page.ts` (+.html, .css)
- `src/app/features/viewer/components/success-card/success-card.ts` (+.html, .css)

**Formulario:** title (120), body (3000), category (select), nickname (50). SuccessCard al enviar.

---

## Paso 8 — Admin (`/admin`)

**Archivos:**
- `src/app/features/admin/admin.routes.ts`
- `src/app/features/admin/pages/login/login.page.ts`
- `src/app/features/admin/pages/dashboard/dashboard.page.ts`
- `src/app/features/admin/components/confession-card/confession-card.ts`
- `src/app/features/admin/components/queue-tabs/queue-tabs.ts`
- `src/app/features/admin/components/show-controls/show-controls.ts`

### Login
Email/password → AuthService.login → redirect a dashboard.

### Dashboard
- **Tabs:** Pendientes | Aprobadas | Rechazadas
- **Realtime:** postgres_changes sobre confessions
- **Acciones:** Aprobar, Rechazar, Lanzar a Pantalla

### Show Controls (cuando hay confesión en pantalla)
- **Lanzar:** `is_highlighted = true` en la confesión seleccionada (el anterior se desmarca)
- **Siguiente párrafo:** `revealed_paragraphs += 1`
- **Reiniciar:** `revealed_paragraphs = 1`
- **Pausar/Reanudar:** `overlay_paused = toggle`

---

## Paso 9 — Overlay (`/overlay`)

**Archivo:** `src/app/features/overlay/overlay.page.ts` (+.html, .css)

- 1920x1080, fondo transparente
- Subscribe a confessions donde `is_highlighted = true`
- Muestra solo los párrafos hasta `revealed_paragraphs`
- Si `overlay_paused`, congela la vista
- Animaciones CSS: card-in, paragraph-in

---

## Paso 10 — Routing

```ts
export const routes: Routes = [
  { path: '', redirectTo: '/enviar', pathMatch: 'full' },
  { path: 'enviar', loadChildren: () => import('./features/viewer/viewer.routes') },
  { path: 'admin/login', loadComponent: () => import('./features/admin/pages/login/login.page') },
  { path: 'admin', canMatch: [authGuard], loadChildren: () => import('./features/admin/admin.routes') },
  { path: 'overlay', loadComponent: () => import('./features/overlay/overlay.page') },
  { path: '**', redirectTo: '/enviar' },
];
```

---

## Paso 11 — SSR

| Ruta | RenderMode |
|---|---|
| `/`, `/enviar` | `Prerender` |
| `/admin/**` | `Client` |
| `/overlay` | `Client` |
| `**` | `Server` |
