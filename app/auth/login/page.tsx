'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Phone, Lock, User as UserIcon, MapPin, CheckCircle, ArrowLeft, RefreshCw, Key } from 'lucide-react';
import { PAKISTAN_CITIES } from '@/lib/cities';

export default function LoginPage() {
  const { language, t, dir } = useLanguage();
  const router = useRouter();

  // Navigation Steps
  // 1: Phone input
  // 2: PIN input (for users with established PINs)
  // 3: First-time OTP Verification + PIN Setup (for registration/first-time login)
  // 4: Reset PIN OTP Verification + PIN Configuration (for locked-out/forgot PIN flows)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Input states
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  
  // Registration setup states
  const [isNewUser, setIsNewUser] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [location, setLocation] = useState('Karachi');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  
  // Custom option to set PIN equal to OTP code
  const [useOtpAsPin, setUseOtpAsPin] = useState(true);

  // TextBee SMS Status States
  const [smsId, setSmsId] = useState('');
  const [smsStatus, setSmsStatus] = useState('');

  // SMS delivery checker polling
  useEffect(() => {
    if (!smsId) return;

    setSmsStatus(language === 'en' ? 'Checking delivery status...' : 'ڈیلیوری کی صورتحال چیک کی جا رہی ہے...');
    
    let intervalId: any;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/auth/sms-status?smsId=${smsId}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          const mainData = data.data;
          const status = mainData.status || (mainData.data && mainData.data.status) || 'Pending';
          
          if (status === 'Delivered' || status === 'Sent') {
            setSmsStatus(language === 'en' ? '✓ Verification SMS Delivered' : '✓ تصدیقی ایس ایم ایس موصول ہو گیا');
            clearInterval(intervalId);
          } else if (status === 'Failed') {
            setSmsStatus(language === 'en' ? '⚠️ Delivery Failed. Try resending.' : '⚠️ ترسیل ناکام ہو گئی۔ دوبارہ کوشش کریں۔');
            clearInterval(intervalId);
          } else {
            setSmsStatus(language === 'en' ? `Status: ${status}` : `صورتحال: ${status}`);
          }
        }
      } catch (e) {
        console.error('Check SMS status error:', e);
      }
      
      attempts++;
      if (attempts >= 15) { // Stop polling after 45 seconds
        clearInterval(intervalId);
      }
    };

    intervalId = setInterval(checkStatus, 3000);
    checkStatus();

    return () => clearInterval(intervalId);
  }, [smsId, language]);

  // Step 1: Submit Phone Number
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneTrimmed = phone.trim();
    
    if (!phoneTrimmed || !/^\+\d{10,15}$/.test(phoneTrimmed)) {
      setError(language === 'en' 
        ? 'Please enter your phone number with country code (e.g. +923001234567).' 
        : 'براہ کرم اپنا فون نمبر کنٹری کوڈ کے ساتھ درج کریں (جیسے +923001234567)۔');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    setSmsId('');
    setSmsStatus('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneTrimmed }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsNewUser(data.isNewUser);
        if (data.hasPin) {
          // User already set a PIN, move to PIN input
          setStep(2);
        } else {
          // First-time register or set PIN, move to OTP Setup
          setStep(3);
          if (data.smsId) {
            setSmsId(data.smsId);
          }
        }
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch (e: any) {
      setError('Connection failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Submit secure PIN to Login
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setError(language === 'en' ? 'PIN must be at least 4 digits.' : 'پن کوڈ کم از کم 4 ہندسوں کا ہونا چاہیے۔');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), pin }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('hunarangan-user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-change'));
        
        if (data.user.role === 'seller') {
          router.push('/dashboard/seller');
        } else {
          router.push('/');
        }
      } else {
        if (data.resetRequired) {
          // Automatically locked out, redirect to OTP reset
          setError(data.error || 'Too many incorrect PIN attempts.');
          setStep(4);
          if (data.smsId) {
            setSmsId(data.smsId);
          }
        } else {
          setError(data.error || 'PIN verification failed.');
          if (data.attemptsRemaining !== undefined) {
            setAttemptsRemaining(data.attemptsRemaining);
          }
        }
      }
    } catch (e) {
      setError('PIN verification failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3 / 4: Verify OTP and save custom/same PIN
  const handleVerifyOtpAndSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError(language === 'en' ? 'Please enter the verification OTP.' : 'تصدیقی کوڈ درج کریں۔');
      return;
    }

    // Determine final PIN selection
    let targetPin = '';
    if (step === 3 && useOtpAsPin) {
      targetPin = otp;
    } else {
      if (!newPin || newPin.length < 4) {
        setError(language === 'en' ? 'PIN must be 4 to 6 digits.' : 'پن کوڈ 4 سے 6 ہندسوں کا ہونا چاہیے۔');
        return;
      }
      if (newPin !== confirmNewPin) {
        setError(language === 'en' ? 'PIN fields do not match.' : 'درج کردہ پن کوڈز مطابقت نہیں رکھتے۔');
        return;
      }
      targetPin = newPin;
    }

    if (isNewUser && !gender) {
      setError(language === 'en' ? 'Please select your gender.' : 'براہ کرم اپنی جنس منتخب کریں۔');
      return;
    }

    if (isNewUser && role === 'seller' && gender !== 'female') {
      setError(language === 'en'
        ? 'Only female artisans can register as sellers on HunarAangan.'
        : 'ہنر آنگن پر صرف خواتین کاریگر ہی سیلر کے طور پر رجسٹر ہو سکتی ہیں۔');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Step 1: Verify OTP and set PIN
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), otp, pin: targetPin }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Step 2: Complete profile if it's registration
        if (isNewUser) {
          const profileRes = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.user.id,
              name: name || `User_${phone.slice(-4)}`,
              location,
              gender,
              role
            })
          });
          const profileData = await profileRes.json();
          if (profileRes.ok && profileData.success) {
            data.user = { 
              ...data.user, 
              name: profileData.user.name, 
              location: profileData.user.location,
              gender: profileData.user.gender,
              role: profileData.user.role
            };
          }
        }

        localStorage.setItem('hunarangan-user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-change'));
        
        if (data.user.role === 'seller') {
          router.push('/dashboard/seller?tab=profile');
        } else {
          router.push('/dashboard/buyer?tab=profile');
        }
      } else {
        setError(data.error || 'Verification failed.');
      }
    } catch (e) {
      setError('Verification failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Forgot PIN verification
  const handleForgotPin = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    setSmsId('');
    setSmsStatus('');

    try {
      const res = await fetch('/api/auth/send-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStep(4);
        if (data.smsId) {
          setSmsId(data.smsId);
        }
        setSuccessMsg(language === 'en' ? 'Reset OTP has been sent to your phone.' : 'ری سیٹ کوڈ آپ کے فون پر بھیج دیا گیا ہے۔');
      } else {
        setError(data.error || 'Failed to send reset code.');
      }
    } catch (e) {
      setError('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP Code
  const handleResendOtp = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    setSmsId('');
    setSmsStatus('');

    try {
      const endpoint = step === 3 ? '/api/auth/login' : '/api/auth/send-reset-otp';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.smsId) {
          setSmsId(data.smsId);
        }
        setSuccessMsg(language === 'en' ? 'Verification OTP has been resent.' : 'تصدیقی او ٹی پی دوبارہ بھیج دیا گیا ہے۔');
      } else {
        setError(data.error || 'Failed to resend code.');
      }
    } catch (e) {
      setError('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const cities = PAKISTAN_CITIES;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '1rem', direction: dir }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
            {step === 1 && t('login')}
            {step === 2 && (language === 'en' ? 'Enter Security PIN' : 'سیکیورٹی پن درج کریں')}
            {step === 3 && (language === 'en' ? 'Verify & Setup PIN' : 'تصدیق اور پن سیٹ اپ')}
            {step === 4 && (language === 'en' ? 'Reset Security PIN' : 'پن کوڈ ری سیٹ کریں')}
          </h2>
          <p style={{ opacity: 0.7, fontSize: '0.95rem', marginTop: '0.25rem' }}>
            {step === 1 && t('tagline')}
            {step === 2 && (language === 'en' ? `Enter secure login PIN for ${phone}` : `اپنا سیکیورٹی لاگ ان پن کوڈ درج کریں`)}
            {(step === 3 || step === 4) && (language === 'en' ? `Enter 6-digit OTP code sent to ${phone}` : `اپنے نمبر پر موصولہ 6 ہندسوں کا کوڈ درج کریں`)}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--accent)', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'rgba(10, 77, 52, 0.08)', color: 'var(--primary)', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            {successMsg}
          </div>
        )}

        {/* STEP 1: Phone input */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>
                {language === 'en' ? 'Phone Number' : 'فون نمبر'}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Phone size={18} style={{ position: 'absolute', [dir === 'ltr' ? 'left' : 'right']: '1rem', opacity: 0.5 }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={language === 'en' ? 'e.g. +923001234567' : 'مثال: +923001234567'}
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

            <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
              {isLoading ? '...' : (language === 'en' ? 'Proceed' : 'آگے بڑھیں')}
            </button>
          </form>
        )}

        {/* STEP 2: PIN entry */}
        {step === 2 && (
          <form onSubmit={handleVerifyPin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>
                {language === 'en' ? 'Enter Login PIN' : 'لاگ ان پن کوڈ درج کریں'}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} style={{ position: 'absolute', [dir === 'ltr' ? 'left' : 'right']: '1rem', opacity: 0.5 }} />
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem 0.8rem 2.8rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-light)',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    letterSpacing: '0.25rem',
                    textAlign: 'center',
                    outline: 'none'
                  }}
                  required
                />
              </div>
            </div>

            {attemptsRemaining !== null && (
              <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, display: 'block', textAlign: 'center' }}>
                {language === 'en' 
                  ? `Warning: ${attemptsRemaining} attempts left before auto OTP reset.` 
                  : `وارننگ: لاک آؤٹ اور خودکار ری سیٹ سے پہلے ${attemptsRemaining} کوششیں باقی ہیں۔`}
              </span>
            )}

            <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
              {isLoading ? '...' : (language === 'en' ? 'Verify & Login' : 'تصدیق اور لاگ ان')}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.85rem' }}>
              <button type="button" onClick={handleForgotPin} className="btn-link" style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontWeight: 700, cursor: 'pointer' }}>
                {language === 'en' ? 'Forgot PIN / Reset PIN?' : 'پن کوڈ بھول گئے؟ ری سیٹ کریں'}
              </button>
              
              <button type="button" onClick={() => setStep(1)} className="btn-link" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {language === 'en' ? 'Change Phone' : 'نمبر تبدیل کریں'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: OTP verify + PIN setup */}
        {step === 3 && (
          <form onSubmit={handleVerifyOtpAndSetPin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Real-time SMS Status Tracker */}
            {smsStatus && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(10, 77, 52, 0.05)', padding: '0.6rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                <RefreshCw size={14} className="spin" style={{ animation: 'spin 2s linear infinite' }} />
                <span>{smsStatus}</span>
              </div>
            )}

            {/* OTP Code */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>
                {language === 'en' ? 'Enter 6-Digit OTP Code' : 'موصولہ 6 ہندسوں کا کوڈ'}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Key size={18} style={{ position: 'absolute', [dir === 'ltr' ? 'left' : 'right']: '1rem', opacity: 0.5 }} />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem 0.8rem 2.8rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-light)',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    letterSpacing: '0.25rem',
                    textAlign: 'center',
                    outline: 'none'
                  }}
                  required
                />
              </div>
            </div>

            {/* PIN Configuration Choice */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                {language === 'en' ? 'Login PIN Setup' : 'لاگ ان پن سیٹ اپ'}
              </span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={useOtpAsPin}
                    onChange={() => setUseOtpAsPin(true)}
                  />
                  <span>{language === 'en' ? 'Use verification OTP as Login PIN' : 'تصدیقی او ٹی پی کو ہی پن کوڈ بنائیں'}</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={!useOtpAsPin}
                    onChange={() => setUseOtpAsPin(false)}
                  />
                  <span>{language === 'en' ? 'Configure a custom PIN' : 'اپنی پسند کا پن کوڈ درج کریں'}</span>
                </label>
              </div>

              {!useOtpAsPin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px dotted var(--border)', paddingTop: '0.75rem' }}>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder={language === 'en' ? 'New PIN (4-6 digits)' : 'نیا پن کوڈ درج کریں (4-6 ہندسے)'}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    style={{ padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border-light)', fontSize: '0.9rem', outline: 'none' }}
                  />
                  <input
                    type="password"
                    maxLength={6}
                    placeholder={language === 'en' ? 'Confirm New PIN' : 'پن کوڈ کی تصدیق کریں'}
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                    style={{ padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border-light)', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
              )}
            </div>

            {/* Complete setup info if registration */}
            {isNewUser && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '0.25rem' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {language === 'en' ? 'Complete Profile Setup' : 'پروفائل سیٹ اپ کریں'}
                </h4>
                
                {/* Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>{language === 'en' ? 'Full Name' : 'پورا نام'}</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <UserIcon size={16} style={{ position: 'absolute', [dir === 'ltr' ? 'left' : 'right']: '0.75rem', opacity: 0.5 }} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Zainab Bibi"
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem 0.6rem 2.4rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-light)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        paddingLeft: dir === 'ltr' ? '2.4rem' : '0.8rem',
                        paddingRight: dir === 'ltr' ? '0.8rem' : '2.4rem'
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Location */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>{language === 'en' ? 'City' : 'شہر'}</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <MapPin size={16} style={{ position: 'absolute', [dir === 'ltr' ? 'left' : 'right']: '0.75rem', opacity: 0.5 }} />
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem 0.6rem 2.4rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-light)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        background: 'white',
                        paddingLeft: dir === 'ltr' ? '2.4rem' : '0.8rem',
                        paddingRight: dir === 'ltr' ? '0.8rem' : '2.4rem'
                      }}
                    >
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Gender */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>{language === 'en' ? 'Gender' : 'جنس'}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        border: gender === 'female' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        background: gender === 'female' ? 'rgba(15, 110, 71, 0.05)' : 'transparent',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      {language === 'en' ? 'Female (خواتین)' : 'خاتون'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        border: gender === 'male' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        background: gender === 'male' ? 'rgba(15, 110, 71, 0.05)' : 'transparent',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      {language === 'en' ? 'Male (مرد)' : 'مرد'}
                    </button>
                  </div>
                </div>

                {/* Role */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>{language === 'en' ? 'Register As' : 'اکاؤنٹ کی قسم'}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setRole('buyer')}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        border: role === 'buyer' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        background: role === 'buyer' ? 'rgba(15, 110, 71, 0.05)' : 'transparent',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      {language === 'en' ? 'Buyer (خریداری)' : 'خریدار'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('seller')}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        border: role === 'seller' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        background: role === 'seller' ? 'rgba(15, 110, 71, 0.05)' : 'transparent',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      {language === 'en' ? 'Artisan / Seller' : 'کاریگر / سیلر'}
                    </button>
                  </div>
                  {role === 'seller' && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, marginTop: '0.25rem' }}>
                      {language === 'en'
                        ? 'Please note: Only women artisans can register as sellers to list their handmade products.'
                        : 'نوٹ: صرف خواتین کاریگر ہی مصنوعات فروخت کرنے کے لیے سیلر کے طور پر رجسٹر ہو سکتی ہیں۔'}
                    </span>
                  )}
                </div>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ width: '100%', padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={18} />
              <span>{isLoading ? '...' : (language === 'en' ? 'Verify & Setup' : 'تصدیق اور سیٹ اپ')}</span>
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.85rem' }}>
              <button type="button" onClick={handleResendOtp} disabled={isLoading} className="btn-link" style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontWeight: 700, cursor: 'pointer' }}>
                {language === 'en' ? 'Resend OTP' : 'او ٹی پی دوبارہ بھیجیں'}
              </button>
              <button type="button" onClick={() => setStep(1)} className="btn-link" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {language === 'en' ? 'Back' : 'پیچھے'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Reset PIN configuration */}
        {step === 4 && (
          <form onSubmit={handleVerifyOtpAndSetPin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Real-time SMS Status Tracker */}
            {smsStatus && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(10, 77, 52, 0.05)', padding: '0.6rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                <RefreshCw size={14} className="spin" style={{ animation: 'spin 2s linear infinite' }} />
                <span>{smsStatus}</span>
              </div>
            )}

            {/* OTP Code */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>
                {language === 'en' ? 'Enter 6-Digit OTP Code' : 'موصولہ 6 ہندسوں کا کوڈ'}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Key size={18} style={{ position: 'absolute', [dir === 'ltr' ? 'left' : 'right']: '1rem', opacity: 0.5 }} />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem 0.8rem 2.8rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-light)',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    letterSpacing: '0.25rem',
                    textAlign: 'center',
                    outline: 'none'
                  }}
                  required
                />
              </div>
            </div>

            {/* New PIN configure fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {language === 'en' ? 'New Secure PIN (4-6 digits)' : 'نیا پن کوڈ درج کریں (4-6 ہندسے)'}
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="••••"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-light)',
                    fontSize: '1.1rem',
                    outline: 'none',
                    letterSpacing: '0.25rem',
                    textAlign: 'center'
                  }}
                  required
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {language === 'en' ? 'Confirm New PIN' : 'پن کوڈ کی تصدیق کریں'}
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="••••"
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-light)',
                    fontSize: '1.1rem',
                    outline: 'none',
                    letterSpacing: '0.25rem',
                    textAlign: 'center'
                  }}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ width: '100%', padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={18} />
              <span>{isLoading ? '...' : (language === 'en' ? 'Reset PIN & Login' : 'پن کوڈ ری سیٹ اور لاگ ان')}</span>
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.85rem' }}>
              <button type="button" onClick={handleResendOtp} disabled={isLoading} className="btn-link" style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontWeight: 700, cursor: 'pointer' }}>
                {language === 'en' ? 'Resend OTP' : 'او ٹی پی دوبارہ بھیجیں'}
              </button>
              <button type="button" onClick={() => setStep(1)} className="btn-link" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {language === 'en' ? 'Back' : 'پیچھے'}
              </button>
            </div>
          </form>
        )}

      </div>

      <style jsx>{`
        .spin {
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .btn-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
