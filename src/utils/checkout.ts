import { supabase } from './supabase';

export type PlanKind = 'monthly' | 'yearly';

/**
 * Start a PayOS checkout. Sign-in is mandatory on the server, so an anonymous
 * visitor is sent to the account page instead of being shown an error.
 */
export async function startCheckout(plan: PlanKind): Promise<void> {
  try {
    const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    const token = data.session?.access_token;
    if (!token) {
      window.location.href = '/account';
      return;
    }

    const res = await fetch('/api/payos/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      window.alert(body.message || 'Không tạo được link thanh toán. Vui lòng thử lại sau.');
      return;
    }

    const { checkoutUrl } = await res.json();
    if (checkoutUrl) window.location.href = checkoutUrl;
  } catch {
    window.alert('Không kết nối được máy chủ. Vui lòng thử lại sau.');
  }
}