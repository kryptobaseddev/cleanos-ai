import { useState, useRef, useEffect, useCallback } from "react";
import { useAppStore } from "@/stores/app-store";
import { chatWithAi } from "@/services/tauri-commands";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Send, Bot, User, Trash2, Settings, AlertCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export function AiChat() {
  const { activeProvider, providers } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const connectedProviders = providers.filter((p) => p.connected);
  const currentProvider = activeProvider ?? connectedProviders[0]?.id ?? null;
  const providerInfo = providers.find((p) => p.id === currentProvider);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending || !currentProvider) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const response = await chatWithAi(currentProvider, trimmed);
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClear() {
    setMessages([]);
    setError(null);
  }

  // No provider configured
  if (connectedProviders.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-surface-400">
        <Settings size={48} className="mb-4" />
        <h2 className="text-xl font-semibold text-surface-600 dark:text-surface-300">
          No AI Provider Configured
        </h2>
        <p className="mt-2 max-w-md text-center text-sm">
          Go to Settings and save an API key for at least one AI provider to
          start chatting.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-200 pb-4 dark:border-surface-700">
        <div className="flex items-center gap-3">
          <Bot size={24} className="text-primary-500" />
          <div>
            <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50">
              AI Chat
            </h1>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Ask questions about system cleanup, file management, or anything
              else.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {providerInfo && (
            <Badge variant="success" size="sm">
              {currentProvider} ({providerInfo.model})
            </Badge>
          )}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<Trash2 size={14} />}
              onClick={handleClear}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-surface-400">
            <Bot size={40} className="mb-3 opacity-50" />
            <p className="text-sm">
              Start a conversation. Try asking about system cleanup tips.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40">
                    <Bot size={16} className="text-primary-600 dark:text-primary-400" />
                  </div>
                )}
                <Card
                  padding="sm"
                  className={`max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-primary-50 dark:bg-primary-900/20"
                      : ""
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm text-surface-700 dark:text-surface-300">
                    {msg.content}
                  </p>
                </Card>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-200 dark:bg-surface-700">
                    <User size={16} className="text-surface-600 dark:text-surface-400" />
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40">
                  <Bot size={16} className="text-primary-600 dark:text-primary-400" />
                </div>
                <Card padding="sm">
                  <div className="flex items-center gap-2 text-sm text-surface-500">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-surface-400" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-surface-400 [animation-delay:0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-surface-400 [animation-delay:0.3s]" />
                    </div>
                    Thinking...
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-surface-200 pt-4 dark:border-surface-700">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            disabled={sending}
            rows={2}
            className="flex-1 resize-none rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-700 placeholder-surface-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:placeholder-surface-500"
          />
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            iconLeft={<Send size={16} />}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
