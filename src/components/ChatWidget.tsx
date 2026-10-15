"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { BillData } from '@/lib/types';
import { AnalyticsEvents } from '@/lib/analytics';
import { useAuth } from '@/hooks/useAuth';
import type { AgentClientAction } from '@/lib/chat-agent-tools';

type QuickAction =
  | { label: string; kind: "message"; text: string }
  | { label: string; kind: "navigate"; href: string };

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatWidgetProps {
  billData?: BillData;
  className?: string;
}

function UserAvatar({
  avatarUrl,
  name,
}: {
  avatarUrl?: string | null;
  name?: string | null;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name || "Du"}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-primary/30"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
      <User className="w-4 h-4 text-white" />
    </div>
  );
}

export default function ChatWidget({ billData: propBillData, className = '' }: ChatWidgetProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [billData, setBillData] = useState<BillData | undefined>(propBillData);
  const [isAdminPage, setIsAdminPage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    null;

  // Check if we're on an admin page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAdminPage(window.location.pathname.startsWith('/admin'));
    }
  }, []);

  // Read billData from sessionStorage if not provided as prop
  useEffect(() => {
    if (!billData && typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('billData');
      if (stored) {
        try {
          const data: BillData = JSON.parse(stored);
          setBillData(data);
        } catch (e) {
          console.error('Failed to parse billData from sessionStorage:', e);
        }
      }
    }
  }, [billData]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Generate session ID when chat opens
  useEffect(() => {
    if (isOpen && !sessionId) {
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      AnalyticsEvents.chatOpened();
    }
  }, [isOpen, sessionId]);

  // Agent-style welcome — owns the next step
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      let welcomeContent: string;

      if (billData) {
        const extraFeesTotal = (billData.extraFeesDetailed || []).reduce(
          (sum, fee) => sum + fee.amount,
          0
        );
        const estimatedSavings = Math.round(extraFeesTotal * 1.25);
        welcomeContent =
          estimatedSavings > 0
            ? `Jag ser din analys — ungefär ${estimatedSavings} kr/månad att ta hem. Nästa steg: byt elavtal på resultatsidan. Säg till om du vill att jag guidar dig dit.`
            : `Jag har din analys. Nästa steg är att välja avtal under Byt elavtal — vill du att jag tar dig dit?`;
      } else {
        welcomeContent =
          `Jag är din sparagent. Nästa steg: ladda upp en elräkning under Analysera faktura — sen tolkar jag siffrorna och tar dig till bytet.`;
      }

      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: welcomeContent,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, billData]);

  // Don't render on admin pages - check AFTER all hooks
  if (isAdminPage) {
    return null;
  }

  const quickActions: QuickAction[] = billData
    ? [
        { label: "Ta mig till bytet", kind: "navigate", href: "/result#byt-avtal" },
        { label: "Förklara min besparing", kind: "message", text: "Förklara min besparing kort och vad jag ska göra nu" },
        { label: "Vad är nästa steg?", kind: "message", text: "Vad är mitt nästa steg för att spara?" },
      ]
    : [
        { label: "Analysera min faktura", kind: "navigate", href: "/upload" },
        { label: "Guidera mig", kind: "message", text: "Guidera mig steg för steg" },
        { label: "Vad kostar det?", kind: "message", text: "Vad kostar det?" },
      ];

  const executeAgentActions = (actions: AgentClientAction[]) => {
    const nav = actions.find((a) => a.type === "navigate");
    if (!nav) return;
    // Short beat so the user sees the agent message before leaving
    window.setTimeout(() => {
      setIsOpen(false);
      router.push(nav.path);
    }, 600);
  };

  const runQuickAction = (action: QuickAction) => {
    if (action.kind === "navigate") {
      setIsOpen(false);
      router.push(action.href);
      return;
    }
    void sendMessage(action.text);
  };

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    // Track message sent
    AnalyticsEvents.chatMessageSent(!!billData);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: sessionId,
          currentPath: typeof window !== "undefined" ? window.location.pathname + window.location.hash : undefined,
          hasBillAnalysis: !!billData,
          context: billData ? {
            totalAmount: billData.totalAmount,
            extraFeesTotal: billData.extraFeesTotal,
            extraFeesDetailed: billData.extraFeesDetailed,
            totalKWh: billData.totalKWh,
            period: billData.period,
            contractType: billData.contractType
          } : undefined
        }),
      });

      const data = await response.json() as {
        success?: boolean;
        reply?: string;
        actions?: AgentClientAction[];
        error?: string;
        sessionId?: string;
        meta?: { responseTimeMs?: number };
      };

      if (!response.ok) {
        const errorMsg = data.error || 'Något gick fel';
        AnalyticsEvents.chatError(errorMsg);
        throw new Error(errorMsg);
      }

      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }

      if (data.success && data.reply) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        AnalyticsEvents.chatMessageReceived(data.meta?.responseTimeMs);

        if (data.actions?.length) {
          executeAgentActions(data.actions);
        }
      } else {
        throw new Error('Inget svar från agenten');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Något gick fel';
      setError(errorMsg);
      AnalyticsEvents.chatError(errorMsg);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className={`fixed bottom-20 right-4 z-[100] ${className}`}>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="
              w-14 h-14 bg-primary text-white rounded-full shadow-lg
              flex items-center justify-center
              hover:bg-primary/90 transition-colors
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            "
            aria-label="Öppna chat"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="
              w-80 h-96 bg-white rounded-xl shadow-2xl border border-border
              flex flex-col overflow-hidden
            "
          >
            {/* Header */}
            <div className="bg-primary text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <div className="leading-tight">
                  <span className="font-semibold block">Sparagenten</span>
                  <span className="text-[11px] text-white/75">Navigerar och guidar dig</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="text-white/70 hover:text-white transition-colors text-sm"
                  title="Rensa chat"
                >
                  Rensa
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label="Stäng chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={`
                      max-w-[80%] p-3 rounded-lg text-sm
                      ${message.role === 'user' 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-900'
                      }
                    `}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString('sv-SE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <UserAvatar avatarUrl={avatarUrl} name={displayName} />
                  )}
                </motion.div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 justify-start"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-gray-600">Jobbar...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-3"
                >
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Agent quick actions — before first reply */}
            {messages.length === 1 && messages[0]?.role === "assistant" && !isLoading && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5 border-t border-border/60 pt-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => runQuickAction(action)}
                    className="text-xs px-2.5 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Säg vad du vill göra…"
                  disabled={isLoading}
                  className="
                    flex-1 px-3 py-2 border border-border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                    disabled:bg-gray-50 disabled:text-gray-500
                    text-sm
                  "
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  className="
                    px-3 py-2 bg-primary text-white rounded-lg
                    hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed
                    transition-colors flex items-center justify-center
                  "
                  aria-label="Skicka meddelande"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
