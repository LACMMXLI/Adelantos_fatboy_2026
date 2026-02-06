import { useState, useEffect } from 'react';
import { X, Search, DollarSign, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Branch, Employee } from '../types';

interface CashModeProps {
  branch: Branch;
  onExit: () => void;
}

export default function CashMode({ branch, onExit }: CashModeProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, [branch]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [searchTerm, employees]);

  const loadEmployees = async () => {
    try {
      const { data } = await supabase
        .from('employees')
        .select('*')
        .eq('branch_id', branch.id)
        .eq('is_active', true)
        .order('name');

      if (data) {
        setEmployees(data);
        setFilteredEmployees(data);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('salary_advances')
        .insert({
          employee_id: selectedEmployee.id,
          branch_id: branch.id,
          amount: parseFloat(amount),
          reason: reason || '',
          recorded_at: new Date().toISOString()
        });

      if (error) throw error;

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedEmployee(null);
        setAmount('');
        setReason('');
      }, 2000);
    } catch (error) {
      console.error('Error registering advance:', error);
      alert('Error al registrar adelanto');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-16 text-center max-w-lg">
          <CheckCircle className="w-32 h-32 text-green-500 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-green-600 mb-4">
            Adelanto Registrado
          </h2>
          <p className="text-2xl text-slate-700">{selectedEmployee?.name}</p>
          <p className="text-3xl font-bold text-slate-900 mt-4">
            ${parseFloat(amount).toFixed(2)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col z-50">
      <div className="bg-green-600 text-white p-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Modo Caja - Adelantos</h1>
          <p className="text-lg opacity-90">{branch.name}</p>
        </div>
        <button
          onClick={onExit}
          className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {!selectedEmployee ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-6 h-6" />
                <input
                  type="text"
                  placeholder="Buscar empleado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 text-xl border-2 border-slate-300 rounded-lg focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredEmployees.map(employee => (
                <button
                  key={employee.id}
                  onClick={() => setSelectedEmployee(employee)}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow text-left"
                >
                  <h3 className="text-2xl font-bold text-slate-800">{employee.name}</h3>
                  <p className="text-lg text-slate-600">{employee.position}</p>
                </button>
              ))}
              {filteredEmployees.length === 0 && (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <p className="text-xl text-slate-500">No se encontraron empleados</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <button
                onClick={() => {
                  setSelectedEmployee(null);
                  setAmount('');
                  setReason('');
                }}
                className="mb-6 text-green-600 hover:text-green-700 font-semibold text-lg"
              >
                ← Volver a lista
              </button>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">{selectedEmployee.name}</h2>
                <p className="text-xl text-slate-600">{selectedEmployee.position}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-slate-700 mb-2">
                    Monto del Adelanto *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-6 h-6" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-14 pr-4 py-4 text-2xl border-2 border-slate-300 rounded-lg focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-slate-700 mb-2">
                    Motivo (opcional)
                  </label>
                  <textarea
                    placeholder="Describe el motivo del adelanto..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-lg focus:border-green-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !amount || parseFloat(amount) <= 0}
                  className="w-full py-6 bg-green-600 hover:bg-green-700 text-white rounded-lg text-2xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Registrando...' : 'Confirmar Adelanto'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
