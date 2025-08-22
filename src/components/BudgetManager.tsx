import React, { useState } from 'react';
import { Plus, Edit, Trash2, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { Budget, Expense, BudgetFormData } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getBudgetProgress, getCategorySpending } from '../utils/budgetUtils';

interface BudgetManagerProps {
  budgets: Budget[];
  expenses: Expense[];
  onAddBudget: (budget: BudgetFormData) => void;
  onUpdateBudget: (id: string, budget: BudgetFormData) => void;
  onDeleteBudget: (id: string) => void;
}

const categories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Business',
  'Other'
];

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  budgets,
  expenses,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState<BudgetFormData>({
    category: '',
    limit: 0,
    period: 'monthly',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyExpenses = expenses.filter(expense => 
    expense.date.startsWith(currentMonth)
  );

  const budgetStats = budgets.map(budget => {
    const spent = getCategorySpending(monthlyExpenses, budget.category);
    const progress = getBudgetProgress(spent, budget.limit);
    const remaining = budget.limit - spent;
    
    return {
      ...budget,
      spent,
      progress,
      remaining,
      status: progress > 100 ? 'over' : progress > 80 ? 'warning' : 'good'
    };
  });

  const resetForm = () => {
    setFormData({ category: '', limit: 0, period: 'monthly' });
    setEditingBudget(null);
    setErrors({});
    setShowForm(false);
  };

  const handleEdit = (budget: Budget) => {
    setFormData({
      category: budget.category,
      limit: budget.limit,
      period: budget.period,
    });
    setEditingBudget(budget);
    setShowForm(true);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (formData.limit <= 0) {
      newErrors.limit = 'Budget limit must be greater than 0';
    }

    // Check for duplicate category (when creating new)
    if (!editingBudget && budgets.some(b => b.category === formData.category)) {
      newErrors.category = 'Budget for this category already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      if (editingBudget) {
        onUpdateBudget(editingBudget.id, formData);
      } else {
        onAddBudget(formData);
      }
      resetForm();
    }
  };

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const totalSpent = budgetStats.reduce((sum, budget) => sum + budget.spent, 0);
  const overBudgetCount = budgetStats.filter(budget => budget.status === 'over').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Management</h2>
          <p className="text-gray-600">
            {budgets.length} active budgets • {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)} spent
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Budget</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalBudget)}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Over Budget</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{overBudgetCount}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Budget Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingBudget ? 'Edit Budget' : 'Add New Budget'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={!!editingBudget}
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Limit
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.limit || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, limit: parseFloat(e.target.value) || 0 }))}
                    className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.limit ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {errors.limit && (
                  <p className="mt-1 text-sm text-red-600">{errors.limit}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value as 'monthly' | 'weekly' }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {editingBudget ? 'Update Budget' : 'Add Budget'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget List */}
      {budgetStats.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No budgets set</h3>
          <p className="text-gray-500 mb-6">Create your first budget to start tracking your spending limits.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create Your First Budget
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {budgetStats.map(budget => (
            <div key={budget.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{budget.category}</h3>
                  <p className="text-sm text-gray-500 capitalize">{budget.period} budget</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(budget)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit budget"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteBudget(budget.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete budget"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {formatCurrency(budget.spent)} of {formatCurrency(budget.limit)}
                  </span>
                  <span className={`font-medium ${
                    budget.status === 'over' ? 'text-red-600' : 
                    budget.status === 'warning' ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {budget.progress.toFixed(1)}%
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      budget.status === 'over' ? 'bg-red-500' :
                      budget.status === 'warning' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budget.progress, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className={`font-medium ${
                    budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {budget.remaining >= 0 
                      ? `${formatCurrency(budget.remaining)} remaining`
                      : `${formatCurrency(Math.abs(budget.remaining))} over budget`
                    }
                  </span>
                  {budget.status === 'over' && (
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-xs">Over budget</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};