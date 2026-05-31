import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPostgres = !!process.env.DATABASE_URL;
let pool = null;

const JSON_DB_DIR = path.join(__dirname, '../data');
const JSON_DB_PATH = path.join(JSON_DB_DIR, 'db.json');

// Initialize JSON database fallback file if not exists
function initJsonDb() {
  if (!fs.existsSync(JSON_DB_DIR)) {
    fs.mkdirSync(JSON_DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(JSON_DB_PATH)) {
    const initialSchema = {
      users: [],
      incomes: [],
      expenses: [],
      saving_goals: [],
      goal_contributions: [],
      chat_history: [],
      budgets: []
    };
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(initialSchema, null, 2), 'utf8');
  }
}

// Helper to read JSON DB
function readJsonDb() {
  initJsonDb();
  try {
    const data = fs.readFileSync(JSON_DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading JSON DB:", error);
    return {
      users: [],
      incomes: [],
      expenses: [],
      saving_goals: [],
      goal_contributions: [],
      chat_history: [],
      budgets: []
    };
  }
}

// Helper to write JSON DB
function writeJsonDb(data) {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Error writing JSON DB:", error);
  }
}

if (isPostgres) {
  console.log("Database Mode: PostgreSQL (Neon)");
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  console.log("Database Mode: Fallback JSON Storage (backend/data/db.json)");
  initJsonDb();
}

