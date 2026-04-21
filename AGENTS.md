# AGENTS.md - Guia De Contribucion Para IA

Este documento define el contexto completo para que cualquier IA o agente pueda contribuir de forma segura y consistente en este proyecto.

## 1. Contexto De Negocio

### 1.1 Que Resuelve El Producto

Nuestra Cuenta es una aplicacion para gestion compartida de pareja. Su unidad de colaboracion es el `household`.

Dominios funcionales:

- Finanzas: cuentas, categorias y transacciones.
- Mascotas: registro y tareas programadas.
- Tareas del hogar: pendientes con fecha limite.
- Configuracion: datos de pareja, tema e invitaciones.

### 1.2 Actores

- Usuario autenticado: opera en su household activo.
- Admin de household: puede gestionar elementos administrativos (incluye invitaciones).
- Miembro de household: opera datos del hogar segun politicas.

### 1.3 Conceptos De Dominio

- Household: espacio compartido de pareja.
- Household member: membresia de un perfil en un household con rol y estado.
- Account: cuenta financiera de tipo checking o savings.
- Category: clasificacion de ingreso o gasto.
- Transaction: movimiento economico con tipo y recurrencia.
- Pet y PetTask: entidad mascota y sus tareas.
- Task: tarea general del hogar con deadline.
- Household invitation: token para unir un usuario a un household.

### 1.4 Reglas Importantes

- Cada operacion de negocio debe estar acotada al `household_id` actual.
- `bootstrap_household` crea cuentas y categorias base de forma idempotente.
- Las invitaciones usan token con expiracion y estado.
- En transacciones, `created_by` referencia `household_members.id`, no `profiles.id`.

## 2. Arquitectura Tecnica

### 2.1 Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS.
- Estado y datos: hooks custom + AuthContext.
- Backend de datos: Supabase (Auth, PostgreSQL, Storage).
- SQL y migraciones: carpeta `supabase/`.

### 2.2 Flujo De Aplicacion

1. `src/main.tsx` monta `AuthProvider` y `App`.
2. `src/contexts/AuthContext.tsx` resuelve sesion, perfil, household y memberId.
3. `src/App.tsx` decide:
    - Sin sesion -> `AuthView`
    - Con sesion sin household -> `OnboardingView`
    - Con household -> vistas de negocio por tabs
4. Hooks por dominio realizan lecturas/escrituras en Supabase:
    - `src/hooks/useTransactions.ts`
    - `src/hooks/usePets.ts`
    - `src/hooks/useTasks.ts`
    - `src/hooks/useSettings.ts`

### 2.3 Capas Del Frontend

- Vistas (`src/views/`): composicion de cada seccion.
- Componentes (`src/components/`): formularios, modales y elementos reutilizables.
- Hooks (`src/hooks/`): logica de consulta y mutaciones.
- Contextos (`src/contexts/`): estado global de auth y household.
- Utilidades (`src/lib/`): cliente Supabase, utilidades de UI y manejo de errores.
- Tipos (`src/types.ts`): contrato de entidades y enums para toda la app.

### 2.4 Persistencia Y Seguridad

Fuentes SQL clave:

- `supabase/schema.sql`: tipos, tablas, triggers y funciones nucleares.
- `supabase/bootstrap_household.sql`: sembrado inicial de cuentas/categorias.
- `supabase/phase2_invitations.sql`: politica y RPC para aceptar invitaciones.
- `supabase/rls_setup.sql`: politicas RLS.

Principio: no introducir cambios de negocio en frontend sin respaldo en SQL/RLS/RPC.

## 3. Guia Operativa Para Contribucion IA

### 3.1 Flujo De Trabajo Recomendado

1. Entender requerimiento y mapear dominio afectado.
2. Localizar archivos fuente de verdad (hook, vista, SQL, tipos).
3. Diseñar cambio minimo y coherente con patrones existentes.
4. Aplicar edicion puntual.
5. Validar tipos y build cuando aplique.
6. Documentar impacto y riesgos.

### 3.2 Mapa De Archivos Por Tipo De Tarea

- Auth/sesion/household: `src/contexts/AuthContext.tsx`, `src/views/AuthView.tsx`, `src/views/OnboardingView.tsx`.
- Transacciones/cuentas/categorias: `src/hooks/useTransactions.ts`, `src/components/transactions/`, `src/components/settings/AccountManager.tsx`, `src/components/settings/CategoryManager.tsx`.
- Mascotas y tareas de mascota: `src/hooks/usePets.ts`, `src/views/PetsView.tsx`, `src/components/pets/`.
- Tareas generales: `src/hooks/useTasks.ts`, `src/views/TasksView.tsx`, `src/components/tasks/`.
- Configuracion de pareja y tema: `src/hooks/useSettings.ts`, `src/components/settings/CoupleSettingsModal.tsx`.
- Modelo de datos: `src/types.ts`, `supabase/*.sql`.

### 3.3 Contratos Y Dependencias Criticas

- Si cambias columnas/tablas SQL, actualiza tipos en `src/types.ts`.
- Si cambias naming o shape de datos, revisa joins en hooks.
- Si cambias permisos de negocio, define o ajusta politicas RLS.
- Si agregas RPC, documenta firma, retorno y errores esperados.

## 4. Guardrails (No Romper)

- No romper aislamiento por household.
- No quitar restricciones de seguridad sin alternativa equivalente.
- No asumir permisos de admin en cliente sin validacion en backend.
- No introducir secretos hardcodeados.
- No cambiar APIs publicas internas (props o contratos de hooks) sin actualizar todos los consumidores.

## 5. Checklist Pre-Cambio

- Confirmar dominio impactado y archivos objetivo.
- Confirmar que el cambio necesita SQL, frontend o ambos.
- Confirmar impacto en tipos y joins.
- Confirmar impacto en permisos (RLS/politicas).

## 6. Checklist Post-Cambio

- Ejecutar validacion de tipos:

```bash
npm run lint
```

- Si hubo cambios amplios, verificar build:

```bash
npm run build
```

- Revisar manualmente flujos afectados en UI.
- Confirmar que no quedaron imports/variables sin uso.
- Confirmar mensajes de error legibles para usuario final.

## 7. Estilo De Implementacion Esperado

- Cambios pequenos y enfocados.
- Reutilizar patrones existentes de hooks y componentes.
- Mantener naming consistente (PascalCase componentes, camelCase funciones/variables).
- Preferir claridad sobre ingenieria excesiva.

## 8. Riesgos Tecnicos Conocidos

- Cobertura de tests automatizados no establecida en repo.
- Dependencia fuerte de RLS para seguridad de datos.
- Cargas completas de datos en hooks pueden escalar mal con volumen alto.

## 9. Plantilla De Resumen De PR Para Agentes

Al finalizar una contribucion, reportar:

1. Objetivo del cambio.
2. Archivos tocados y por que.
3. Riesgos y mitigaciones.
4. Validaciones ejecutadas (`npm run lint`, `npm run build`, pruebas manuales).
5. Pendientes o follow-ups recomendados.

## 10. Inicio Rapido Para Agentes

1. Leer `README.md`.
2. Leer este archivo completo.
3. Abrir `src/App.tsx` y `src/contexts/AuthContext.tsx`.
4. Ir al hook del dominio a modificar.
5. Revisar SQL asociado en `supabase/` antes de tocar logica sensible.
