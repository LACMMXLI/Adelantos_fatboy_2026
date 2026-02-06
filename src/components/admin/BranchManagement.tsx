import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Branch } from '../../types';

export default function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({ name: '', cash_pin: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBranches();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cash_pin) return;

    setLoading(true);
    try {
      if (editingBranch) {
        const { error } = await supabase
          .from('branches')
          .update(formData)
          .eq('id', editingBranch.id);

        if (error) throw error;

        await supabase.from('audit_log').insert({
          action: 'Sucursal Actualizada',
          details: { branch_id: editingBranch.id, name: formData.name }
        });
      } else {
        const { error } = await supabase
          .from('branches')
          .insert([formData]);

        if (error) throw error;

        await supabase.from('audit_log').insert({
          action: 'Sucursal Creada',
          details: { name: formData.name }
        });
      }

      await loadBranches();
      setShowForm(false);
      setEditingBranch(null);
      setFormData({ name: '', cash_pin: '' });
    } catch (error) {
      console.error('Error saving branch:', error);
      alert('Error al guardar sucursal');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({ name: branch.name, cash_pin: branch.cash_pin });
    setShowForm(true);
  };

  const handleDelete = async (branch: Branch) => {
    if (!confirm(`¿Eliminar sucursal ${branch.name}?`)) return;

    try {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', branch.id);

      if (error) throw error;

      await supabase.from('audit_log').insert({
        action: 'Sucursal Eliminada',
        details: { branch_id: branch.id, name: branch.name }
      });

      await loadBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
      alert('Error al eliminar sucursal. Puede tener empleados asignados.');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBranch(null);
    setFormData({ name: '', cash_pin: '' });
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestión de Sucursales</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Sucursal
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-slate-100 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
            {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Nombre de la Sucursal *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Ej: Sucursal Centro"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                PIN de Caja (6 dígitos) *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                value={formData.cash_pin}
                onChange={(e) => setFormData({ ...formData, cash_pin: e.target.value })}
                className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="123456"
              />
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Este PIN se usará para acceder al modo caja-adelantos
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando...' : editingBranch ? 'Actualizar' : 'Crear'}
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

      <div className="grid gap-4">
        {branches.map(branch => (
          <div key={branch.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 sm:p-6 flex justify-between items-center border border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{branch.name}</h3>
              <p className="text-slate-600 dark:text-slate-400">PIN de Caja: {branch.cash_pin}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(branch)}
                className="p-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(branch)}
                className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        {branches.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-12 text-center border border-slate-100 dark:border-slate-700">
            <p className="text-xl text-slate-500">No hay sucursales registradas</p>
            <p className="text-slate-400 mt-2">Crea tu primera sucursal para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
}
