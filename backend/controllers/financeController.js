import { db } from '../config/database.js';
import { financialEngine } from '../services/financialEngine.js';

export const getDashboardSummary = async (req, res) => {
  const userId = req.user.id;
  const { month } = req.query; // YYYY-MM
  try {
    const summary = await financialEngine.calculateSummary(userId, month);
    res.json(summary);
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({ error: "Failed to retrieve dashboard summary." });
  }
};

export const addIncome = async (req, res) => {
  const userId = req.user.id;
  const { source, amount, date } = req.body;
  
  if (!source || !amount) {
    return res.status(400).json({ error: "Source and amount are required." });
  }

  try {
    const income = await db.addIncome(userId, source, amount, date);
    res.status(201).json(income);
  } catch (error) {
    console.error("Add income error:", error);
    res.status(500).json({ error: "Failed to add income." });
  }
};

export const getIncomes = async (req, res) => {
  const userId = req.user.id;
  const { month } = req.query; // YYYY-MM
  try {
    const list = await db.getIncomes(userId, month);
    res.json(list);
  } catch (error) {
    console.error("Get incomes error:", error);
    res.status(500).json({ error: "Failed to retrieve incomes." });
  }
};

export const addExpense = async (req, res) => {
  const userId = req.user.id;
  const { category, amount, description, date } = req.body;

  if (!category || !amount) {
    return res.status(400).json({ error: "Category and amount are required." });
  }

  try {
    const expense = await db.addExpense(userId, category, amount, description, date);
    res.status(201).json(expense);
  } catch (error) {
    console.error("Add expense error:", error);
    res.status(500).json({ error: "Failed to add expense." });
  }
};

export const getExpenses = async (req, res) => {
  const userId = req.user.id;
  const { month } = req.query; // YYYY-MM
  try {
    const list = await db.getExpenses(userId, month);
    res.json(list);
  } catch (error) {
    console.error("Get expenses error:", error);
    res.status(500).json({ error: "Failed to retrieve expenses." });
  }
};

export const deleteExpense = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const deleted = await db.deleteExpense(userId, id);
    if (!deleted) {
      return res.status(404).json({ error: "Expense not found or access denied." });
    }
    res.json({ message: "Expense deleted successfully." });
  } catch (error) {
    console.error("Delete expense error:", error);
    res.status(500).json({ error: "Failed to delete expense." });
  }
};

export const getSavingGoals = async (req, res) => {
  const userId = req.user.id;
  try {
    const list = await db.getSavingGoals(userId);
    res.json(list);
  } catch (error) {
    console.error("Get saving goals error:", error);
    res.status(500).json({ error: "Failed to retrieve saving goals." });
  }
};

export const addSavingGoal = async (req, res) => {
  const userId = req.user.id;
  const { goal_name, target_amount, current_amount, target_date } = req.body;

  if (!goal_name || !target_amount || !target_date) {
    return res.status(400).json({ error: "Goal name, target amount, and target date are required." });
  }

  try {
    const goal = await db.addSavingGoal(userId, goal_name, target_amount, current_amount || 0.00, target_date);
    res.status(201).json(goal);
  } catch (error) {
    console.error("Add saving goal error:", error);
    res.status(500).json({ error: "Failed to add saving goal." });
  }
};

export const addGoalContribution = async (req, res) => {
  const userId = req.user.id;
  const { goal_id, amount, date } = req.body;

  if (!goal_id || !amount) {
    return res.status(400).json({ error: "Goal ID and contribution amount are required." });
  }

  try {
    const result = await db.addGoalContribution(userId, goal_id, amount, date);
    res.status(201).json(result);
  } catch (error) {
    console.error("Add goal contribution error:", error);
    res.status(500).json({ error: error.message || "Failed to add goal contribution." });
  }
};

export const getGoalContributions = async (req, res) => {
  const { goalId } = req.params;
  try {
    const list = await db.getGoalContributions(goalId);
    res.json(list);
  } catch (error) {
    console.error("Get contributions error:", error);
    res.status(500).json({ error: "Failed to retrieve goal contributions." });
  }
};

export const getPredictions = async (req, res) => {
  const userId = req.user.id;
  try {
    const predictions = await financialEngine.getPredictions(userId);
    res.json(predictions);
  } catch (error) {
    console.error("Get predictions error:", error);
    res.status(500).json({ error: "Failed to generate financial predictions." });
  }
};

export const getInsights = async (req, res) => {
  const userId = req.user.id;
  try {
    const insights = await financialEngine.getInsights(userId);
    res.json(insights);
  } catch (error) {
    console.error("Get insights error:", error);
    res.status(500).json({ error: "Failed to generate financial insights." });
  }
};

export const upsertBudget = async (req, res) => {
  const userId = req.user.id;
  const { month, savings_target } = req.body;

  if (!month || savings_target === undefined) {
    return res.status(400).json({ error: "Month (YYYY-MM) and savings target are required." });
  }

  try {
    const budget = await db.upsertBudget(userId, month, savings_target);
    res.json(budget);
  } catch (error) {
    console.error("Upsert budget error:", error);
    res.status(500).json({ error: "Failed to set savings target." });
  }
};
