import { useState, useEffect } from 'react';
import { Budget, BudgetFormData } from '../types';

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Load budgets from localStorage on mount
  useEffect(() => {
    const savedBudgets = localStorage.getItem('expenseTracker_budgets');
    if (savedBudgets) {
      try {
        setBudgets(JSON.parse(savedBudgets));
      } catch (error) {
        console.error('Error loading budgets from localStorage:', error);
      }
    }
  }, []);

  // Save budgets to localStorage whenever budgets change
  useEffect(() => {
    localStorage.setItem('expenseTracker_budgets', JSON.stringify(budgets));
  }, [budgets]);

  const addBudget = (budgetData: BudgetFormData) => {
    const newBudget: Budget = {
      id: `budget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...budgetData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setBudgets(prev => [newBudget, ...prev]);
    return newBudget;
  };

  const updateBudget = (id: string, budgetData: Partial<BudgetFormData>) => {
    setBudgets(prev =>
      prev.map(budget =>
        budget.id === id
          ? { ...budget, ...budgetData, updatedAt: new Date().toISOString() }
          : budget
      )
    );
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(budget => budget.id !== id));
  };

  const getBudgetByCategory = (category: string) => {
    return budgets.find(budget => budget.category === category);
  };

  return {
    budgets,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetByCategory,
  };
};