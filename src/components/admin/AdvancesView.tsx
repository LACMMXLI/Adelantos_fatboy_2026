import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Branch, Employee, SalaryAdvance } from '../../types';

interface AdvanceWithDetails extends SalaryAdvance {
  employees?: Employee;
  branches?: Branch;
}

export default function AdvancesView() {
  const [advances, setAdvances] = useState<AdvanceWithDetails[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBranches();
    loadAdvances();
  }, []);

  useEffect(() => {
    loadAdvances();
  }, [filterBranch, startDate, endDate]);

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

  const loadAdvances = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('salary_advances')
        .select('*, employees(*), branches(*)')
        .order('recorded_at', { ascending: false });

      if (filterBranch !== 'all') {
        query = query.eq('branch_id', filterBranch);
      }

      if (startDate) {
        query = query.gte('recorded_at', new Date(startDate).toISOString());
      }

      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query = query.lte('recorded_at', endDateTime.toISOString());
      }

      const { data } = await query;

      if (data) setAdvances(data);
    } catch (error) {
      console.error('Error loading advances:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalAdvances = advances.reduce((sum, adv) => sum + adv.amount, 0);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Control de Adelantos</h2>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 sm:p-6 mb-6 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Sucursal
            </label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Todas las sucursales</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Fecha Inicio
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
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6 mb-6">
        <p className="text-lg opacity-90 mb-2">Total de Adelantos</p>
        <p className="text-3xl sm:text-4xl font-bold">${totalAdvances.toFixed(2)}</p>
        <p className="text-sm opacity-80 mt-2">{advances.length} adelantos registrados</p>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-12 text-center border border-slate-100 dark:border-slate-700">
          <p className="text-xl text-slate-500 dark:text-slate-400">Cargando...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden border border-slate-100 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Fecha</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Empleado</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Sucursal</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Monto</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {advances.map(advance => (
                  <tr key={advance.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-300">
                      {new Date(advance.recorded_at).toLocaleString('es-MX')}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                      {advance.employees?.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-400">
                      {advance.branches?.name}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600 dark:text-green-400">
                      ${advance.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {advance.reason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {advances.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-xl text-slate-500 dark:text-slate-400">No hay adelantos registrados</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
