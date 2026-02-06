import { useState } from 'react';
import { X } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const ADMIN_PIN = '728654';

export default function AdminLogin({ onSuccess, onCancel }: AdminLoginProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);

      if (newPin.length === 6) {
        if (newPin === ADMIN_PIN) {
          onSuccess();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 1500);
        }
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative border border-slate-100 dark:border-slate-700 transition-colors text-slate-800 dark:text-white">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-center mb-8 text-slate-800 dark:text-white">
          Acceso Administrador
        </h2>

        <div className="mb-8">
          <p className="text-lg text-center mb-4 text-slate-600 dark:text-slate-400">Código de administrador:</p>
          <div className="flex justify-center gap-2 mb-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 flex items-center justify-center text-xl sm:text-2xl font-bold ${
                  error
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : pin.length > i
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50'
                }`}
              >
                {pin.length > i ? '●' : ''}
              </div>
            ))}
          </div>
          {error && (
            <p className="text-red-600 dark:text-red-400 text-center font-semibold">Código incorrecto</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="p-4 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-2xl font-bold text-slate-800 dark:text-white transition-colors"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="p-4 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg text-lg font-bold text-red-600 dark:text-red-400 transition-colors"
          >
            Borrar
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            className="p-4 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-2xl font-bold text-slate-800 dark:text-white transition-colors"
          >
            0
          </button>
          <button
            onClick={onCancel}
            className="p-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-lg font-bold text-slate-700 dark:text-slate-300 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
