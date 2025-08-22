import React from 'react';
import { Mic, MicOff, DollarSign, BarChart3, Plus, List, Target, Users } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: any) => void;
  isListening: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, isListening }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'add-expense', label: 'Add', icon: Plus },
    { id: 'expenses', label: 'Expenses', icon: List },
    { id: 'budgets', label: 'Budgets', icon: Target },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">ExpenseTracker</h1>
            </div>
            {isListening && (
              <div className="flex items-center space-x-2 text-red-500">
                <Mic className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">Listening...</span>
              </div>
            )}
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onViewChange(id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  currentView === id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="md:hidden">
            <button
              onClick={() => onViewChange('add-expense')}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="md:hidden border-t border-gray-200">
          <div className="flex items-center justify-around py-2">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onViewChange(id)}
                className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg transition-all duration-200 ${
                  currentView === id
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};