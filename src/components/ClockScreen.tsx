import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Employee, AttendanceRecord, RecordType } from '../types';
import { Settings, DollarSign, CheckCircle, XCircle } from 'lucide-react';

interface ClockScreenProps {
  onAdminAccess: () => void;
  onCashAccess: () => void;
}

export default function ClockScreen({ onAdminAccess, onCashAccess }: ClockScreenProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; employee?: string } | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [lastRecord, setLastRecord] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
        setShowOptions(false);
        setSelectedEmployee(null);
        setLastRecord(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setPin(pin + num);
    }
  };

  const handleClear = () => {
    setPin('');
    setMessage(null);
    setShowOptions(false);
    setSelectedEmployee(null);
    setLastRecord(null);
  };

  const getNextRecordType = (lastRecord: AttendanceRecord | null): RecordType => {
    if (!lastRecord) return 'entry';

    const today = new Date().toDateString();
    const recordDate = new Date(lastRecord.recorded_at).toDateString();

    if (today !== recordDate) {
      return 'entry';
    }

    switch (lastRecord.record_type) {
      case 'entry':
        return 'lunch_start';
      case 'lunch_start':
        return 'lunch_end';
      case 'lunch_end':
        return 'exit';
      case 'exit':
        return 'entry';
      default:
        return 'entry';
    }
  };

  const getRecordTypeName = (type: RecordType): string => {
    const names = {
      entry: 'Entrada',
      exit: 'Salida',
      lunch_start: 'Inicio de Comida',
      lunch_end: 'Fin de Comida'
    };
    return names[type];
  };

  const recordAttendance = async (employee: Employee, recordType: RecordType) => {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .insert({
          employee_id: employee.id,
          branch_id: employee.branch_id,
          record_type: recordType,
          recorded_at: new Date().toISOString()
        });

      if (error) throw error;

      const now = new Date();
      const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('es-MX');

      setMessage({
        type: 'success',
        text: `${getRecordTypeName(recordType)} registrada`,
        employee: `${employee.name} - ${dateStr} ${timeStr}`
      });
      setPin('');
      setShowOptions(false);
      setSelectedEmployee(null);
      setLastRecord(null);
    } catch (error) {
      console.error('Error registering attendance:', error);
      setMessage({ type: 'error', text: 'Error al registrar. Intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (pin.length === 0 || loading) return;

    setLoading(true);
    setMessage(null);

    try {
      const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('pin', pin)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!employee) {
        setMessage({ type: 'error', text: 'PIN incorrecto' });
        setPin('');
        setLoading(false);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: records } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employee.id)
        .gte('recorded_at', today.toISOString())
        .order('recorded_at', { ascending: false })
        .limit(1);

      const lastRec = records && records.length > 0 ? records[0] : null;
      const nextType = getNextRecordType(lastRec);

      if (lastRec && (lastRec.record_type === 'entry' || lastRec.record_type === 'lunch_start')) {
        setSelectedEmployee(employee);
        setLastRecord(lastRec);
        setShowOptions(true);
        setLoading(false);
      } else {
        await recordAttendance(employee, nextType);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error al procesar. Intenta de nuevo.' });
      setPin('');
      setLoading(false);
    }
  };

  const handleOptionSelect = async (recordType: RecordType) => {
    if (selectedEmployee) {
      setLoading(true);
      await recordAttendance(selectedEmployee, recordType);
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
  }, [pin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col transition-colors duration-300">
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={onCashAccess}
          className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-all"
          title="Caja - Adelantos"
        >
          <DollarSign className="w-6 h-6 text-green-600" />
        </button>
        <button
          onClick={onAdminAccess}
          className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-all"
          title="Panel Administrador"
        >
          <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl">
          {message ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-12 text-center border border-slate-100 dark:border-slate-700">
              {message.type === 'success' ? (
                <CheckCircle className="w-20 h-20 sm:w-32 sm:h-32 text-green-500 mx-auto mb-6" />
              ) : (
                <XCircle className="w-20 h-20 sm:w-32 sm:h-32 text-red-500 mx-auto mb-6" />
              )}
              <h2 className={`text-2xl sm:text-4xl font-bold mb-4 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message.text}
              </h2>
              {message.employee && (
                <p className="text-lg sm:text-2xl text-slate-700 dark:text-slate-300">{message.employee}</p>
              )}
            </div>
          ) : showOptions && selectedEmployee ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-12 border border-slate-100 dark:border-slate-700">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-slate-800 dark:text-white">
                {selectedEmployee.name}
              </h2>
              <p className="text-lg sm:text-xl text-center mb-6 sm:mb-8 text-slate-600 dark:text-slate-400">
                Selecciona la acción a registrar:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lastRecord?.record_type === 'entry' && (
                  <>
                    <button
                      onClick={() => handleOptionSelect('lunch_start')}
                      disabled={loading}
                      className="p-4 sm:p-6 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-lg sm:text-xl font-semibold transition-colors"
                    >
                      Inicio de Comida
                    </button>
                    <button
                      onClick={() => handleOptionSelect('exit')}
                      disabled={loading}
                      className="p-4 sm:p-6 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-lg sm:text-xl font-semibold transition-colors"
                    >
                      Salida
                    </button>
                  </>
                )}
                {lastRecord?.record_type === 'lunch_start' && (
                  <>
                    <button
                      onClick={() => handleOptionSelect('lunch_end')}
                      disabled={loading}
                      className="p-4 sm:p-6 bg-green-500 hover:bg-green-600 text-white rounded-xl text-lg sm:text-xl font-semibold transition-colors sm:col-span-2"
                    >
                      Fin de Comida
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={handleClear}
                className="w-full mt-4 p-3 sm:p-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-base sm:text-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-12 border border-slate-100 dark:border-slate-700">
              <h1 className="text-2xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 text-slate-800 dark:text-white">
                Reloj Checador
              </h1>

              <div className="mb-6 sm:mb-8">
                <p className="text-lg sm:text-xl text-center mb-4 text-slate-600 dark:text-slate-400">Ingresa tu PIN:</p>
                <div className="flex justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg border-2 sm:border-4 flex items-center justify-center text-2xl sm:text-3xl font-bold ${
                        pin.length > i
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50'
                      }`}
                    >
                      {pin.length > i ? '●' : ''}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num.toString())}
                    disabled={loading}
                    className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white transition-colors disabled:opacity-50"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleClear}
                  disabled={loading}
                  className="p-4 sm:p-6 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-xl text-lg sm:text-xl font-bold text-red-600 dark:text-red-400 transition-colors"
                >
                  Borrar
                </button>
                <button
                  onClick={() => handleNumberClick('0')}
                  disabled={loading}
                  className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white transition-colors disabled:opacity-50"
                >
                  0
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || pin.length === 0}
                  className="p-4 sm:p-6 bg-green-500 hover:bg-green-600 rounded-xl text-lg sm:text-xl font-bold text-white transition-colors disabled:opacity-50"
                >
                  {loading ? '...' : 'OK'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
