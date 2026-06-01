import '../index.css';

export const metadata = {
  title: 'FinGPT - AI-Powered Personal Finance Assistant',
  description: 'Manage your personal finance, track budgets, expenses, and savings goals with the power of AI insights.',
  keywords: 'finance, budget, chatbot, expense tracker, AI insights, savings goals',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="bg-darkBg text-gray-100 font-sans antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
