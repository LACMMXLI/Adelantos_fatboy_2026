import { useState } from 'react';
import { X, Users, Building2, DollarSign, FileText, ClipboardList } from 'lucide-react';
import EmployeeManagement from './admin/EmployeeManagement';
import BranchManagement from './admin/BranchManagement';
import AdvancesView from './admin/AdvancesView';
import PayrollGeneration from './admin/PayrollGeneration';
import Reports from './admin/Reports';

interface AdminPanelProps {
  onExit: () => void;
}

type Tab = 'branches' | 'employees' | 'advances' | 'payroll' | 'reports';

export default function AdminPanel({ onExit }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('branches');

  const tabs = [
    { id: 'branches' as Tab, label: 'Sucursales', icon: Building2 },
    { id: 'employees' as Tab, label: 'Empleados', icon: Users },
    { id: 'advances' as Tab, label: 'Adelantos', icon: DollarSign },
    { id: 'payroll' as Tab, label: 'Nómina', icon: ClipboardList },
    { id: 'reports' as Tab, label: 'Reportes', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900 dark:bg-black flex flex-col z-50 transition-colors duration-300">
      <div className="bg-blue-600 dark:bg-blue-900 text-white p-4 sm:p-6 flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold">Panel Administrador</h1>
        <button
          onClick={onExit}
          className="p-2 sm:p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
        >
          <X className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
        <div className="flex overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-4 border-blue-600 dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900">
        {activeTab === 'branches' && <BranchManagement />}
        {activeTab === 'employees' && <EmployeeManagement />}
        {activeTab === 'advances' && <AdvancesView />}
        {activeTab === 'payroll' && <PayrollGeneration />}
        {activeTab === 'reports' && <Reports />}
      </div>
    </div>
  );
}
