import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Branch, Employee, AttendanceRecord, SalaryAdvance, Payroll } from '../../types';

interface PayrollCalculation {
  employee: Employee;
  days_worked: number;
  total_advances: number;
  base_salary: number;
  absences: string[];
  incomplete_records: string[];
  manual_deductions: number;
  deduction_reason: string;
  total_to_pay: number;
}

export default function PayrollGeneration() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [periodType, setPeriodType] = useState<'weekly' | 'biweekly'>('weekly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calculations, setCalculations] = useState<PayrollCalculation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (startDate && periodType) {
      const start = new Date(startDate);
      const end = new Date(start);

      if (periodType === 'weekly') {
        end.setDate(start.getDate() + 6);
      } else {
        end.setDate(start.getDate() + 13);
      }

      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [startDate, periodType]);

  const loadBranches = async () => {
    try {
      const { data } = await supabase
        .from('branches')
        .select('*')
        .order('name');

      if (data) setBranches(data);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const calculatePayroll = async () => {
    if (!selectedBranch || !startDate || !endDate) {
      alert('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .eq('branch_id', selectedBranch)
        .eq('is_active', true);

      if (!employees || employees.length === 0) {
        alert('No hay empleados en esta sucursal');
        setLoading(false);
        return;
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const payrollCalcs: PayrollCalculation[] = [];

      for (const employee of employees) {
        const { data: attendanceRecords } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('employee_id', employee.id)
          .gte('recorded_at', start.toISOString())
          .lte('recorded_at', end.toISOString())
          .order('recorded_at');

        const { data: advances } = await supabase
          .from('salary_advances')
          .select('*')
          .eq('employee_id', employee.id)
          .gte('recorded_at', start.toISOString())
          .lte('recorded_at', end.toISOString());

        const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const daysWorked = calculateDaysWorked(attendanceRecords || [], start, end);
        const absences = findAbsences(attendanceRecords || [], start, end);
        const incompleteRecords = findIncompleteRecords(attendanceRecords || []);

        const totalAdvances = advances?.reduce((sum, adv) => sum + adv.amount, 0) || 0;

        let baseSalaryForPeriod = 0;
        if (employee.payment_type === 'daily') {
          baseSalaryForPeriod = employee.base_salary * daysInPeriod;
        } else {
          baseSalaryForPeriod = employee.base_salary * (periodType === 'weekly' ? 1 : 2);
        }

        payrollCalcs.push({
          employee,
          days_worked: daysWorked,
          total_advances: totalAdvances,
          base_salary: baseSalaryForPeriod,
          absences,
          incomplete_records: incompleteRecords,
          manual_deductions: 0,
          deduction_reason: '',
          total_to_pay: baseSalaryForPeriod - totalAdvances,
        });
      }

      setCalculations(payrollCalcs);
    } catch (error) {
      console.error('Error calculating payroll:', error);
      alert('Error al calcular nómina');
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysWorked = (records: AttendanceRecord[], start: Date, end: Date): number => {
    const daysSet = new Set<string>();

    records.forEach(record => {
      if (record.record_type === 'entry') {
        const date = new Date(record.recorded_at).toDateString();
        daysSet.add(date);
      }
    });

    return daysSet.size;
  };

  const findAbsences = (records: AttendanceRecord[], start: Date, end: Date): string[] => {
    const workedDays = new Set<string>();

    records.forEach(record => {
      if (record.record_type === 'entry') {
        const date = new Date(record.recorded_at);
        workedDays.add(date.toISOString().split('T')[0]);
      }
    });

    const absences: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0) {
        const dateStr = current.toISOString().split('T')[0];
        if (!workedDays.has(dateStr)) {
          absences.push(dateStr);
        }
      }
      current.setDate(current.getDate() + 1);
    }

    return absences;
  };

  const findIncompleteRecords = (records: AttendanceRecord[]): string[] => {
    const incomplete: string[] = [];
    const dayGroups: { [key: string]: AttendanceRecord[] } = {};

    records.forEach(record => {
      const date = new Date(record.recorded_at).toISOString().split('T')[0];
      if (!dayGroups[date]) dayGroups[date] = [];
      dayGroups[date].push(record);
    });

    Object.entries(dayGroups).forEach(([date, dayRecords]) => {
      const types = dayRecords.map(r => r.record_type);

      if (types.includes('entry') && !types.includes('exit')) {
        incomplete.push(`${date}: No registró salida`);
      }
      if (types.includes('lunch_start') && !types.includes('lunch_end')) {
        incomplete.push(`${date}: No registró fin de comida`);
      }
    });

    return incomplete;
  };

  const updateDeduction = (index: number, amount: number, reason: string) => {
    const updated = [...calculations];
    updated[index].manual_deductions = amount;
    updated[index].deduction_reason = reason;
    updated[index].total_to_pay = updated[index].base_salary - updated[index].total_advances - amount;
    setCalculations(updated);
  };

  const handleSavePayroll = async () => {
    setSaving(true);
    try {
      const payrollRecords: Omit<Payroll, 'id' | 'created_at' | 'updated_at'>[] = calculations.map(calc => ({
        employee_id: calc.employee.id,
        branch_id: selectedBranch,
        period_start: startDate,
        period_end: endDate,
        base_salary: calc.base_salary,
        days_worked: calc.days_worked,
        total_advances: calc.total_advances,
        manual_deductions: calc.manual_deductions,
        deduction_reason: calc.deduction_reason,
        total_to_pay: calc.total_to_pay,
        status: 'confirmed',
        generated_by: 'admin',
      }));

      const { error } = await supabase
        .from('payroll')
        .insert(payrollRecords);

      if (error) throw error;

      await supabase.from('audit_log').insert({
        action: 'Nómina Generada',
        details: {
          branch_id: selectedBranch,
          period_start: startDate,
          period_end: endDate,
          employees: calculations.length,
        }
      });

      alert('Nómina guardada exitosamente');
      setShowConfirmation(false);
      setCalculations([]);
      setSelectedBranch('');
      setStartDate('');
      setEndDate('');
    } catch (error) {
      console.error('Error saving payroll:', error);
      alert('Error al guardar nómina');
    } finally {
      setSaving(false);
    }
  };

  const totalToPay = calculations.reduce((sum, calc) => sum + calc.total_to_pay, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Generación de Nómina</h2>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-6 border border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Configuración del Periodo</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Sucursal *
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">Seleccionar...</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Tipo de Periodo *
            </label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as 'weekly' | 'biweekly')}
              className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="weekly">Semanal (7 días)</option>
              <option value="biweekly">Quincenal (14 días)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Fecha Inicio *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={endDate}
              readOnly
              className="w-full px-4 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 dark:text-slate-400"
            />
          </div>
        </div>
        <button
          onClick={calculatePayroll}
          disabled={loading || !selectedBranch || !startDate}
          className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? 'Calculando...' : 'Calcular Nómina'}
        </button>
      </div>

      {calculations.length > 0 && (
        <>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg opacity-90 mb-2">Total a Pagar</p>
                <p className="text-4xl font-bold">${totalToPay.toFixed(2)}</p>
                <p className="text-sm opacity-80 mt-2">{calculations.length} empleados</p>
              </div>
              <button
                onClick={() => setShowConfirmation(true)}
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors"
              >
                Confirmar y Guardar Nómina
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {calculations.map((calc, index) => (
              <div key={calc.employee.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{calc.employee.name}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{calc.employee.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${calc.total_to_pay.toFixed(2)}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">Total a pagar</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Sueldo Base</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">${calc.base_salary.toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Días Trabajados</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{calc.days_worked}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                    <p className="text-xs text-red-600 dark:text-red-400 mb-1">Adelantos</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">-${calc.total_advances.toFixed(2)}</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                    <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">Descuentos</p>
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">-${calc.manual_deductions.toFixed(2)}</p>
                  </div>
                </div>

                {(calc.absences.length > 0 || calc.incomplete_records.length > 0) && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Alertas</p>
                        {calc.absences.length > 0 && (
                          <div className="mb-2">
                            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Faltas detectadas ({calc.absences.length}):</p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-500">{calc.absences.join(', ')}</p>
                          </div>
                        )}
                        {calc.incomplete_records.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Registros incompletos:</p>
                            {calc.incomplete_records.map((rec, i) => (
                              <p key={i} className="text-sm text-yellow-700 dark:text-yellow-500">{rec}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {calc.absences.length > 0 && (
                  <div className="border-t dark:border-slate-700 pt-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Descuento Manual por Faltas</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Monto del Descuento
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={calc.manual_deductions || ''}
                          onChange={(e) => updateDeduction(index, parseFloat(e.target.value) || 0, calc.deduction_reason)}
                          className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Motivo (opcional)
                        </label>
                        <input
                          type="text"
                          value={calc.deduction_reason}
                          onChange={(e) => updateDeduction(index, calc.manual_deductions, e.target.value)}
                          className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="Ej: Descuento por 2 faltas"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full border border-slate-100 dark:border-slate-700">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Confirmar Nómina</h3>
            <div className="mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Periodo</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(startDate).toLocaleDateString('es-MX')} - {new Date(endDate).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total de Empleados</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{calculations.length}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total a Pagar</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">${totalToPay.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                ¿Estás seguro de que deseas guardar esta nómina? Una vez guardada, se registrará en el sistema.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSavePayroll}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Confirmar y Guardar'}
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-bold transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
