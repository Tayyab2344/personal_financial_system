import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { db } from './config/database.js';
import router from './routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*', // Allow all origins for dev
  credentials: true
}));
app.use(express.json());

// Bind API routes
app.use('/api', router);

// Default Route
app.get('/', (req, res) => {
  res.send('AI-Powered Personal Finance Assistant API is running.');
});

// Auto-seed mock data for demo user
async function seedDemoData() {
  try {
    const demoEmail = 'demo@finance.com';
    const existing = await db.getUserByEmail(demoEmail);
    if (existing) {
      console.log("Demo user 'demo@finance.com' already exists. Skipping seed.");
      return;
    }

    console.log("Seeding demo financial data...");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    
    // 1. Add User
    const user = await db.addUser('Demo User', demoEmail, passwordHash);
    const userId = user.id;

    // Get current month YYYY-MM
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const monthKey = `${year}-${month}`;

    // 2. Add Budgets (Savings Target)
    await db.upsertBudget(userId, monthKey, 35000); // 35k savings goal

    // 3. Add Income (Total 110,000)
    await db.addIncome(userId, 'Salary', 80000, `${monthKey}-01`);
    await db.addIncome(userId, 'Freelancing Web Dev', 30000, `${monthKey}-10`);

    // 4. Add Expenses (Total 43,200)
    await db.addExpense(userId, 'Bills', 15000, 'Electricity and Internet bill', `${monthKey}-03`);
    await db.addExpense(userId, 'Food', 12000, 'Weekly grocery shopping at Metro', `${monthKey}-05`);
    await db.addExpense(userId, 'Fuel', 5000, 'Car refueling at Total station', `${monthKey}-08`);
    await db.addExpense(userId, 'Shopping', 6200, 'Purchased new clothes', `${monthKey}-12`);
    await db.addExpense(userId, 'Entertainment', 3000, 'Movie night with friends', `${monthKey}-18`);
    await db.addExpense(userId, 'Health', 2000, 'Routine medical checkup', `${monthKey}-20`);

    // 5. Add Savings Goals
    const goal1 = await db.addSavingGoal(userId, 'New MacBook Pro', 200000, 40000, `${year + 1}-12-31`);
    const goal2 = await db.addSavingGoal(userId, 'Emergency Fund', 100000, 15000, `${year}-12-31`);

    // 6. Add Goal Contributions
    await db.addGoalContribution(userId, goal1.id, 25000, `${monthKey}-02`);
    await db.addGoalContribution(userId, goal1.id, 15000, `${monthKey}-15`);
    
    await db.addGoalContribution(userId, goal2.id, 10000, `${monthKey}-05`);
    await db.addGoalContribution(userId, goal2.id, 5000, `${monthKey}-22`);

    // 7. Add Chat History
    await db.addChatHistory(userId, "How much can I spend today?", "Based on your remaining spending budget of **Rs. 31,800** and **X** remaining days, your safe daily allowance is **Rs. Y / day**.");
    await db.addChatHistory(userId, "Can I afford a 15000 PKR monitor?", "### Affordability Analysis\n* **Cost:** Rs. 15,000\n* **Status:** Purchase Approved\n* **Details:** This purchase fits within your remaining monthly spending budget of Rs. 31,800.");

    console.log("Demo data seeded successfully! Login with 'demo@finance.com' / 'password123'");
  } catch (error) {
    console.error("Error seeding demo data:", error);
  }
}

// Start Server
db.init()
  .then(async () => {
    await seedDemoData();
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("Server startup failed - Database initialization error:", err);
  });
