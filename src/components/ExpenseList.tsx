import React, { useState } from 'react';
import { Search, Edit, Trash2, Users, Download, Filter } from 'lucide-react';
import { Expense, Budget } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ExpenseListProps {
  expenses: Expense[];
  budgets: Budget[];
  onEditExpense: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onAddExpense: () => void;
  onSplitExpense: (id: string) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  budgets,
  onEditExpense,
  onDeleteExpense,
  onAddExpense,
  onSplitExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const categories = [...new Set(expenses.map(expense => expense.category))];
  const months = [...new Set(expenses.map(expense => expense.date.slice(0, 7)))].sort().reverse();

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || expense.category === selectedCategory;
    const matchesMonth = !selectedMonth || expense.date.startsWith(selectedMonth);
    
    return matchesSearch && matchesCategory && matchesMonth;
  });

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const exportExpenses = () => {
    const csvContent = [
      'Date,Description,Category,Amount',
      ...filteredExpenses.map(expense => 
        `${expense.date},"${expense.description}",${expense.category},${expense.amount}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
          <p className="text-gray-600">
            {filteredExpenses.length} expenses • Total: {formatCurrency(totalAmount)}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={exportExpenses}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={onAddExpense}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Months</option>
            {months.map(month => (
              <option key={month} value={month}>
                {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setSelectedMonth('');
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No expenses found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedCategory || selectedMonth 
              ? 'Try adjusting your filters or search terms.'
              : 'Start adding expenses to see them here.'}
          </p>
          {!searchTerm && !selectedCategory && !selectedMonth && (
            <button
              onClick={onAddExpense}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Add Your First Expense
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredExpenses
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(expense => (
                <div key={expense.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{expense.description}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <span>{expense.category}</span>
                            <span>•</span>
                            <span>{new Date(expense.date).toLocaleDateString()}</span>
                            {expense.splits && expense.splits.length > 0 && (
                              <>
                                <span>•</span>
                                <div className="flex items-center space-x-1">
                                  <Users className="h-3 w-3" />
                                  <span>Split with {expense.splits.length} people</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(expense.amount)}</p>
                        {expense.splits && expense.splits.length > 0 && (
                          <p className="text-sm text-gray-500">
                            Your share: {formatCurrency(expense.amount / (expense.splits.length + 1))}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onSplitExpense(expense.id)}
                          className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                          title="Split expense"
                        >
                          <Users className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditExpense(expense.id)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit expense"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteExpense(expense.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {expense.receipt && (
                    <div className="mt-3">
                      <img
                        src={expense.receipt}
                        alt="Receipt"
                        className="h-20 w-auto rounded border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};