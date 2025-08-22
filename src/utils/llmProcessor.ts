interface ExpenseData {
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface LLMResponse {
  success: boolean;
  data?: ExpenseData;
  error?: string;
}

const EXPENSE_CATEGORIES = [
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

export const processVoiceTranscriptWithLLM = async (transcript: string): Promise<LLMResponse> => {
  try {
    // Create a comprehensive prompt for the LLM
    const prompt = `
You are an intelligent expense tracking assistant. Parse the following voice transcript and extract expense information.

Voice Transcript: "${transcript}"

Available Categories: ${EXPENSE_CATEGORIES.join(', ')}

Instructions:
1. Extract a clean, descriptive title for the expense (remove filler words, amounts, dates)
2. Identify the amount spent (look for numbers, dollar signs, currency mentions)
3. Choose the most appropriate category from the available list
4. Determine the date (today, yesterday, specific dates, or default to today)
5. Handle natural language variations and context

Examples:
- "I spent fifteen dollars on lunch at McDonald's today" → Description: "Lunch at McDonald's", Amount: 15.00, Category: "Food & Dining", Date: today
- "Doctor appointment cost me one hundred fifty bucks yesterday" → Description: "Doctor appointment", Amount: 150.00, Category: "Healthcare", Date: yesterday
- "Bought gas for forty five dollars" → Description: "Gas", Amount: 45.00, Category: "Transportation", Date: today
- "Movie tickets were twenty eight dollars on January 15th" → Description: "Movie tickets", Amount: 28.00, Category: "Entertainment", Date: 2024-01-15

Return ONLY a JSON object with this exact structure:
{
  "description": "Clean expense description",
  "amount": 0.00,
  "category": "Exact category from list",
  "date": "YYYY-MM-DD format"
}

If you cannot parse the transcript properly, return:
{
  "error": "Could not parse expense information"
}
`;

    // Use a free LLM API or fallback to local processing
    const response = await callLLMAPI(prompt);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data
      };
    } else {
      // Fallback to enhanced local processing if LLM fails
      return processTranscriptLocally(transcript);
    }
  } catch (error) {
    console.error('LLM processing failed:', error);
    // Fallback to enhanced local processing
    return processTranscriptLocally(transcript);
  }
};

