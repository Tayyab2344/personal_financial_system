# FinGPT - AI-Powered Personal Finance Assistant

FinGPT is an intelligent, web-based personal finance management platform. It combines traditional budgeting metrics, interactive charts, predictive modeling, and an AI-powered conversational chatbot to help you take absolute control of your financial destiny.

Unlike basic expense trackers, FinGPT answers decision-making questions: *How much can I spend today? Can I afford this purchase? When will I reach my savings goal?*

---

## 🌟 Key Features

*   **⚡ Active Daily Spending Allowance**: A dynamic limit that updates in real time as you log expenses, showing exactly how much you can spend today.
*   **📊 Interactive Financial Analytics**: Category pie charts and daily trend bar graphs powered by Recharts.
*   **🎯 Savings Goals & Progresstimelines**: Set targets (e.g., MacBook, Vacation), log contributions, and see estimated completion forecasts.
*   **🧠 Hybrid Conversational Assistant**:
    *   **AI Mode**: Uses Gemini API (or Grok) to extract transaction inputs and analyze queries.
    *   **Fallback Mode**: Automatically switches to an offline regex-based parser when API keys are not configured or limits are hit.
*   **🔮 End-of-Month Forecasts**: Projects monthly spending based on your daily rate, providing warning indicators if you are on track to overspend.
*   **💡 Actionable Money Insights**: Scans your records to highlight high category spends (e.g. food > 30%), fast spending paces, and goal achievements.

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite), Tailwind CSS v3, Recharts, Lucide Icons, Glassmorphic Glass-UI.
*   **Backend**: Node.js, Express.js (ES Modules).
*   **Database**:
    *   **PostgreSQL (Neon)**: Standard relational production database.
    *   **JSON-File Fallback (Zero Config)**: Auto-switches to local JSON storage if no Postgres URL is provided, allowing instant execution.
*   **Authentication**: JSON Web Token (JWT) with hashed password storage (Bcrypt).
*   **AI Providers**: Google Gemini API & xAI Grok API.

---

## 📂 Project Structure

```
personal_financial_system/
├── package.json               # Root scripts to control client & server concurrently
├── .gitignore                 # Excludes node_modules, envs, and local mock database files
├── backend/                   # Node/Express API Server
│   ├── server.js              # Server entry point with auto-seeding routine
│   ├── routes.js              # Endpoint routing configuration
│   ├── .env.example           # Environment variables template
│   ├── config/
│   │   └── database.js        # PostgreSQL / JSON-file unified DB interface
│   ├── controllers/
│   │   ├── authController.js  # JWT Login & Registration
│   │   ├── financeController.js# Transaction REST operations
│   │   └── chatController.js  # Chatbot intent routing
│   └── services/
│       ├── financialEngine.js # Calculations for budget, allowance, & predictions
│       ├── aiService.js       # Gemini/Grok API client integration
│       └── ruleParser.js      # Offline regex-based parser
└── frontend/                  # React Vite Client
    ├── tailwind.config.js     # Tailwind layout & custom theme styles
    ├── src/
    │   ├── index.css          # Global styling, scrollbars, & animations
    │   ├── App.jsx            # Routing, auth panels, and dashboard navigation
    │   ├── utils/
    │   │   └── api.js         # API client handler
    │   └── components/
    │       ├── DashboardHome.jsx     # Financial totals & daily allowance gauge
    │       ├── ExpenseAnalytics.jsx  # Recharts graphs & search tables
    │       ├── SavingsDashboard.jsx  # Progress timelines & goal deposits
    │       ├── InsightsDashboard.jsx # Risk profiles & warning insights
    │       └── Chatbot.jsx           # Conversational bubble panels
```

---

## 🚀 Step-by-Step Installation

### 1. Prerequisite
Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Install Dependencies
Run the install command from the root directory to automatically install packages for the root, backend, and frontend:
```bash
# Installs root, backend, and frontend dependencies
npm run install:all
```

### 3. Environment Setup (Optional)
If you want to use the AI chatbot (Gemini/Grok) or a remote database (PostgreSQL), create a `.env` file in the `/backend` folder based on [backend/.env.example](file:///e:/coding/personal_financial_system/backend/.env.example):
```env
PORT=5000
JWT_SECRET=your_custom_jwt_secret

# Leave blank to use local fallback JSON database (backend/data/db.json)
DATABASE_URL=your_postgres_neon_connection_string

# Leave blank to use Rule-Based Regex Parser Fallback
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key
GROK_API_KEY=your_grok_key
```

### 4. Start the Application
To run both backend and frontend servers concurrently, execute:
```bash
npm run dev
```
*   **Backend Server**: running on [http://localhost:5000](http://localhost:5000)
*   **Frontend Client**: running on [http://localhost:5173](http://localhost:5173)

---

## 🔑 Demo Account (With Mock History)

To help you inspect the visual dashboards immediately without entering data manually, the application **auto-seeds a demo user** when first initialized:

*   **Email**: `demo@finance.com`
*   **Password**: `password123`

Logging in with this account will automatically load:
1.  **Salary & Freelancing** income streams.
2.  **Bills, Food, Fuel, Shopping** historical expense records.
3.  Active **MacBook Pro** and **Emergency Fund** goals with contribution logs.
4.  Calculated predictions, risk alerts, and category warnings.

---

## 💬 Supported Chat Commands

The chatbot supports both natural conversation (AI Mode) and exact shorthand inputs (Fallback Mode):

*   **Add Income**: `Add income 50000 salary`
*   **Add Expense**: `Add expense 1200 fuel` (Categories: *Food, Fuel, Transport, Education, Shopping, Bills, Entertainment, Health, Other*)
*   **Affordability Checks**: `Can I afford a 15000 PKR monitor?`
*   **Allowance**: `How much can I spend today?`
*   **Savings Milestones**: `Will I achieve my savings goal?`
*   **Visual logs**: `Show spending by category` or `Show expenses this month`
*   **Help**: `help`
