import type { IncomingMessage, ServerResponse } from 'node:http';

export interface ChatHistoryEntry {
  role: 'user' | 'assistant';
  text: string;
}

export interface ChatCartItem {
  name: string;
  quantity: number;
  price: number;
  detail?: string;
}

export interface ChatRequestPayload {
  message: string;
  sessionId: string;
  history: ChatHistoryEntry[];
  cartSummary: ChatCartItem[];
}

export interface ChatResult {
  status: number;
  body: Record<string, unknown>;
}

const MAX_MESSAGE_LENGTH = 1500;
const MAX_HISTORY_ITEMS = 12;
const MAX_CART_ITEMS = 20;
const WEBHOOK_TIMEOUT_MS = 30000;
const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]{8,100}$/;
const DEFAULT_N8N_WEBHOOK_URL =
  'https://alfizar1.app.n8n.cloud/webhook/freshbite-chat';

const DEPRECATED_WEBHOOK_URLS = new Set([
  'https://alfizar1.app.n8n.cloud/webhook/keuangan-simple',
  'https://alfizar1.app.n8n.cloud/webhook-test/freshbite-chat',
]);

function getWebhookUrl(): string {
  const envUrl = (process.env.N8N_WEBHOOK_URL || '').trim();
  if (!envUrl || DEPRECATED_WEBHOOK_URLS.has(envUrl)) {
    return DEFAULT_N8N_WEBHOOK_URL;
  }
  return envUrl;
}

const BLOCKED_METADATA_HOSTS = new Set([
  '169.254.169.254',
  'metadata.google.internal',
  'metadata',
]);

function isSafeWebhookUrl(rawUrl: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_METADATA_HOSTS.has(host)) {
    return null;
  }

  return parsed;
}

function sanitizeHistory(raw: unknown): ChatHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const result: ChatHistoryEntry[] = [];
  for (const item of raw.slice(-MAX_HISTORY_ITEMS)) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const role = record.role === 'user' || record.role === 'assistant' ? record.role : null;
    const text = typeof record.text === 'string' ? record.text.trim().slice(0, MAX_MESSAGE_LENGTH) : '';
    if (role && text) {
      result.push({ role, text });
    }
  }
  return result;
}

function sanitizeCart(raw: unknown): ChatCartItem[] {
  if (!Array.isArray(raw)) return [];
  const result: ChatCartItem[] = [];
  for (const item of raw.slice(0, MAX_CART_ITEMS)) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const name = typeof record.name === 'string' ? record.name.trim().slice(0, 120) : '';
    const quantity =
      typeof record.quantity === 'number' && Number.isInteger(record.quantity) && record.quantity > 0
        ? Math.min(record.quantity, 999)
        : 0;
    const price =
      typeof record.price === 'number' && Number.isFinite(record.price) && record.price >= 0
        ? record.price
        : 0;
    const detail =
      typeof record.detail === 'string' ? record.detail.trim().slice(0, 200) : undefined;
    if (name && quantity > 0) {
      result.push({ name, quantity, price, ...(detail ? { detail } : {}) });
    }
  }
  return result;
}

export function validateChatPayload(rawBody: unknown): {
  data?: ChatRequestPayload;
  error?: string;
} {
  if (!rawBody || typeof rawBody !== 'object') {
    return { error: 'Format permintaan tidak valid.' };
  }

  const body = rawBody as Record<string, unknown>;
  const rawMessage = typeof body.message === 'string' ? body.message.trim() : '';

  if (!rawMessage) {
    return { error: 'Pesan tidak boleh kosong.' };
  }

  if (rawMessage.length > MAX_MESSAGE_LENGTH) {
    return { error: `Pesan terlalu panjang (maksimal ${MAX_MESSAGE_LENGTH} karakter).` };
  }

  const rawSessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
  const sessionId = SESSION_ID_PATTERN.test(rawSessionId)
    ? rawSessionId
    : `fb_session_${Date.now()}`;

  return {
    data: {
      message: rawMessage,
      sessionId,
      history: sanitizeHistory(body.history),
      cartSummary: sanitizeCart(body.cartSummary),
    },
  };
}

function extractReplyFromObject(obj: Record<string, unknown>): string | null {
  const candidateKeys = [
    'output',
    'reply',
    'message',
    'text',
    'response',
    'answer',
    'content',
    'result',
    'pesan',
    'balasan',
  ];
  for (const key of candidateKeys) {
    const val = obj[key];
    if (typeof val === 'string' && val.trim()) {
      return val.trim();
    }
  }
  if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
    return extractReplyFromObject(obj.data as Record<string, unknown>);
  }
  return null;
}

function parseN8nReply(rawText: string, contentType: string): string | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  if (contentType.includes('application/json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (typeof parsed === 'string' && parsed.trim()) {
        return parsed.trim();
      }
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];
        if (typeof first === 'string' && first.trim()) return first.trim();
        if (first && typeof first === 'object') {
          const fromFirst = extractReplyFromObject(first as Record<string, unknown>);
          if (fromFirst) return fromFirst;
        }
      }
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const fromObj = extractReplyFromObject(parsed as Record<string, unknown>);
        if (fromObj) return fromObj;
      }
    } catch {
      // Fall through to plain-text handling
    }
  }

  return trimmed;
}

