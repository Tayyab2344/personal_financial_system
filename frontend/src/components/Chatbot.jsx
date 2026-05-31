import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { Send, Sparkles, AlertCircle, Cpu, Bot, User, Trash2, ArrowDownCircle } from 'lucide-react';

const SUGGESTIONS = [
  "How much can I spend today?",
  "Can I afford a 5000 PKR course?",
  "Show budget summary",
  "Will I achieve my savings goal?",
  "Add expense 1200 fuel",
  "Show spending by category",
  "Show expenses this month"
];

export default function Chatbot({ triggerRefresh, refreshCount }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAiMode, setIsAiMode] = useState(true); // Default to AI mode (will update from API response)
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, [refreshCount]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const history = await api.getChatHistory();
      // Map database schema {message, response, timestamp} to chat UI schema
      const mapped = [];
      history.forEach((h, idx) => {
        mapped.push({ id: `user-${idx}`, text: h.message, isBot: false });
        mapped.push({ id: `bot-${idx}`, text: h.response, isBot: true });
      });
      
      // If no history, add a welcoming bot message
      if (mapped.length === 0) {
        mapped.push({
          id: 'welcome',
          text: "Hello! I am your AI Financial Assistant. 🧠💸\n\nI can help you add transactions, evaluate budgets, analyze affordability, and provide savings estimates. Try asking: **'How much can I spend today?'** or type **'help'** to see my commands.",
          isBot: true
        });
      }
      setMessages(mapped);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) setInput('');
    
    // Clear any active pending actions in existing messages to ensure only the latest is active
    setMessages(prev => prev.map(m => m.pendingAction ? { ...m, pendingAction: null } : m));

    // Add user message to UI immediately
    const userMsg = { id: `user-${Date.now()}`, text, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    
    setLoading(true);
    try {
      const data = await api.sendMessage(text);
      
      // Update system mode indicator
      setIsAiMode(data.isAiMode);

      // Add bot response to UI, saving pendingAction if present
      const botMsg = { 
        id: `bot-${Date.now()}`, 
        text: data.response, 
        isBot: true,
        pendingAction: data.pendingAction 
      };
      setMessages(prev => [...prev, botMsg]);
      
      // Trigger dashboard updates ONLY if a transaction was completed immediately (no pending action)
      if (data.intent && data.intent !== 'CHAT' && data.intent !== 'UNKNOWN' && !data.pendingAction) {
        triggerRefresh();
      }
    } catch (err) {
      const errorMsg = { id: `bot-err-${Date.now()}`, text: `Failed to connect to assistant: ${err.message}`, isBot: true, isError: true };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (msgId, pendingAction) => {
    setLoading(true);
    try {
      const data = await api.confirmChatAction(pendingAction.type, pendingAction.params);
      
      // Update the specific message to remove its pendingAction state
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, pendingAction: null } : m));
      
      // Add confirm response to chat list
      const confirmMsg = { id: `bot-confirm-${Date.now()}`, text: data.response, isBot: true };
      setMessages(prev => [...prev, confirmMsg]);
      
      // Trigger dashboard update since transaction is now saved
      triggerRefresh();
    } catch (err) {
      const errorMsg = { id: `bot-err-${Date.now()}`, text: `Failed to confirm action: ${err.message}`, isBot: true, isError: true };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAction = (msgId) => {
    // Clear pendingAction
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, pendingAction: null } : m));
    
    // Add cancel text
    const cancelMsg = { id: `bot-cancel-${Date.now()}`, text: "❌ Transaction cancelled.", isBot: true };
    setMessages(prev => [...prev, cancelMsg]);
  };

  // Convert markdown-like stars **bold** and ### headers for neat bot responses
  const renderMessageText = (text) => {
    // split by lines
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content = line;
      let isHeader = false;
      let isBullet = false;

      if (line.startsWith('### ')) {
        content = line.substring(4);
        isHeader = true;
      } else if (line.startsWith('* ')) {
        content = line.substring(2);
        isBullet = true;
      }

      // Handle bold formatting **text**
      const parts = content.split('**');
      const formattedParts = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={pIdx} className="text-white font-extrabold">{part}</strong>;
        }
        return part;
      });

      if (isHeader) {
        return <h4 key={idx} className="text-sm font-black text-blue-400 mt-2 mb-1 uppercase tracking-wider">{formattedParts}</h4>;
      }
      if (isBullet) {
        return (
          <li key={idx} className="list-disc list-inside text-gray-300 pl-2 leading-relaxed text-xs">
            {formattedParts}
          </li>
        );
      }
      return <p key={idx} className="leading-relaxed text-xs mb-1.5">{formattedParts}</p>;
    });
  };

  return (
    <div className="glass-card rounded-xl flex flex-col h-[550px] border border-white/5 overflow-hidden">
      {/* Header with Mode indicator */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg">
            <Bot className="h-5 w-5 animate-float" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-none">Financial Chatbot</h3>
            <span className="text-[10px] text-gray-400">Ask questions or run commands</span>
          </div>
        </div>

        {/* Engine status indicator pill */}
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 ${
            isAiMode 
              ? 'bg-blue-950/40 border-blue-800/40 text-blue-300' 
              : 'bg-amber-950/40 border-amber-800/40 text-amber-300'
          }`}>
            {isAiMode ? <Sparkles className="h-2.5 w-2.5" /> : <Cpu className="h-2.5 w-2.5" />}
            {isAiMode ? 'AI Engine Mode' : 'Fallback Engine Mode'}
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/20 scroll-container">
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={`flex gap-3 max-w-[85%] ${msg.isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
          >
            <div className={`p-2 rounded-lg h-fit flex-shrink-0 border ${
              msg.isBot 
                ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' 
                : 'bg-purple-600/10 border-purple-500/20 text-purple-400'
            }`}>
              {msg.isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            
            <div className={`p-3.5 rounded-xl border text-sm shadow-sm ${
              msg.isBot 
                ? (msg.isError ? 'bg-red-950/20 border-red-800/30 text-red-300' : 'bg-slate-900/60 border-white/5 text-gray-200')
                : 'bg-blue-600/20 border-blue-500/20 text-blue-100 font-medium'
            }`}>
              {msg.isBot ? renderMessageText(msg.text) : <p className="text-xs leading-relaxed">{msg.text}</p>}
              
              {msg.isBot && msg.pendingAction && (
                <div className="mt-3.5 pt-3 border-t border-white/5 flex gap-2">
                  <button 
                    onClick={() => handleConfirmAction(msg.id, msg.pendingAction)}
                    disabled={loading}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/50 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-glow-emerald flex items-center gap-1 cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button 
                    onClick={() => handleCancelAction(msg.id)}
                    disabled={loading}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:text-gray-500 text-gray-300 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 max-w-[85%] mr-auto items-center">
            <div className="p-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg animate-pulse">
              <Bot className="h-4 w-4" />
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-gray-400 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              Processing...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="p-3 border-t border-white/5 bg-slate-900/20 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none scroll-container">
        {SUGGESTIONS.map((s, idx) => (
          <button 
            key={idx}
            onClick={() => handleSend(s)}
            className="px-2.5 py-1 bg-slate-900 border border-white/10 rounded-full text-[10px] font-bold text-gray-400 hover:text-white hover:border-blue-500/40 hover:bg-blue-950/10 transition-all flex items-center gap-1"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="p-3 border-t border-white/5 bg-slate-900/40 flex gap-2"
      >
        <input 
          type="text" 
          placeholder="Ask e.g. 'Can I buy a 5000 PKR game?'..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 glass-input px-3.5 py-2 text-xs"
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-gray-500 text-white rounded-lg transition-all flex items-center justify-center shadow-glow-blue"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
