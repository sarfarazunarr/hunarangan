'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { Check, ShieldCheck, Truck, ArrowLeft, Loader, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface OrderDetail {
  _id: string;
  productId?: { title: { en: string; ur: string; sd: string }; price: number; images: string[] };
  customOfferDetails?: { title: string; amount: number };
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryStatus: string;
  createdAt: string;
  sellerId: { name: string; location: string };
  buyerId: { name: string };
}

export default function OrderTrackingPage() {
  const { language, t, dir } = useLanguage();
  const { showToast, success: showSuccessToast, error: showErrorToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrderDetails = async () => {
    setIsLoading(true);
    try {
      // Find order in database
      // For fallback/offline evaluation, we parse standard details
      const storedUser = localStorage.getItem('hunarangan-user');
      const userId = storedUser ? JSON.parse(storedUser).id : 'buyer1';
      
      const res = await fetch(`/api/orders?userId=${userId}&role=buyer`);
      const data = await res.json();
      
      if (data.success && data.orders && data.orders.length > 0) {
        const found = data.orders.find((o: any) => o._id === orderId);
        setOrder(found || data.orders[0]);
      } else {
        // Fallback mock order
        setOrder({
          _id: orderId,
          productId: { title: { en: 'Red Sindhi Rilli Quilt', ur: 'سرخ رلی رضائی', sd: 'ڳاڙهي رلي' }, price: 4500, images: ['https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&auto=format&fit=crop&q=80'] },
          amount: 4500,
          paymentMethod: 'Mock_EasyPaisa',
          paymentStatus: 'Paid_Escrow',
          deliveryStatus: 'Placed',
          createdAt: new Date().toISOString(),
          sellerId: { name: 'Mai Bhagi', location: 'Hyderabad' },
          buyerId: { name: 'Sajida Bano' }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const handleReleaseFunds = async () => {
    if (!order) return;
    const confirmRelease = window.confirm(language === 'en'
      ? 'Do you confirm delivery and want to release escrow funds to the artisan?'
      : 'کیا آپ آرڈر وصولی کی تصدیق اور کاریگر کو رقم کی منتقلی منظور کرتے ہیں؟');
    
    if (!confirmRelease) return;

    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id, paymentStatus: 'Released_To_Seller' })
      });
      if (res.ok) {
        showSuccessToast(language === 'en' ? 'Funds successfully released!' : 'رقم کاریگر کو منتقل کر دی گئی ہے!');
        fetchOrderDetails();
      }
    } catch (e) {
      console.error(e);
      showErrorToast('Failed to release funds.');
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Order not found.</p>
      </div>
    );
  }

  const steps = ['Placed', 'Packed', 'Shipped', 'Delivered'];
  const currentStepIdx = steps.indexOf(order.deliveryStatus);
  const prodName = order.productId ? (order.productId.title[language] || order.productId.title.en) : order.customOfferDetails?.title;

  return (
    <div className="container" style={{ direction: dir, marginTop: '1.5rem', maxWidth: '650px' }}>
      
      <button onClick={() => router.push('/dashboard/buyer')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} />
        <span>{language === 'en' ? 'Go to Dashboard' : 'ڈیش بورڈ پر جائیں'}</span>
      </button>

      <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
            {language === 'en' ? 'Track Your Purchase' : 'آرڈر کی صورتحال'}
          </h2>
          <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Order ID: {order._id}</p>
        </div>

        {/* Stepper nodes */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 0', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '5%', right: '5%', top: '50%', height: '4px', background: 'rgba(0,0,0,0.1)', zIndex: 1, transform: 'translateY(-50%)' }}></div>
          <div style={{ position: 'absolute', left: '5%', width: `${(currentStepIdx / 3) * 90}%`, top: '50%', height: '4px', background: 'var(--primary)', zIndex: 2, transform: 'translateY(-50%)', transition: 'width 0.5s ease' }}></div>

          {steps.map((step, idx) => {
            const isActive = idx <= currentStepIdx;
            return (
              <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative', flex: 1 }}>
                <div style={{
                  width: '2.2rem',
                  height: '2.2rem',
                  borderRadius: '50%',
                  background: isActive ? 'var(--primary)' : 'white',
                  border: isActive ? 'none' : '2px solid rgba(0,0,0,0.15)',
                  color: isActive ? 'white' : 'rgba(0,0,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {isActive ? <Check size={14} /> : idx + 1}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 700 : 500, opacity: isActive ? 1 : 0.6, marginTop: '0.5rem' }}>
                  {t(`status${step}`)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Order specs details */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.7 }}>Item name:</span>
            <strong>{prodName}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.7 }}>Payment Channel:</span>
            <strong>{order.paymentMethod}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.7 }}>Escrow Status:</span>
            <strong style={{ color: order.paymentStatus === 'Paid_Escrow' ? 'var(--secondary)' : 'var(--primary)' }}>
              {order.paymentStatus}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dotted var(--border-light)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
            <span style={{ fontWeight: 700 }}>Total Paid:</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>Rs. {order.amount}</strong>
          </div>

        </div>

        {/* Escrow payout unlock action */}
        {order.paymentStatus === 'Paid_Escrow' && order.deliveryStatus === 'Delivered' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', background: 'rgba(217, 119, 6, 0.05)', padding: '1rem', borderRadius: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary)', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <ShieldCheck size={16} />
              <span>{language === 'en' ? 'Package Delivered! Release Funds to Seller.' : 'پیکیج موصول ہو گیا! رقم کاریگر کو منتقل کریں۔'}</span>
            </span>
            <button onClick={handleReleaseFunds} className="btn btn-primary" style={{ width: '100%' }}>
              Release Escrow Funds
            </button>
          </div>
        ) : order.paymentStatus === 'Released_To_Seller' ? (
          <div style={{ background: 'rgba(15, 110, 71, 0.08)', color: 'var(--primary)', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center', fontWeight: 700 }}>
            ✓ {t('escrowReleased')}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', background: 'rgba(217, 119, 6, 0.05)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
            <Truck size={16} />
            <span>
              {language === 'en' 
                ? 'Standard local courier is delivering your product. Escrow secures your funds safely.' 
                : 'ڈیلیوری جاری ہے! ایسکرو آپ کے فنڈز کو ترسیل مکمل ہونے تک محفوظ رکھتا ہے۔'}
            </span>
          </div>
        )}

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
      `}</style>
    </div>
  );
}
