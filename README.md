# Sistema de Control de Asistencia y Nómina

Sistema profesional completo para gestión de asistencia de empleados, control de adelantos de sueldo y generación automática de nómina.

## Características Principales

- **Reloj Checador Digital**: Interfaz táctil optimizada para tablets y computadoras
- **Flujo Automático**: Sistema inteligente que determina automáticamente el tipo de registro (entrada/salida/comida)
- **Control de Adelantos**: Modo exclusivo para personal de caja
- **Nómina Automática**: Generación de nómina con cálculo automático y descuentos manuales
- **Multisucursal**: Gestión de múltiples sucursales con control independiente
- **Reportes Detallados**: Reportes de asistencia, adelantos y nómina exportables a CSV
- **Seguridad y Auditoría**: Registro completo de todas las acciones administrativas
- **Base de Datos Segura**: Toda la información guardada en Supabase con respaldos automáticos

## Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **Estilos**: Tailwind CSS
- **Base de Datos**: Supabase (PostgreSQL)
- **Iconos**: Lucide React
- **Build**: Vite

## Requisitos Previos

- Node.js 18 o superior
- npm o yarn
- Cuenta de Supabase (gratuita disponible)

## Instalación

### 1. Clonar o Descargar el Proyecto

```bash
# Si tienes git
git clone [url-del-proyecto]
cd [nombre-del-proyecto]
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

El archivo `.env` ya está configurado con las credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://eeykghwfhgkvbejvdiqx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Ejecutar Migraciones de Base de Datos

Las migraciones ya se aplicaron automáticamente. La base de datos incluye:

- `branches` - Sucursales
- `employees` - Empleados
- `attendance_records` - Registros de asistencia
- `salary_advances` - Adelantos de sueldo
- `payroll` - Nómina
- `audit_log` - Registro de auditoría

### 5. (Opcional) Insertar Datos de Prueba

Puedes insertar datos de prueba usando el archivo `DATOS_DE_PRUEBA.sql`:

1. Abre Supabase Dashboard
2. Ve a SQL Editor
3. Copia y pega el contenido de `DATOS_DE_PRUEBA.sql`
4. Ejecuta las consultas

### 6. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Estructura del Proyecto

```
src/
├── components/
│   ├── ClockScreen.tsx         # Pantalla principal de checador
│   ├── AdminLogin.tsx          # Login de administrador
│   ├── AdminPanel.tsx          # Panel de administración
│   ├── CashLogin.tsx           # Login de modo caja
│   ├── CashMode.tsx            # Modo caja para adelantos
│   └── admin/
│       ├── BranchManagement.tsx      # Gestión de sucursales
│       ├── EmployeeManagement.tsx    # Gestión de empleados
│       ├── AdvancesView.tsx          # Vista de adelantos
│       ├── PayrollGeneration.tsx     # Generación de nómina
│       └── Reports.tsx               # Reportes
├── lib/
│   └── supabase.ts             # Cliente de Supabase
├── types/
│   └── index.ts                # Tipos TypeScript
├── App.tsx                     # Componente principal
└── main.tsx                    # Punto de entrada
```

## Base de Datos

### Esquema de Tablas

#### `branches` (Sucursales)
- `id` (UUID): ID único
- `name` (Text): Nombre de la sucursal
- `cash_pin` (Text): PIN de 6 dígitos para modo caja
- `created_at` (Timestamp): Fecha de creación

#### `employees` (Empleados)
- `id` (UUID): ID único
- `branch_id` (UUID): ID de la sucursal
- `name` (Text): Nombre completo
- `position` (Text): Puesto
- `pin` (Text): PIN de 4 dígitos (único)
- `payment_type` (Text): 'daily' o 'weekly'
- `base_salary` (Decimal): Sueldo base
- `is_active` (Boolean): Empleado activo
- `created_at` (Timestamp): Fecha de creación

#### `attendance_records` (Registros de Asistencia)
- `id` (UUID): ID único
- `employee_id` (UUID): ID del empleado
- `branch_id` (UUID): ID de la sucursal
- `record_type` (Text): 'entry', 'exit', 'lunch_start', 'lunch_end'
- `recorded_at` (Timestamp): Fecha y hora del registro
- `created_at` (Timestamp): Fecha de creación

#### `salary_advances` (Adelantos)
- `id` (UUID): ID único
- `employee_id` (UUID): ID del empleado
- `branch_id` (UUID): ID de la sucursal
- `amount` (Decimal): Monto del adelanto
- `reason` (Text): Motivo
- `recorded_at` (Timestamp): Fecha y hora del adelanto
- `created_at` (Timestamp): Fecha de creación

#### `payroll` (Nómina)
- `id` (UUID): ID único
- `employee_id` (UUID): ID del empleado
- `branch_id` (UUID): ID de la sucursal
- `period_start` (Date): Inicio del periodo
- `period_end` (Date): Fin del periodo
- `base_salary` (Decimal): Sueldo base del periodo
- `days_worked` (Integer): Días trabajados
- `total_advances` (Decimal): Total de adelantos
- `manual_deductions` (Decimal): Descuentos manuales
- `deduction_reason` (Text): Razón de descuentos
- `total_to_pay` (Decimal): Total a pagar
- `status` (Text): 'draft', 'confirmed', 'paid'
- `generated_by` (Text): Generado por
- `created_at` (Timestamp): Fecha de creación
- `updated_at` (Timestamp): Fecha de actualización

#### `audit_log` (Auditoría)
- `id` (UUID): ID único
- `action` (Text): Acción realizada
- `details` (JSONB): Detalles de la acción
- `created_at` (Timestamp): Fecha de creación

## Códigos de Acceso

### Código de Administrador
```
728654
```

Este código está hardcodeado en `src/components/AdminLogin.tsx`.

Para cambiarlo, modifica la constante `ADMIN_PIN`:

```typescript
const ADMIN_PIN = '728654'; // Cambia este valor
```

### PINs de Sucursal (Modo Caja)

Los PINs de sucursal se definen al crear cada sucursal en el Panel Admin. Deben ser de 6 dígitos.

### PINs de Empleados

Los PINs de empleados se definen al crear cada empleado en el Panel Admin. Deben ser de 4 dígitos y únicos.

## Flujo de Uso

### 1. Pantalla de Checador (Principal)

Esta es la pantalla inicial. Los empleados ingresan su PIN de 4 dígitos para registrar asistencia.

El sistema determina automáticamente qué tipo de registro hacer basándose en el último registro del empleado.

### 2. Acceso al Panel Admin

Clic en el ícono de engrane → Ingresa código 728654

Desde aquí puedes:
- Gestionar sucursales
- Gestionar empleados
- Ver adelantos
- Generar nómina
- Ver reportes

### 3. Acceso al Modo Caja

Clic en el ícono de dólar → Ingresa PIN de sucursal (6 dígitos)

Desde aquí puedes:
- Registrar adelantos para empleados de la sucursal

## Generación de Nómina

### Proceso

1. **Seleccionar sucursal y periodo**
2. **Calcular nómina**: El sistema calcula automáticamente:
   - Sueldo base según tipo de pago
   - Días trabajados
   - Total de adelantos del periodo
3. **Revisar alertas**:
   - Faltas detectadas
   - Registros incompletos
4. **Aplicar descuentos manuales**: Para faltas u otros conceptos
5. **Confirmar y guardar**: La nómina se guarda en la base de datos

### Cálculo Automático

- **Tipo Diario**: Sueldo base × días del periodo
- **Tipo Semanal**: Sueldo base × (1 o 2 según sea semanal o quincenal)
- **Días Trabajados**: Cuenta días únicos con registro de entrada
- **Faltas**: Detecta días sin registro (excluyendo domingos)
- **Total a Pagar**: Sueldo base - Adelantos - Descuentos manuales

## Seguridad

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas que permiten acceso público para el funcionamiento de la aplicación.

**Nota**: En un ambiente de producción, se recomienda implementar autenticación de usuario y políticas RLS más restrictivas.

### Auditoría

Todas las acciones importantes se registran en `audit_log`:
- Creación/edición/eliminación de sucursales
- Creación/edición/desactivación de empleados
- Generación de nómina

## Build para Producción

```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`.

## Personalización

### Cambiar Colores

Edita `tailwind.config.js` para personalizar la paleta de colores.

### Cambiar Código de Admin

Edita `src/components/AdminLogin.tsx`:

```typescript
const ADMIN_PIN = 'TU_NUEVO_CODIGO';
```

### Agregar Campos a Empleados

1. Actualiza la migración de base de datos
2. Actualiza los tipos en `src/types/index.ts`
3. Actualiza el formulario en `src/components/admin/EmployeeManagement.tsx`

## Soporte y Documentación

- **Manual de Usuario**: Ver `MANUAL_DE_USO.md`
- **Datos de Prueba**: Ver `DATOS_DE_PRUEBA.sql`

## Licencia

Este es un sistema privado desarrollado para uso específico del negocio.

---

**Desarrollado con React + TypeScript + Supabase**
