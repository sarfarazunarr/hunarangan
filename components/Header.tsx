'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage, Language } from '../context/LanguageContext';
import { ShoppingBag, User, LogOut, Menu, X, Sun, Moon } from 'lucide-react';

export default function Header() {
  const { language, setLanguage, t, dir } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'buyer' | 'seller' | 'admin'>('buyer');
  const [userName, setUserName] = useState('');
  
  // Theme State (Lite-First by default)
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Sync auth status from cookie / localStorage on mount
  useEffect(() => {
    const syncAuth = () => {
      const storedUser = localStorage.getItem('hunarangan-user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setIsLoggedIn(true);
          setUserRole(parsed.role || 'buyer');
          setUserName(parsed.name || 'Artisan');
        } catch (e) {
          console.error(e);
        }
      } else {
        setIsLoggedIn(false);
      }
    };
    syncAuth();
    // Add event listener to react to login/logout changes
    window.addEventListener('auth-change', syncAuth);
    return () => window.removeEventListener('auth-change', syncAuth);
  }, []);

  // Theme Sync on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('hunarangan-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Light mode first default
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('hunarangan-theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hunarangan-user');
    // Delete session cookie
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setIsLoggedIn(false);
    window.dispatchEvent(new Event('auth-change'));
    window.location.href = '/';
  };

  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'ur', name: 'اردو' },
    { code: 'sd', name: 'سنڌي' }
  ];

  return (
    <header className="glass-card" style={{ margin: '1rem', borderRadius: '1rem', border: '1px solid var(--border)', position: 'sticky', top: '1rem', zIndex: 90 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4.5rem', padding: '0 1rem' }}>
        
        {/* Brand Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'var(--primary)', color: 'white' }}>
            <ShoppingBag size={18} />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--primary)' }}>
            {t('appName')}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }} className="desktop-only">
          <Link href="/" style={{ fontWeight: 600, textDecoration: 'none', color: 'inherit' }}>
            {language === 'en' ? 'Home' : language === 'ur' ? 'ہوم' : 'گھر'}
          </Link>
          <Link href="/categories" style={{ fontWeight: 600, textDecoration: 'none', color: 'inherit' }}>
            {language === 'en' ? 'Explore' : language === 'ur' ? 'تلاش کریں' : 'ڳوليو'}
          </Link>

          {isLoggedIn && (
            <Link 
              href={userRole === 'seller' ? '/dashboard/seller' : userRole === 'admin' ? '/dashboard/admin' : '/dashboard/buyer'} 
              style={{ fontWeight: 600, textDecoration: 'none', color: 'var(--primary)', borderBottom: '2px solid var(--primary)' }}
            >
              {userRole === 'seller' ? (language === 'en' ? 'Seller Panel' : 'سیلر پینل') : userRole === 'admin' ? 'Admin Panel' : (language === 'en' ? 'My Account' : 'میرا اکاؤنٹ')}
            </Link>
          )}
        </nav>

        {/* Theme, Language Switcher & Auth Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            style={{
              background: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2.2rem',
              height: '2.2rem',
              borderRadius: '50%',
              transition: 'var(--transition)'
            }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className="theme-toggle-btn"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Language Buttons */}
          <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0, 0, 0, 0.05)', padding: '0.2rem', borderRadius: '9999px' }}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                style={{
                  padding: '0.3rem 0.8rem',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: language === lang.code ? 'var(--primary)' : 'transparent',
                  color: language === lang.code ? '#ffffff' : 'var(--text)',
                  transition: 'all 0.15s ease'
                }}
              >
                {lang.name}
              </button>
            ))}
          </div>

          {/* User Auth Info */}
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{userName}</span>
                <button onClick={handleLogout} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--accent)', display: 'flex', gap: '0.25rem' }}>
                  <LogOut size={14} />
                  <span>{t('logout')}</span>
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="btn btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem' }}>
                <User size={15} />
                <span>{t('login')}</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            className="mobile-only-btn"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="mobile-only">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 600, textDecoration: 'none', color: 'inherit' }}>
            {language === 'en' ? 'Home' : language === 'ur' ? 'ہوم' : 'گھر'}
          </Link>
          <Link href="/categories" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 600, textDecoration: 'none', color: 'inherit' }}>
            {language === 'en' ? 'Explore' : language === 'ur' ? 'تلاش کریں' : 'ڳوليو'}
          </Link>
          
          {isLoggedIn ? (
            <>
              <Link 
                href={userRole === 'seller' ? '/dashboard/seller' : userRole === 'admin' ? '/dashboard/admin' : '/dashboard/buyer'} 
                onClick={() => setMobileMenuOpen(false)}
                style={{ fontSize: '1.1rem', fontWeight: 600, textDecoration: 'none', color: 'var(--primary)' }}
              >
                {userRole === 'seller' ? 'Seller Panel' : userRole === 'admin' ? 'Admin Panel' : 'My Account'}
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>{userName}</span>
                <button onClick={handleLogout} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--accent)', display: 'flex', gap: '0.25rem' }}>
                  <LogOut size={14} />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </>
          ) : (
            <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ width: '100%', display: 'flex', gap: '0.5rem' }}>
              <User size={16} />
              <span>{t('login')}</span>
            </Link>
          )}
        </div>
      )}

      <style jsx>{`
        .desktop-only {
          display: flex;
        }
        .mobile-only {
          display: none;
        }
        .mobile-only-btn {
          display: none;
        }
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
          .mobile-only {
            display: flex;
          }
          .mobile-only-btn {
            display: block;
          }
        }
      `}</style>
    </header>
  );
}
