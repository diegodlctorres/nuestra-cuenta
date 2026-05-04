-- Ejecutar contra la base real para refrescar los artefactos locales de auditoría.

-- 1. Políticas RLS
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 2. Tablas con RLS activado
select
  schemaname,
  tablename,
  rowsecurity,
  forcerowsecurity
from pg_tables
join pg_class on pg_class.relname = pg_tables.tablename
join pg_namespace on pg_namespace.nspname = pg_tables.schemaname
  and pg_namespace.oid = pg_class.relnamespace
where schemaname = 'public'
order by tablename;

-- 3. Funciones públicas / RPC
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;
