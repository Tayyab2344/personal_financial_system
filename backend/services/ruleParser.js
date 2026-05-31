export const ruleParser = {
  parse(message) {
    const text = message.trim().replace(/\s+/g, ' ');

    // 1. Add Income
    // e.g. "add income 50000 salary", "add income 2000 freelancing"
    const addIncomeRegex = /^\s*add\s+income\s+(\d+(?:\.\d+)?)\s*(?:pkr|rs|rupees)?\s+(.+)$/i;
    let match = text.match(addIncomeRegex);
    if (match) {
      return {
        matched: true,
        intent: 'ADD_INCOME',
        params: {
          amount: parseFloat(match[1]),
          source: match[2].trim()
        }
      };
    }

    // 2. Add Expense
    // e.g. "add expense 1200 fuel", "add expense 500 food"
    const addExpenseRegex = /^\s*add\s+expense\s+(\d+(?:\.\d+)?)\s*(?:pkr|rs|rupees)?\s+(.+)$/i;
    match = text.match(addExpenseRegex);
    if (match) {
      return {
        matched: true,
        intent: 'ADD_EXPENSE',
        params: {
          amount: parseFloat(match[1]),
          category: this.normalizeCategory(match[2].trim())
        }
      };
    }

    // 3. Affordability Check
    // e.g. "can i afford a 5000 PKR course?", "can i afford 150000 laptop"
    const affordRegex = /^\s*can\s+i\s+afford\s+(?:a\s+)?(\d+(?:\.\d+)?)\s*(?:pkr|rs|rupees)?\s+(.+)\??$/i;
    match = text.match(affordRegex);
    if (match) {
      return {
        matched: true,
        intent: 'AFFORDABILITY_CHECK',
        params: {
          amount: parseFloat(match[1]),
          item: match[2].trim().replace(/\?$/, '')
        }
      };
    }

    // 4. Daily Spending Allowance
    // e.g. "how much can i spend today?", "how much spend today"
    const dailyAllowanceRegex = /^\s*how\s+much\s+(?:can\s+)?i\s+spend\s+today\s*\??$/i;
    if (dailyAllowanceRegex.test(text)) {
      return {
        matched: true,
        intent: 'DAILY_ALLOWANCE',
        params: {}
      };
    }

    // 5. Savings Goal Status
    // e.g. "will i achieve my savings goal?"
    const savingsRegex = /^\s*(?:will\s+)?i\s+achieve\s+(?:my\s+)?savings?\s+goals?\s*\??$/i;
    if (savingsRegex.test(text)) {
      return {
        matched: true,
        intent: 'SAVINGS_GOAL_STATUS',
        params: {}
      };
    }

    // 6. Show Expenses Month
    // e.g. "show expenses this month", "show expenses month"
    const showExpensesRegex = /^\s*show\s+expenses(?:\s+this)?\s+month\s*$/i;
    if (showExpensesRegex.test(text)) {
      return {
        matched: true,
        intent: 'SHOW_EXPENSES_MONTH',
        params: {}
      };
    }

    // 7. Show Spending Category
    // e.g. "show spending by category"
    const showCategoryRegex = /^\s*show\s+spending\s+by\s+category\s*$/i;
    if (showCategoryRegex.test(text)) {
      return {
        matched: true,
        intent: 'SHOW_SPENDING_CATEGORY',
        params: {}
      };
    }

    // 8. Show Budget Summary
    // e.g. "show budget summary", "budget summary"
    const budgetSummaryRegex = /^\s*(?:show\s+)?budget\s+summary\s*$/i;
    if (budgetSummaryRegex.test(text)) {
      return {
        matched: true,
        intent: 'BUDGET_SUMMARY',
        params: {}
      };
    }

    // 9. Help Command
    const helpRegex = /^\s*(?:help|commands|menu)\s*$/i;
    if (helpRegex.test(text)) {
      return {
        matched: true,
        intent: 'HELP',
        params: {}
      };
    }

    return {
      matched: false,
      intent: 'UNKNOWN',
      params: {}
    };
  },

  normalizeCategory(cat) {
    const validCategories = [
      'Food', 'Fuel', 'Transport', 'Education', 'Shopping',
      'Bills', 'Entertainment', 'Health', 'Other'
    ];
    const cleanCat = cat.trim().toLowerCase();
    
    // Find matching category
    const found = validCategories.find(c => c.toLowerCase() === cleanCat);
    if (found) return found;

    // Handle mapping/synonyms
    if (['dining', 'restaurant', 'groceries', 'eat', 'coffee'].includes(cleanCat)) return 'Food';
    if (['petrol', 'diesel', 'gas'].includes(cleanCat)) return 'Fuel';
    if (['taxi', 'bus', 'uber', 'metro', 'fare', 'ride'].includes(cleanCat)) return 'Transport';
    if (['school', 'college', 'course', 'book', 'fees', 'university'].includes(cleanCat)) return 'Education';
    if (['clothes', 'shoes', 'purchased', 'buy', 'dress'].includes(cleanCat)) return 'Shopping';
    if (['electricity', 'water', 'gas bill', 'internet', 'rent', 'utility'].includes(cleanCat)) return 'Bills';
    if (['movie', 'fun', 'game', 'club', 'trip', 'play'].includes(cleanCat)) return 'Entertainment';
    if (['medicine', 'doctor', 'clinic', 'hospital', 'gym', 'fitness'].includes(cleanCat)) return 'Health';

    return 'Other';
  }
};
