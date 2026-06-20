'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { Award, MapPin, Play, Square, MessageSquare, Phone, ShieldCheck, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface SellerDetail {
  _id: string;
  name: string;
  location: string;
  phone: string;
  bio: { en: string; ur: string; sd: string };
}

interface ProductItem {
  _id: string;
  title: { en: string; ur: string; sd: string };
  price: number;
  images: string[];
  category: string;
  isCustomService: boolean;
}

export default function SellerProfilePage() {
  const { language, t, dir } = useLanguage();
  const { showToast, success: showSuccessToast, error: showErrorToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const sellerId = params.id as string;

  const [seller, setSeller] = useState<SellerDetail | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchSellerData = async () => {
      setIsLoading(true);
      try {
        // Fetch seller details from products or simulated User profile endpoint
        // For local evaluation, we make sure we have fallback values if API is empty
        const res = await fetch(`/api/products?sellerId=${sellerId}`);
        const data = await res.json();
        
        let targetSeller: SellerDetail | null = null;
        let targetProducts: ProductItem[] = [];

        if (data.products && data.products.length > 0) {
          const firstProd = data.products[0];
          targetSeller = {
            _id: firstProd.sellerId._id || sellerId,
            name: firstProd.sellerId.name,
            location: firstProd.sellerId.location,
            phone: firstProd.sellerId.phone || '03001234567',
            bio: firstProd.sellerId.bio || {
              en: 'Traditional craft maker from Punjab.',
              ur: 'پنجاب کی روایتی دستکاری بنانے والی کاریگر۔',
              sd: 'پنجاب جي روايتي دستڪاري ٺاهيندڙ ڪاريگر.'
            }
          };
          targetProducts = data.products;
        } else {
          // If no products, try to fetch profile details directly
          try {
            const profileRes = await fetch(`/api/profile?userId=${sellerId}`);
            const profileData = await profileRes.json();
            if (profileData.success && profileData.user) {
              const u = profileData.user;
              targetSeller = {
                _id: u._id || u.id || sellerId,
                name: u.name,
                location: u.location,
                phone: u.phone,
                bio: u.bio || { en: '', ur: '', sd: '' }
              };
            }
          } catch (err) {
            console.error('Failed to fetch seller profile:', err);
          }
          targetProducts = [];
        }

        setSeller(targetSeller);
        setProducts(targetProducts);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellerData();
  }, [sellerId]);

  const toggleVoiceIntro = () => {
    if (isPlayingVoice) {
      if (audioObj) {
        audioObj.pause();
        setIsPlayingVoice(false);
      }
    } else {
      // Simulate playing seller voice recording introduction file
      // In a real flow, this redirects to the seller's custom voice payload URL
      const textToSpeak = language === 'en' 
        ? `Hello, Assalam-o-Alaikum! My name is ${seller?.name}. Welcome to my shop. I hope you enjoy my handmade products.`
        : language === 'ur'
        ? `السلام علیکم، میرا نام ${seller?.name} ہے۔ میرے ہنر آنگن اسٹور پر خوش آمدید۔ امید ہے آپ کو میرا کام پسند آئے گا۔`
        : `اسلام عليڪم، منهنجو نالو ${seller?.name} آهي. منهنجي دڪان تي ڀليڪار. اميد آهي ته توهان کي منهنجون شيون پسند اينديون.`;

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = language === 'ur' ? 'ur-PK' : language === 'sd' ? 'sd-PK' : 'en-US';
        utterance.onend = () => setIsPlayingVoice(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingVoice(true);
      }
    }
  };

  const handleStartConversation = async () => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('hunarangan-user');
    if (!storedUser) {
      router.push('/auth/login');
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: parsed.id, sellerId }),
      });
      const data = await res.json();
      
      if (res.ok) {
        router.push(`/chat/${data.roomId}`);
      } else {
        showErrorToast('Could not start conversation: ' + data.error);
      }
    } catch (e) {
      console.error(e);
      showErrorToast('Connection failed.');
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>{language === 'en' ? 'Seller profile not found.' : 'کاریگر کا پروفائل نہیں ملا۔'}</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ direction: dir, marginTop: '1.5rem' }}>
      
      <section className="glass-card responsive-profile-grid" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* Profile Pic & Badge */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '3rem',
            fontWeight: 800,
            boxShadow: 'var(--shadow-md)',
            border: '4px solid white'
          }}>
            {seller.name.charAt(0)}
          </div>
          
          {/* Verified Badge */}
          <div style={{
            position: 'absolute',
            bottom: '-5px',
            right: dir === 'ltr' ? '15px' : 'auto',
            left: dir === 'rtl' ? '15px' : 'auto',
            background: '#ffffff',
            borderRadius: '50%',
            padding: '2px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <ShieldCheck size={28} style={{ color: 'var(--primary)', fill: 'rgba(15, 110, 71, 0.1)' }} />
          </div>
        </div>

        {/* Info Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{seller.name}</h2>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.2rem 0.6rem',
              background: 'rgba(15, 110, 71, 0.1)',
              color: 'var(--primary)',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700
            }}>
              <Award size={14} />
              <span>{t('verifiedArtisan')}</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: 0.8, fontSize: '0.95rem', fontWeight: 600 }}>
            <MapPin size={16} style={{ color: 'var(--secondary)' }} />
            <span>{seller.location} (Operational Location)</span>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
            <p style={{ fontStyle: 'italic', fontSize: '1.05rem', opacity: 0.9 }}>
              "{language === 'en' ? seller.bio.en : language === 'ur' ? seller.bio.ur : seller.bio.sd}"
            </p>
          </div>

          {/* Spoken Voice Intro Button */}
          <div style={{ marginTop: '0.5rem' }}>
            <button
              onClick={toggleVoiceIntro}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                border: '1px solid var(--primary)',
                background: 'rgba(15, 110, 71, 0.05)',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              {isPlayingVoice ? <Square size={12} fill="var(--primary)" /> : <Play size={12} fill="var(--primary)" />}
              <span>{isPlayingVoice ? (language === 'en' ? 'Stop Voice Intro' : 'آواز بند کریں') : (language === 'en' ? 'Listen to Voice Intro' : 'کاریگر کا تعارف سنیں')}</span>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ minWidth: '200px' }}>
          <button
            onClick={handleStartConversation}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '1.1rem 1.8rem',
              borderRadius: '0.75rem',
              boxShadow: '0 8px 20px rgba(15, 110, 71, 0.15)',
              display: 'flex',
              gap: '0.5rem',
              fontSize: '1.1rem'
            }}
          >
            <MessageSquare size={20} />
            <span>{t('startChat')}</span>
          </button>
        </div>

      </section>

      {/* 2. Dukan Catalog Items Grid */}
      <section style={{ marginTop: '3rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingBag size={22} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {language === 'en' ? 'Artisan Catalog (Dukan)' : 'دکان کی مصنوعات'}
          </h3>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ opacity: 0.6 }}>{language === 'en' ? 'No items in the catalog yet.' : 'اس دکان میں ابھی کوئی چیز نہیں ہے۔'}</p>
          </div>
        ) : (
          <div className="discovery-grid">
            {products.map((product) => (
              <div key={product._id} className="product-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                  <img src={product.images[0]} alt={product.title.en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {product.isCustomService && (
                    <span style={{ position: 'absolute', bottom: '0.5rem', [dir === 'ltr' ? 'right' : 'left']: '0.5rem', background: 'var(--secondary)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 800 }}>
                      {t('customServices')}
                    </span>
                  )}
                </div>
                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h4 style={{ fontWeight: 800, fontSize: '1rem', height: '2.8rem', overflow: 'hidden' }}>
                    {language === 'en' ? product.title.en : language === 'ur' ? product.title.ur : product.title.sd}
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>Rs. {product.price}</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{product.category}</span>
                  </div>
                  <Link href={`/product/${product._id}`} className="btn btn-outline" style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    {language === 'en' ? 'View details' : 'تفصیلات'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
        @media (max-width: 991px) {
          .responsive-profile-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .responsive-profile-grid > div {
            justify-content: center;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}
