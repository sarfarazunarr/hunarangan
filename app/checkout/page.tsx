'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { CreditCard, Truck, Wallet, CheckCircle, ArrowLeft, Loader } from 'lucide-react';

interface CartItem {
  productId: string;
  title: string;
  price: number;
  images: string[];
  sellerId: string;
  sellerName: string;
}

export default function CheckoutPage() {
  const globalLang = useLanguage();
  const activeLang = globalLang.language;
  const activeDir = globalLang.dir;
  const t = globalLang.t;

  const router = useRouter();

  const [cart, setCart] = useState<CartItem | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Mock_EasyPaisa' | 'Mock_JazzCash' | 'Mock_Card'>('COD');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Shipping Form States
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Auth check
    const storedUser = localStorage.getItem('hunarangan-user');
    if (!storedUser) {
      router.push('/auth/login');
      return;
    }
    const user = JSON.parse(storedUser);
    setCurrentUser(user);

    // Fetch detailed profile to autofill
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile?userId=${user.id}`);
        const data = await res.json();
        if (data.success && data.user) {
          setRecipientName(data.user.name || '');
          setRecipientPhone(data.user.phone || '');
          setShippingAddress(data.user.address || '');
        }
      } catch (err) {
        console.error('Profile fetch failed:', err);
      }
    };
    fetchProfile();

    // Cart fetch
    const storedCart = localStorage.getItem('hunarangan-cart');
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    } else {
      router.push('/');
    }
  }, []);

  const handleCheckout = async () => {
    if (!cart || !currentUser) return;
    if (!recipientName.trim() || !recipientPhone.trim() || !shippingAddress.trim()) {
      setError(activeLang === 'en' ? 'Please fill in all required shipping details.' : 'براہ کرم ترسیل کی تمام تفصیلات درج کریں۔');
      return;
    }
    const phoneTrimmed = recipientPhone.trim();
    if (!/^\+\d{10,15}$/.test(phoneTrimmed)) {
      setError(activeLang === 'en'
        ? 'Recipient phone must start with country code (e.g. +923001234567).'
        : 'وصول کنندہ کا فون نمبر کنٹری کوڈ کے ساتھ ہونا چاہیے (جیسے +923001234567)۔');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: currentUser.id,
          productId: cart.productId,
          paymentMethod,
          shippingAddress,
          recipientPhone: phoneTrimmed,
          recipientName,
          notes
        })
      });

      const data = await res.json();
      if (res.ok) {
        // Clear cart
        localStorage.removeItem('hunarangan-cart');
        // Route to order-tracking
        router.push(`/order-tracking/${data.orderId}`);
      } else {
        setError(data.error || 'Checkout failed.');
      }
    } catch (e) {
      setError('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!cart) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ direction: activeDir, marginTop: '1.5rem', maxWidth: '600px' }}>
      
      {/* Back button */}
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} />
        <span>{activeLang === 'en' ? 'Back' : 'پیچھے'}</span>
      </button>

      <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
          {activeLang === 'en' ? 'Checkout Options' : 'ادائیگی کی تفصیلات'}
        </h2>

        {error && (
          <div style={{ background: 'rgba(220,38,38,0.1)', color: 'var(--accent)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* Product preview */}
        <div style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '0.75rem', alignItems: 'center' }}>
          <img src={cart.images[0]} alt={cart.title} style={{ width: '80px', height: '80px', borderRadius: '0.5rem', objectFit: 'cover' }} />
          <div>
            <h4 style={{ fontWeight: 800 }}>{cart.title}</h4>
            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Artisan: {cart.sellerName}</span>
            <p style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem', marginTop: '0.25rem' }}>
              Rs. {cart.price}
            </p>
          </div>
        </div>

        {/* Shipping Form details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
            {activeLang === 'en' ? 'Shipping Details' : 'ترسیل کی تفصیلات'}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                {activeLang === 'en' ? 'Recipient Name' : 'وصول کنندہ کا نام'} <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <input 
                type="text" 
                value={recipientName} 
                onChange={(e) => setRecipientName(e.target.value)} 
                placeholder="e.g. Sajida Bano"
                style={{ padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                {activeLang === 'en' ? 'Recipient Phone' : 'فون نمبر'} <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <input 
                type="tel" 
                value={recipientPhone} 
                onChange={(e) => setRecipientPhone(e.target.value)} 
                placeholder="e.g. +923001234567"
                style={{ padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              {activeLang === 'en' ? 'Shipping Address' : 'گھر کا پتہ'} <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <textarea 
              value={shippingAddress} 
              onChange={(e) => setShippingAddress(e.target.value)} 
              placeholder="House Number, Street Name, Sector, City..."
              style={{ padding: '0.6rem', borderRadius: '0.5rem', outline: 'none', height: '60px', fontFamily: 'inherit', resize: 'none' }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              {activeLang === 'en' ? 'Delivery Instructions / Notes (Optional)' : 'خصوصی ہدایات (اختیاری)'}
            </label>
            <input 
              type="text" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="e.g. Call before arrival"
              style={{ padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }}
            />
          </div>
        </div>

        {/* Payment options toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
            Select Payment Method
          </h3>

          {/* COD Option */}
          <div 
            onClick={() => setPaymentMethod('COD')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: paymentMethod === 'COD' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
              background: paymentMethod === 'COD' ? 'rgba(15, 110, 71, 0.05)' : 'white',
              cursor: 'pointer'
            }}
          >
            <Truck style={{ color: paymentMethod === 'COD' ? 'var(--primary)' : 'inherit' }} />
            <div>
              <strong style={{ display: 'block' }}>Cash on Delivery (COD)</strong>
              <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Pay when items are delivered to your doorstep.</span>
            </div>
          </div>

          {/* EasyPaisa Option */}
          <div 
            onClick={() => setPaymentMethod('Mock_EasyPaisa')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: paymentMethod === 'Mock_EasyPaisa' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
              background: paymentMethod === 'Mock_EasyPaisa' ? 'rgba(15, 110, 71, 0.05)' : 'white',
              cursor: 'pointer'
            }}
          >
            <Wallet style={{ color: paymentMethod === 'Mock_EasyPaisa' ? 'var(--primary)' : 'inherit' }} />
            <div>
              <strong style={{ display: 'block' }}>EasyPaisa Escrow Wallet</strong>
              <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Locked in secure escrow. Released upon delivery.</span>
            </div>
          </div>

          {/* JazzCash Option */}
          <div 
            onClick={() => setPaymentMethod('Mock_JazzCash')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: paymentMethod === 'Mock_JazzCash' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
              background: paymentMethod === 'Mock_JazzCash' ? 'rgba(15, 110, 71, 0.05)' : 'white',
              cursor: 'pointer'
            }}
          >
            <Wallet style={{ color: paymentMethod === 'Mock_JazzCash' ? 'var(--primary)' : 'inherit' }} />
            <div>
              <strong style={{ display: 'block' }}>JazzCash Escrow Wallet</strong>
              <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Protected transaction. Safe and secure payouts.</span>
            </div>
          </div>

          {/* Card Option */}
          <div 
            onClick={() => setPaymentMethod('Mock_Card')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: paymentMethod === 'Mock_Card' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
              background: paymentMethod === 'Mock_Card' ? 'rgba(15, 110, 71, 0.05)' : 'white',
              cursor: 'pointer'
            }}
          >
            <CreditCard style={{ color: paymentMethod === 'Mock_Card' ? 'var(--primary)' : 'inherit' }} />
            <div>
              <strong style={{ display: 'block' }}>Credit / Debit Card</strong>
              <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Supports all Visa and MasterCard systems.</span>
            </div>
          </div>

        </div>

        {/* Submit */}
        <button onClick={handleCheckout} disabled={isLoading} className="btn btn-primary" style={{ width: '100%', padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', borderRadius: '0.5rem', fontSize: '1.05rem' }}>
          {isLoading ? <Loader className="spin" size={18} /> : <CheckCircle size={18} />}
          <span>{isLoading ? 'Processing...' : 'Complete Purchase'}</span>
        </button>

      </div>

      <style jsx>{`
        .spinner {
          width: 32px;
          height: 32px;
          border: 4px solid var(--border-light);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
