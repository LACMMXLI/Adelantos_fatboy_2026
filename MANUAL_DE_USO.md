# Sistema de Control de Asistencia y Nómina

## Manual de Uso Completo

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Configuración Inicial](#configuración-inicial)
3. [Pantalla Principal - Reloj Checador](#pantalla-principal---reloj-checador)
4. [Panel Administrador](#panel-administrador)
5. [Modo Caja - Adelantos](#modo-caja---adelantos)
6. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Introducción

Este es un sistema profesional diseñado para gestionar la asistencia de empleados, control de adelantos y generación automática de nómina. El sistema funciona con base de datos Supabase que guarda toda la información de forma segura.

### Características Principales

- Reloj checador de empleados con PIN
- Control de turnos (entrada/salida/comida)
- Registro de adelantos por sucursal
- Generación automática de nómina
- Sistema multisucursal
- Reportes detallados
- Base de datos segura

---

## Configuración Inicial

### 1. Crear Sucursales (OBLIGATORIO)

Antes de comenzar a usar el sistema, **DEBES** crear al menos una sucursal:

1. Abre la aplicación
2. Haz clic en el ícono de engrane (esquina superior derecha)
3. Ingresa el código de administrador: **728654**
4. Ve a la pestaña **"Sucursales"**
5. Haz clic en **"Nueva Sucursal"**
6. Completa:
   - **Nombre**: Ej. "Sucursal Centro"
   - **PIN de Caja**: 6 dígitos (Ej. 123456)
7. Haz clic en **"Crear"**

**Importante**: El PIN de Caja se usará para que el personal de caja pueda registrar adelantos.

### 2. Registrar Empleados

Una vez creada la sucursal:

1. En el Panel Administrador, ve a **"Empleados"**
2. Haz clic en **"Nuevo Empleado"**
3. Completa:
   - **Nombre Completo**: Nombre del empleado
   - **Puesto**: Cargo del empleado
   - **PIN**: 4 dígitos para que el empleado cheque (Ej. 1234)
   - **Sucursal**: Selecciona la sucursal
   - **Tipo de Pago**: Diario o Semanal
   - **Sueldo Base**: Monto (por día o por semana según el tipo)
4. Haz clic en **"Crear"**

---

## Pantalla Principal - Reloj Checador

Esta es la pantalla que se muestra al abrir la aplicación.

### Cómo Checar Asistencia

1. El empleado ingresa su PIN de 4 dígitos
2. El sistema automáticamente determina qué registrar:
   - Si no ha checado hoy → Registra **ENTRADA**
   - Si ya registró entrada → Pregunta si es **SALIDA** o **INICIO DE COMIDA**
   - Si inició comida → Registra **FIN DE COMIDA**
   - Si terminó comida → Registra **SALIDA**

3. Se muestra confirmación en pantalla grande:
   - Nombre del empleado
   - Acción registrada
   - Fecha y hora

### Restricciones de Empleados

Los empleados **SOLO** pueden:
- Registrar entrada
- Registrar salida
- Registrar inicio/fin de comida
- Ver la confirmación

**NO pueden** ver reportes, nómina, adelantos ni configuración.

---

## Panel Administrador

### Acceso

1. Haz clic en el ícono de engrane (esquina superior derecha)
2. Ingresa el código: **728654**
3. Si el código es incorrecto, se muestra "Código incorrecto" y regresa al checador

### Funciones del Panel

#### 1. Sucursales

- **Ver** todas las sucursales registradas
- **Crear** nuevas sucursales
- **Editar** nombre o PIN de caja
- **Eliminar** sucursales (no se puede si tiene empleados)

#### 2. Empleados

- **Ver** lista de todos los empleados activos
- **Buscar** empleados por nombre
- **Filtrar** por sucursal
- **Crear** nuevos empleados
- **Editar** datos de empleados
- **Desactivar** empleados (no se eliminan, solo se desactivan)

**Campos del Empleado:**
- Nombre Completo
- Puesto
- PIN (4 dígitos, único por empleado)
- Sucursal asignada
- Tipo de pago (Diario/Semanal)
- Sueldo base

#### 3. Control de Adelantos

Visualiza todos los adelantos registrados:

- **Filtrar** por sucursal
- **Filtrar** por rango de fechas
- Ver **total de adelantos**
- Ver detalles: empleado, fecha, monto, motivo, sucursal

**Nota**: Los adelantos se registran desde el Modo Caja, no desde aquí.

#### 4. Nómina Automática

Genera la nómina de forma automática:

**Paso 1: Configurar Periodo**
1. Selecciona **Sucursal**
2. Selecciona **Tipo de Periodo**:
   - Semanal (7 días)
   - Quincenal (14 días)
3. Selecciona **Fecha Inicio**
4. La **Fecha Fin** se calcula automáticamente
5. Haz clic en **"Calcular Nómina"**

**Paso 2: Revisar Cálculos**

Para cada empleado se muestra:
- **Sueldo Base**: Según tipo de pago y periodo
- **Días Trabajados**: Días que registró entrada
- **Adelantos**: Total de adelantos en el periodo
- **Descuentos**: Se pueden agregar manualmente

**Alertas Importantes:**
- **Faltas Detectadas**: Lista de días que no asistió
- **Registros Incompletos**: Ej. "No registró salida"

**Paso 3: Aplicar Descuentos por Faltas (OBLIGATORIO)**

El sistema **NO descuenta automáticamente** por faltas. Tú decides:

1. Para empleados con faltas, verás un formulario:
   - **Monto del Descuento**: Captura el monto a descontar
   - **Motivo**: Ej. "Descuento por 2 faltas"

2. Puedes:
   - **Aplicar descuento**: Escribe el monto
   - **No aplicar descuento**: Deja en 0
   - **Agregar motivo**: Opcional

3. El **Total a Pagar** se actualiza automáticamente:
   ```
   Total = Sueldo Base - Adelantos - Descuentos
   ```

**Paso 4: Confirmar y Guardar**

1. Revisa el resumen total
2. Haz clic en **"Confirmar y Guardar Nómina"**
3. Verifica los datos en el modal de confirmación
4. Haz clic en **"Confirmar y Guardar"**

La nómina se guarda en el sistema con estado "confirmada".

#### 5. Reportes

Genera reportes detallados de:

**Tipos de Reportes:**

**A) Reporte de Asistencias**
- Lista todos los registros de entrada/salida/comida
- Filtra por: sucursal, empleado, rango de fechas
- Muestra: fecha, hora, empleado, tipo de registro

**B) Reporte de Adelantos**
- Lista todos los adelantos entregados
- Filtra por: sucursal, empleado, rango de fechas
- Muestra: fecha, hora, empleado, monto, motivo

**C) Reporte de Nómina**
- Lista todas las nóminas generadas
- Filtra por: sucursal, empleado, rango de fechas
- Muestra: periodo, empleado, sueldo, días, adelantos, descuentos, total

**Exportar Reportes:**
- Haz clic en **"Exportar CSV"**
- Se descarga un archivo CSV que puedes abrir en Excel

---

## Modo Caja - Adelantos

Este modo es **EXCLUSIVO** para el personal de caja que entrega adelantos.

### Acceso

1. Desde la pantalla principal (checador), haz clic en el ícono de dólar (esquina superior derecha)
2. Ingresa el **PIN de Sucursal** (6 dígitos)
3. El PIN determina a qué sucursal estás entrando

**Importante**: Si ingresas el PIN de otra sucursal, verás los empleados de ESA sucursal.

### Registrar Adelanto

1. Busca al empleado en la lista o usa el buscador
2. Haz clic en el empleado
3. Completa:
   - **Monto del Adelanto**: Cantidad a entregar
   - **Motivo**: Opcional (Ej. "Emergencia familiar")
4. Haz clic en **"Confirmar Adelanto"**
5. Se muestra confirmación grande con el monto

### Restricciones del Modo Caja

En este modo **SOLO** puedes:
- Ver empleados de la sucursal activa
- Buscar empleados
- Registrar adelantos

**NO puedes**:
- Ver reportes
- Ver nómina
- Ver asistencias
- Editar empleados
- Ver configuración

Para salir, haz clic en el botón **X** (arriba a la derecha).

---

## Preguntas Frecuentes

### ¿Qué pasa si un empleado olvida checar?

Los registros incompletos se detectan automáticamente al generar la nómina. Aparecen como alertas para que puedas decidir qué hacer.

### ¿Cómo se calculan los días trabajados?

El sistema cuenta cuántos días diferentes el empleado registró **ENTRADA**. Los domingos no se cuentan como faltas.

### ¿Se pueden editar los registros de asistencia?

No desde la interfaz de usuario. Los registros se guardan en la base de datos y quedan permanentes para auditoría.

### ¿Qué pasa si registro un adelanto por error?

Los adelantos quedan registrados pero se pueden revisar en "Control de Adelantos" del Panel Admin.

### ¿Cómo cambio el código de administrador?

El código está fijo en el código fuente: **728654**. Para cambiarlo, modifica el archivo `AdminLogin.tsx`.

### ¿Puedo usar el mismo PIN para dos empleados?

No. Cada PIN de empleado debe ser único. El sistema no permite duplicados.

### ¿Se puede eliminar una sucursal con empleados?

No. Primero debes desactivar o reasignar a todos los empleados de esa sucursal.

### ¿La información está segura?

Sí. Toda la información se guarda en Supabase, una base de datos profesional con respaldos automáticos.

### ¿Funciona sin internet?

El sistema requiere conexión a internet para acceder a la base de datos Supabase.

### ¿Cómo hago respaldo de la información?

Supabase realiza respaldos automáticos. También puedes exportar reportes en CSV desde el Panel Admin.

---

## Códigos de Acceso Rápido

### Código de Administrador
```
728654
```

### Códigos de Sucursal (Ejemplos)
Los defines tú al crear cada sucursal (6 dígitos).

### PINs de Empleados (Ejemplos)
Los defines tú al crear cada empleado (4 dígitos).

---

## Soporte Técnico

Para cualquier problema o duda:
- Revisa este manual primero
- Verifica que todos los datos estén completos
- Revisa la sección de Preguntas Frecuentes

---

## Changelog

**Versión 1.0.0** (Inicial)
- Sistema completo de asistencia
- Control de adelantos
- Generación de nómina
- Sistema multisucursal
- Reportes y exportación

---

**Desarrollado para gestión profesional de personal**
