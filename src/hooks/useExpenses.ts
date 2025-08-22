import { useState, useEffect } from 'react';
import { Expense, ExpenseFormData } from '../types';

// Webhook configuration - replace with your actual N8N webhook URL
const WEBHOOK_URL = 'https://shyamgsundar.app.n8n.cloud/webhook/1b61f533-5d54-4eec-abc9-283c9e5c3396';

// Function to send data to webhook
const sendToWebhook = async (expense: Expense) => {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'expense_added',
        timestamp: new Date().toISOString(),
        data: expense,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log('Successfully sent expense to webhook:', expense.id);
  } catch (error) {
    console.error('Failed to send expense to webhook:', error);
    // Don't throw the error - we don't want webhook failures to break the app
  }
};

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Load expenses from localStorage on mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem('expenseTracker_expenses');
    if (savedExpenses) {
      try {
        setExpenses(JSON.parse(savedExpenses));
      } catch (error) {
        console.error('Error loading expenses from localStorage:', error);
      }
    }
  }, []);

  // Save expenses to localStorage whenever expenses change
  useEffect(() => {
    localStorage.setItem('expenseTracker_expenses', JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = async (expenseData: ExpenseFormData) => {
    const newExpense: Expense = {
      id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...expenseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setExpenses(prev => [newExpense, ...prev]);
    
    // Send to webhook asynchronously
    sendToWebhook(newExpense);
    
    return newExpense;
  };

  const updateExpense = (id: string, expenseData: Partial<ExpenseFormData & { splits?: Expense['splits'] }>) => {
    setExpenses(prev =>
      prev.map(expense =>
        expense.id === id
          ? { ...expense, ...expenseData, updatedAt: new Date().toISOString() }
          : expense
      )
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const getExpensesByCategory = (category: string) => {
    return expenses.filter(expense => expense.category === category);
  };

  const getExpensesByDateRange = (startDate: string, endDate: string) => {
    return expenses.filter(expense => 
      expense.date >= startDate && expense.date <= endDate
    );
  };

  const getTotalSpent = (startDate?: string, endDate?: string) => {
    let filteredExpenses = expenses;
    
    if (startDate && endDate) {
      filteredExpenses = getExpensesByDateRange(startDate, endDate);
    }

    return filteredExpenses.reduce((total, expense) => total + expense.amount, 0);
  };

  return {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByCategory,
    getExpensesByDateRange,
    getTotalSpent,
  };
};