# Supabase

Esta carpeta sigue ahora un modelo `live-first`.

## Fuente de verdad actual

La referencia principal del estado de la base es `supabase/live/`.

Archivos principales:

- `live/schema_live.sql`
- `live/rls_live.json`
- `live/public_rls_status.md`
- `live/functions_live.json`
- `live/extract_live_snapshot.sql`

Interpretación:

- `schema_live.sql`: snapshot completo del esquema real
- `rls_live.json`: políticas RLS extraídas de la base real
- `public_rls_status.md`: estado de tablas públicas con RLS activo/forzado
- `functions_live.json`: snapshot de funciones/RPC públicas
- `extract_live_snapshot.sql`: consultas auxiliares para refrescar snapshots

## Histórico

### `archive/legacy_repo/`

Contiene la antigua “fuente de verdad” del repo, hoy considerada desactualizada:

- `schema.sql`
- `rls_setup.sql`
- `bootstrap_household.sql`
- `phase2_invitations.sql`
- `household_profiles.sql`
- `household_member_profiles.sql`

No deben usarse como referencia principal mientras no se reconcilien con `live/`.

### `archive/`

Contiene parches y scripts históricos ya absorbidos o archivados.

## Cómo refrescar la data de `live/`

### Requisito

Disponer de una conexión segura a Supabase mediante `DATABASE_URL` o equivalente.

### 1. Esquema completo

PowerShell:

```powershell
pg_dump "$env:DATABASE_URL" --schema-only --no-owner --no-privileges > .\supabase\live\schema_live.sql
```

### 2. Políticas RLS

Ejecuta el bloque 1 de `live/extract_live_snapshot.sql` y exporta el resultado a:

- `supabase/live/rls_live.json`

### 3. Estado de RLS en tablas públicas

Ejecuta el bloque 2 de `live/extract_live_snapshot.sql` y guarda el resultado en:

- `supabase/live/public_rls_status.md`

### 4. Funciones públicas / RPC

Ejecuta el bloque 3 de `live/extract_live_snapshot.sql` y exporta el resultado a:

- `supabase/live/functions_live.json`

### 5. Tipos TypeScript opcionales

Si quieres snapshot tipado de la base:

```powershell
supabase gen types typescript --db-url "$env:DATABASE_URL" > .\supabase\live\types_live.ts
```

## Reglas importantes

- No guardar credenciales reales en esta carpeta.
- No volver a crear archivos de consulta con secrets embebidos.
- Si una credencial fue expuesta, rotarla en Supabase.
- Si en el futuro quieres volver a tener una fuente consolidada en raíz, primero reconcíliala contra `live/`.
