export interface Branch {
  id: string;
  name: string;
  cash_pin: string;
  created_at: string;
}

export interface Employee {
  id: string;
  branch_id: string;
  name: string;
  position: string;
  pin: string;
  payment_type: 'daily' | 'weekly';
  base_salary: number;
  is_active: boolean;
  created_at: string;
}

export type RecordType = 'entry' | 'exit' | 'lunch_start' | 'lunch_end';

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  branch_id: string;
  record_type: RecordType;
  recorded_at: string;
  created_at: string;
}

export interface SalaryAdvance {
  id: string;
  employee_id: string;
  branch_id: string;
  amount: number;
  reason: string;
  recorded_at: string;
  created_at: string;
}

export interface Payroll {
  id: string;
  employee_id: string;
  branch_id: string;
  period_start: string;
  period_end: string;
  base_salary: number;
  days_worked: number;
  total_advances: number;
  manual_deductions: number;
  deduction_reason: string;
  total_to_pay: number;
  status: 'draft' | 'confirmed' | 'paid';
  generated_by: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface EmployeeWithBranch extends Employee {
  branches?: Branch;
}

export interface AttendanceWithEmployee extends AttendanceRecord {
  employees?: Employee;
}

export interface PayrollWithEmployee extends Payroll {
  employees?: EmployeeWithBranch;
}
