import { db } from '../config/database.js';
import { aiService } from '../services/aiService.js';
import { financialEngine } from '../services/financialEngine.js';

export const sendMessage = async (req, res) => {
  const userId = req.user.id;
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    // 1. Extract intent and parameters via AI Service (Hybrid: Gemini/Grok/Rule-based Regex)
    const extraction = await aiService.extractIntent(message);
    const { intent, params, isAiMode } = extraction;
    let responseText = extraction.reply; // default to AI conversational response if present

    // 2. Perform action based on intent
    if (intent === 'ADD_INCOME') {
      const { amount, source } = params;
      if (!amount || !source) {
        responseText = "I detected that you want to add income, but I couldn't extract the amount or source. Please try like this: **'Add income 50000 salary'**";
      } else {
        const income = await db.addIncome(userId, source, amount);
        responseText = `Added income of **Rs. ${income.amount.toLocaleString()}** from **${income.source}** for this month!`;
      }
    } 
    
    else if (intent === 'ADD_EXPENSE') {
      const { amount, category } = params;
      if (!amount || !category) {
        responseText = "I detected that you want to add an expense, but I couldn't extract the amount or category. Please try like this: **'Add expense 1200 fuel'**";
      } else {
        const expense = await db.addExpense(userId, category, amount, `Added via chatbot: ${message}`);
        responseText = `Logged expense of **Rs. ${expense.amount.toLocaleString()}** under **${expense.category}** category.`;
      }
    } 
    
    else if (intent === 'AFFORDABILITY_CHECK') {
      const { amount, item } = params;
      if (!amount || !item) {
        responseText = "I detected you want to check affordability, but I couldn't extract the cost or the item. Please try: **'Can I afford a 5000 PKR course?'**";
      } else {
        const check = await financialEngine.checkAffordability(userId, amount, item);
        responseText = `### Affordability Analysis: **${check.itemDescription}**\n\n` +
                       `* **Cost:** Rs. ${check.purchaseAmount.toLocaleString()}\n` +
                       `* **Status:** **${check.recommendation}**\n` +
                       `* **Savings Goal Impact:** ${check.savingsStatus}\n\n` +
                       `**Details:** ${check.reason}`;
      }
    } 
    
    else if (intent === 'DAILY_ALLOWANCE') {
      const summary = await financialEngine.calculateSummary(userId);
      if (summary.totalIncome === 0) {
        responseText = "You haven't recorded any income for this month yet, so your daily allowance is Rs. 0. Use **'Add income 50000 salary'** to set up your budget!";
      } else {
        responseText = `Based on your remaining spending budget of **Rs. ${summary.budgetRemaining.toLocaleString()}** and **${summary.remainingDays}** remaining days this month, your safe daily spending limit is **Rs. ${summary.dailySpendingAllowance.toLocaleString()} per day**.`;
      }
    } 
    
    else if (intent === 'SAVINGS_GOAL_STATUS') {
      const predictions = await financialEngine.getPredictions(userId);
      const summary = await financialEngine.calculateSummary(userId);
      if (summary.goalsCount === 0) {
        responseText = "You do not have any active savings goals yet. You can create a savings goal in the Savings Dashboard tab!";
      } else {
        responseText = `### Savings Goals & Target Prediction:\n\n` +
                       `* **Current Progress:** **${summary.savingsProgress}%** achieved across active goals.\n` +
                       `* **Target Status:** ${predictions.savingsStatusMessage}\n` +
                       `* **Pace:** You are saving at a rate of **${predictions.spendingSpeed}** relative to your timeline.`;
      }
    } 
    
    else if (intent === 'SHOW_EXPENSES_MONTH') {
      const summary = await financialEngine.calculateSummary(userId);
      responseText = `This month, you have spent **Rs. ${summary.totalExpenses.toLocaleString()}** out of your available spending budget of **Rs. ${summary.availableBudget.toLocaleString()}**.\n` +
                     `You have **Rs. ${summary.budgetRemaining.toLocaleString()}** remaining for the rest of the month.`;
    } 
    
    else if (intent === 'SHOW_SPENDING_CATEGORY') {
      const summary = await financialEngine.calculateSummary(userId);
      const expenses = await db.getExpenses(userId, summary.month);
      
      if (expenses.length === 0) {
        responseText = "You have no expenses recorded for this month yet!";
      } else {
        const categoryTotals = {};
        expenses.forEach(e => {
          categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
        });

        let breakdown = `### Spending Breakdown by Category for ${summary.month}:\n\n`;
        Object.keys(categoryTotals)
          .sort((a, b) => categoryTotals[b] - categoryTotals[a])
          .forEach(cat => {
            const amount = categoryTotals[cat];
            const pct = summary.totalExpenses > 0 ? ((amount / summary.totalExpenses) * 100).toFixed(1) : 0;
            breakdown += `* **${cat}:** Rs. ${amount.toLocaleString()} (${pct}%)\n`;
          });
        breakdown += `\n**Total Expenses:** Rs. ${summary.totalExpenses.toLocaleString()}`;
        responseText = breakdown;
      }
    } 
    
    else if (intent === 'BUDGET_SUMMARY') {
      const summary = await financialEngine.calculateSummary(userId);
      responseText = `### Budget Summary for ${summary.month}:\n\n` +
                     `* **Total Income:** Rs. ${summary.totalIncome.toLocaleString()}\n` +
                     `* **Reserved Savings Target:** Rs. ${summary.savingsTarget.toLocaleString()}\n` +
                     `* **Available Spending Budget:** Rs. ${summary.availableBudget.toLocaleString()}\n` +
                     `* **Total Expenses to Date:** Rs. ${summary.totalExpenses.toLocaleString()}\n` +
                     `* **Remaining Budget:** Rs. ${summary.budgetRemaining.toLocaleString()}\n\n` +
                     `*Daily Spending Limit: Rs. ${summary.dailySpendingAllowance.toLocaleString()} / day*`;
    }

    else if (intent === 'HELP') {
      responseText = `### Supported Chat Commands:\n\n` +
                     `* **Add Income:** 'Add income 50000 salary'\n` +
                     `* **Add Expense:** 'Add expense 1200 fuel' (Categories: Food, Fuel, Transport, Education, Shopping, Bills, Entertainment, Health, Other)\n` +
                     `* **Check Affordability:** 'Can I afford a 5000 PKR course?' or 'Can I buy a 2500 PKR game?'\n` +
                     `* **Daily Allowance:** 'How much can I spend today?'\n` +
                     `* **Savings Goal Status:** 'Will I achieve my savings goal?'\n` +
                     `* **Budget Summary:** 'Show budget summary'\n` +
                     `* **Expenses Log:** 'Show expenses this month'\n` +
                     `* **Category Breakdown:** 'Show spending by category'`;
    }

    // Default conversational responses
    if (!responseText) {
      responseText = "I'm not sure how to process that. You can type **'help'** to see a list of commands I can handle, or try adding a transaction (e.g. **'Add expense 1200 fuel'**).";
    }

    // 3. Save Chat History
    await db.addChatHistory(userId, message, responseText);

    // 4. Retrieve updated chat history (limit 20) to keep client synchronized
    const chatHistory = await db.getChatHistory(userId, 20);

    res.json({
      message,
      response: responseText,
      intent,
      isAiMode,
      chatHistory
    });

  } catch (error) {
    console.error("Chat message error:", error);
    res.status(500).json({ error: "An error occurred while processing your message." });
  }
};

export const getHistory = async (req, res) => {
  const userId = req.user.id;
  try {
    const list = await db.getChatHistory(userId, 50);
    res.json(list);
  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({ error: "Failed to retrieve chat history." });
  }
};
