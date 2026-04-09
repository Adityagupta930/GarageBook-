'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/');
    });
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return setError('Email aur password daalo');
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.replace('/');
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0d1117', padding: '16px',
    }}>
      <div style={{
        background: '#161b22', border: '1px solid #30363d', borderRadius: '16px',
        padding: '36px 32px', width: '100%', maxWidth: '400px',
        boxShadow: '0 8px 32px rgba(0,0,0,.4)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #e94560, #c73652)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', margin: '0 auto 12px',
            boxShadow: '0 4px 16px rgba(233,69,96,.4)',
          }}>🔧</div>
          <h1 style={{ color: '#e6edf3', fontSize: '20px', fontWeight: 700, margin: 0 }}>Porwal Autoparts</h1>
          <p style={{ color: '#8b949e', fontSize: '13px', marginTop: '4px' }}>Apne account mein login karo</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#8b949e', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="aapka@email.com"
              autoComplete="email"
              required
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                background: '#0d1117', border: '1.5px solid #30363d',
                color: '#e6edf3', fontSize: '14px', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#e94560'}
              onBlur={e => e.target.style.borderColor = '#30363d'}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#8b949e', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                background: '#0d1117', border: '1.5px solid #30363d',
                color: '#e6edf3', fontSize: '14px', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#e94560'}
              onBlur={e => e.target.style.borderColor = '#30363d'}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
              borderRadius: '8px', padding: '10px 14px',
              color: '#f87171', fontSize: '13px',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '11px', background: loading ? '#555' : '#e94560',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background .15s', marginTop: '4px',
            }}>
            {loading ? '⏳ Login ho raha hai...' : '🔐 Login Karo'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#8b949e' }}>
          Account nahi hai?{' '}
          <a href="/signup" style={{ color: '#e94560', fontWeight: 600, textDecoration: 'none' }}>
            Signup karo
          </a>
        </p>
      </div>
    </div>
  );
}
