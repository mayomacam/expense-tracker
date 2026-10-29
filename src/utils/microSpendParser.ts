import { PaymentMethod, QuickPresetChip, SpendNature } from '../types';

export const DEFAULT_MICRO_PRESETS: QuickPresetChip[] = [
  {
    id: 'chip-biscuit-1',
    title: '₹1 Biscuit / Toffee',
    amount: 1,
    category: 'cat-snacks',
    paymentMethod: 'cash',
    nature: 'want',
    icon: 'Cookie',
    tags: ['biscuit', 'micro_spend', 'cash'],
    notes: 'Micro cash spend',
  },
  {
    id: 'chip-chai-10',
    title: '₹10 Chai / Snack',
    amount: 10,
    category: 'cat-snacks',
    paymentMethod: 'upi',
    nature: 'want',
    icon: 'Coffee',
    tags: ['chai', 'tea', 'tea_stall'],
    notes: 'Daily tap tea / quick snack',
  },
  {
    id: 'chip-auto-20',
    title: '₹20 Auto / Transit',
    amount: 20,
    category: 'cat-transport',
    paymentMethod: 'upi',
    nature: 'need',
    icon: 'Bus',
    tags: ['transit', 'auto', 'commute'],
    notes: 'Local shared auto / transit ticket',
  },
  {
    id: 'chip-cab-40',
    title: '₹40 Office Cab / Shared Auto',
    amount: 40,
    category: 'cat-transport',
    paymentMethod: 'upi',
    nature: 'need',
    icon: 'Car',
    tags: ['cab', 'commute', 'office'],
    notes: 'Office commute / transit jump',
  },
  {
    id: 'chip-meal-50',
    title: '₹50 Quick Meal / Samosa',
    amount: 50,
    category: 'cat-snacks',
    paymentMethod: 'upi',
    nature: 'want',
    icon: 'Utensils',
    tags: ['snack', 'evening_bite', 'food'],
    notes: 'Evening snacks / bite',
  },
];

export interface ParsedUpiResult {
  success: boolean;
  rawText: string;
  amount: number | null;
  merchant: string;
  category: string;
  nature: SpendNature;
  paymentMethod: PaymentMethod;
  date: string;
  refNumber?: string;
  inferredTitle: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Intelligent client-side parser for Indian Bank & UPI SMS notifications
 * (HDFC, SBI, ICICI, Axis, Paytm, PhonePe, Google Pay, CRED, etc.)
 */
export function parseUpiSms(rawText: string): ParsedUpiResult {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    return {
      success: false,
      rawText: '',
      amount: null,
      merchant: '',
      category: 'cat-snacks',
      nature: 'want',
      paymentMethod: 'upi',
      date: new Date().toISOString().slice(0, 10),
      inferredTitle: 'Quick Transaction',
      confidence: 'low',
    };
  }

  // Safety bound: prevent ReDoS or excessive memory consumption from giant pastes
  const text = rawText.slice(0, 1000).trim();
  let amount: number | null = null;
  let merchant = '';
  let refNumber: string | undefined = undefined;

