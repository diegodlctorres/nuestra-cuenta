# Nuestra Cuenta

Aplicacion web para la gestion financiera compartida de pareja, con modulos de transacciones, tareas del hogar y mascotas. El proyecto esta construido con React + TypeScript y usa Supabase para autenticacion y persistencia de datos.

## Objetivo De Producto

Nuestra Cuenta centraliza la operacion diaria de un hogar en tres ejes:

- Finanzas compartidas: ingresos, gastos, cuentas y categorias.
- Organizacion del hogar: tareas con vencimiento y exportacion a calendario.
- Cuidado de mascotas: registro de mascotas y tareas programadas por mascota.

## Alcance Funcional

- Autenticacion y onboarding de hogar:
    - Registro/login con Supabase Auth.
    - Creacion de hogar mediante RPC `create_household_and_insert_admin`.
    - Union a hogar por codigo con RPC `accept_invitation`.
- Dashboard:
    - Resumen de cuentas y balance por cuenta.
    - Alta rapida de transacciones.
    - Contador de tareas de mascota pendientes.
- Detalle financiero:
    - Historial de transacciones por cuenta.
    - Agrupacion por ingresos, gastos fijos y gastos variables.
- Mascotas:
    - CRUD de mascotas.
    - Programacion y marcado de tareas por mascota.
- Tareas del hogar:
    - Alta de tareas con deadline.
    - Marcado de completadas.
    - Exportacion de recordatorio en formato ICS.
- Configuracion:
    - Gestion de pareja (localStorage), cuentas y categorias.
    - Gestion de invitaciones de pareja.
    - Selector de tema visual.

## Arquitectura En Alto Nivel

SPA basada en tabs con cinco vistas principales:

1. `dashboard`
2. `detail`
3. `pets`
4. `tasks`
5. `settings`

Flujo principal:

1. `AuthProvider` determina sesion, perfil y `householdId`.
2. Si no hay sesion, muestra `AuthView`.
3. Si hay sesion sin household activo, muestra `OnboardingView`.
4. Con household activo, se habilitan hooks por dominio:
    - `useTransactions`
    - `usePets`
    - `useTasks`
    - `useSettings`
5. Cada hook consulta/actualiza Supabase y expone operaciones CRUD a las vistas.

## Stack Tecnologico

### Frontend

- React 19
- TypeScript 5
- Vite 6
- Tailwind CSS 4
- Motion (animaciones)
- Lucide React (iconos)
- date-fns (fechas)

### Backend/Persistencia

- Supabase (Auth + PostgreSQL + Storage)
- `@supabase/supabase-js`
- SQL de esquema y migraciones en carpeta `supabase/`

### Herramientas

- `tsc --noEmit` como validacion de tipos (`npm run lint`)
- Scripts npm para desarrollo y build

## Estructura Del Proyecto

