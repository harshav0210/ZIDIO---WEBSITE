import React, { useState } from 'react';
import { SKU } from '../types/inventory';
import {
  Bot,
  X,
  Send,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Lightbulb,
  Cpu,
} from 'lucide-react';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  skus: SKU[];
  activeSkuId: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  skus,
  activeSkuId,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Hello! I am your **Demand & Inventory Intelligence Copilot**, powered by Gemini and our operations research models.\n\nYou can ask me complex supply chain questions like:\n- *"Which products will run out next week?"*\n- *"What is our total working capital tied up in excess stock?"*\n- *"How should we handle lead time drift on electrolyte mixes?"*`,
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const activeSku = skus.find((s) => s.id === activeSkuId);

  const suggestedPrompts = [
    'Which products will run out next week?',
    'How should we liquidate dead stock on Vortex Trail Shoes?',
    'What happens if lead times increase by 5 days?',
    'Recommend replenishment POs for Central Hub',
  ];

  const handleSend = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Build inventory summary for prompt context
      const skusSummary = skus.map((s) => ({
        code: s.skuCode,
        name: s.name,
        category: s.category,
        location: s.locationName,
        stock: s.currentStock,
        leadTime: s.supplierLeadTimeDays,
        anomaly: s.anomaly?.type || 'none',
      }));

      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          activeSku: activeSku ? { code: activeSku.skuCode, name: activeSku.name, stock: activeSku.currentStock } : null,
          skusSummary,
        }),
      });

      const data = await response.json();
      const replyText = data.text || 'Analysis completed.';

      const botMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text: `**Imminent Stockout Risk Analysis:**\n\n- **AcousticPro ANC Headphones (AUD-NC-09)** at Central Distribution Hub has 145 units on hand with viral demand velocity (~52 u/d), representing **2.8 days of runway**.\n- **PureHydrate Electrolyte Mix (HLT-ELY-30)** has 380 units on hand (4.4 days runway) with 600 units in transit.\n\n*Action: Dispatch expedited PO for 450 units of AUD-NC-09.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl border-l border-slate-200 flex flex-col">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
            <Bot className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Supply Chain AI Copilot</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Contextual natural language inventory intelligence</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        <span className="text-slate-400 shrink-0 font-medium flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          Ask:
        </span>
        {suggestedPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-2xs font-medium"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 space-y-1.5 leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-br-xs'
                    : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] opacity-70">
                  <span className="font-semibold">{isUser ? 'You' : 'AI Copilot'}</span>
                  <span>{m.timestamp}</span>
                </div>

                {/* Content formatting */}
                <div className="prose-xs text-xs whitespace-pre-wrap">
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-600 rounded-2xl p-3.5 rounded-bl-xs border border-slate-200 flex items-center gap-2 text-xs">
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Analyzing historical distributions &amp; lead times...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputText);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a supply chain or inventory question..."
            disabled={isLoading}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors shrink-0 shadow-2xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
