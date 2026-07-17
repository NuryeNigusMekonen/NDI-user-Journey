import { useEffect, useState } from 'react';
import { Lock, LogOut, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Gates its children behind a real Supabase login. The protected content is fetched
// from Supabase (RLS: authenticated-only) by the child views — so an unauthenticated
// visitor never receives it, even via DevTools. This screen only unlocks the session.
export default function AuthGate({ title, children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError('Incorrect email or password.');
    setBusy(false);
  };

  const signOut = () => supabase.auth.signOut();

  if (!ready) {
    return <div className="h-full flex items-center justify-center bg-canvas text-ink-muted text-sm">
      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
    </div>;
  }

  if (!isSupabaseConfigured) {
    return <div className="h-full flex items-center justify-center bg-canvas text-ink-muted text-sm px-8 text-center">
      Sign-in is unavailable — Supabase is not configured for this deployment.
    </div>;
  }

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center bg-canvas px-6">
        <form onSubmit={signIn} className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-brand/15 border border-brand/40 flex items-center justify-center">
              <Lock className="w-[18px] h-[18px] text-brand" strokeWidth={2.25} />
            </div>
            <div>
              <h2 className="font-display text-[17px] font-bold text-ink tracking-tight leading-none">{title}</h2>
              <p className="text-[10px] font-mono text-ink-muted mt-1.5">Protected — sign in to view</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="email" autoComplete="username" required
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-hairline text-[13px] text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-brand/50"
            />
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="password" autoComplete="current-password" required
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-hairline text-[13px] text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-brand/50"
            />
            {error && <p className="text-[11px] text-amber">{error}</p>}
            <button
              type="submit" disabled={busy}
              className="w-full py-2.5 rounded-lg bg-brand text-canvas text-[13px] font-semibold hover:bg-brand-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Sign in
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 flex items-center justify-end px-6 py-2 bg-surface/60 border-b border-hairline">
        <span className="text-[10px] font-mono text-ink-muted mr-3">{session.user.email}</span>
        <button onClick={signOut} className="flex items-center gap-1.5 text-[10px] font-mono text-ink-muted hover:text-brand transition-colors">
          <LogOut className="w-3.5 h-3.5" /> sign out
        </button>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
