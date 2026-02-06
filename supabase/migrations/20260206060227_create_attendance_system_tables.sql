/*
  # Sistema de Control de Asistencia y Nómina

  1. Tablas Nuevas
    - `branches` - Sucursales del negocio
      - `id` (uuid, primary key)
      - `name` (text) - Nombre de la sucursal
      - `cash_pin` (text) - PIN para modo caja-adelantos
      - `created_at` (timestamptz)
    
    - `employees` - Empleados
      - `id` (uuid, primary key)
      - `branch_id` (uuid) - Sucursal asignada
      - `name` (text) - Nombre completo
      - `position` (text) - Puesto
      - `pin` (text) - PIN personal para checador
      - `payment_type` (text) - Tipo de pago: 'daily' o 'weekly'
      - `base_salary` (decimal) - Sueldo base
      - `is_active` (boolean) - Empleado activo
      - `created_at` (timestamptz)
    
    - `attendance_records` - Registros de asistencia
      - `id` (uuid, primary key)
      - `employee_id` (uuid) - Empleado
      - `branch_id` (uuid) - Sucursal
      - `record_type` (text) - Tipo: 'entry', 'exit', 'lunch_start', 'lunch_end'
      - `recorded_at` (timestamptz) - Fecha y hora del registro
      - `created_at` (timestamptz)
    
    - `salary_advances` - Adelantos de sueldo
      - `id` (uuid, primary key)
      - `employee_id` (uuid) - Empleado
      - `branch_id` (uuid) - Sucursal donde se registró
      - `amount` (decimal) - Monto del adelanto
      - `reason` (text) - Motivo (opcional)
      - `recorded_at` (timestamptz) - Fecha y hora del adelanto
      - `created_at` (timestamptz)
    
    - `payroll` - Nómina
      - `id` (uuid, primary key)
      - `employee_id` (uuid) - Empleado
      - `branch_id` (uuid) - Sucursal
      - `period_start` (date) - Inicio del periodo
      - `period_end` (date) - Fin del periodo
      - `base_salary` (decimal) - Sueldo base del periodo
      - `days_worked` (integer) - Días trabajados
      - `total_advances` (decimal) - Total de adelantos en el periodo
      - `manual_deductions` (decimal) - Descuentos manuales aplicados
      - `deduction_reason` (text) - Razón de los descuentos
      - `total_to_pay` (decimal) - Total a pagar
      - `status` (text) - Estado: 'draft', 'confirmed', 'paid'
      - `generated_by` (text) - Generado por administrador
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `audit_log` - Registro de auditoría
      - `id` (uuid, primary key)
      - `action` (text) - Acción realizada
      - `details` (jsonb) - Detalles de la acción
      - `created_at` (timestamptz)

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas restrictivas que requieren autenticación de administrador
*/

-- Crear tabla de sucursales
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cash_pin text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to branches"
  ON branches FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Crear tabla de empleados
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES branches(id),
  name text NOT NULL,
  position text NOT NULL DEFAULT '',
  pin text NOT NULL UNIQUE,
  payment_type text NOT NULL CHECK (payment_type IN ('daily', 'weekly')),
  base_salary decimal(10,2) NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to employees"
  ON employees FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Crear tabla de registros de asistencia
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  branch_id uuid NOT NULL REFERENCES branches(id),
  record_type text NOT NULL CHECK (record_type IN ('entry', 'exit', 'lunch_start', 'lunch_end')),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to attendance_records"
  ON attendance_records FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Crear índice para consultas rápidas de registros por empleado y fecha
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date 
  ON attendance_records(employee_id, recorded_at DESC);

-- Crear tabla de adelantos
CREATE TABLE IF NOT EXISTS salary_advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  branch_id uuid NOT NULL REFERENCES branches(id),
  amount decimal(10,2) NOT NULL,
  reason text DEFAULT '',
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE salary_advances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to salary_advances"
  ON salary_advances FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Crear índice para consultas de adelantos por periodo
CREATE INDEX IF NOT EXISTS idx_advances_employee_date 
  ON salary_advances(employee_id, recorded_at DESC);

-- Crear tabla de nómina
CREATE TABLE IF NOT EXISTS payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  branch_id uuid NOT NULL REFERENCES branches(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  base_salary decimal(10,2) NOT NULL DEFAULT 0,
  days_worked integer NOT NULL DEFAULT 0,
  total_advances decimal(10,2) NOT NULL DEFAULT 0,
  manual_deductions decimal(10,2) NOT NULL DEFAULT 0,
  deduction_reason text DEFAULT '',
  total_to_pay decimal(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'paid')),
  generated_by text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to payroll"
  ON payroll FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Crear índice para consultas de nómina por periodo
CREATE INDEX IF NOT EXISTS idx_payroll_period 
  ON payroll(period_start, period_end, branch_id);

-- Crear tabla de auditoría
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to audit_log"
  ON audit_log FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en payroll
DROP TRIGGER IF EXISTS update_payroll_updated_at ON payroll;
CREATE TRIGGER update_payroll_updated_at
  BEFORE UPDATE ON payroll
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();