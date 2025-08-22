import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Upload, X, Save, ArrowLeft } from 'lucide-react';
import { ExpenseFormData } from '../types';
import { formatCurrency } from '../utils/formatters';
import { processVoiceTranscriptWithLLM } from '../utils/llmProcessor';

interface ExpenseFormProps {
  expense?: any;
  budgets: any[];
  onSubmit: (expense: ExpenseFormData) => void;
  onCancel: () => void;
  transcript: string;
  interimTranscript?: string;
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  isVoiceSupported: boolean;
}

const categoryMappings = {
  'Food & Dining': ['food', 'dining', 'restaurant', 'lunch', 'dinner', 'breakfast', 'coffee', 'cafe', 'pizza', 'burger', 'meal', 'snack', 'grocery', 'groceries'],
  'Transportation': ['gas', 'fuel', 'uber', 'taxi', 'bus', 'train', 'parking', 'car', 'transport', 'metro', 'subway', 'flight', 'airline'],
  'Shopping': ['shopping', 'clothes', 'clothing', 'shoes', 'amazon', 'store', 'mall', 'purchase', 'buy', 'bought'],
  'Entertainment': ['movie', 'cinema', 'theater', 'concert', 'game', 'entertainment', 'fun', 'party', 'bar', 'club', 'music'],
  'Bills & Utilities': ['bill', 'utility', 'electric', 'electricity', 'water', 'internet', 'phone', 'rent', 'mortgage', 'insurance'],
  'Healthcare': ['doctor', 'hospital', 'medical', 'medicine', 'pharmacy', 'dentist', 'health', 'clinic', 'prescription', 'checkup'],
  'Travel': ['hotel', 'vacation', 'trip', 'travel', 'flight', 'booking', 'airbnb', 'resort'],
  'Education': ['school', 'education', 'book', 'course', 'tuition', 'class', 'learning', 'university', 'college'],
  'Business': ['business', 'office', 'work', 'meeting', 'conference', 'supplies', 'equipment'],
  'Other': []
};

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

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  expense,
  budgets,
  onSubmit,
  onCancel,
  transcript,
  interimTranscript = '',
  isListening,
  onStartListening,
  onStopListening,
  isVoiceSupported,
}) => {
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: '',
    amount: 0,
    category: '',
    date: new Date().toISOString().split('T')[0],
    receipt: null,
  });

  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasProcessedTranscript, setHasProcessedTranscript] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        receipt: expense.receipt,
      });
      if (expense.receipt) {
        setReceiptPreview(expense.receipt);
      }
    }
  }, [expense]);

  useEffect(() => {
    if (transcript && transcript.trim() && !isListening && !hasProcessedTranscript && !isProcessingVoice) {
      processVoiceInput(transcript);
      setHasProcessedTranscript(true);
    }
  }, [transcript, isListening, hasProcessedTranscript, isProcessingVoice]);

  useEffect(() => {
    if (isListening) {
      setHasProcessedTranscript(false);
    }
  }, [isListening]);

  const processVoiceInput = async (text: string) => {
    setIsProcessingVoice(true);
    
    try {
      const result = await processVoiceTranscriptWithLLM(text);
      
      if (result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          description: result.data!.description || prev.description,
          amount: result.data!.amount > 0 ? result.data!.amount : prev.amount,
          category: result.data!.category || prev.category,
          date: result.data!.date || prev.date,
        }));
      } else {
        console.error('Voice processing failed:', result.error);
        // Show error to user
        setErrors(prev => ({ ...prev, voice: result.error || 'Failed to process voice input' }));
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      setErrors(prev => ({ ...prev, voice: 'Failed to process voice input' }));
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Handle async submission
      const submitExpense = async () => {
        try {
          await onSubmit(formData);
        } catch (error) {
          console.error('Error submitting expense:', error);
          // You could show an error message to the user here
        }
      };
      
      submitExpense();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setFormData(prev => ({ ...prev, receipt: result }));
        setReceiptPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReceipt = () => {
    setFormData(prev => ({ ...prev, receipt: null }));
    setReceiptPreview(null);
  };

  const getBudgetStatus = (category: string) => {
    const budget = budgets.find(b => b.category === category);
    if (!budget) return null;

    const currentMonth = new Date().toISOString().slice(0, 7);
    // This would normally come from props, but for demo purposes:
    const spent = 0; // You'd calculate this from expenses
    const remaining = budget.limit - spent - formData.amount;
    const willExceed = remaining < 0;

    return { budget, remaining, willExceed };
  };

  const budgetStatus = formData.category ? getBudgetStatus(formData.category) : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {expense ? 'Edit Expense' : 'Add Expense'}
            </h2>
          </div>

          {isVoiceSupported && (
            <button
              onClick={isListening ? onStopListening : onStartListening}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isListening
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4" />
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  <span>Voice Input</span>
                </>
              )}
            </button>
          )}
        </div>

        {(transcript || interimTranscript) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            {isProcessingVoice && (
              <div className="flex items-center space-x-2 mb-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-700 font-medium">Processing with AI...</span>
              </div>
            )}
            <p className="text-sm text-blue-700">
              <span className="font-medium">
                {isListening ? 'Listening...' : 'Voice Input:'}
              </span> {transcript}
              {interimTranscript && (
                <span className="text-blue-500 italic"> {interimTranscript}</span>
              )}
            </p>
          </div>
        )}

        {errors.voice && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-700">⚠️ {errors.voice}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Lunch at cafe, Gas for car..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.category ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {budgetStatus && (
            <div className={`p-4 rounded-lg border ${
              budgetStatus.willExceed 
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              <p className="text-sm font-medium">
                {budgetStatus.willExceed 
                  ? `⚠️ This expense will exceed your ${formData.category} budget by ${formatCurrency(Math.abs(budgetStatus.remaining))}`
                  : `✅ ${formatCurrency(budgetStatus.remaining)} remaining in ${formData.category} budget`
                }
              </p>
            </div>
          )}

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.date ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt (Optional)
            </label>
            {receiptPreview ? (
              <div className="relative">
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  className="w-full h-48 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={removeReceipt}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="text-sm text-gray-500">Click to upload receipt</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{expense ? 'Update' : 'Save'} Expense</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};