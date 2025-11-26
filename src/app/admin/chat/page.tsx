"use client";

import { useState, useEffect } from "react";
import { 
  MessageCircle, 
  User, 
  Bot, 
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { ChatMessage, ApiResponse } from "@/lib/types";

export default function ChatAdminPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "user" | "assistant">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async (sessionId?: string) => {
    try {
      setIsLoading(true);
      const url = sessionId 
        ? `/api/chat/messages?sessionId=${sessionId}&limit=500`
        : `/api/chat/messages?limit=500`;
      
      const response = await fetch(url);
      const result = await response.json() as ApiResponse<ChatMessage[]>;
      
      if (result.success && result.data) {
        // Sortera efter datum (nyaste först)
        const sorted = result.data.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setMessages(sorted);
      }
    } catch (error) {
      console.error("Error fetching chat messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMessages = messages.filter(msg => {
    // Filtrera på roll
    if (filter !== "all" && msg.role !== filter) {
      return false;
    }
    
    // Sök i innehåll
    if (searchTerm && !msg.content.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Gruppera meddelanden per session
  const sessions = Array.from(new Set(messages.map(m => m.sessionId)));
  const messagesBySession = sessions.reduce((acc, sessionId) => {
    acc[sessionId] = messages.filter(m => m.sessionId === sessionId);
    return acc;
  }, {} as Record<string, ChatMessage[]>);

  const exportMessages = () => {
    const dataStr = JSON.stringify(filteredMessages, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-messages-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Chat-meddelanden
                </h1>
                <p className="text-gray-600">
                  Visa och analysera AI-chattmeddelanden för att förbättra AI:n
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchMessages()}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Uppdatera
                </button>
                <button
                  onClick={exportMessages}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportera
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Totalt meddelanden</div>
              <div className="text-2xl font-bold text-gray-900">{messages.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Användarmeddelanden</div>
              <div className="text-2xl font-bold text-blue-600">
                {messages.filter(m => m.role === 'user').length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">AI-svar</div>
              <div className="text-2xl font-bold text-purple-600">
                {messages.filter(m => m.role === 'assistant').length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Chat-sessioner</div>
              <div className="text-2xl font-bold text-green-600">{sessions.length}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Sök i meddelanden..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Alla
                </button>
                <button
                  onClick={() => setFilter("user")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Användare
                </button>
                <button
                  onClick={() => setFilter("assistant")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === "assistant"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  AI
                </button>
              </div>
            </div>
          </div>

          {/* Messages List */}
          {isLoading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Laddar meddelanden...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Inga meddelanden hittades</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(messagesBySession)
                .filter(([sessionId]) => {
                  if (selectedSessionId) {
                    return sessionId === selectedSessionId;
                  }
                  return true;
                })
                .map(([sessionId, sessionMessages]) => {
                  const sessionFiltered = sessionMessages.filter(msg => {
                    if (filter !== "all" && msg.role !== filter) return false;
                    if (searchTerm && !msg.content.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                    return true;
                  });

                  if (sessionFiltered.length === 0) return null;

                  return (
                    <div key={sessionId} className="bg-white rounded-lg shadow">
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              Session: {sessionId.substring(0, 20)}...
                            </h3>
                            <p className="text-sm text-gray-600">
                              {sessionMessages.length} meddelanden • {sessionMessages[0]?.ipAddress || 'Okänd IP'}
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedSessionId(selectedSessionId === sessionId ? null : sessionId)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            {selectedSessionId === sessionId ? 'Visa alla' : 'Visa session'}
                          </button>
                        </div>
                      </div>
                      <div className="p-4 space-y-4">
                        {sessionFiltered.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${
                              message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {message.role === 'assistant' && (
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-purple-600" />
                              </div>
                            )}
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                message.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {new Date(message.createdAt).toLocaleString('sv-SE')}
                                </span>
                                {message.responseTimeMs && (
                                  <>
                                    <span>•</span>
                                    <span>{message.responseTimeMs}ms</span>
                                  </>
                                )}
                                {message.model && (
                                  <>
                                    <span>•</span>
                                    <span>{message.model}</span>
                                  </>
                                )}
                              </div>
                              {message.error && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>{message.error}</span>
                                </div>
                              )}
                              {message.context && (
                                <div className="mt-2 text-xs opacity-70">
                                  <details>
                                    <summary className="cursor-pointer">Visa kontext</summary>
                                    <pre className="mt-2 text-xs bg-black/10 p-2 rounded overflow-auto">
                                      {JSON.stringify(message.context, null, 2)}
                                    </pre>
                                  </details>
                                </div>
                              )}
                            </div>
                            {message.role === 'user' && (
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

