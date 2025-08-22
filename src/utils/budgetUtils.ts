import { Expense } from '../types';

export const getCategorySpending = (expenses: Expense[], category: string): number => {
  return expenses
    .filter(expense => expense.category === category)
    .reduce((total, expense) => total + expense.amount, 0);
};

export const getBudgetProgress = (spent: number, budgetLimit: number): number => {
  if (budgetLimit === 0) return 0;
  return (spent / budgetLimit) * 100;
};

export const getRemainingBudget = (spent: number, budgetLimit: number): number => {
  return budgetLimit - spent;
};

export const getBudgetStatus = (progress: number): 'good' | 'warning' | 'over' => {
  if (progress > 100) return 'over';
  if (progress > 80) return 'warning';
  return 'good';
};

export const getMonthlyExpenses = (expenses: Expense[], monthYear?: string): Expense[] => {
  const targetMonth = monthYear || new Date().toISOString().slice(0, 7);
  return expenses.filter(expense => expense.date.startsWith(targetMonth));
};

export const getWeeklyExpenses = (expenses: Expense[], weekStart?: Date): Expense[] => {
  const start = weekStart || getWeekStart(new Date());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= start && expenseDate <= end;
  });
};

export const getWeekStart = (date: Date): Date => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day;
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
};