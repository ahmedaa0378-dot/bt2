import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Plus, List, Settings, AlertCircle } from 'lucide-react';
import { Expense, Budget } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getBudgetProgress, getCategorySpending } from '../utils/budgetUtils';

interface DashboardProps {
  expenses: Expense[];
  budgets: Budget[];
  onAddExpense: () => void;
  onViewExpenses: () => void;
  onManageBudgets: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  expenses,
  budgets,
  onAddExpense,
  onViewExpenses,
  onManageBudgets,
}) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyExpenses = expenses.filter(expense => 
    expense.date.startsWith(currentMonth)
  );

  const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const remainingBudget = totalBudget - totalSpent;

  const budgetProgress = budgets.map(budget => {
    const spent = getCategorySpending(monthlyExpenses, budget.category);
    const progress = getBudgetProgress(spent, budget.limit);
    return {
      ...budget,
      spent,
      progress,
      remaining: budget.limit - spent,
    };
  });

  const overBudgetCategories = budgetProgress.filter(bp => bp.progress > 100);

  const recentExpenses = expenses
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={onAddExpense}
          className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
        >
          <div className="flex items-center space-x-3">
            <Plus className="h-6 w-6" />
            <div className="text-left">
              <div className="font-semibold">Add Expense</div>
              <div className="text-sm opacity-90">Voice or manual entry</div>
            </div>
          </div>
        </button>

        <button
          onClick={onViewExpenses}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
        >
          <div className="flex items-center space-x-3">
            <List className="h-6 w-6" />
            <div className="text-left">
              <div className="font-semibold">View Expenses</div>
              <div className="text-sm opacity-90">{expenses.length} total expenses</div>
            </div>
          </div>
        </button>

        <button
          onClick={onManageBudgets}
          className="bg-orange-600 hover:bg-orange-700 text-white p-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
        >
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6" />
            <div className="text-left">
              <div className="font-semibold">Manage Budgets</div>
              <div className="text-sm opacity-90">{budgets.length} active budgets</div>
            </div>
          </div>
        </button>
      </div>

      {/* Budget Alerts */}
      {overBudgetCategories.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-red-700 mb-3">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-semibold">Budget Alerts</h3>
          </div>
          <div className="space-y-2">
            {overBudgetCategories.map(budget => (
              <div key={budget.id} className="text-sm text-red-600">
                <span className="font-medium">{budget.category}</span> is over budget by{' '}
                <span className="font-semibold">{formatCurrency(budget.spent - budget.limit)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Spent This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Remaining Budget</p>
              <p className={`text-2xl font-bold mt-1 ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(remainingBudget))}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${remainingBudget >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {remainingBudget >= 0 ? (
                <DollarSign className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalBudget)}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Budget Progress */}
      {budgetProgress.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <PieChart className="h-5 w-5" />
            <span>Budget Progress</span>
          </h3>
          <div className="space-y-4">
            {budgetProgress.map(budget => (
              <div key={budget.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">{budget.category}</span>
                  <span className="text-sm text-gray-600">
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      budget.progress > 100 
                        ? 'bg-red-500' 
                        : budget.progress > 80 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budget.progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{budget.progress.toFixed(1)}% used</span>
                  <span>{formatCurrency(budget.remaining)} remaining</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Expenses */}
      {recentExpenses.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
            <button
              onClick={onViewExpenses}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentExpenses.map(expense => (
              <div key={expense.id} className="flex justify-between items-center py-2">
                <div>
                  <p className="font-medium text-gray-900">{expense.description}</p>
                  <p className="text-sm text-gray-500">{expense.category} • {new Date(expense.date).toLocaleDateString()}</p>
                </div>
                <p className="font-semibold text-gray-900">{formatCurrency(expense.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {expenses.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No expenses yet</h3>
          <p className="text-gray-500 mb-6">Start tracking your expenses to see insights and manage your budget.</p>
          <button
            onClick={onAddExpense}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Add Your First Expense
          </button>
        </div>
      )}
    </div>
  );
};