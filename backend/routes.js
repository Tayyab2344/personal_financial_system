import express from 'express';
import * as authController from './controllers/authController.js';
import * as financeController from './controllers/financeController.js';
import * as chatController from './controllers/chatController.js';
import { authMiddleware } from './middleware/auth.js';

const router = express.Router();

// Health Check
router.get('/health', (req, res) => res.json({ status: "OK", timestamp: new Date() }));

// Authentication Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authMiddleware, authController.getMe);

// Finance Routes
router.get('/finance/summary', authMiddleware, financeController.getDashboardSummary);
router.post('/finance/income', authMiddleware, financeController.addIncome);
router.get('/finance/income', authMiddleware, financeController.getIncomes);
router.post('/finance/expense', authMiddleware, financeController.addExpense);
router.get('/finance/expense', authMiddleware, financeController.getExpenses);
router.delete('/finance/expense/:id', authMiddleware, financeController.deleteExpense);
router.get('/finance/goals', authMiddleware, financeController.getSavingGoals);
router.post('/finance/goals', authMiddleware, financeController.addSavingGoal);
router.post('/finance/goals/contribution', authMiddleware, financeController.addGoalContribution);
router.get('/finance/goals/:goalId/contributions', authMiddleware, financeController.getGoalContributions);
router.get('/finance/predictions', authMiddleware, financeController.getPredictions);
router.get('/finance/insights', authMiddleware, financeController.getInsights);
router.post('/finance/budget', authMiddleware, financeController.upsertBudget);

// Chat Routes
router.post('/chat/message', authMiddleware, chatController.sendMessage);
router.get('/chat/history', authMiddleware, chatController.getHistory);

export default router;