  // 1. Amount Extraction Regex
  // Matches: "debited by Rs 40.00", "spent INR 250", "paid Rs. 20", "vpa ... Rs.150.00", "₹ 45"
  const amountPatterns = [
    /(?:debited\s+by|spent|paid|transferred|sent|txn\s+of|purchase\s+of)\s*(?:INR|Rs\.?|₹)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i,
    /(?:INR|Rs\.?|₹)\s*([0-9]+(?:\.[0-9]{1,2})?)\s*(?:debited|spent|paid|withdrawn|transferred)?/i,
    /([0-9]+(?:\.[0-9]{1,2})?)\s*(?:INR|Rs\.?|₹)\s*(?:debited|spent)/i,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const parsed = parseFloat(match[1]);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        break;
      }
    }
  }

  // Fallback amount finder
  if (amount === null) {
    const fallbackMatch = text.match(/[₹RsINR\.]+\s*(\d+(?:\.\d{1,2})?)/i);
    if (fallbackMatch && fallbackMatch[1]) {
      amount = parseFloat(fallbackMatch[1]);
    }
  }

  // 2. Reference Number extraction (UTR / Ref / Txn ID)
  const refMatch = text.match(/(?:UPI\s+Ref|Ref\s+No|UTR|Txn\s+ID|txn)\s*[:\-]?\s*([A-Za-z0-9]+)/i);
  if (refMatch && refMatch[1]) {
    refNumber = refMatch[1];
  }

  // 3. Merchant / Beneficiary Extraction
  const merchantPatterns = [
    /(?:to|paid\s+to|transferred\s+to|at|vpa)\s+([A-Za-z0-9\s._&@'-]+?)(?:\s+on|\s+ref|\s+utr|\s+txn|\s+avl|\s+bal|\s+via|\.|$)/i,
    /(?:info[:\s]+)([A-Za-z0-9\s._&@'-]+?)(?:\s+on|\s+ref|\.|$)/i,
    /(?:swiped\s+at)\s+([A-Za-z0-9\s._&@'-]+?)(?:\s+on|\.|$)/i,
  ];

  for (const pattern of merchantPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const rawMerchant = match[1].trim();
      // Clean unwanted artifacts
      const cleaned = rawMerchant
        .replace(/^(vpa\s+|the\s+)/i, '')
        .replace(/\b(using|upi|neft|imps|card|xx\d{4})\b/gi, '')
        .trim();
      if (cleaned.length > 1 && !/^\d+$/.test(cleaned)) {
        merchant = cleaned;
        break;
      }
    }
  }

  if (!merchant) {
    merchant = 'Merchant / Store';
  }

  // 4. Payment Method Detection
  let paymentMethod: PaymentMethod = 'upi';
  if (/credit\s*card|card\s*ending|credit\s*limit/i.test(text)) {
    paymentMethod = 'credit_card';
  } else if (/debit\s*card/i.test(text)) {
    paymentMethod = 'debit_card';
  } else if (/cash|atm\s*with/i.test(text)) {
    paymentMethod = 'cash';
  } else if (/net\s*bank/i.test(text)) {
    paymentMethod = 'net_banking';
  }

  // 5. Category & Needs vs Wants Inference
  const lowerText = text.toLowerCase() + ' ' + merchant.toLowerCase();
  let category = 'cat-snacks';
  let nature: SpendNature = 'want';

  if (/(uber|ola|rapido|metro|auto|transit|irctc|petrol|fuel|indian\s*oil|hpcl|bpcl)/i.test(lowerText)) {
    category = 'cat-transport';
    nature = 'need';
  } else if (/(blinkit|zepto|instamart|bigbasket|grofers|supermarket|vegetable|grocer|milk|dairy)/i.test(lowerText)) {
    category = 'cat-groceries';
    nature = 'need';
  } else if (/(swiggy|zomato|eats|restaurant|biryani|cafe|starbucks|domino|mcdonald|pizza|burger)/i.test(lowerText)) {
    category = 'cat-dining';
    nature = 'want';
  } else if (/(pharmacy|apollo|medplus|1mg|hospital|clinic|doctor|lab)/i.test(lowerText)) {
    category = 'cat-health';
    nature = 'need';
  } else if (/(bescom|electricity|power|broadband|airtel|jio|vi|water|gas|indane|cylinder|bill)/i.test(lowerText)) {
    category = 'cat-utilities';
    nature = 'need';
  } else if (/(amazon|flipkart|myntra|zara|nykaa|shopping|cloth)/i.test(lowerText)) {
    category = 'cat-shopping';
    nature = 'want';
  } else if (/(cinema|pvr|inox|bookmyshow|netflix|spotify|youtube)/i.test(lowerText)) {
    category = 'cat-entertainment';
    nature = 'want';
  } else if (/(tea|chai|coffee|biscuit|samosa|bakery|pan|tapri|sweet)/i.test(lowerText)) {
    category = 'cat-snacks';
    nature = 'want';
  }

  // 6. Title generation
  const inferredTitle = merchant && merchant !== 'Merchant / Store'
    ? `Paid to ${merchant}`
    : amount
    ? `Quick UPI Spend (₹${amount})`
    : 'Quick UPI Spend';

  const confidence: 'high' | 'medium' | 'low' =
    amount !== null && merchant !== 'Merchant / Store'
      ? 'high'
      : amount !== null
      ? 'medium'
      : 'low';

  return {
    success: amount !== null,
    rawText: text,
    amount,
    merchant,
    category,
    nature,
    paymentMethod,
    date: new Date().toISOString().slice(0, 10),
    refNumber,
    inferredTitle,
    confidence,
  };
}
