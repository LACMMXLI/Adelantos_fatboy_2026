-- DATOS DE PRUEBA PARA EL SISTEMA
-- Ejecuta estos comandos en el Panel Admin de Supabase o usa la herramienta SQL de Supabase

-- IMPORTANTE: Estos son datos de ejemplo. Puedes modificarlos según tus necesidades.

-- ============================================
-- 1. CREAR SUCURSALES DE PRUEBA
-- ============================================

-- Sucursal 1: Centro
-- PIN de Caja: 111111
INSERT INTO branches (name, cash_pin) VALUES
('Sucursal Centro', '111111');

-- Sucursal 2: Norte
-- PIN de Caja: 222222
INSERT INTO branches (name, cash_pin) VALUES
('Sucursal Norte', '222222');

-- ============================================
-- 2. CREAR EMPLEADOS DE PRUEBA
-- ============================================

-- Nota: Necesitas el ID de las sucursales. Si ya creaste sucursales manualmente,
-- reemplaza estos IDs con los correctos.

-- Para obtener los IDs de tus sucursales, ejecuta:
-- SELECT id, name FROM branches;

-- Empleado 1: Juan Pérez (Sucursal Centro)
-- PIN: 1234
-- Tipo: Diario ($350 por día)
INSERT INTO employees (branch_id, name, position, pin, payment_type, base_salary, is_active)
SELECT
  id,
  'Juan Pérez',
  'Vendedor',
  '1234',
  'daily',
  350.00,
  true
FROM branches WHERE name = 'Sucursal Centro' LIMIT 1;

-- Empleado 2: María González (Sucursal Centro)
-- PIN: 2345
-- Tipo: Semanal ($2800 por semana)
INSERT INTO employees (branch_id, name, position, pin, payment_type, base_salary, is_active)
SELECT
  id,
  'María González',
  'Cajera',
  '2345',
  'weekly',
  2800.00,
  true
FROM branches WHERE name = 'Sucursal Centro' LIMIT 1;

-- Empleado 3: Carlos Ramírez (Sucursal Norte)
-- PIN: 3456
-- Tipo: Diario ($400 por día)
INSERT INTO employees (branch_id, name, position, pin, payment_type, base_salary, is_active)
SELECT
  id,
  'Carlos Ramírez',
  'Gerente',
  '3456',
  'daily',
  400.00,
  true
FROM branches WHERE name = 'Sucursal Norte' LIMIT 1;

-- Empleado 4: Ana Martínez (Sucursal Norte)
-- PIN: 4567
-- Tipo: Semanal ($2500 por semana)
INSERT INTO employees (branch_id, name, position, pin, payment_type, base_salary, is_active)
SELECT
  id,
  'Ana Martínez',
  'Vendedora',
  '4567',
  'weekly',
  2500.00,
  true
FROM branches WHERE name = 'Sucursal Norte' LIMIT 1;

-- ============================================
-- 3. CREAR REGISTROS DE ASISTENCIA DE PRUEBA
-- ============================================

-- Registros de ejemplo para Juan Pérez (los últimos 7 días)
-- Día 1: Entrada y Salida completa
INSERT INTO attendance_records (employee_id, branch_id, record_type, recorded_at)
SELECT
  e.id,
  e.branch_id,
  'entry',
  NOW() - INTERVAL '6 days' + INTERVAL '8 hours'
FROM employees e WHERE e.pin = '1234';

INSERT INTO attendance_records (employee_id, branch_id, record_type, recorded_at)
SELECT
  e.id,
  e.branch_id,
  'lunch_start',
  NOW() - INTERVAL '6 days' + INTERVAL '13 hours'
FROM employees e WHERE e.pin = '1234';

INSERT INTO attendance_records (employee_id, branch_id, record_type, recorded_at)
SELECT
  e.id,
  e.branch_id,
  'lunch_end',
  NOW() - INTERVAL '6 days' + INTERVAL '14 hours'
FROM employees e WHERE e.pin = '1234';

INSERT INTO attendance_records (employee_id, branch_id, record_type, recorded_at)
SELECT
  e.id,
  e.branch_id,
  'exit',
  NOW() - INTERVAL '6 days' + INTERVAL '18 hours'
FROM employees e WHERE e.pin = '1234';

-- Día 2: Solo entrada (registro incompleto para demostración)
INSERT INTO attendance_records (employee_id, branch_id, record_type, recorded_at)
SELECT
  e.id,
  e.branch_id,
  'entry',
  NOW() - INTERVAL '5 days' + INTERVAL '8 hours'
FROM employees e WHERE e.pin = '1234';

-- Día 3: Falta (no hay registros)

-- Día 4: Entrada y Salida completa
INSERT INTO attendance_records (employee_id, branch_id, record_type, recorded_at)
SELECT
  e.id,
  e.branch_id,
  'entry',
  NOW() - INTERVAL '3 days' + INTERVAL '8 hours'
FROM employees e WHERE e.pin = '1234';

INSERT INTO attendance_records (employee_id, branch_id, record_type, recorded_at)
SELECT
  e.id,
  e.branch_id,
  'exit',
  NOW() - INTERVAL '3 days' + INTERVAL '17 hours'
FROM employees e WHERE e.pin = '1234';

-- ============================================
-- 4. CREAR ADELANTOS DE PRUEBA
-- ============================================

-- Adelanto 1: Juan Pérez - $500
INSERT INTO salary_advances (employee_id, branch_id, amount, reason, recorded_at)
SELECT
  e.id,
  e.branch_id,
  500.00,
  'Emergencia médica',
  NOW() - INTERVAL '4 days'
FROM employees e WHERE e.pin = '1234';

-- Adelanto 2: María González - $300
INSERT INTO salary_advances (employee_id, branch_id, amount, reason, recorded_at)
SELECT
  e.id,
  e.branch_id,
  300.00,
  'Gastos personales',
  NOW() - INTERVAL '2 days'
FROM employees e WHERE e.pin = '2345';

-- ============================================
-- RESUMEN DE DATOS DE PRUEBA
-- ============================================

/*
SUCURSALES:
- Sucursal Centro (PIN Caja: 111111)
- Sucursal Norte (PIN Caja: 222222)

EMPLEADOS:
- Juan Pérez (PIN: 1234) - Vendedor - Diario $350 - Sucursal Centro
- María González (PIN: 2345) - Cajera - Semanal $2800 - Sucursal Centro
- Carlos Ramírez (PIN: 3456) - Gerente - Diario $400 - Sucursal Norte
- Ana Martínez (PIN: 4567) - Vendedora - Semanal $2500 - Sucursal Norte

CÓDIGOS DE ACCESO:
- Administrador: 728654
- Caja Sucursal Centro: 111111
- Caja Sucursal Norte: 222222

PARA PROBAR:
1. En la pantalla de checador, ingresa PIN 1234 para checar como Juan Pérez
2. Accede al Modo Caja con PIN 111111 para registrar adelantos en Sucursal Centro
3. Accede al Panel Admin con código 728654 para generar nómina y ver reportes

NOTAS:
- Juan Pérez tiene registros de asistencia de ejemplo con:
  - Un día completo con entrada, comida y salida
  - Un día con registro incompleto (solo entrada)
  - Un día de falta
  - Esto ayudará a ver cómo funciona la generación de nómina con alertas
- Se crearon 2 adelantos de ejemplo para demostrar el control de adelantos
*/
