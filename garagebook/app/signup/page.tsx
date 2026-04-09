'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/hooks/useAuth';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/');
    });
  }, [router]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('Naam daalo');
    if (!email.trim()) return setError('Email daalo');
    if (password.length < 6) return setError('Password kam se kam 6 characters ka hona chahiye');
    if (password !== confirm) return setError('Passwords match nahi kar rahe');

    setLoading(true); setError('');

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim(), role: 'owner' },
      },
    });

    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0d1117', padding: '16px',
      }}>
        <div style={{
          background: '#161b22', border: '1px solid #30363d', borderRadius: '16px',
          padding: '36px 32px', width: '100%', maxWidth: '400px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ color: '#e6edf3', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
            Account ban gaya!
          </h2>
          <p style={{ color: '#8b949e', fontSize: '14px', marginBottom: '24px' }}>
            Apna email check karo — confirmation link bheja gaya hai.
            Link click karne ke baad login kar sakte ho.
          </p>
          <a href="/login" style={{
            display: 'block', padding: '11px', background: '#e94560',
            color: '#fff', borderRadius: '8px', fontSize: '14px',
            fontWeight: 600, textDecoration: 'none',
          }}>
            🔐 Login Page Pe Jao
          </a>
        </div>
      </div>
    );
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
          <p style={{ color: '#8b949e', fontSize: '13px', marginTop: '4px' }}>Naya account banao</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { label: 'AAPKA NAAM', value: name, set: setName, type: 'text', placeholder: 'Ramesh Kumar', auto: 'name' },
            { label: 'EMAIL', value: email, set: setEmail, type: 'email', placeholder: 'aapka@email.com', auto: 'email' },
            { label: 'PASSWORD', value: password, set: setPassword, type: 'password', placeholder: '••••••••', auto: 'new-password' },
            { label: 'PASSWORD CONFIRM KARO', value: confirm, set: setConfirm, type: 'password', placeholder: '••••••••', auto: 'new-password' },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize: '12px', color: '#8b949e', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                {f.label}
              </label>
              <input
                type={f.type}
                value={f.value}
                onChange={e => f.set(e.target.value)}
                placeholder={f.placeholder}
                autoComplete={f.auto}
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
          ))}

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
            {loading ? '⏳ Account ban raha hai...' : '🚀 Account Banao'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#8b949e' }}>
          Pehle se account hai?{' '}
          <a href="/login" style={{ color: '#e94560', fontWeight: 600, textDecoration: 'none' }}>
            Login karo
          </a>
        </p>
      </div>
    </div>
  );
}
