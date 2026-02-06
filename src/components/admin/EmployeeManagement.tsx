import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Employee, EmployeeWithBranch, Branch } from '../../types';

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<EmployeeWithBranch[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    pin: '',
    branch_id: '',
    payment_type: 'daily' as 'daily' | 'weekly',
    base_salary: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBranches();
    loadEmployees();
  }, []);

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
        .select('*, branches(*)')
        .eq('is_active', true)
        .order('name');

      if (data) setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.pin || !formData.branch_id || !formData.base_salary) return;

    setLoading(true);
    try {
      const employeeData = {
        ...formData,
        base_salary: parseFloat(formData.base_salary),
      };

      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', editingEmployee.id);

        if (error) throw error;

        await supabase.from('audit_log').insert({
          action: 'Empleado Actualizado',
          details: { employee_id: editingEmployee.id, name: formData.name }
        });
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([employeeData]);

        if (error) throw error;

        await supabase.from('audit_log').insert({
          action: 'Empleado Creado',
          details: { name: formData.name }
        });
      }

      await loadEmployees();
      handleCancel();
    } catch (error: unknown) {
      console.error('Error saving employee:', error);
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        alert('El PIN ya está en uso. Por favor usa otro PIN.');
      } else {
        alert('Error al guardar empleado');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      position: employee.position,
      pin: employee.pin,
      branch_id: employee.branch_id,
      payment_type: employee.payment_type,
      base_salary: employee.base_salary.toString(),
    });
    setShowForm(true);
  };

  const handleDeactivate = async (employee: Employee) => {
    if (!confirm(`¿Desactivar empleado ${employee.name}?`)) return;

    try {
      const { error } = await supabase
        .from('employees')
        .update({ is_active: false })
        .eq('id', employee.id);

      if (error) throw error;

      await supabase.from('audit_log').insert({
        action: 'Empleado Desactivado',
        details: { employee_id: employee.id, name: employee.name }
      });

      await loadEmployees();
    } catch (error) {
      console.error('Error deactivating employee:', error);
      alert('Error al desactivar empleado');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEmployee(null);
    setFormData({
      name: '',
      position: '',
      pin: '',
      branch_id: '',
      payment_type: 'daily',
      base_salary: '',
    });
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = filterBranch === 'all' || emp.branch_id === filterBranch;
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestión de Empleados</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Empleado
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-slate-100 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
            {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Puesto
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                PIN (4 dígitos) *
              </label>
              <input
                type="text"
                required
                maxLength={4}
                pattern="[0-9]{4}"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Sucursal *
              </label>
              <select
                required
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
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
                Tipo de Pago *
              </label>
              <select
                required
                value={formData.payment_type}
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value as 'daily' | 'weekly' })}
                className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Sueldo Base *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando...' : editingEmployee ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="w-full sm:w-auto px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 mb-6 border border-slate-100 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar empleado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Todas las sucursales</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredEmployees.map(employee => (
              <div key={employee.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-slate-100 dark:border-slate-700">
                <div className="flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{employee.name}</h3>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold">
                      {employee.branches?.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Puesto:</span> {employee.position || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">PIN:</span> {employee.pin}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Tipo:</span> {employee.payment_type === 'daily' ? 'Diario' : 'Semanal'}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Sueldo:</span> ${employee.base_salary.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleEdit(employee)}
                    className="p-2 sm:p-2.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeactivate(employee)}
                    className="p-2 sm:p-2.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {filteredEmployees.length === 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-12 text-center border border-slate-100 dark:border-slate-700">
                <p className="text-xl text-slate-500">No se encontraron empleados</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
