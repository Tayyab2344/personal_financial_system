const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://personal-finance-system-backend.vercel.app/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // AUTHENTICATION
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  async register(name, email, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // FINANCE SUMMARY
  async getDashboardSummary(month = null) {
    const url = month ? `${API_BASE}/finance/summary?month=${month}` : `${API_BASE}/finance/summary`;
    const res = await fetch(url, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch summary');
    return data;
  },

  // INCOMES
  async getIncomes(month = null) {
    const url = month ? `${API_BASE}/finance/income?month=${month}` : `${API_BASE}/finance/income`;
    const res = await fetch(url, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch incomes');
    return data;
  },

  async addIncome(source, amount, date, account_type) {
    const res = await fetch(`${API_BASE}/finance/income`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ source, amount: parseFloat(amount), date, account_type })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add income');
    return data;
  },

  // EXPENSES
  async getExpenses(month = null) {
    const url = month ? `${API_BASE}/finance/expense?month=${month}` : `${API_BASE}/finance/expense`;
    const res = await fetch(url, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch expenses');
    return data;
  },

  async addExpense(category, amount, description, date, account_type) {
    const res = await fetch(`${API_BASE}/finance/expense`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ category, amount: parseFloat(amount), description, date, account_type })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add expense');
    return data;
  },

  async deleteExpense(id) {
    const res = await fetch(`${API_BASE}/finance/expense/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete expense');
    return data;
  },

  // SAVINGS GOALS
  async getSavingGoals() {
    const res = await fetch(`${API_BASE}/finance/goals`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch saving goals');
    return data;
  },

  async addSavingGoal(goal_name, target_amount, current_amount, target_date) {
    const res = await fetch(`${API_BASE}/finance/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        goal_name,
        target_amount: parseFloat(target_amount),
        current_amount: parseFloat(current_amount || 0),
        target_date
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add savings goal');
    return data;
  },

  async addGoalContribution(goal_id, amount, date) {
    const res = await fetch(`${API_BASE}/finance/goals/contribution`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ goal_id: parseInt(goal_id, 10), amount: parseFloat(amount), date })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add contribution');
    return data;
  },

  async getGoalContributions(goalId) {
    const res = await fetch(`${API_BASE}/finance/goals/${goalId}/contributions`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch contributions');
    return data;
  },

  // BUDGETS (SAVINGS TARGET)
  async upsertBudget(month, savings_target) {
    const res = await fetch(`${API_BASE}/finance/budget`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ month, savings_target: parseFloat(savings_target) })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update savings target');
    return data;
  },

  // PREDICTIONS
  async getPredictions() {
    const res = await fetch(`${API_BASE}/finance/predictions`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch predictions');
    return data;
  },

  // INSIGHTS
  async getInsights() {
    const res = await fetch(`${API_BASE}/finance/insights`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch insights');
    return data;
  },

  // CHATBOT
  async sendMessage(message) {
    const res = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send chat message');
    return data;
  },

  async confirmChatAction(type, params) {
    const res = await fetch(`${API_BASE}/chat/confirm`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ type, params })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to confirm chat action');
    return data;
  },

  async getChatHistory() {
    const res = await fetch(`${API_BASE}/chat/history`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch chat history');
    return data;
  },

  // ANALYTICS AND SEEDING
  async getAnalyticsDashboard() {
    const res = await fetch(`${API_BASE}/finance/analytics/dashboard`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch financial intelligence data');
    return data;
  },

  async seedMockData() {
    const res = await fetch(`${API_BASE}/finance/analytics/seed`, {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to seed mock data');
    return data;
  },

  async changePassword(oldPassword, newPassword) {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ oldPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change password');
    return data;
  },

  async resetData() {
    const res = await fetch(`${API_BASE}/finance/reset`, {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reset all data');
    return data;
  }
};
