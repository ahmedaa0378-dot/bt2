import React, { useState } from 'react';
import { Plus, X, Users, Calculator, ArrowLeft } from 'lucide-react';
import { Expense, ExpenseSplit } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ExpenseSplitterProps {
  expense: Expense | null;
  onSplitComplete: (splits: ExpenseSplit[]) => void;
  onCancel: () => void;
}

type SplitMethod = 'equal' | 'custom' | 'percentage';

export const ExpenseSplitter: React.FC<ExpenseSplitterProps> = ({
  expense,
  onSplitComplete,
  onCancel,
}) => {
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [people, setPeople] = useState<Array<{ name: string; email: string }>>([
    { name: '', email: '' }
  ]);
  const [customAmounts, setCustomAmounts] = useState<number[]>([0]);
  const [percentages, setPercentages] = useState<number[]>([50]);

  if (!expense) return null;

  const addPerson = () => {
    setPeople([...people, { name: '', email: '' }]);
    setCustomAmounts([...customAmounts, 0]);
    setPercentages([...percentages, 0]);
  };

  const removePerson = (index: number) => {
    if (people.length > 1) {
      setPeople(people.filter((_, i) => i !== index));
      setCustomAmounts(customAmounts.filter((_, i) => i !== index));
      setPercentages(percentages.filter((_, i) => i !== index));
    }
  };

  const updatePerson = (index: number, field: 'name' | 'email', value: string) => {
    const updated = [...people];
    updated[index][field] = value;
    setPeople(updated);
  };

  const updateCustomAmount = (index: number, amount: number) => {
    const updated = [...customAmounts];
    updated[index] = amount;
    setCustomAmounts(updated);
  };

  const updatePercentage = (index: number, percentage: number) => {
    const updated = [...percentages];
    updated[index] = percentage;
    setPercentages(updated);
  };

  const calculateSplits = (): ExpenseSplit[] => {
    const validPeople = people.filter(person => person.name.trim());
    
    switch (splitMethod) {
      case 'equal':
        const equalAmount = expense.amount / (validPeople.length + 1); // +1 for you
        return validPeople.map((person, index) => ({
          id: `split-${Date.now()}-${index}`,
          name: person.name,
          email: person.email,
          amount: equalAmount,
        }));

      case 'custom':
        const customTotal = customAmounts.slice(0, validPeople.length).reduce((sum, amount) => sum + amount, 0);
        const yourCustomAmount = expense.amount - customTotal;
        return validPeople.map((person, index) => ({
          id: `split-${Date.now()}-${index}`,
          name: person.name,
          email: person.email,
          amount: customAmounts[index] || 0,
        }));

      case 'percentage':
        const totalPercentage = percentages.slice(0, validPeople.length).reduce((sum, p) => sum + p, 0);
        const yourPercentage = 100 - totalPercentage;
        return validPeople.map((person, index) => ({
          id: `split-${Date.now()}-${index}`,
          name: person.name,
          email: person.email,
          amount: (expense.amount * (percentages[index] || 0)) / 100,
        }));

      default:
        return [];
    }
  };

  const splits = calculateSplits();
  const yourAmount = expense.amount - splits.reduce((sum, split) => sum + split.amount, 0);
  const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0) + yourAmount;
  const isValidSplit = Math.abs(totalSplit - expense.amount) < 0.01;

  const handleComplete = () => {
    if (isValidSplit && splits.length > 0) {
      onSplitComplete(splits);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Split Expense</h2>
              <p className="text-gray-600">{expense.description} • {formatCurrency(expense.amount)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-blue-600">
            <Users className="h-5 w-5" />
            <span className="font-medium">{people.filter(p => p.name.trim()).length + 1} people</span>
          </div>
        </div>

        {/* Split Method Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Split Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => setSplitMethod('equal')}
              className={`p-4 rounded-lg border-2 transition-all ${
                splitMethod === 'equal'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="font-medium text-gray-900">Equal Split</div>
                <div className="text-sm text-gray-500 mt-1">Split evenly among all people</div>
              </div>
            </button>

            <button
              onClick={() => setSplitMethod('custom')}
              className={`p-4 rounded-lg border-2 transition-all ${
                splitMethod === 'custom'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="font-medium text-gray-900">Custom Amounts</div>
                <div className="text-sm text-gray-500 mt-1">Set specific amounts for each person</div>
              </div>
            </button>

            <button
              onClick={() => setSplitMethod('percentage')}
              className={`p-4 rounded-lg border-2 transition-all ${
                splitMethod === 'percentage'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="font-medium text-gray-900">Percentage</div>
                <div className="text-sm text-gray-500 mt-1">Split by percentage of total</div>
              </div>
            </button>
          </div>
        </div>

        {/* People List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">People to Split With</h3>
            <button
              onClick={addPerson}
              className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Person</span>
            </button>
          </div>

          <div className="space-y-4">
            {people.map((person, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={person.name}
                    onChange={(e) => updatePerson(index, 'name', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={person.email}
                    onChange={(e) => updatePerson(index, 'email', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {splitMethod === 'custom' && (
                  <div className="w-32">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customAmounts[index] || ''}
                        onChange={(e) => updateCustomAmount(index, parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}

                {splitMethod === 'percentage' && (
                  <div className="w-24">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={percentages[index] || ''}
                        onChange={(e) => updatePercentage(index, parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>
                )}

                {splitMethod === 'equal' && person.name.trim() && (
                  <div className="w-32 text-right">
                    <span className="font-medium text-gray-900">
                      {formatCurrency(expense.amount / (people.filter(p => p.name.trim()).length + 1))}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => removePerson(index)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  disabled={people.length === 1}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        {splits.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-3 flex items-center space-x-2">
              <Calculator className="h-4 w-4" />
              <span>Split Summary</span>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">You:</span>
                <span className="font-medium text-blue-900">{formatCurrency(yourAmount)}</span>
              </div>
              {splits.map((split, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-blue-700">{split.name}:</span>
                  <span className="font-medium text-blue-900">{formatCurrency(split.amount)}</span>
                </div>
              ))}
              <div className="border-t border-blue-300 pt-2 flex justify-between text-sm font-medium">
                <span className="text-blue-900">Total:</span>
                <span className={`${isValidSplit ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalSplit)}
                </span>
              </div>
            </div>
            {!isValidSplit && (
              <p className="text-red-600 text-xs mt-2">
                ⚠️ Split amounts don't equal the total expense amount
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            disabled={!isValidSplit || splits.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Complete Split
          </button>
        </div>
      </div>
    </div>
  );
};