export const db = {
  async init() {
    if (!isPostgres) {
      // JSON mode: already initialized
      return;
    }

    // Postgres: Create tables if they do not exist
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS incomes (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          source VARCHAR(255) NOT NULL,
          amount DECIMAL(12, 2) NOT NULL,
          date DATE NOT NULL
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS expenses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          category VARCHAR(100) NOT NULL,
          amount DECIMAL(12, 2) NOT NULL,
          description TEXT,
          date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      try {
        await client.query('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');
      } catch (err) {
        // Column may already exist
      }

      await client.query(`
        CREATE TABLE IF NOT EXISTS saving_goals (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          goal_name VARCHAR(255) NOT NULL,
          target_amount DECIMAL(12, 2) NOT NULL,
          current_amount DECIMAL(12, 2) DEFAULT 0.00,
          target_date DATE NOT NULL
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS goal_contributions (
          id SERIAL PRIMARY KEY,
          goal_id INTEGER REFERENCES saving_goals(id) ON DELETE CASCADE,
          amount DECIMAL(12, 2) NOT NULL,
          contribution_date DATE NOT NULL
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_history (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          response TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS budgets (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
          savings_target DECIMAL(12, 2) NOT NULL,
          UNIQUE(user_id, month)
        );
      `);
      console.log("PostgreSQL database schemas verified/created successfully.");
    } catch (err) {
      console.error("Error creating database tables:", err);
    } finally {
      client.release();
    }
  },

  // USER OPERATIONS
  async addUser(name, email, passwordHash) {
    if (isPostgres) {
      const res = await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
        [name, email, passwordHash]
      );
      return res.rows[0];
    } else {
      const dbData = readJsonDb();
      const newUser = {
        id: dbData.users.length + 1,
        name,
        email,
        password: passwordHash,
        created_at: new Date().toISOString()
      };
      dbData.users.push(newUser);
      writeJsonDb(dbData);
      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    }
  },

  async getUserByEmail(email) {
    if (isPostgres) {
      const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return res.rows[0] || null;
    } else {
      const dbData = readJsonDb();
      const user = dbData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      return user || null;
    }
  },

  async getUserById(id) {
    const intId = parseInt(id, 10);
    if (isPostgres) {
      const res = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [intId]);
      return res.rows[0] || null;
    } else {
      const dbData = readJsonDb();
      const user = dbData.users.find(u => u.id === intId);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      return null;
    }
  },

  // INCOME OPERATIONS
  async addIncome(userId, source, amount, date) {
    const decAmount = parseFloat(amount);
    const intUserId = parseInt(userId, 10);
    const formattedDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    if (isPostgres) {
      const res = await pool.query(
        'INSERT INTO incomes (user_id, source, amount, date) VALUES ($1, $2, $3, $4) RETURNING *',
        [intUserId, source, decAmount, formattedDate]
      );
      return res.rows[0];
    } else {
      const dbData = readJsonDb();
      const newIncome = {
        id: dbData.incomes.length + 1,
        user_id: intUserId,
        source,
        amount: decAmount,
        date: formattedDate
      };
      dbData.incomes.push(newIncome);
      writeJsonDb(dbData);
      return newIncome;
    }
  },

  async getIncomes(userId, month = null) {
    const intUserId = parseInt(userId, 10);
    if (isPostgres) {
      let query = 'SELECT * FROM incomes WHERE user_id = $1';
      const params = [intUserId];
      if (month) {
        query += " AND TO_CHAR(date, 'YYYY-MM') = $2";
        params.push(month);
      }
      query += ' ORDER BY date DESC, id DESC';
      const res = await pool.query(query, params);
      return res.rows.map(r => ({ ...r, amount: parseFloat(r.amount) }));
    } else {
      const dbData = readJsonDb();
      let list = dbData.incomes.filter(i => i.user_id === intUserId);
      if (month) {
        list = list.filter(i => i.date.substring(0, 7) === month);
      }
      return list.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    }
  },

  // EXPENSE OPERATIONS
  async addExpense(userId, category, amount, description, date, createdAt = null) {
    const decAmount = parseFloat(amount);
    const intUserId = parseInt(userId, 10);
    const formattedDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const finalCreatedAt = createdAt ? new Date(createdAt).toISOString() : new Date().toISOString();

    if (isPostgres) {
      const res = await pool.query(
        'INSERT INTO expenses (user_id, category, amount, description, date, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [intUserId, category, decAmount, description || '', formattedDate, finalCreatedAt]
      );
      return res.rows[0];
    } else {
      const dbData = readJsonDb();
      const newExpense = {
        id: dbData.expenses.length + 1,
        user_id: intUserId,
        category,
        amount: decAmount,
        description: description || '',
        date: formattedDate,
        created_at: finalCreatedAt
      };
      dbData.expenses.push(newExpense);
      writeJsonDb(dbData);
      return newExpense;
    }
  },

  async getExpenses(userId, month = null) {
    const intUserId = parseInt(userId, 10);
    if (isPostgres) {
      let query = 'SELECT * FROM expenses WHERE user_id = $1';
      const params = [intUserId];
      if (month) {
        query += " AND TO_CHAR(date, 'YYYY-MM') = $2";
        params.push(month);
      }
      query += ' ORDER BY date DESC, id DESC';
      const res = await pool.query(query, params);
      return res.rows.map(r => ({ ...r, amount: parseFloat(r.amount) }));
    } else {
      const dbData = readJsonDb();
      let list = dbData.expenses.filter(e => e.user_id === intUserId);
      if (month) {
        list = list.filter(e => e.date.substring(0, 7) === month);
      }
      return list.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    }
  },

  async deleteExpense(userId, expenseId) {
    const intUserId = parseInt(userId, 10);
    const intExpenseId = parseInt(expenseId, 10);
    if (isPostgres) {
      await pool.query('DELETE FROM expenses WHERE id = $1 AND user_id = $2', [intExpenseId, intUserId]);
      return true;
    } else {
      const dbData = readJsonDb();
      const initialLength = dbData.expenses.length;
      dbData.expenses = dbData.expenses.filter(e => !(e.id === intExpenseId && e.user_id === intUserId));
      writeJsonDb(dbData);
      return dbData.expenses.length < initialLength;
    }
  },

  // SAVINGS GOALS OPERATIONS
  async addSavingGoal(userId, goalName, targetAmount, currentAmount = 0.00, targetDate) {
    const intUserId = parseInt(userId, 10);
    const decTarget = parseFloat(targetAmount);
    const decCurrent = parseFloat(currentAmount);
    const formattedDate = targetDate ? new Date(targetDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    if (isPostgres) {
      const res = await pool.query(
        'INSERT INTO saving_goals (user_id, goal_name, target_amount, current_amount, target_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [intUserId, goalName, decTarget, decCurrent, formattedDate]
      );
      return res.rows[0];
    } else {
      const dbData = readJsonDb();
      const newGoal = {
        id: dbData.saving_goals.length + 1,
        user_id: intUserId,
        goal_name: goalName,
        target_amount: decTarget,
        current_amount: decCurrent,
        target_date: formattedDate
      };
      dbData.saving_goals.push(newGoal);
      writeJsonDb(dbData);
      return newGoal;
    }
  },

  async getSavingGoals(userId) {
    const intUserId = parseInt(userId, 10);
    if (isPostgres) {
      const res = await pool.query('SELECT * FROM saving_goals WHERE user_id = $1 ORDER BY id DESC', [intUserId]);
      return res.rows.map(r => ({
        ...r,
        target_amount: parseFloat(r.target_amount),
        current_amount: parseFloat(r.current_amount)
      }));
    } else {
      const dbData = readJsonDb();
      return dbData.saving_goals.filter(g => g.user_id === intUserId).sort((a, b) => b.id - a.id);
    }
  },

  async updateSavingGoalCurrentAmount(userId, goalId, newAmount) {
    const intUserId = parseInt(userId, 10);
    const intGoalId = parseInt(goalId, 10);
    const decAmount = parseFloat(newAmount);

    if (isPostgres) {
      const res = await pool.query(
        'UPDATE saving_goals SET current_amount = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [decAmount, intGoalId, intUserId]
      );
      return res.rows[0] || null;
    } else {
      const dbData = readJsonDb();
      const goal = dbData.saving_goals.find(g => g.id === intGoalId && g.user_id === intUserId);
      if (goal) {
        goal.current_amount = decAmount;
        writeJsonDb(dbData);
        return goal;
      }
      return null;
    }
  },

  async addGoalContribution(userId, goalId, amount, date) {
    const intUserId = parseInt(userId, 10);
    const intGoalId = parseInt(goalId, 10);
    const decAmount = parseFloat(amount);
    const formattedDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    if (isPostgres) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        // Check ownership
        const goalCheck = await client.query('SELECT * FROM saving_goals WHERE id = $1 AND user_id = $2', [intGoalId, intUserId]);
        if (goalCheck.rows.length === 0) {
          throw new Error("Goal not found or access denied");
        }
        // Insert contribution
        const contribRes = await client.query(
          'INSERT INTO goal_contributions (goal_id, amount, contribution_date) VALUES ($1, $2, $3) RETURNING *',
          [intGoalId, decAmount, formattedDate]
        );
        // Update goal current amount
        const updatedGoalRes = await client.query(
          'UPDATE saving_goals SET current_amount = current_amount + $1 WHERE id = $2 RETURNING *',
          [decAmount, intGoalId]
        );
        await client.query('COMMIT');
        return {
          contribution: contribRes.rows[0],
          goal: updatedGoalRes.rows[0]
        };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      const dbData = readJsonDb();
      const goalIndex = dbData.saving_goals.findIndex(g => g.id === intGoalId && g.user_id === intUserId);
      if (goalIndex === -1) {
        throw new Error("Goal not found or access denied");
      }
      const goal = dbData.saving_goals[goalIndex];
      const newContrib = {
        id: dbData.goal_contributions.length + 1,
        goal_id: intGoalId,
        amount: decAmount,
        contribution_date: formattedDate
      };
      dbData.goal_contributions.push(newContrib);
      goal.current_amount += decAmount;
      writeJsonDb(dbData);
      return {
        contribution: newContrib,
        goal: goal
      };
    }
  },

  async getGoalContributions(goalId) {
    const intGoalId = parseInt(goalId, 10);
    if (isPostgres) {
      const res = await pool.query('SELECT * FROM goal_contributions WHERE goal_id = $1 ORDER BY contribution_date DESC, id DESC', [intGoalId]);
      return res.rows.map(r => ({ ...r, amount: parseFloat(r.amount) }));
    } else {
      const dbData = readJsonDb();
      return dbData.goal_contributions.filter(c => c.goal_id === intGoalId).sort((a, b) => b.contribution_date.localeCompare(a.contribution_date) || b.id - a.id);
    }
  },

  // CHAT HISTORY OPERATIONS
  async getChatHistory(userId, limit = 50) {
    const intUserId = parseInt(userId, 10);
    if (isPostgres) {
      const res = await pool.query('SELECT * FROM chat_history WHERE user_id = $1 ORDER BY timestamp ASC LIMIT $2', [intUserId, limit]);
      return res.rows;
    } else {
      const dbData = readJsonDb();
      const list = dbData.chat_history.filter(h => h.user_id === intUserId);
      return list.slice(-limit);
    }
  },

  async addChatHistory(userId, message, response) {
    const intUserId = parseInt(userId, 10);
    if (isPostgres) {
      const res = await pool.query(
        'INSERT INTO chat_history (user_id, message, response) VALUES ($1, $2, $3) RETURNING *',
        [intUserId, message, response]
      );
      return res.rows[0];
    } else {
      const dbData = readJsonDb();
      const newChat = {
        id: dbData.chat_history.length + 1,
        user_id: intUserId,
        message,
        response,
        timestamp: new Date().toISOString()
      };
      dbData.chat_history.push(newChat);
      writeJsonDb(dbData);
      return newChat;
    }
  },

  // BUDGET OPERATIONS
  async getBudget(userId, month) {
    const intUserId = parseInt(userId, 10);
    if (isPostgres) {
      const res = await pool.query('SELECT * FROM budgets WHERE user_id = $1 AND month = $2', [intUserId, month]);
      if (res.rows.length > 0) {
        return { ...res.rows[0], savings_target: parseFloat(res.rows[0].savings_target) };
      }
      return null;
    } else {
      const dbData = readJsonDb();
      const budget = dbData.budgets.find(b => b.user_id === intUserId && b.month === month);
      return budget || null;
    }
  },

  async getBudgets(userId) {
    const intUserId = parseInt(userId, 10);
    if (isPostgres) {
      const res = await pool.query('SELECT * FROM budgets WHERE user_id = $1 ORDER BY month DESC', [intUserId]);
      return res.rows.map(r => ({ ...r, savings_target: parseFloat(r.savings_target) }));
    } else {
      const dbData = readJsonDb();
      return dbData.budgets.filter(b => b.user_id === intUserId).sort((a, b) => b.month.localeCompare(a.month));
    }
  },

  async clearUserData(userId) {
    const intUserId = parseInt(userId, 10);
    if (isPostgres) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM goal_contributions WHERE goal_id IN (SELECT id FROM saving_goals WHERE user_id = $1)', [intUserId]);
        await client.query('DELETE FROM saving_goals WHERE user_id = $1', [intUserId]);
        await client.query('DELETE FROM expenses WHERE user_id = $1', [intUserId]);
        await client.query('DELETE FROM incomes WHERE user_id = $1', [intUserId]);
        await client.query('DELETE FROM budgets WHERE user_id = $1', [intUserId]);
        await client.query('DELETE FROM chat_history WHERE user_id = $1', [intUserId]);
        await client.query('COMMIT');
        return true;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      const dbData = readJsonDb();
      dbData.expenses = dbData.expenses.filter(e => e.user_id !== intUserId);
      dbData.incomes = dbData.incomes.filter(i => i.user_id !== intUserId);
      
      const userGoalIds = dbData.saving_goals.filter(g => g.user_id === intUserId).map(g => g.id);
      dbData.goal_contributions = dbData.goal_contributions.filter(c => !userGoalIds.includes(c.goal_id));
      dbData.saving_goals = dbData.saving_goals.filter(g => g.user_id !== intUserId);
      dbData.budgets = dbData.budgets.filter(b => b.user_id !== intUserId);
      dbData.chat_history = dbData.chat_history.filter(h => h.user_id !== intUserId);
      
      writeJsonDb(dbData);
      return true;
    }
  },

  async upsertBudget(userId, month, savingsTarget) {
    const intUserId = parseInt(userId, 10);
    const decTarget = parseFloat(savingsTarget);

    if (isPostgres) {
      const res = await pool.query(`
        INSERT INTO budgets (user_id, month, savings_target)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, month)
        DO UPDATE SET savings_target = EXCLUDED.savings_target
        RETURNING *
      `, [intUserId, month, decTarget]);
      return { ...res.rows[0], savings_target: parseFloat(res.rows[0].savings_target) };
    } else {
      const dbData = readJsonDb();
      let budget = dbData.budgets.find(b => b.user_id === intUserId && b.month === month);
      if (budget) {
        budget.savings_target = decTarget;
      } else {
        budget = {
          id: dbData.budgets.length + 1,
          user_id: intUserId,
          month,
          savings_target: decTarget
        };
        dbData.budgets.push(budget);
      }
      writeJsonDb(dbData);
      return budget;
    }
  }
};
