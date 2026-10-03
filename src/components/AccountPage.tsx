import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, LogOut, Sparkles } from 'lucide-react';
import { EMPTY_ME, fetchMe, signInWithGoogle, type MeState } from '../utils/viewer';
import { startCheckout } from '../utils/checkout';
import { supabase } from '../utils/supabase';

const fmtDate = (iso: string | null): string =>
  iso
    ? new Date(iso).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

const fmtAmount = (amount: number): string => new Intl.NumberFormat('vi-VN').format(amount) + ' đ';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Đang chờ thanh toán',
  paid: 'Đã thanh toán',
  cancelled: 'Đã hủy',
  expired: 'Hết hạn',
};

export const AccountPage: React.FC = () => {
  const [me, setMe] = useState<MeState>(EMPTY_ME);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    const state = await fetchMe();
    setMe(state);
    return state;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const params = new URLSearchParams(window.location.search);
      const justPaid = params.get('paid') === '1';
      const orderCode = params.get('orderCode');

      const state = await refresh();
      if (cancelled) return;

      // The webhook can lag behind the redirect. Poll the server (never trust a
      // local guess) until the membership flips to Pro.
      if (justPaid && orderCode && state.plan !== 'pro') {
        setPending(true);
        setNotice('Đang xác nhận thanh toán. Trang sẽ tự cập nhật trong vài giây.');
        for (let attempt = 0; attempt < 5; attempt += 1) {
          await new Promise((r) => setTimeout(r, 2000));
          try {
            const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
            const token = data.session?.access_token;
            const res = await fetch(`/api/payos/status/${orderCode}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
              const json = await res.json();
              if (json.proUntil) {
                await refresh();
                setPending(false);
                setNotice('Thanh toán đã được xác nhận. Gói Pro đã kích hoạt.');
                break;
              }
            }
          } catch {
            // Keep polling; the final state comes from the server either way.
          }
        }
        if (pending) {
          setPending(false);
          setNotice('Chưa thấy giao dịch. Nếu bạn đã thanh toán, hãy tải lại trang sau vài phút.');
        }
      }

      if (state.userId) {
        try {
          const { data } = await supabase!.auth.getSession();
          const res = await fetch('/api/payments', {
            headers: data.session?.access_token
              ? { Authorization: `Bearer ${data.session.access_token}` }
              : {},
          });
          if (res.ok) {
            const json = await res.json();
            if (!cancelled) setPayments(json.payments || []);
          }
        } catch {
          // Payment history is supplementary; failing to load it must not block the page.
        }
      }

      if (!cancelled) setLoading(false);
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    await refresh();
    setPayments([]);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
      </main>
    );
  }

  if (!me.userId) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <section className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-extrabold text-white">Tài khoản LyricStudio AI</h1>
          <p className="text-sm text-zinc-400">
            Đăng nhập bằng Google để nâng cấp Pro, xem hạn mức AI hằng ngày và lịch sử thanh toán.
          </p>
          <button
            onClick={() => void signInWithGoogle()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-sm font-bold text-white"
          >
            Đăng nhập Google
          </button>
          <p className="text-xs text-zinc-500">
            Chưa cần tài khoản để dùng thử miễn phí tại{' '}
            <a className="text-rose-400" href="/studio">
              Studio
            </a>
            .
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <header className="flex items-center gap-3">
        {me.avatar && <img src={me.avatar} alt="" className="w-10 h-10 rounded-full" />}
        <div>
          <h1 className="text-2xl font-extrabold text-white">{me.name || me.email}</h1>
          <p className="text-xs text-zinc-500">{me.email}</p>
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          {me.plan === 'pro' && <Sparkles className="w-4 h-4 text-rose-400" />}
          {me.plan === 'pro' ? 'Gói Pro' : 'Gói miễn phí'}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {me.plan === 'pro'
            ? `Pro còn hiệu lực đến ${fmtDate(me.proUntil)}.`
            : 'Gói Pro bỏ watermark, xuất 1080p và không hiện quảng cáo.'}
        </p>
        <p className="mt-3 text-sm text-zinc-300">
          Lượt AI hôm nay: {me.aiUsedToday}/{me.aiLimit}
        </p>

        {me.plan !== 'pro' && (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => void startCheckout('monthly')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-sm font-bold text-white"
            >
              Mua Pro 79.000đ / tháng
            </button>
            <button
              onClick={() => void startCheckout('yearly')}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 text-sm font-bold text-zinc-100 hover:bg-zinc-700 transition"
            >
              Mua Pro 790.000đ / năm
            </button>
          </div>
        )}
      </section>

      {notice && (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          {notice}
          {pending && <Loader2 className="inline w-3.5 h-3.5 ml-2 animate-spin" />}
        </p>
      )}

      {payments.length > 0 && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-lg font-bold text-white">Lịch sử thanh toán</h2>
          <ul className="mt-3 space-y-2">
            {payments.map((p) => (
              <li
                key={p.orderCode}
                className="flex items-center justify-between text-sm border-b border-zinc-800/70 pb-2"
              >
                <span className="text-zinc-300">
                  {p.planKind === 'yearly' ? 'Gói năm' : 'Gói tháng'} · {fmtAmount(p.amount)}
                </span>
                <span
                  className={
                    p.status === 'paid' ? 'text-emerald-400' : 'text-zinc-500'
                  }
                >
                  {STATUS_LABEL[p.status] || p.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="text-lg font-bold text-white">Đăng xuất</h2>
        <button
          onClick={() => void handleSignOut()}
          className="mt-3 px-4 py-2 rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 transition flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </section>

      <p className="text-xs">
        <a href="/pricing" className="text-rose-400">
          Bảng giá
        </a>{' '}
        ·{' '}
        <a href="/" className="text-zinc-400">
          Trang chủ
        </a>
      </p>
    </main>
  );
};