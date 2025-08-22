export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD format
  receipt?: string; // Base64 encoded image
  createdAt: string;
  updatedAt: string;
  splits?: ExpenseSplit[];
}

export interface ExpenseFormData {
  description: string;
  amount: number;
  category: string;
  date: string;
  receipt?: string | null;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  period: 'monthly' | 'weekly';
  createdAt: string;
  updatedAt: string;
}

export interface BudgetFormData {
  category: string;
  limit: number;
  period: 'monthly' | 'weekly';
}

export interface ExpenseSplit {
  id: string;
  name: string;
  email: string;
  amount: number;
}