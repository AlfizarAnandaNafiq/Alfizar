import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  MessageSquare,
  RotateCcw,
  SendHorizontal,
  X,
} from 'lucide-react';
import type { OrderItem } from '../data/menuData';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isError?: boolean;
  retryPrompt?: string;
}

interface ChatBotWidgetProps {
  orderItems: OrderItem[];
}

const QUICK_PROMPTS = [
  'Menu paling laris apa saja?',
  'Info promo Paket Hemat',
  'Rekomendasi salad buah segar',
  'Jam buka & cara pengiriman',
];

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `fb_${crypto.randomUUID().replace(/-/g, '')}`;
  }
  return `fb_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function formatCurrentTime(): string {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createWelcomeMessage(): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    text: 'Halo! Selamat datang di FreshBite. Ada yang bisa kami bantu soal menu salad buah, jus segar, custom topping, atau promo Paket Hemat hari ini?',
    timestamp: formatCurrentTime(),
  };
}

export function ChatBotWidget({ orderItems }: ChatBotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => createSessionId());
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createWelcomeMessage(),
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [webhookConfigured, setWebhookConfigured] = useState<boolean | null>(
    null,
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    fetch('/api/chat')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { configured?: boolean } | null) => {
        if (!cancelled && data && typeof data.configured === 'boolean') {
          setWebhookConfigured(data.configured);
        }
      })
      .catch(() => {
        if (!cancelled) setWebhookConfigured(null);
      });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => {
      cancelled = true;
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending, isOpen]);

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isSending) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: formatCurrentTime(),
    };

    const historyForRequest = messages
      .filter((m) => m.id !== 'welcome' && !m.isError)
      .slice(-10)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          sessionId,
          history: historyForRequest,
          cartSummary: orderItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            ...(item.detail ? { detail: item.detail } : {}),
          })),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
        configured?: boolean;
      };

      if (typeof data.configured === 'boolean') {
        setWebhookConfigured(data.configured);
      }

      if (!response.ok || !data.reply) {
        const errorText =
          data.error ||
          `Maaf, server chat merespons error (HTTP ${response.status}). Silakan coba lagi.`;
        setMessages((prev) => [
          ...prev,
          {
            id: `e_${Date.now()}`,
            role: 'assistant',
            text: errorText,
            timestamp: formatCurrentTime(),
            isError: true,
            retryPrompt: trimmed,
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: data.reply as string,
          timestamp: formatCurrentTime(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e_${Date.now()}`,
          role: 'assistant',
          text: 'Koneksi ke server chat terputus. Periksa jaringanmu lalu coba lagi.',
          timestamp: formatCurrentTime(),
          isError: true,
          retryPrompt: trimmed,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(inputValue);
  };

  const handleReset = () => {
    setSessionId(createSessionId());
    setMessages([createWelcomeMessage()]);
    setInputValue('');
  };

  const showQuickPrompts = messages.length <= 1 && !isSending;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <section
          role="dialog"
          aria-label="Chat Asisten FreshBite"
          className="w-[calc(100vw-2.5rem)] sm:w-[390px] h-[540px] max-h-[calc(100vh-6.5rem)] rounded-[24px] bg-surface text-on-surface border border-outline-variant shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Chat Header */}
          <div className="bg-primary text-on-primary px-5 py-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-headline text-lg font-semibold leading-tight truncate">
                Asisten FreshBite
              </h2>
              <p className="font-body text-xs text-primary-container truncate mt-0.5">
                Tanya menu, racikan &amp; pesanan
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                aria-label="Mulai percakapan baru"
                title="Mulai percakapan baru"
                className="w-9 h-9 rounded-full flex items-center justify-center text-primary-container hover:text-on-primary hover:bg-white/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mango-yellow"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Tutup jendela chat"
                className="w-9 h-9 rounded-full flex items-center justify-center text-primary-container hover:text-on-primary hover:bg-white/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mango-yellow"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Setup notice when N8N_WEBHOOK_URL is not configured yet */}
          {webhookConfigured === false && (
            <div
              role="status"
              className="px-4 py-3 bg-mango-soft border-b border-outline-variant text-xs text-on-mango-soft flex items-start gap-2.5"
            >
              <AlertCircle
                className="w-4 h-4 text-papaya-deep shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="leading-relaxed">
                Atur environment variable{' '}
                <span className="font-bold">N8N_WEBHOOK_URL</span> pada Vercel
                atau Secrets untuk mengaktifkan balasan otomatis dari workflow
                n8n.
              </p>
            </div>
          )}

          {/* Message List */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-surface">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isUser
                        ? 'rounded-2xl rounded-br-sm bg-primary text-on-primary'
                        : msg.isError
                          ? 'rounded-2xl rounded-bl-sm bg-mango-soft border border-papaya-deep/40 text-on-mango-soft'
                          : 'rounded-2xl rounded-bl-sm bg-surface-container-low border border-outline-variant text-on-surface'
                    }`}
                  >
                    <p>{msg.text}</p>
                    {msg.isError && msg.retryPrompt && (
                      <button
                        type="button"
                        onClick={() => void sendMessage(msg.retryPrompt!)}
                        disabled={isSending}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-papaya-deep underline underline-offset-2 hover:text-primary disabled:opacity-50"
                      >
                        Coba kirim lagi
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-on-surface-muted tabular-nums mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {showQuickPrompts && (
              <div className="flex flex-wrap gap-2 pt-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="rounded-full border border-outline-variant bg-surface-container-low px-3.5 py-2 text-xs font-semibold text-on-surface hover:border-primary hover:bg-mango-soft transition-colors duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {isSending && (
              <div className="flex items-start">
                <div className="rounded-2xl rounded-bl-sm bg-surface-container-low border border-outline-variant px-4 py-3 text-xs font-semibold text-on-surface-muted inline-flex items-center gap-2">
                  <Loader2
                    className="w-3.5 h-3.5 animate-spin text-papaya-orange"
                    aria-hidden="true"
                  />
                  <span>Menghubungi Asisten FreshBite...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Composer */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-outline-variant bg-surface-container-low p-3 flex items-center gap-2"
          >
            <label htmlFor="freshbite-chat-input" className="sr-only">
              Tulis pesan untuk Asisten FreshBite
            </label>
            <input
              ref={inputRef}
              id="freshbite-chat-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tulis pertanyaanmu..."
              maxLength={1500}
              disabled={isSending}
              className="flex-1 min-w-0 rounded-full border border-outline-variant bg-surface px-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isSending || !inputValue.trim()}
              aria-label="Kirim pesan"
              className="w-10 h-10 rounded-full bg-papaya-orange text-on-papaya-orange flex items-center justify-center shrink-0 transition-colors duration-150 hover:bg-papaya-deep hover:text-on-papaya-deep disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <SendHorizontal className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Tutup chat FreshBite' : 'Buka chat FreshBite'}
        className="inline-flex items-center justify-center gap-2.5 rounded-full bg-primary text-on-primary border border-mango-yellow/60 px-5 py-3.5 shadow-lg font-label text-sm font-bold whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-papaya-orange hover:text-on-papaya-orange hover:border-papaya-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {isOpen ? (
          <X className="w-5 h-5" aria-hidden="true" />
        ) : (
          <MessageSquare className="w-5 h-5 text-mango-yellow" aria-hidden="true" />
        )}
        <span>{isOpen ? 'Tutup Chat' : 'Tanya FreshBite'}</span>
      </button>
    </div>
  );
}