// Enhanced local processing as fallback
const processTranscriptLocally = (transcript: string): LLMResponse => {
  try {
    // Validate input
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return {
        success: false,
        error: 'Empty or invalid transcript'
      };
    }
    
    const lowerText = transcript.toLowerCase();
    
    // Enhanced amount extraction
    const amountPatterns = [
      /\$(\d+(?:\.\d{1,2})?)/,
      /(\d+(?:\.\d{1,2})?) dollars?/,
      /(\d+(?:\.\d{1,2})?) bucks?/,
      /(\d+(?:\.\d{1,2})?) USD/i,
      /(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand) dollars?/,
      /(\d+(?:\.\d{1,2})?)/
    ];
    
    let amount = 0;
    let amountText = '';
    
    for (const pattern of amountPatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        if (match[1]) {
          if (isNaN(Number(match[1]))) {
            amount = convertWordToNumber(match[1]);
          } else {
            amount = parseFloat(match[1]);
          }
          amountText = match[0];
          break;
        }
      }
    }
    
    // Enhanced category detection with context
    const categoryMappings = {
      'Food & Dining': [
        'food', 'dining', 'restaurant', 'lunch', 'dinner', 'breakfast', 'coffee', 'cafe', 'pizza', 
        'burger', 'meal', 'snack', 'grocery', 'groceries', 'mcdonalds', 'starbucks', 'subway',
        'eat', 'ate', 'hungry', 'kitchen', 'cooking', 'recipe', 'takeout', 'delivery', 'uber eats',
        'doordash', 'grubhub', 'fast food', 'fine dining', 'buffet', 'brunch'
      ],
      'Healthcare': [
        'doctor', 'doctors', 'dr', 'hospital', 'medical', 'medicine', 'pharmacy', 'dentist', 'health', 'clinic',
        'prescription', 'checkup', 'appointment', 'surgery', 'treatment', 'therapy', 'insurance',
        'copay', 'deductible', 'medication', 'pills', 'vaccine', 'examination', 'specialist',
        'visit', 'consultation', 'physician', 'nurse', 'patient', 'diagnosis', 'symptoms',
        'medical bill', 'healthcare', 'wellness', 'physical', 'blood test', 'x-ray', 'scan'
      ],
      'Transportation': [
        'gas', 'fuel', 'uber', 'taxi', 'bus', 'train', 'parking', 'car', 'transport', 'metro',
        'subway', 'flight', 'airline', 'lyft', 'vehicle', 'maintenance', 'repair', 'oil change',
        'registration', 'insurance', 'toll', 'bridge', 'highway', 'commute'
      ],
      'Shopping': [
        'shopping', 'clothes', 'clothing', 'shoes', 'amazon', 'store', 'mall', 'purchase', 'buy',
        'bought', 'target', 'walmart', 'costco', 'online', 'retail', 'fashion', 'accessories',
        'electronics', 'gadget', 'phone', 'computer', 'laptop'
      ],
      'Entertainment': [
        'movie', 'cinema', 'theater', 'concert', 'game', 'entertainment', 'fun', 'party', 'bar',
        'club', 'music', 'netflix', 'spotify', 'streaming', 'tickets', 'show', 'performance',
        'sports', 'hobby', 'recreation', 'amusement', 'festival'
      ],
      'Bills & Utilities': [
        'bill', 'utility', 'electric', 'electricity', 'water', 'internet', 'phone', 'rent',
        'mortgage', 'insurance', 'cable', 'subscription', 'monthly', 'payment', 'service',
        'maintenance', 'repair', 'home', 'house', 'apartment'
      ],
      'Travel': [
        'hotel', 'vacation', 'trip', 'travel', 'flight', 'booking', 'airbnb', 'resort',
        'tourism', 'holiday', 'destination', 'luggage', 'passport', 'visa', 'cruise',
        'adventure', 'sightseeing', 'accommodation'
      ],
      'Education': [
        'school', 'education', 'book', 'course', 'tuition', 'class', 'learning', 'university',
        'college', 'student', 'textbook', 'supplies', 'workshop', 'seminar', 'training',
        'certification', 'degree', 'academic'
      ],
      'Business': [
        'business', 'office', 'work', 'meeting', 'conference', 'supplies', 'equipment',
        'professional', 'client', 'project', 'service', 'consulting', 'networking',
        'presentation', 'software', 'tools'
      ]
    };
    
    let detectedCategory = 'Other';
    let maxScore = 0;
    
    for (const [category, keywords] of Object.entries(categoryMappings)) {
      let score = 0;
      
      // Check for exact keyword matches and partial matches
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          // Give higher score for longer, more specific keywords
          score += keyword.length > 6 ? 3 : keyword.length > 4 ? 2 : 1;
          
          // Bonus for exact word boundaries
          const wordBoundaryRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (wordBoundaryRegex.test(lowerText)) {
            score += 2;
          }
        }
      }
      
      // Special handling for common phrases
      if (category === 'Healthcare') {
        if (lowerText.includes('doctor') && lowerText.includes('visit')) score += 5;
        if (lowerText.includes('medical') && lowerText.includes('appointment')) score += 5;
        if (lowerText.includes('dentist') && lowerText.includes('visit')) score += 5;
      }
      
      if (score > maxScore) {
        maxScore = score;
        detectedCategory = category;
      }
    }
    
    // Enhanced date extraction
    const today = new Date();
    let detectedDate = today.toISOString().split('T')[0];
    
    if (lowerText.includes('yesterday')) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      detectedDate = yesterday.toISOString().split('T')[0];
    } else if (lowerText.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      detectedDate = tomorrow.toISOString().split('T')[0];
    }
    
    // Month and day extraction
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                       'july', 'august', 'september', 'october', 'november', 'december'];
    const monthAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    
    for (let i = 0; i < monthNames.length; i++) {
      const patterns = [
        new RegExp(`(${monthNames[i]}|${monthAbbr[i]})\\s+(\\d{1,2})`, 'i'),
        new RegExp(`(\\d{1,2})(st|nd|rd|th)?\\s+(${monthNames[i]}|${monthAbbr[i]})`, 'i')
      ];
      
      for (const pattern of patterns) {
        const match = lowerText.match(pattern);
        if (match) {
          const dayStr = match[2] || match[1];
          const day = parseInt(dayStr);
          
          // Validate day is a valid number and within reasonable range
          if (!isNaN(day) && day >= 1 && day <= 31) {
            const date = new Date(today.getFullYear(), i, day);
            
            // Check if the constructed date is valid
            if (!isNaN(date.getTime()) && date.getMonth() === i) {
              detectedDate = date.toISOString().split('T')[0];
              break;
            }
          }
        }
      }
    }
    
    // Clean description
    let description = transcript;
    
    // Remove amount references
    if (amountText) {
      description = description.replace(new RegExp(amountText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
    }
    
    // Remove category keywords
    if (detectedCategory !== 'Other') {
      const keywords = categoryMappings[detectedCategory as keyof typeof categoryMappings];
      keywords.forEach(keyword => {
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        description = description.replace(new RegExp(`\\b${escapedKeyword}\\b`, 'gi'), '');
      });
    }
    
    // Remove date references and clean up
    description = description
      .replace(/\b(today|yesterday|tomorrow)\b/gi, '')
      .replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/gi, '')
      .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}\b/gi, '')
      .replace(/\b\d{1,2}(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi, '')
      .replace(/\b(for|on|at|in|the|a|an|and|or|to|from|with|by|spent|cost|paid|dollars?|bucks?|USD)\b/gi, '')
      .replace(/\s+/g, ' ')
      .replace(/^\s*[,.-]\s*/, '')
      .replace(/\s*[,.-]\s*$/, '')
      .trim();
    
    // Capitalize first letter
    if (description) {
      description = description.charAt(0).toUpperCase() + description.slice(1);
    }
    
    // Fallback to original if description is empty
    if (!description) {
      description = transcript.replace(/\$?\d+(?:\.\d{1,2})?/g, '').trim();
      if (description) {
        description = description.charAt(0).toUpperCase() + description.slice(1);
      } else {
        description = 'Expense';
      }
    }
    
    return {
      success: true,
      data: {
        description,
        amount,
        category: detectedCategory,
        date: detectedDate
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to process transcript'
    };
  }
};

// Convert word numbers to digits
const convertWordToNumber = (word: string): number => {
  const numbers: { [key: string]: number } = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
    'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000
  };
  
  return numbers[word.toLowerCase()] || 0;
};

// Mock LLM API call - replace with actual LLM service
const callLLMAPI = async (prompt: string): Promise<LLMResponse> => {
  // This would be replaced with actual LLM API calls like OpenAI, Anthropic, etc.
  // For now, we'll use the enhanced local processing
  return {
    success: false,
    error: 'LLM API not configured - using local processing'
  };
};