import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { BudgetManager } from './components/BudgetManager';
import { ExpenseSplitter } from './components/ExpenseSplitter';
import { useExpenses } from './hooks/useExpenses';
import { useBudgets } from './hooks/useBudgets';
import { useVoiceRecording } from './hooks/useVoiceRecording';

type View = 'dashboard' | 'add-expense' | 'expenses' | 'budgets' | 'split-expense';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { budgets, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { isListening, transcript, interimTranscript, startListening, stopListening, isSupported } = useVoiceRecording();

  const selectedExpense = selectedExpenseId 
    ? expenses.find(exp => exp.id === selectedExpenseId) 
    : null;

  const handleExpenseSelect = (expenseId: string) => {
    setSelectedExpenseId(expenseId);
    setCurrentView('add-expense');
  };

  const handleExpenseSubmit = () => {
    setSelectedExpenseId(null);
    setCurrentView('expenses');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            expenses={expenses} 
            budgets={budgets}
            onAddExpense={() => setCurrentView('add-expense')}
            onViewExpenses={() => setCurrentView('expenses')}
            onManageBudgets={() => setCurrentView('budgets')}
          />
        );
      case 'add-expense':
        return (
          <ExpenseForm
            expense={selectedExpense}
            budgets={budgets}
            onSubmit={(expenseData) => {
              if (selectedExpense) {
                updateExpense(selectedExpense.id, expenseData);
              } else {
                // Handle async addExpense
                const handleAddExpense = async () => {
                  try {
                    await addExpense(expenseData);
                  } catch (error) {
                    console.error('Error adding expense:', error);
                  }
                };
                handleAddExpense();
              }
              handleExpenseSubmit();
            }}
            onCancel={() => {
              setSelectedExpenseId(null);
              setCurrentView('dashboard');
            }}
            transcript={transcript}
            interimTranscript={interimTranscript}
            isListening={isListening}
            onStartListening={startListening}
            onStopListening={stopListening}
            isVoiceSupported={isSupported}
          />
        );
      case 'expenses':
        return (
          <ExpenseList
            expenses={expenses}
            budgets={budgets}
            onEditExpense={handleExpenseSelect}
            onDeleteExpense={deleteExpense}
            onAddExpense={() => setCurrentView('add-expense')}
            onSplitExpense={(expenseId) => {
              setSelectedExpenseId(expenseId);
              setCurrentView('split-expense');
            }}
          />
        );
      case 'budgets':
        return (
          <BudgetManager
            budgets={budgets}
            expenses={expenses}
            onAddBudget={addBudget}
            onUpdateBudget={updateBudget}
            onDeleteBudget={deleteBudget}
          />
        );
      case 'split-expense':
        return (
          <ExpenseSplitter
            expense={selectedExpense}
            onSplitComplete={(splits) => {
              if (selectedExpense) {
                updateExpense(selectedExpense.id, { ...selectedExpense, splits });
              }
              setSelectedExpenseId(null);
              setCurrentView('expenses');
            }}
            onCancel={() => {
              setSelectedExpenseId(null);
              setCurrentView('expenses');
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView}
        isListening={isListening}
      />
      <main className="container mx-auto px-4 py-6">
        {renderCurrentView()}
      </main>
    </div>
  );
}

export default App;