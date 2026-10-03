import { supabase } from './supabase';
import { fetchMe } from './viewer';

/**
 * A failed AI request, carrying the server's machine-readable code so callers
 * can react instead of pattern-matching on Vietnamese prose.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  /** True when the user hit the daily AI limit. */
  get isQuota(): boolean {
    return this.code === 'AI_LIMIT_FREE' || this.code === 'AI_LIMIT_PRO';
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // No session is a valid state: anonymous visitors get IP-based quota.
  }
  return headers;
}

const QUOTA_MESSAGES: Record<string, string> = {
  AI_LIMIT_FREE:
    'Bạn đã dùng hết 3 lượt AI miễn phí hôm nay. Hãy đợi sang ngày mai hoặc nâng cấp Pro để có 50 lượt mỗi ngày.',
  AI_LIMIT_PRO: 'Bạn đã dùng hết 50 lượt AI hôm nay. Hãy thử lại vào ngày mai.',
  AUTH_BACKEND: 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.',
  QUOTA_UNAVAILABLE: 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.',
};

/**
 * POST to one of the metered AI routes.
 *
 * The server spends the credit before it calls Gemini, so the client only has to
 * attach the session token and surface the refusal. Refreshing the cached plan
 * here keeps the ad gating and export limits correct right after a quota error.
 */
export async function aiRequest<T = any>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng.');
  }

  if (!res.ok) {
    let payload: any = {};
    try {
      payload = await res.json();
    } catch {
      // Non-JSON error body; fall through to the generic message.
    }
    const code = String(payload.code || payload.error || `HTTP_${res.status}`);
    const message = QUOTA_MESSAGES[code] || payload.message || payload.error || 'Không thể xử lý yêu cầu AI.';
    if (res.status === 429 || code.startsWith('AI_LIMIT')) {
      void fetchMe();
    }
    throw new ApiError(res.status, code, message);
  }

  return res.json();
}