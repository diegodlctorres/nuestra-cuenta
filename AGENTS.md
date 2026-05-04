# AGENTS.md - Guía De Contribución Para IA

Este documento define el contexto operativo actual para contribuir de forma segura en este proyecto.

## 1. Contexto De Producto

### 1.1 Qué resuelve

Nuestra Cuenta es una aplicación compartida para gestión de pareja/hogar. La unidad de colaboración es el `household`.

Dominios funcionales:

- Finanzas: cuentas, categorías y transacciones.
- Mascotas: mascotas y tareas programadas.
- Tareas del hogar: recordatorios puntuales y recurrentes.
- Configuración: perfil de pareja, tema e invitaciones.

### 1.2 Actores

- Usuario autenticado
- Miembro de household
- Admin de household

### 1.3 Reglas de negocio críticas

- Toda operación debe quedar acotada al `household_id` activo.
- `bootstrap_household` crea datos base de forma idempotente.
- En transacciones, `created_by` referencia `household_members.id`.
- No asumir permisos de admin en cliente sin respaldo backend.
- La app es colaborativa; Supabase es la fuente de verdad.

## 2. Estrategia Técnica Actual

### 2.1 Plataforma

- Frontend: React 19 + TypeScript + Vite + Tailwind CSS
- Datos: TanStack Query + hooks custom + providers por dominio
- Backend: Supabase Auth + Postgres + Storage
- Deploy: Vercel
- Objetivo UX: PWA instalable en iOS

### 2.2 Estrategia PWA

La app sigue una estrategia `online-first`.

Sí existe:

- instalación PWA
- app shell cacheado
- assets estáticos cacheados
- fallback offline
- banner de conectividad
- bloqueo explícito de mutaciones sin red

No existe:

- escritura offline
- cola local de mutaciones
- sincronización diferida
- resolución de conflictos entre usuarios

No introducir offline colaborativo sin rediseño explícito.

## 3. Arquitectura Actual

### 3.1 Flujo principal

1. `src/main.tsx` monta:
   - `NetworkStatusProvider`
   - `QueryClientProvider`
   - `AuthProvider`
   - `App`
2. `src/contexts/AuthContext.tsx` resuelve sesión, perfil, `householdId` y `memberId`.
3. `src/App.tsx` decide:
   - sin sesión -> `AuthView`
   - con sesión sin household -> `OnboardingView`
   - con household -> shell principal
4. Con household activo, el shell usa providers de dominio:
   - `FinanceProvider`
   - `PetsProvider`
   - `TasksProvider`
   - `SettingsProvider`

### 3.2 Organización por capas

- `src/views/`: composición de pantallas
- `src/components/`: formularios, modales y UI reusable
- `src/contexts/`: auth, navegación, red, providers de dominio
- `src/hooks/`: coordinación de estado y mutaciones
- `src/lib/`: acceso a datos, mapping, server-state, utilidades
- `src/types.ts`: contratos de dominio

### 3.3 Server-state

Fuente compartida:

- `src/lib/queryClient.ts`
- `src/lib/queryKeys.ts`

Dominios:

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

### 3.4 Red y resiliencia

- `src/contexts/NetworkStatusContext.tsx`
- `src/lib/networkStatus.ts`
- `src/components/ui/ConnectivityBanner.tsx`
- `public/sw.js`
- `public/offline.html`

## 4. Supabase Y Fuente De Verdad

Archivos importantes:

- `supabase/schema.sql`
- `supabase/rls_setup.sql`
- `supabase/bootstrap_household.sql`
- `supabase/phase2_invitations.sql`
- `supabase/household_profiles.sql`
- `supabase/household_member_profiles.sql`

Snapshots/auditoría:

- `supabase/live/schema_live.sql`
- `supabase/live/functions_live.sql`
- `supabase/live/functions_live.json`
- `supabase/live/rls_live.md`
- `supabase/live/DRIFT_REPORT.md`
- `supabase/live/extract_live_snapshot.sql`

Principio:

- No introducir lógica sensible en frontend sin respaldo en SQL, RLS o RPC.

## 5. Flujo De Trabajo Recomendado

1. Entender el dominio afectado.
2. Revisar el provider, hook y `lib/*Data.ts` correspondientes.
3. Revisar SQL asociado si hay permisos, joins, funciones o integridad.
4. Aplicar cambio pequeño y localizado.
5. Validar `npm run lint`.
6. Si el cambio es amplio, validar `npm run build`.
7. Reportar riesgos y follow-ups.

## 6. Guardrails

- No romper aislamiento por `household`.
- No relajar RLS sin alternativa equivalente.
- No mover integridad crítica al cliente si puede vivir en DB/RPC.
- No asumir offline seguro para mutaciones.
- No cambiar contratos públicos sin actualizar consumidores.
- No revertir cambios del usuario no relacionados.

## 7. Mapa Rápido Por Tipo De Tarea

- Auth/sesión/household:
  - `src/contexts/AuthContext.tsx`
  - `src/views/AuthView.tsx`
  - `src/views/OnboardingView.tsx`
- Finanzas:
  - `src/hooks/useTransactions.ts`
  - `src/lib/financeData.ts`
  - `src/components/transactions/`
  - `src/components/settings/AccountManager.tsx`
  - `src/components/settings/CategoryManager.tsx`
- Mascotas:
  - `src/hooks/usePets.ts`
  - `src/lib/petsData.ts`
  - `src/views/PetsView.tsx`
  - `src/components/pets/`
- Tareas:
  - `src/hooks/useTasks.ts`
  - `src/lib/tasksData.ts`
  - `src/lib/taskRecurrence.ts`
  - `src/views/TasksView.tsx`
  - `src/components/tasks/`
- Settings:
  - `src/hooks/useSettings.ts`
  - `src/lib/settingsData.ts`
  - `src/views/SettingsView.tsx`
  - `src/components/settings/`
- PWA/red:
  - `src/main.tsx`
  - `src/App.tsx`
  - `src/contexts/NetworkStatusContext.tsx`
  - `public/sw.js`
  - `public/offline.html`

## 8. Checklist Pre-Cambio

- Confirmar dominio afectado.
- Confirmar si toca frontend, SQL o ambos.
- Confirmar impacto en tipos.
- Confirmar impacto en permisos.
- Si afecta mutaciones, revisar comportamiento online/offline.

## 9. Checklist Post-Cambio

Ejecutar:

```bash
npm run lint
```

Si el cambio es amplio:

```bash
npm run build
```

Además:

- revisar UX de error si cambias una mutación
- revisar que no queden imports/variables sin uso
- revisar que la app siga siendo coherente en iPhone/PWA si tocas shell, layout o service worker

## 10. Estado De Riesgos Técnicos

- No hay suite de tests automatizados todavía.
- La seguridad depende fuertemente de RLS correcta.
- El bundle ya mejoró, pero aún hay vendor pesado compartido.
- La app no tiene soporte offline colaborativo, por diseño.

## 11. Resumen Esperado Al Finalizar

Al reportar una contribución, incluir:

1. Objetivo del cambio.
2. Archivos tocados y por qué.
3. Riesgos y mitigaciones.
4. Validaciones ejecutadas.
5. Pendientes o follow-ups.

## 12. Inicio Rápido Para Agentes

1. Leer `README.md`.
2. Leer este archivo completo.
3. Revisar `src/App.tsx` y `src/contexts/AuthContext.tsx`.
4. Revisar el provider/hook/capa `lib/*Data.ts` del dominio a tocar.
5. Revisar `supabase/` si hay impacto de datos o permisos.
