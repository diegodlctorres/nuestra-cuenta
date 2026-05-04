# Nuestra Cuenta

Aplicación web compartida para gestión de hogar orientada a instalación como PWA en iPhone. Está desplegada en Vercel y usa Supabase para autenticación, base de datos y storage.

## Qué resuelve

Nuestra Cuenta organiza la operación diaria de un `household` en cuatro dominios:

- Finanzas: cuentas, categorías y transacciones.
- Tareas del hogar: recordatorios puntuales y recurrentes.
- Mascotas: registro de mascotas y tareas programadas.
- Configuración: perfil de pareja, tema e invitaciones.

La unidad de colaboración es siempre el `household`. Toda operación de negocio debe quedar acotada a ese contexto.

## Estado técnico actual

El proyecto ya no está en una SPA básica con hooks locales. A día de hoy:

- La app está preparada como PWA instalable para iOS.
- La arquitectura frontend está separada por dominios.
- Los dominios principales usan React Query como capa de server-state.
- La app sigue una estrategia `online-first` con resiliencia offline limitada.
- Supabase sigue siendo la fuente de verdad; no existe edición offline colaborativa.

## Estrategia PWA

La estrategia actual no es `offline-first`.

Sí soportamos:

- instalación desde Safari/iPhone
- `manifest` e iconos locales versionados
- `service worker` para app shell y assets estáticos
- apertura básica sin red
- página fallback offline
- banner de conectividad
- bloqueo explícito de mutaciones sin red

No soportamos por ahora:

- escritura offline
- cola local de mutaciones
- sincronización diferida
- resolución de conflictos entre usuarios

La decisión es deliberada: la app es colaborativa y Supabase es la fuente de verdad compartida.

## Arquitectura actual

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Motion
- Lucide React
- date-fns
- TanStack Query

### Backend y datos

- Supabase Auth
- Supabase Postgres
- Supabase Storage
- SQL versionado en `supabase/`

### Organización por capas

- `src/views/`: composición de cada sección
- `src/components/`: formularios, modales y UI reusable
- `src/contexts/`: auth, navegación, red y providers de dominio
- `src/hooks/`: coordinación de estado por dominio
- `src/lib/`: acceso a Supabase, mapeos, query keys, utilidades
- `src/types.ts`: contratos del dominio

## Flujo principal de la app

1. `src/main.tsx` monta `NetworkStatusProvider`, `QueryClientProvider`, `AuthProvider` y `App`.
2. `src/contexts/AuthContext.tsx` resuelve sesión, perfil, `householdId` y `memberId`.
3. `src/App.tsx` decide:
   - sin sesión: `AuthView`
   - con sesión sin household: `OnboardingView`
   - con household: shell principal por tabs
4. Con household activo, la UI se monta sobre providers por dominio:
   - `FinanceProvider`
   - `PetsProvider`
   - `TasksProvider`
   - `SettingsProvider`
5. Cada dominio usa React Query para lectura, cache e invalidación.

## Server-state y dominios

Los dominios principales ya están desacoplados en capa de datos:

- Finanzas:
  - `src/hooks/useTransactions.ts`
  - `src/lib/financeData.ts`
- Mascotas:
  - `src/hooks/usePets.ts`
  - `src/lib/petsData.ts`
- Tareas:
  - `src/hooks/useTasks.ts`
  - `src/lib/tasksData.ts`
  - `src/lib/taskRecurrence.ts`
- Settings:
  - `src/hooks/useSettings.ts`
  - `src/lib/settingsData.ts`

Infraestructura compartida:

- `src/lib/queryClient.ts`
- `src/lib/queryKeys.ts`
- `src/contexts/NetworkStatusContext.tsx`
- `src/lib/networkStatus.ts`

## Seguridad y Supabase

Principios actuales:

- Supabase es la fuente de verdad.
- RLS debe proteger el aislamiento por `household`.
- El cliente no debe asumir permisos sin respaldo en backend.
- Reglas críticas deben vivir en SQL, políticas o RPCs.

Artefactos relevantes:

- `supabase/schema.sql`: esquema base consolidado del repo
- `supabase/rls_setup.sql`: políticas relevantes consolidadas
- `supabase/phase2_invitations.sql`: flujo de invitaciones
- `supabase/bootstrap_household.sql`: bootstrap inicial
- `supabase/household_profiles.sql`: RPC para perfiles resumidos del household
- `supabase/household_member_profiles.sql`: RPC para perfiles de miembros del household
- `supabase/live/schema_live.sql`: snapshot extraído de la base real
- `supabase/live/functions_live.sql`
- `supabase/live/functions_live.json`
- `supabase/live/rls_live.md`
- `supabase/live/DRIFT_REPORT.md`

## Estructura relevante del proyecto

```text
src/
  App.tsx
  main.tsx
  index.css
  types.ts
  components/
  contexts/
  hooks/
  lib/
  views/
public/
  manifest.json
  sw.js
  offline.html
supabase/
  schema.sql
  rls_setup.sql
  phase2_invitations.sql
  bootstrap_household.sql
  household_profiles.sql
  household_member_profiles.sql
  live/
    schema_live.sql
    functions_live.sql
    functions_live.json
    rls_live.md
    DRIFT_REPORT.md
    extract_live_snapshot.sql
  archive/
```

## Variables de entorno

Crear `.env.local` con:

```bash
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
VITE_SUPABASE_PUBLISHABLE_KEY=TU_SUPABASE_PUBLISHABLE_KEY
GEMINI_API_KEY=TU_GEMINI_API_KEY
```

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

Scripts:

- `dev`: inicia Vite en `0.0.0.0:3000`
- `build`: build de producción
- `preview`: previsualización local
- `lint`: validación de tipos con `tsc --noEmit`

## Calidad actual

- Validación de tipos: sí
- Build de producción: sí
- PWA base para iOS: sí
- Server-state con React Query: sí
- Tests automatizados: todavía no
- Observabilidad formal: todavía no

## Contribución

Antes de tocar lógica sensible:

1. Revisa `AGENTS.md`.
2. Revisa el hook y la capa `lib/*Data.ts` del dominio afectado.
3. Si cambias datos o permisos, revisa `supabase/`.

Reglas prácticas:

- No romper aislamiento por `household`.
- No introducir lógica de permisos solo en frontend.
- Si cambias SQL, revisa `src/types.ts` y snapshots de Supabase.
- Si una mutación requiere red, no intentes convertirla en offline sin diseñar reconciliación.

## Fuente de verdad en `supabase/`

Mantener como fuente activa:

- `supabase/schema.sql`
- `supabase/rls_setup.sql`
- `supabase/bootstrap_household.sql`
- `supabase/phase2_invitations.sql`
- `supabase/household_profiles.sql`
- `supabase/household_member_profiles.sql`

Mantener como auditoría del estado real:

- `supabase/live/schema_live.sql`
- `supabase/live/functions_live.sql`
- `supabase/live/functions_live.json`
- `supabase/live/rls_live.md`
- `supabase/live/DRIFT_REPORT.md`
- `supabase/live/extract_live_snapshot.sql`

Mantener en histórico:

- `supabase/archive/`

## Estado de roadmap

- Fase 1 PWA/iOS: completada
- Fase 2 seguridad y backend base: completada en lo principal
- Fase 3 arquitectura de datos y server-state: completada
- Fase 4 reducida `online-first + resiliencia`: en marcha y ya con base implementada

## Guía para agentes

La guía operativa para IA está en `AGENTS.md`.