```text
.
|-- index.html
|-- LICENSE
|-- metadata.json
|-- package.json
|-- README.md
|-- tsconfig.json
|-- vite.config.ts
|-- AGENTS.md
|-- public/
|   `-- manifest.json
|-- src/
|   |-- App.tsx
|   |-- index.css
|   |-- main.tsx
|   |-- types.ts
|   |-- vite-env.d.ts
|   |-- components/
|   |   |-- pets/
|   |   |   |-- AddPetForm.tsx
|   |   |   |-- AddPetTaskForm.tsx
|   |   |   `-- EditPetModal.tsx
|   |   |-- settings/
|   |   |   |-- AccountManager.tsx
|   |   |   |-- CategoryManager.tsx
|   |   |   |-- CoupleSettingsModal.tsx
|   |   |   |-- InvitePartnerModal.tsx
|   |   |   `-- PartnerForm.tsx
|   |   |-- tasks/
|   |   |   `-- AddTaskForm.tsx
|   |   |-- transactions/
|   |   |   |-- AddTransactionForm.tsx
|   |   |   |-- MonthlyBalanceButton.tsx
|   |   |   |-- TransactionGroup.tsx
|   |   |   `-- TransactionItem.tsx
|   |   `-- ui/
|   |       |-- Modal.tsx
|   |       `-- NavButton.tsx
|   |-- contexts/
|   |   `-- AuthContext.tsx
|   |-- hooks/
|   |   |-- usePets.ts
|   |   |-- useSettings.ts
|   |   |-- useTasks.ts
|   |   `-- useTransactions.ts
|   |-- lib/
|   |   |-- errors.ts
|   |   |-- supabase.ts
|   |   `-- utils.ts
|   `-- views/
|       |-- AuthView.tsx
|       |-- DashboardView.tsx
|       |-- DetailView.tsx
|       |-- OnboardingView.tsx
|       |-- PetsView.tsx
|       |-- SettingsView.tsx
|       `-- TasksView.tsx
`-- supabase/
    |-- accounts.sql
    |-- bootstrap_household.sql
    |-- phase2_invitations.sql
    |-- reset_data.sql
    |-- rls_setup.sql
    |-- schema_updates.sql
    `-- schema.sql
```

## Modelo De Datos (Resumen)

Entidades centrales:

- `profiles`
- `households`
- `household_members`
- `household_invitations`
- `accounts`
- `categories`
- `transactions`
- `pets`
- `pet_tasks`
- `tasks`

Enums relevantes:

- `transaction_type`: income, expense, transfer
- `recurrence_type`: none, fixed, variable
- `account_type`: savings, checking
- `member_role`: admin, member
- `invitation_status`: pending, accepted, expired, revoked

## Seguridad Y RLS

- RLS esta habilitado en tablas principales.
- Existen politicas implementadas para `profiles`, `households`, `household_members` e invitaciones.
- Recomendacion de contribucion: cualquier cambio de esquema debe incluir politicas RLS explicitas para lectura/escritura por household.

## Requisitos Y Puesta En Marcha

### Prerrequisitos

- Node.js 18+
- Proyecto Supabase configurado

### Variables De Entorno

Crear `.env.local` con:

```bash
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
VITE_SUPABASE_PUBLISHABLE_KEY=TU_SUPABASE_PUBLISHABLE_KEY
GEMINI_API_KEY=TU_GEMINI_API_KEY
```

### Comandos

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

Scripts disponibles (fuente: `package.json`):

- `dev`: inicia Vite en `0.0.0.0:3000`.
- `build`: build de produccion.
- `preview`: previsualiza el build local.
- `clean`: limpia `dist`.
- `lint`: chequeo de tipos con TypeScript.

## Convenciones De Contribucion

- Mantener consistencia de tipos en `src/types.ts` cuando se cambie SQL.
- Si se agrega funcionalidad de dominio, priorizar hook dedicado en `src/hooks/`.
- Evitar logica de permisos en UI sin respaldo en RLS o RPC segura.
- No exponer secretos en cliente.

## Ruta Recomendada Para Nuevos Contribuidores

1. Leer este README de principio a fin.
2. Revisar `src/App.tsx` para entender navegacion y composicion de vistas.
3. Revisar `src/contexts/AuthContext.tsx` para flujo de sesion y household.
4. Revisar hooks de dominio en `src/hooks/`.
5. Revisar esquema y funciones SQL en `supabase/`.

## Guia Para IA Y Agentes

Para contribucion asistida por IA, consulta `AGENTS.md`.

Ese documento incluye:

- Contexto de negocio y reglas operativas.
- Mapa tecnico por capas.
- Protocolo de cambios por tipo de tarea.
- Checklists pre y post cambio para minimizar regresiones.

## Estado Actual De Calidad

- Hay validacion de tipos via TypeScript.
- Actualmente no hay suite de tests automatizados integrada en el repo.

## Licencia

Proyecto bajo licencia definida en `LICENSE`.
