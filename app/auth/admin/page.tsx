'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { ShieldAlert, User, Lock, CheckCircle, ArrowLeft, Loader } from 'lucide-react';

export default function AdminLoginPage() {
  const { language, t, dir } = useLanguage();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if already logged in as admin
    const stored = localStorage.getItem('hunarangan-user');
    if (stored) {
      const user = JSON.parse(stored);
      if (user.role === 'admin') {
        router.push('/dashboard/admin');
      }
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError(language === 'en' ? 'Please fill in all credentials.' : 'براہ کرم تمام اسناد درج کریں۔');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('hunarangan-user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-change'));
        router.push('/dashboard/admin');
      } else {
        setError(data.error || 'Authentication failed.');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '1rem', direction: dir }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Back Button */}
        <button onClick={() => router.push('/auth/login')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', width: 'fit-content' }}>
          <ArrowLeft size={16} />
          <span>{language === 'en' ? 'Artisan Login' : 'کاریگر لاگ ان'}</span>
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ background: 'rgba(217, 119, 6, 0.08)', width: '3.5rem', height: '3.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: 'var(--secondary)' }}>
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
            {language === 'en' ? 'Admin Portal' : 'ایڈمن پورٹل'}
          </h2>
          <p style={{ opacity: 0.7, fontSize: '0.95rem', marginTop: '0.25rem' }}>
            {language === 'en' ? 'Enter administrator credentials to login' : 'لاگ ان کرنے کے لیے اپنی اسناد درج کریں۔'}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--accent)', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Username */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 600 }}>
              {language === 'en' ? 'Admin Username' : 'یوزر نیم'}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User size={18} style={{ position: 'absolute', [dir === 'ltr' ? 'left' : 'right']: '1rem', opacity: 0.5 }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem 0.8rem 2.8rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-light)',
                  fontSize: '1rem',
                  outline: 'none',
                  textAlign: dir === 'ltr' ? 'left' : 'right',
                  paddingLeft: dir === 'ltr' ? '2.8rem' : '1rem',
                  paddingRight: dir === 'ltr' ? '1rem' : '2.8rem'
                }}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 600 }}>
              {language === 'en' ? 'Password' : 'پاس ورڈ'}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} style={{ position: 'absolute', [dir === 'ltr' ? 'left' : 'right']: '1rem', opacity: 0.5 }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem 0.8rem 2.8rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-light)',
                  fontSize: '1rem',
                  outline: 'none',
                  textAlign: dir === 'ltr' ? 'left' : 'right',
                  paddingLeft: dir === 'ltr' ? '2.8rem' : '1rem',
                  paddingRight: dir === 'ltr' ? '1rem' : '2.8rem'
                }}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ width: '100%', padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
            {isLoading ? <Loader size={18} className="spin" /> : <CheckCircle size={18} />}
            <span>{isLoading ? '...' : (language === 'en' ? 'Login Securely' : 'محفوظ لاگ ان')}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.8rem', opacity: 0.6 }}>
          <span>Demo admin credentials: admin / adminpassword123</span>
        </div>

      </div>

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
