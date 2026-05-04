# Arquitectura Base Actual

## Flujos críticos

1. `src/main.tsx` monta `AuthProvider` y el shell principal.
2. `src/contexts/AuthContext.tsx` resuelve sesión, perfil, `householdId` y `memberId`.
3. `src/App.tsx` decide entre:
   - `AuthView`
   - `OnboardingView`
   - shell autenticado con tabs
4. Los dominios cargan datos desde hooks:
   - `useTransactions`
   - `usePets`
   - `useTasks`
   - `useSettings`

## Riesgos actuales

- `App.tsx` sigue siendo el orquestador de casi toda la data del cliente.
- La app dependía de recargas por `window.focus` para refrescar varios dominios.
- Hay drift entre SQL del repo y snapshot vivo de Supabase.
- No existe una suite automatizada que proteja los flujos principales.
- La PWA era solo un manifest básico; no existía service worker ni shell offline.

## Dependencias críticas

- Vercel: hosting/build de la SPA.
- Supabase: auth, PostgreSQL y RLS.
- RPCs críticas:
  - `bootstrap_household`
  - `accept_invitation`
  - `get_household_profiles`
  - `get_household_member_profiles`

## Criterios de mantenimiento

- Toda regla de aislamiento por `household` debe estar garantizada por backend.
- Los artefactos `schema.sql`, `rls_setup.sql` y snapshots vivos deben reconciliarse periódicamente.
- Los cambios PWA no deben cachear respuestas sensibles ni mutaciones de negocio sin estrategia explícita.
