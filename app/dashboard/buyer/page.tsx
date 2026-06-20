'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { ShoppingCart, Heart, MessageSquare, Sparkles, Check, ArrowRight, ShieldCheck, MapPin, Truck, Send, User } from 'lucide-react';
import Link from 'next/link';
import { PAKISTAN_CITIES } from '@/lib/cities';

interface OrderItem {
  _id: string;
  productId?: { title: { en: string; ur: string; sd: string }; price: number; images: string[] };
  customOfferDetails?: { title: string; amount: number };
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryStatus: string;
  createdAt: string;
  sellerId: { name: string; location: string };
}

interface ProductItem {
  _id: string;
  title: { en: string; ur: string; sd: string };
  price: number;
  images: string[];
  category: string;
}

interface ChatItem {
  roomId: string;
  sellerId: { _id: string; name: string };
  messages: { text: string; timestamp: string }[];
}

export default function BuyerDashboard() {
  const { language, t, dir } = useLanguage();
  const { showToast, success: showSuccessToast, error: showErrorToast } = useToast();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'orders' | 'favorites' | 'chats' | 'ask_ai' | 'profile'>('orders');

  // Backend lists
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [favorites, setFavorites] = useState<ProductItem[]>([]);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ask AI states
  const [statsInput, setStatsInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Profile Editor States
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileLocation, setProfileLocation] = useState('Karachi');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('hunarangan-user');
    if (!stored) {
      router.push('/auth/login');
      return;
    }
    const user = JSON.parse(stored);
    setCurrentUser(user);

    // Load full profile details from DB
    const loadProfile = async () => {
      try {
        const res = await fetch(`/api/profile?userId=${user.id}`);
        const data = await res.json();
        if (data.success && data.user) {
          setProfileName(data.user.name || '');
          setProfileEmail(data.user.email || '');
          setProfileLocation(data.user.location || 'Karachi');
          setProfileAddress(data.user.address || '');
          setProfileImage(data.user.profileImage || '');
          setProfileBio(data.user.bio?.[language] || data.user.bio?.en || '');
        }
      } catch (err) {
        console.error('Failed to load user details:', err);
      }
    };
    loadProfile();

    // Check search params query on mount
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['orders', 'favorites', 'chats', 'ask_ai', 'profile'].includes(tab)) {
        setActiveTab(tab as any);
      }
    }
  }, []);

  const fetchBuyerDashboardData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const orderRes = await fetch(`/api/orders?userId=${currentUser.id}&role=buyer`);
      const orderData = await orderRes.json();

      const chatRes = await fetch(`/api/chat/rooms?userId=${currentUser.id}`);
      const chatData = await chatRes.json();

      setOrders(orderData.orders || [
        {
          _id: 'o1',
          productId: { title: { en: 'Red Sindhi Rilli Quilt', ur: 'سرخ رلی رضائی', sd: 'ڳاڙهي رلي' }, price: 4500, images: ['https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&auto=format&fit=crop&q=80'] },
          amount: 4500,
          paymentMethod: 'Mock_EasyPaisa',
          paymentStatus: 'Paid_Escrow',
          deliveryStatus: 'Shipped',
          createdAt: new Date().toISOString(),
          sellerId: { name: 'Mai Bhagi', location: 'Hyderabad' }
        }
      ]);

      setFavorites([
        {
          _id: 'p2',
          title: { en: 'Hand-block Printed Indigo Ajrak Shawl', ur: 'ہاتھ کی بلاک چھپائی والی اجرک شال', sd: 'هٿ سان ٺهيل نيري اجرڪ شال' },
          price: 2800,
          images: ['https://images.unsplash.com/photo-1606744824163-985d376605aa?w=800&auto=format&fit=crop&q=80'],
          category: 'Ajrak'
        }
      ]);

      setChats(chatData.rooms || [
        {
          roomId: `buyer1_2`,
          sellerId: { _id: '2', name: 'Mai Bhagi' },
          messages: [{ text: 'Yes, it takes 3 days to customize.', timestamp: new Date().toISOString() }]
        }
      ]);

      // Initialize welcome message
      setAiMessages([
        {
          sender: 'bot',
          text: language === 'en'
            ? "Hello! Ask me stats or policies (e.g. 'where is my order?', 'what payment methods do you support?')."
            : "السلام علیکم! مجھ سے اپنے پیکیج کی معلومات یا ادائیگی کے طریقوں کے بارے میں پوچھیں۔"
        }
      ]);

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchBuyerDashboardData();
    }
  }, [currentUser]);

  const handleReleaseFunds = async (orderId: string) => {
    const confirmRelease = window.confirm(language === 'en'
      ? 'Do you confirm delivery and want to release escrow funds to the artisan?'
      : 'کیا آپ آرڈر وصولی کی تصدیق اور کاریگر کو رقم کی منتقلی منظور کرتے ہیں؟');
    
    if (!confirmRelease) return;

    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentStatus: 'Released_To_Seller' })
      });
      if (res.ok) {
        showSuccessToast(language === 'en' ? 'Funds successfully released!' : 'رقم کاریگر کو منتقل کر دی گئی ہے!');
        fetchBuyerDashboardData();
      }
    } catch (e) {
      console.error(e);
      showErrorToast('Failed to release funds.');
    }
  };

  const handleSendAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statsInput.trim()) return;

    const query = statsInput;
    setAiMessages(prev => [...prev, { sender: 'user', text: query }]);
    setStatsInput('');
    setIsAiLoading(true);

    try {
      // Direct call to chatbot endpoint
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, lang: language, context: 'buyer', userId: currentUser.id })
      });
      const data = await res.json();

      let answer = '';
      if (res.ok) {
        answer = data.responseText[language];
      } else {
        const lowercaseQuery = query.toLowerCase();
        if (lowercaseQuery.includes('order') || lowercaseQuery.includes('kahan') || lowercaseQuery.includes('ترسیل') || lowercaseQuery.includes('آرڈر')) {
          const activeOrder = orders[0];
          if (activeOrder) {
            const prodName = activeOrder.productId ? activeOrder.productId.title[language] || activeOrder.productId.title.en : activeOrder.customOfferDetails?.title;
            answer = language === 'en'
              ? `Your order for "${prodName}" is currently "${activeOrder.deliveryStatus}". It is handled securely.`
              : `آپ کا آرڈر "${prodName}" اس وقت "${activeOrder.deliveryStatus}" مرحلے میں ہے۔`;
          } else {
            answer = language === 'en' ? "You do not have any active orders." : "آپ کا کوئی آرڈر فعال نہیں ہے۔";
          }
        } else {
          answer = language === 'en'
            ? "HunarAangan connects you with local artisans. We secure payments in escrow until you verify delivery."
            : "ہنر آنگن آپ کو خواتین کاریگروں سے ملاتا ہے۔ ڈیلیوری کی تصدیق تک رقم ایسکرو میں محفوظ رہتی ہے۔";
        }
      }

      setAiMessages(prev => [...prev, { sender: 'bot', text: answer }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'profile');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setProfileImage(data.url);
        showSuccessToast(language === 'en' ? 'Avatar uploaded!' : 'پروفائل تصویر اپ لوڈ ہو گئی ہے!');
      } else {
        showErrorToast('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Upload connection failed.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setIsSavingProfile(true);
    setProfileSuccess(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          name: profileName,
          email: profileEmail,
          location: profileLocation,
          address: profileAddress,
          profileImage,
          bio: profileBio,
          lang: language
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfileSuccess(true);
        showSuccessToast(language === 'en' ? 'Profile updated successfully!' : 'پروفائل اپ ڈیٹ ہو گئی ہے!');
        // Update local storage user details
        const updatedUser = {
          ...currentUser,
          name: profileName,
          location: profileLocation
        };
        localStorage.setItem('hunarangan-user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        showErrorToast('Update failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Connection failed.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="container" style={{ direction: dir, marginTop: '1rem' }}>
      
      {/* Buyer profile top header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            {language === 'en' ? `My Account: ${currentUser?.name}` : `میرا اکاؤنٹ: ${currentUser?.name}`}
          </h2>
          <p style={{ opacity: 0.7 }}>{currentUser?.phone}</p>
        </div>

        {/* Quick swap dashboard switch */}
        {currentUser?.role === 'seller' && (
          <Link href="/dashboard/seller" className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            {t('buyerSellerSwitch')}
          </Link>
        )}
      </div>

      {/* Tabs navigation panel */}
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.03)', padding: '0.4rem', borderRadius: '1rem', gap: '0.5rem', marginBottom: '2rem' }}>
        
        <button onClick={() => setActiveTab('orders')} style={{
          flex: 1, padding: '0.8rem 1rem', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          background: activeTab === 'orders' ? 'var(--primary)' : 'transparent',
          color: activeTab === 'orders' ? 'white' : 'inherit',
          fontSize: '1rem'
        }}>
          <ShoppingCart size={18} />
          <span>{t('ordersTab')}</span>
        </button>

        <button onClick={() => setActiveTab('favorites')} style={{
          flex: 1, padding: '0.8rem 1rem', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          background: activeTab === 'favorites' ? 'var(--primary)' : 'transparent',
          color: activeTab === 'favorites' ? 'white' : 'inherit',
          fontSize: '1rem'
        }}>
          <Heart size={18} />
          <span>{language === 'en' ? 'Saved' : 'پسندیدہ'}</span>
        </button>

        <button onClick={() => setActiveTab('chats')} style={{
          flex: 1, padding: '0.8rem 1rem', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          background: activeTab === 'chats' ? 'var(--primary)' : 'transparent',
          color: activeTab === 'chats' ? 'white' : 'inherit',
          fontSize: '1rem'
        }}>
          <MessageSquare size={18} />
          <span>{t('chatsTab')}</span>
        </button>

        <button onClick={() => setActiveTab('ask_ai')} style={{
          flex: 1, padding: '0.8rem 1rem', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          background: activeTab === 'ask_ai' ? 'var(--primary)' : 'transparent',
          color: activeTab === 'ask_ai' ? 'white' : 'inherit',
          fontSize: '1rem'
        }}>
          <Sparkles size={18} />
          <span>{t('askAiTab')}</span>
        </button>

        <button onClick={() => setActiveTab('profile')} style={{
          flex: 1, padding: '0.8rem 1rem', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          background: activeTab === 'profile' ? 'var(--primary)' : 'transparent',
          color: activeTab === 'profile' ? 'white' : 'inherit',
          fontSize: '1rem'
        }}>
          <User size={18} />
          <span>{language === 'en' ? 'Profile' : 'پروفائل'}</span>
        </button>

      </div>

      {/* Tab contents */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div>
          {/* TAB 1: BUYER ORDERS & PROGRESS STEPPER */}
          {activeTab === 'orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{language === 'en' ? 'Order Tracking' : 'آرڈرز کی صورتحال'}</h3>
              
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <p>{language === 'en' ? 'No orders placed yet.' : 'کوئی آرڈر نہیں ملا۔'}</p>
                </div>
              ) : (
                orders.map((order) => {
                  const steps = ['Placed', 'Packed', 'Shipped', 'Delivered'];
                  const currentStepIdx = steps.indexOf(order.deliveryStatus);
                  const prodName = order.productId ? (order.productId.title[language] || order.productId.title.en) : order.customOfferDetails?.title;
                  
                  return (
                    <div key={order._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{prodName}</h4>
                          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Order ID: {order._id}</span>
                        </div>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                          Rs. {order.amount.toLocaleString()}
                        </span>
                      </div>

                      {/* Visual Stepper Tracker */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', position: 'relative' }}>
                        
                        <div style={{
                          position: 'absolute',
                          left: '5%',
                          right: '5%',
                          top: '50%',
                          height: '4px',
                          background: 'rgba(0,0,0,0.1)',
                          zIndex: 1,
                          transform: 'translateY(-50%)'
                        }}></div>

                        <div style={{
                          position: 'absolute',
                          left: '5%',
                          width: `${(currentStepIdx / 3) * 90}%`,
                          top: '50%',
                          height: '4px',
                          background: 'var(--primary)',
                          zIndex: 2,
                          transform: 'translateY(-50%)',
                          transition: 'width 0.5s ease'
                        }}></div>

                        {steps.map((step, idx) => {
                          const isActive = idx <= currentStepIdx;
                          const label = t(`status${step}`);
                          
                          return (
                            <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative', flex: 1 }}>
                              <div style={{
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '50%',
                                background: isActive ? 'var(--primary)' : 'white',
                                border: isActive ? 'none' : '2px solid rgba(0,0,0,0.15)',
                                color: isActive ? 'white' : 'rgba(0,0,0,0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                transition: 'all 0.3s ease',
                                boxShadow: 'var(--shadow-sm)'
                              }}>
                                {isActive ? <Check size={14} /> : idx + 1}
                              </div>
                              <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 700 : 500, opacity: isActive ? 1 : 0.6, marginTop: '0.5rem', textAlign: 'center' }}>
                                {label}
                              </span>
                            </div>
                          );
                        })}

                      </div>

                      {/* Escrow Release Button */}
                      {order.paymentStatus === 'Paid_Escrow' && order.deliveryStatus === 'Delivered' && (
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary)', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                            <ShieldCheck size={16} />
                            <span>{t('escrowPaid')} - Please release funds since you received items.</span>
                          </span>
                          <button onClick={() => handleReleaseFunds(order._id)} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '0.5rem' }}>
                            {language === 'en' ? 'Release Escrow Funds to Artisan' : 'رقم کاریگر کو منتقل کریں'}
                          </button>
                        </div>
                      )}

                      {order.paymentStatus === 'Released_To_Seller' && (
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', textAlign: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                          ✓ {t('escrowReleased')}
                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: SAVED ITEMS */}
          {activeTab === 'favorites' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>{language === 'en' ? 'Saved Handmade Items' : 'پسندیدہ مصنوعات'}</h3>
              <div className="discovery-grid">
                {favorites.map((product) => (
                  <div key={product._id} className="product-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '180px', overflow: 'hidden' }}>
                      <img src={product.images[0]} alt={product.title.en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <h4 style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                        {language === 'en' ? product.title.en : language === 'ur' ? product.title.ur : product.title.sd}
                      </h4>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>Rs. {product.price}</span>
                      <Link href={`/product/${product._id}`} className="btn btn-outline" style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        View details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CHATS LIST */}
          {activeTab === 'chats' && (
            <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                {language === 'en' ? 'Active Creator Conversations' : 'کاریگروں کے ساتھ بات چیت'}
              </h3>
              {chats.map((chat) => (
                <div key={chat.roomId} className="glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{chat.sellerId.name}</h4>
                    <p style={{ fontSize: '0.85rem', opacity: 0.7, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                      {chat.messages[chat.messages.length - 1]?.text || 'Start conversation...'}
                    </p>
                  </div>
                  
                  <Link href={`/chat/${chat.roomId}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', gap: '0.25rem', borderRadius: '0.5rem' }}>
                    <span>Open Chat</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: ASK AI SEARCH COMPANION (Text Chat Console) */}
          {activeTab === 'ask_ai' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }} className="glass-card">
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
                
                <div style={{ textAlign: 'center' }}>
                  <Sparkles size={36} style={{ color: 'var(--secondary)', margin: '0 auto' }} />
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.5rem' }}>
                    {language === 'en' ? 'AI Companion Assistant' : 'اے آئی مددگار اسسٹنٹ'}
                  </h3>
                  <p style={{ opacity: 0.7, fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    {language === 'en' 
                      ? 'Type questions regarding your orders, shipping policies, or request assistance.' 
                      : 'اپنے آرڈر، ڈیلیوری یا مدد کے بارے میں سوال درج کریں۔'}
                  </p>
                </div>

                {/* Text Chat Log Window */}
                <div style={{
                  width: '100%',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '1rem',
                  height: '300px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    flex: 1,
                    padding: '1rem',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    {aiMessages.map((msg, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          background: msg.sender === 'user' ? 'var(--primary)' : 'var(--card)',
                          color: msg.sender === 'user' ? 'white' : 'var(--text)',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.75rem',
                          fontSize: '0.9rem',
                          maxWidth: '85%',
                          boxShadow: 'var(--shadow-sm)',
                          border: msg.sender === 'bot' ? '1px solid var(--border)' : 'none'
                        }}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isAiLoading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.6 }}>
                        <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                        <span style={{ fontSize: '0.8rem' }}>Assistant is typing...</span>
                      </div>
                    )}
                  </div>
                  
                  <form onSubmit={handleSendAiQuery} style={{ display: 'flex', padding: '0.75rem', borderTop: '1px solid var(--border)', background: 'var(--card)', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={statsInput}
                      onChange={(e) => setStatsInput(e.target.value)}
                      placeholder={language === 'en' ? 'Type Roman Urdu (e.g. mera order kahan hai?)...' : 'اپنا سوال لکھیں...'}
                      style={{
                        flex: 1,
                        padding: '0.5rem 1rem',
                        borderRadius: '9999px',
                        border: '1px solid var(--border)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        background: 'var(--input-bg)'
                      }}
                    />
                    <button type="submit" disabled={isAiLoading || !statsInput.trim()} className="btn btn-primary" style={{ width: '2.2rem', height: '2.2rem', padding: 0, borderRadius: '50%', flexShrink: 0 }}>
                      <Send size={14} />
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: PROFILE MANAGEMENT */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }} className="glass-card fade-in">
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
                  {language === 'en' ? 'Edit Profile Details' : 'پروفائل تبدیل کریں'}
                </h3>

                {profileSuccess && (
                  <div style={{ background: 'rgba(10, 77, 52, 0.08)', color: 'var(--primary)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>
                    {language === 'en' ? '✓ Profile updated successfully!' : '✓ پروفائل اپ ڈیٹ ہو گئی ہے!'}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Avatar Upload Container */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--input-bg)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', background: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800 }}>
                      {profileImage ? (
                        <img src={profileImage} alt={profileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        profileName.charAt(0) || 'U'
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{language === 'en' ? 'Profile Picture' : 'پروفائل تصویر'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarUpload} 
                        style={{ fontSize: '0.8rem', width: '100%' }} 
                        id="avatar-file"
                        disabled={isUploadingAvatar}
                      />
                      {isUploadingAvatar && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Uploading image...</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>{language === 'en' ? 'Full Name' : 'مکمل نام'}</label>
                    <input 
                      type="text" 
                      value={profileName} 
                      onChange={(e) => setProfileName(e.target.value)} 
                      style={{ padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>{language === 'en' ? 'Email Address' : 'ای میل ایڈریس'}</label>
                    <input 
                      type="email" 
                      value={profileEmail} 
                      onChange={(e) => setProfileEmail(e.target.value)} 
                      placeholder="name@domain.com"
                      style={{ padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>{language === 'en' ? 'City / Location' : 'شہر'}</label>
                    <select 
                      value={profileLocation} 
                      onChange={(e) => setProfileLocation(e.target.value)} 
                      style={{ padding: '0.6rem', borderRadius: '0.5rem', outline: 'none', background: 'var(--card)' }}
                    >
                      {PAKISTAN_CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>{language === 'en' ? 'Default Shipping Address' : 'شپنگ ایڈریس'}</label>
                    <textarea 
                      value={profileAddress} 
                      onChange={(e) => setProfileAddress(e.target.value)} 
                      placeholder="Enter house no, street, sector..."
                      style={{ padding: '0.6rem', borderRadius: '0.5rem', outline: 'none', height: '80px', fontFamily: 'inherit', resize: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>{language === 'en' ? 'Profile Bio' : 'پروفائل بائیو'}</label>
                    <textarea 
                      value={profileBio} 
                      onChange={(e) => setProfileBio(e.target.value)} 
                      placeholder={language === 'en' ? 'Tell sellers about yourself...' : 'اپنے بارے میں لکھیں...'}
                      style={{ padding: '0.6rem', borderRadius: '0.5rem', outline: 'none', height: '80px', fontFamily: 'inherit', resize: 'none' }}
                    />
                  </div>

                  <button 
                    onClick={handleSaveProfile} 
                    disabled={isSavingProfile || isUploadingAvatar || !profileName.trim()} 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', borderRadius: '0.5rem' }}
                  >
                    {isSavingProfile ? 'Saving...' : (language === 'en' ? 'Save Profile' : 'پروفائل محفوظ کریں')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