export function isN8nConfigured(): boolean {
  const url = getWebhookUrl();
  return Boolean(url && isSafeWebhookUrl(url));
}

export async function forwardChatToN8n(rawBody: unknown): Promise<ChatResult> {
  const validated = validateChatPayload(rawBody);
  if (!validated.data) {
    return {
      status: 400,
      body: { error: validated.error || 'Permintaan tidak valid.' },
    };
  }

  const webhookRaw = getWebhookUrl();
  if (!webhookRaw) {
    return {
      status: 503,
      body: {
        configured: false,
        error:
          'Webhook n8n belum dikonfigurasi. Tambahkan N8N_WEBHOOK_URL pada Environment Variables (Vercel) atau Secrets (AI Studio).',
      },
    };
  }

  const safeUrl = isSafeWebhookUrl(webhookRaw);
  if (!safeUrl) {
    return {
      status: 500,
      body: {
        configured: false,
        error: 'Format N8N_WEBHOOK_URL tidak valid. Pastikan menggunakan URL http:// atau https:// yang benar.',
      },
    };
  }

  const { message, sessionId, history, cartSummary } = validated.data;
  const itemCount = cartSummary.reduce((sum, item) => sum + item.quantity, 0);

  const outboundPayload = {
    chatInput: message,
    message,
    sessionId,
    source: 'freshbite-web',
    timestamp: new Date().toISOString(),
    history,
    cart: {
      itemCount,
      items: cartSummary,
    },
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain',
  };

  const authHeaderName = (process.env.N8N_WEBHOOK_AUTH_HEADER || '').trim();
  const authToken = (process.env.N8N_WEBHOOK_AUTH_TOKEN || '').trim();
  if (authHeaderName && authToken && /^[a-zA-Z0-9-]+$/.test(authHeaderName)) {
    headers[authHeaderName] = authToken;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(safeUrl.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(outboundPayload),
      signal: controller.signal,
    });

    const responseText = await response.text();
    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      const isTestWebhook = safeUrl.pathname.includes('/webhook-test/');
      const errorMessage =
        response.status === 404
          ? isTestWebhook
            ? 'Webhook test n8n belum aktif mendengarkan (404). Klik tombol "Execute workflow / Listen for test event" di editor n8n sebelum mengirim pesan.'
            : 'Webhook n8n belum aktif (404). Aktifkan toggle Active di pojok kanan atas editor n8n dan pastikan node Webhook memakai metode POST.'
          : `Webhook n8n merespons dengan status ${response.status}. Pastikan workflow n8n aktif dan menerima metode POST.`;
      return {
        status: 502,
        body: {
          configured: true,
          error: errorMessage,
        },
      };
    }

    const reply = parseN8nReply(responseText, contentType);
    if (!reply) {
      return {
        status: 200,
        body: {
          configured: true,
          reply:
            'Pesan diterima oleh workflow n8n, namun belum ada teks balasan (pastikan node Respond to Webhook mengembalikan field "output", "reply", atau "message").',
        },
      };
    }

    return {
      status: 200,
      body: {
        configured: true,
        reply,
      },
    };
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return {
      status: isTimeout ? 504 : 502,
      body: {
        configured: true,
        error: isTimeout
          ? 'Permintaan ke webhook n8n melewati batas waktu. Silakan coba lagi.'
          : 'Gagal terhubung ke webhook n8n. Periksa kembali URL webhook dan status aktif workflow.',
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

interface VercelLikeRequest extends IncomingMessage {
  body?: unknown;
}

interface VercelLikeResponse extends ServerResponse {
  status?: (code: number) => VercelLikeResponse;
  json?: (data: unknown) => void;
}

function sendJson(res: VercelLikeResponse, status: number, data: Record<string, unknown>) {
  if (typeof res.status === 'function') {
    const statusRes = res.status(status);
    if (typeof statusRes.json === 'function') {
      statusRes.json(data);
      return;
    }
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

async function readJsonBody(req: VercelLikeRequest): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return null;
      }
    }
    return req.body;
  }

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    const maxBytes = 64 * 1024;

    req.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes <= maxBytes) {
        chunks.push(chunk);
      }
    });
    req.on('end', () => {
      if (totalBytes > maxBytes) {
        resolve(null);
        return;
      }
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : null);
      } catch {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
  });
}

// Vercel Serverless Function handler for /api/chat
export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse) {
  if (req.method === 'GET') {
    sendJson(res, 200, { configured: isN8nConfigured() });
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    sendJson(res, 405, { error: 'Metode tidak diizinkan.' });
    return;
  }

  const body = await readJsonBody(req);
  const result = await forwardChatToN8n(body);
  sendJson(res, result.status, result.body);
}
