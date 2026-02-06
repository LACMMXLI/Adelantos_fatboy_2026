import { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Branch, Employee, AttendanceRecord, SalaryAdvance, PayrollWithEmployee } from '../../types';

type ReportType = 'attendance' | 'advances' | 'payroll';

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>('attendance');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      loadEmployees();
    }
  }, [selectedBranch]);

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

  const loadEmployees = async () => {
    try {
      const { data } = await supabase
        .from('employees')
        .select('*')
        .eq('branch_id', selectedBranch)
        .eq('is_active', true)
        .order('name');

      if (data) setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      alert('Por favor selecciona las fechas');
      return;
    }

    setLoading(true);
    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      if (reportType === 'attendance') {
        let query = supabase
          .from('attendance_records')
          .select('*, employees(*), branches(*)')
          .gte('recorded_at', start.toISOString())
          .lte('recorded_at', end.toISOString())
          .order('recorded_at', { ascending: false });

        if (selectedBranch) {
          query = query.eq('branch_id', selectedBranch);
        }
        if (selectedEmployee) {
          query = query.eq('employee_id', selectedEmployee);
        }

        const { data } = await query;
        setReportData(data || []);
      } else if (reportType === 'advances') {
        let query = supabase
          .from('salary_advances')
          .select('*, employees(*), branches(*)')
          .gte('recorded_at', start.toISOString())
          .lte('recorded_at', end.toISOString())
          .order('recorded_at', { ascending: false });

        if (selectedBranch) {
          query = query.eq('branch_id', selectedBranch);
        }
        if (selectedEmployee) {
          query = query.eq('employee_id', selectedEmployee);
        }

        const { data } = await query;
        setReportData(data || []);
      } else if (reportType === 'payroll') {
        let query = supabase
          .from('payroll')
          .select('*, employees(*, branches(*))')
          .gte('period_start', start.toISOString().split('T')[0])
          .lte('period_end', end.toISOString().split('T')[0])
          .order('created_at', { ascending: false });

        if (selectedBranch) {
          query = query.eq('branch_id', selectedBranch);
        }
        if (selectedEmployee) {
          query = query.eq('employee_id', selectedEmployee);
        }

        const { data } = await query;
        setReportData(data || []);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error al generar reporte');
    } finally {
      setLoading(false);
    }
  };

  const getRecordTypeName = (type: string): string => {
    const names: { [key: string]: string } = {
      entry: 'Entrada',
      exit: 'Salida',
      lunch_start: 'Inicio Comida',
      lunch_end: 'Fin Comida'
    };
    return names[type] || type;
  };

  const exportToCSV = () => {
    if (reportData.length === 0) return;

    let csvContent = '';
    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === 'attendance') {
      headers = ['Fecha', 'Hora', 'Empleado', 'Sucursal', 'Tipo'];
      rows = (reportData as (AttendanceRecord & { employees?: Employee; branches?: Branch })[]).map(record => [
        new Date(record.recorded_at).toLocaleDateString('es-MX'),
        new Date(record.recorded_at).toLocaleTimeString('es-MX'),
        record.employees?.name || '',
        record.branches?.name || '',
        getRecordTypeName(record.record_type)
      ]);
    } else if (reportType === 'advances') {
      headers = ['Fecha', 'Hora', 'Empleado', 'Sucursal', 'Monto', 'Motivo'];
      rows = (reportData as (SalaryAdvance & { employees?: Employee; branches?: Branch })[]).map(record => [
        new Date(record.recorded_at).toLocaleDateString('es-MX'),
        new Date(record.recorded_at).toLocaleTimeString('es-MX'),
        record.employees?.name || '',
        record.branches?.name || '',
        record.amount.toString(),
        record.reason || ''
      ]);
    } else if (reportType === 'payroll') {
      headers = ['Periodo Inicio', 'Periodo Fin', 'Empleado', 'Sucursal', 'Sueldo Base', 'Días Trabajados', 'Adelantos', 'Descuentos', 'Total a Pagar'];
      rows = (reportData as PayrollWithEmployee[]).map(record => [
        new Date(record.period_start).toLocaleDateString('es-MX'),
        new Date(record.period_end).toLocaleDateString('es-MX'),
        record.employees?.name || '',
        record.employees?.branches?.name || '',
        record.base_salary.toString(),
        record.days_worked.toString(),
        record.total_advances.toString(),
        record.manual_deductions.toString(),
        record.total_to_pay.toString()
      ]);
    }

    csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Reportes</h2>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 sm:p-6 mb-6 border border-slate-100 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Tipo de Reporte
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setReportType('attendance')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  reportType === 'attendance'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileText className="w-6 h-6 mx-auto mb-2" />
                <p className="font-semibold">Asistencias</p>
              </button>
              <button
                onClick={() => setReportType('advances')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  reportType === 'advances'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileText className="w-6 h-6 mx-auto mb-2" />
                <p className="font-semibold">Adelantos</p>
              </button>
              <button
                onClick={() => setReportType('payroll')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  reportType === 'payroll'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileText className="w-6 h-6 mx-auto mb-2" />
                <p className="font-semibold">Nómina</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Sucursal (opcional)
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setSelectedEmployee('');
              }}
              className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todas</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Empleado (opcional)
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              disabled={!selectedBranch}
              className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-500"
            >
              <option value="">Todos</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>{employee.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Inicio *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Fin *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={generateReport}
            disabled={loading || !startDate || !endDate}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Generando...' : 'Generar Reporte'}
          </button>
          {reportData.length > 0 && (
            <button
              onClick={exportToCSV}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              <Download className="w-5 h-5" />
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {reportData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden border border-slate-100 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-900/50">
                <tr>
                  {reportType === 'attendance' && (
                    <>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Fecha/Hora</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Empleado</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Sucursal</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Tipo</th>
                    </>
                  )}
                  {reportType === 'advances' && (
                    <>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Fecha/Hora</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Empleado</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Sucursal</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Monto</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Motivo</th>
                    </>
                  )}
                  {reportType === 'payroll' && (
                    <>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Periodo</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Empleado</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Sucursal</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Sueldo Base</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Días</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Adelantos</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Descuentos</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Total</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {reportType === 'attendance' && (reportData as (AttendanceRecord & { employees?: Employee; branches?: Branch })[]).map(record => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-300">
                      {new Date(record.recorded_at).toLocaleString('es-MX')}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                      {record.employees?.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-400">
                      {record.branches?.name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        record.record_type === 'entry' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        record.record_type === 'exit' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      }`}>
                        {getRecordTypeName(record.record_type)}
                      </span>
                    </td>
                  </tr>
                ))}

                {reportType === 'advances' && (reportData as (SalaryAdvance & { employees?: Employee; branches?: Branch })[]).map(record => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-300">
                      {new Date(record.recorded_at).toLocaleString('es-MX')}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                      {record.employees?.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-400">
                      {record.branches?.name}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600 dark:text-green-400">
                      ${record.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {record.reason || '-'}
                    </td>
                  </tr>
                ))}

                {reportType === 'payroll' && (reportData as PayrollWithEmployee[]).map(record => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-300">
                      {new Date(record.period_start).toLocaleDateString('es-MX')} - {new Date(record.period_end).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                      {record.employees?.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-400">
                      {record.employees?.branches?.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-300">
                      ${record.base_salary.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-300">
                      {record.days_worked}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400">
                      ${record.total_advances.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-orange-600 dark:text-orange-400">
                      ${record.manual_deductions.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-600 dark:text-blue-400">
                      ${record.total_to_pay.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && reportData.length === 0 && startDate && endDate && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-xl text-slate-500">No hay datos para el periodo seleccionado</p>
        </div>
      )}
    </div>
  );
}
