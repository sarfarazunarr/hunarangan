'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { 
  ShoppingBag, MessageSquare, MapPin, Truck, ArrowLeft, 
  Sparkles, Send, Star, ChevronDown, ChevronUp, Clock, Info, Check, Heart 
} from 'lucide-react';
import Link from 'next/link';

interface ProductDetail {
  _id: string;
  sellerId: {
    _id: string;
    name: string;
    location: string;
    phone: string;
  };
  title: { en: string; ur: string; sd: string };
  description: { en: string; ur: string; sd: string };
  price: number;
  images: string[];
  category: string;
  isCustomService: boolean;
  shortDescription?: { en: string; ur: string; sd: string };
  faqs?: {
    question: { en: string; ur: string; sd: string };
    answer: { en: string; ur: string; sd: string };
  }[];
  reviews?: {
    buyerId: string;
    buyerName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }[];
  createdAt: Date;
}

export default function ProductDetailPage() {
  const { language, t, dir } = useLanguage();
  const { showToast, success: showSuccessToast, error: showErrorToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const searchParams = useSearchParams();
  const isDeal = searchParams ? searchParams.get('deal') === 'true' : false;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // Widget States
  const [widgetQuestion, setWidgetQuestion] = useState('');
  const [widgetAnswer, setWidgetAnswer] = useState('');
  const [isWidgetLoading, setIsWidgetLoading] = useState(false);
  const [typedInput, setTypedInput] = useState('');

  // Review Form States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Localized FAQs data
  const faqData = [
    {
      q: {
        en: 'Will the thread colors bleed or shrink during wash?',
        ur: 'کیا دھونے سے دھاگے کا رنگ نکلے گا یا کپڑا سکڑے گا؟',
        sd: 'ڇا ڌوئڻ سان ڌاڳي جو رنگ نڪرندو يا ڪپڙو سڪڙندو؟'
      },
      a: {
        en: 'No, all items are handcrafted using pre-washed premium threads and organic cotton. We recommend washing in cold water with mild detergent.',
        ur: 'جی نہیں، تمام مصنوعات پہلے سے دھلے ہوئے پکے دھاگوں اور خالص سوتی کپڑے سے بنائی جاتی ہیں۔ ہلکے صابن اور ٹھنڈے پانی سے دھوئیں۔',
        sd: 'جي نه، سموريون شيون اڳ ۾ ڌوتل پڪي ڌاڳي مان ٺهيل آهن. هلڪي صابڻ ۽ ٿڌي پاڻي سان ڌوئڻ گهرجي.'
      }
    },
    {
      q: {
        en: 'Can I request a customized size or color?',
        ur: 'کیا میں اپنی مرضی کا سائز یا رنگ بنوا سکتا ہوں؟',
        sd: 'ڇا مان پنهنجي پسند جو سائيز يا رنگ ٺهرائي سگهان ٿو؟'
      },
      a: {
        en: 'Yes, absolutely! Use the "Chat" button to message the artisan directly and request custom sizing, specific color schemes, or patterns.',
        ur: 'جی ہاں بالکل! کاریگر سے براہ راست بات کرنے کے لیے "چیٹ" بٹن دبائیں اور اپنی پسند کے رنگ یا سائز کا آرڈر دیں۔',
        sd: 'جي ها بلڪل! ڪاريگر سان سڌو سنئون ڳالهائڻ لاءِ "ڳالهه ٻولهه" وارو بٽڻ دٻايو ۽ پنهنجي پسند جو آرڊر ڏيو.'
      }
    },
    {
      q: {
        en: 'How does the secure Escrow system work?',
        ur: 'ایسکرو ادائیگی کا محفوظ نظام کیسے کام کرتا ہے؟',
        sd: 'ايسڪرو ادائيگي جو محفوظ نظام ڪيئن ڪم ڪندو آهي؟'
      },
      a: {
        en: 'When you purchase, your funds are securely held in HunarAangan Escrow. The artisan is notified to ship. Once you confirm delivery, funds are released.',
        ur: 'جب آپ آرڈر کرتے ہیں تو آپ کی رقم ہنر آنگن ایسکرو میں محفوظ رہتی ہے۔ ترسیل ملنے پر جب آپ تصدیق کرتے ہیں تب ہی رقم کاریگر کو دی جاتی ہے۔',
        sd: 'جڏهن توهان خريداري ڪندا آهيو ته توهان جي رقم ايسڪرو ۾ محفوظ رهندي آهي. ڊليوري ملڻ کانپوءِ جڏهن توهان تصديق ڪندا آهيو تڏهن ئي رقم ڪاريگر کي ملندي آهي.'
      }
    }
  ];

  const fetchProductDetails = async () => {
    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();

      if (data.success && data.product) {
        setProduct(data.product);
        // Fetch related products in the same category
        fetchRelated(data.product.category, data.product._id);
      } else {
        setProduct(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelated = async (category: string, currentId: string) => {
    try {
      const res = await fetch(`/api/products?category=${category}`);
      const data = await res.json();
      if (data.success && data.products) {
        // Exclude current product
        const filtered = data.products.filter((p: any) => p._id !== currentId);
        setRelatedProducts(filtered.slice(0, 3));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Auth check for reviews & favorites
    const storedUser = localStorage.getItem('hunarangan-user');
    let userObj: any = null;
    if (storedUser) {
      userObj = JSON.parse(storedUser);
      setCurrentUser(userObj);
    }
    
    fetchProductDetails();

    if (userObj) {
      fetch(`/api/favorites?userId=${userObj.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.favorites) {
            const saved = data.favorites.some((fav: any) => fav._id === productId);
            setIsSaved(saved);
          }
        })
        .catch(err => console.error('Error fetching favorites:', err));
    }
  }, [productId]);

  const handleToggleSave = async () => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, productId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsSaved(data.isSaved);
        if (data.isSaved) {
          showSuccessToast(language === 'en' ? 'Product saved to your favorites!' : 'مصنوعات آپ کے پسندیدہ میں محفوظ کر لی گئی ہے!');
        } else {
          showSuccessToast(language === 'en' ? 'Product removed from favorites.' : 'مصنوعات پسندیدہ سے نکال دی گئی ہے۔');
        }
      } else {
        showErrorToast(data.error || 'Failed to toggle save.');
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Failed to toggle save.');
    }
  };

  const handleTextSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;

    setWidgetQuestion(typedInput);
    setWidgetAnswer('');
    setIsWidgetLoading(true);
    const queryToSend = typedInput;
    setTypedInput('');

    try {
      const productContext = {
        title: product ? product.title.en : '',
        price: product ? (isDeal ? Math.round(product.price * 0.8) : product.price) : 0,
        deliveryTime: product?.isCustomService ? 5 : 3,
        isCustomService: product ? product.isCustomService : false
      };

      const res = await fetch('/api/products/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productContext, question: queryToSend, lang: language }),
      });
      const data = await res.json();

      setWidgetAnswer(data.text);
    } catch (e) {
      console.error(e);
    } finally {
      setIsWidgetLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      const finalPrice = isDeal ? Math.round(product.price * 0.8) : product.price;
      localStorage.setItem('hunarangan-cart', JSON.stringify({
        productId: product._id,
        title: product.title[language] || product.title.en,
        price: finalPrice,
        images: product.images,
        sellerId: product.sellerId._id,
        sellerName: product.sellerId.name
      }));
      router.push('/checkout');
    }
  };

  const handleChatDirect = async () => {
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
        body: JSON.stringify({ buyerId: parsed.id, sellerId: product?.sellerId._id }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push(`/chat/${data.roomId}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    if (!newComment.trim()) return;
    setIsSubmittingReview(true);
    setReviewError('');

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: currentUser.id,
          buyerName: currentUser.name,
          rating: newRating,
          comment: newComment
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProduct(prev => prev ? { ...prev, reviews: data.reviews } : null);
        setNewComment('');
        setNewRating(5);
        showSuccessToast(language === 'en' ? 'Review submitted successfully!' : 'تبصرہ کامیابی سے شامل ہو گیا ہے!');
      } else {
        setReviewError(data.error || 'Failed to submit review.');
      }
    } catch (err) {
      console.error(err);
      setReviewError('Connection failed.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
          {language === 'en' ? 'No Products' : 'کوئی پروڈکٹ دستیاب نہیں ہے'}
        </h2>
      </div>
    );
  }

  const reviewsList = product.reviews || [];
  const averageRating = reviewsList.length > 0 
    ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1)
    : '4.8'; // fallback average

  return (
    <div className="container" style={{ direction: dir, marginTop: '1.5rem', paddingBottom: '4rem' }}>
      
      {/* Back button link */}
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} />
        <span>{language === 'en' ? 'Back to listings' : 'پیچھے جائیں'}</span>
      </button>

      {/* Main Grid Frame */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem' }} className="product-split-view">
        
        {/* Left pane: image */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ overflow: 'hidden', padding: '0.5rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ position: 'relative', width: '100%', height: '420px', background: '#f5f5f5', borderRadius: '1rem', overflow: 'hidden' }}>
              <img
                src={product.images[0]}
                alt={product.title.en}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              
              {product.isCustomService && (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--secondary)', color: 'white', padding: '0.4rem 1rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 800 }}>
                  <span>{t('customServices')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right pane: pricing details and explainer widget */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Title and price card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {language === 'en' ? product.title.en : language === 'ur' ? product.title.ur : product.title.sd}
            </h1>

            <p style={{ fontStyle: 'italic', opacity: 0.8, fontSize: '1.05rem', borderLeft: '3px solid var(--secondary)', paddingLeft: '0.75rem', marginTop: '0.25rem' }}>
              {product.shortDescription
                ? (product.shortDescription[language] || product.shortDescription.en || '')
                : (product.description[language] || product.description.en || '').slice(0, 150) + '...'}
            </p>

            {/* Stars row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', color: 'var(--secondary)' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} style={{ fill: s <= Math.round(parseFloat(averageRating)) ? 'var(--secondary)' : 'none' }} />
                ))}
              </div>
              <span style={{ fontWeight: 700, marginLeft: '0.25rem' }}>{averageRating}</span>
              <span style={{ opacity: 0.6 }}>({reviewsList.length} {language === 'en' ? 'reviews' : 'تبصرے'})</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                Rs. {isDeal ? Math.round(product.price * 0.8).toLocaleString() : product.price.toLocaleString()}
              </span>
              {isDeal && (
                <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '1.2rem', marginLeft: '0.5rem' }}>
                  Rs. {product.price.toLocaleString()}
                </span>
              )}
            </div>

            {/* Seller profile link block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--input-bg)', padding: '0.75rem 1rem', borderRadius: '0.75rem', marginTop: '0.5rem', border: '1px solid var(--border)' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                {product.sellerId.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{product.sellerId.name}</p>
                <p style={{ fontSize: '0.8rem', display: 'flex', gap: '0.2rem', opacity: 0.7 }}><MapPin size={12} />{product.sellerId.location}</p>
              </div>
              <Link href={`/seller/${product.sellerId._id}`} style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
                {language === 'en' ? 'Visit Shop' : 'دکان دیکھیں'}
              </Link>
            </div>

          </div>

          {/* Checkout, Chat & Save Actions */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={handleBuyNow} className="btn btn-primary" style={{ flex: 1, padding: '1rem 1.5rem', borderRadius: '0.75rem', fontSize: '1.05rem' }}>
              <ShoppingBag size={18} />
              <span>{t('buyNow')}</span>
            </button>
            <button onClick={handleChatDirect} className="btn btn-outline" style={{ padding: '1rem', borderRadius: '0.75rem' }}>
              <MessageSquare size={18} />
              <span>{language === 'en' ? 'Chat' : 'چیٹ'}</span>
            </button>
            <button onClick={handleToggleSave} className="btn btn-outline" style={{ padding: '1rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: isSaved ? 'var(--accent)' : 'var(--primary)', color: isSaved ? 'var(--accent)' : 'var(--primary)', background: isSaved ? 'rgba(185, 28, 28, 0.05)' : 'transparent' }} title={isSaved ? 'Remove from Saved' : 'Save Product'}>
              <Heart size={18} style={{ fill: isSaved ? 'var(--accent)' : 'none', color: isSaved ? 'var(--accent)' : 'currentColor' }} />
            </button>
          </div>

          {/* Product-Specific Explainer Widget ("Ask Product AI") */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} style={{ color: 'var(--secondary)' }} />
              <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                {language === 'en' ? 'Ask Product AI' : 'مصنوعات کے بارے میں پوچھیں'}
              </h4>
            </div>

            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
              {language === 'en' 
                ? 'Type your questions regarding color bleeding, custom sizes, or delivery time.' 
                : 'رنگ، سائز یا ڈیلیوری کے بارے میں اپنا سوال لکھیں۔'}
            </p>

            {/* Text input form */}
            <form onSubmit={handleTextSearchSubmit} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder={language === 'en' ? 'e.g. Will this color shrink?' : 'مثال کے طور پر: کیا اس کا رنگ اترے گا؟'}
                disabled={isWidgetLoading}
                style={{
                  flex: 1,
                  padding: '0.6rem 1.2rem',
                  borderRadius: '9999px',
                  border: '1px solid var(--border)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: 'var(--input-bg)'
                }}
              />
              <button
                type="submit"
                disabled={isWidgetLoading || !typedInput.trim()}
                className="btn btn-primary"
                style={{
                  width: '2.4rem',
                  height: '2.4rem',
                  borderRadius: '50%',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Send size={14} />
              </button>
            </form>

            {/* Widget answers */}
            {(widgetQuestion || widgetAnswer || isWidgetLoading) && (
              <div style={{
                background: 'var(--input-bg)',
                padding: '1rem',
                borderRadius: '0.5rem',
                fontSize: '0.9rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                border: '1px solid var(--border)'
              }}>
                {widgetQuestion && (
                  <div>
                    <strong style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block' }}>YOUR QUESTION:</strong>
                    <p style={{ fontWeight: 600 }}>{widgetQuestion}</p>
                  </div>
                )}

                {isWidgetLoading && (
                  <div style={{ opacity: 0.5 }}>{language === 'en' ? 'AI is composing answer...' : 'تصدیق ہو رہی ہے...'}</div>
                )}

                {widgetAnswer && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                    <strong style={{ fontSize: '0.75rem', color: 'var(--secondary)', display: 'block' }}>AI ANSWER:</strong>
                    <p style={{ color: 'var(--text)', fontWeight: 500 }}>{widgetAnswer}</p>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* 1. Product Description Section below grid */}
      <section style={{ marginTop: '3.5rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--primary)' }}>
          {language === 'en' ? 'Product Description' : 'تفصیلات'}
        </h2>
        <div className="glass-card" style={{ padding: '2rem', border: '1px solid var(--border)' }}>
          <p style={{ opacity: 0.85, fontSize: '1.1rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
            {language === 'en' ? product.description.en : language === 'ur' ? product.description.ur : product.description.sd}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', opacity: 0.8, marginTop: '1.5rem', borderTop: '1px dotted var(--border)', paddingTop: '1rem' }}>
            <Truck size={18} style={{ color: 'var(--primary)' }} />
            <span>
              {language === 'en' ? 'Delivery timeframe: ' : 'ڈیلیوری کا وقت: '}{' '}
              <strong>{product.isCustomService ? '5 to 7 days' : '3 days'}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* 2. Reviews Section */}
      <section style={{ marginTop: '3.5rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem' }}>
          {language === 'en' ? 'Buyer Reviews' : 'خریداروں کی آراء'}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '2.5rem' }} className="product-split-view">
          
          {/* Reviews List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviewsList.length === 0 ? (
              <p style={{ opacity: 0.6 }}>{language === 'en' ? 'No reviews yet for this product.' : 'اس پروڈکٹ کے لیے کوئی جائزے موجود نہیں ہیں۔'}</p>
            ) : (
              reviewsList.map((rev, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', border: '1px solid var(--border)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                    {rev.buyerName.charAt(0)}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{rev.buyerName}</strong>
                      <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                    {/* Stars */}
                    <div style={{ display: 'flex', color: 'var(--secondary)' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} style={{ fill: s <= rev.rating ? 'var(--secondary)' : 'none' }} />
                      ))}
                    </div>
                    <p style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '0.25rem', lineHeight: 1.5 }}>{rev.comment}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Submit Review Form */}
          <div>
            <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--border)', background: 'var(--card)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--primary)' }}>
                {language === 'en' ? 'Write a Review' : 'اپنی رائے دیں'}
              </h3>

              {reviewError && (
                <div style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--accent)', padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  {reviewError}
                </div>
              )}

              {currentUser ? (
                <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Rating Selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>{language === 'en' ? 'Rating' : 'درجہ بندی'}</label>
                    <div style={{ display: 'flex', gap: '0.25rem', color: 'var(--secondary)' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button 
                          key={s} 
                          type="button" 
                          onClick={() => setNewRating(s)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          <Star size={24} style={{ fill: s <= newRating ? 'var(--secondary)' : 'none' }} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment Textarea */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>{language === 'en' ? 'Your Comment' : 'تبصرہ'}</label>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={language === 'en' ? 'What did you like or dislike about this product?' : 'تبصرہ لکھیں...'}
                      style={{ padding: '0.6rem', borderRadius: '0.5rem', outline: 'none', height: '80px', fontFamily: 'inherit', resize: 'none' }}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmittingReview || !newComment.trim()} 
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}
                  >
                    {isSubmittingReview ? 'Submitting...' : (language === 'en' ? 'Submit Review' : 'تبصرہ بھیجیں')}
                  </button>

                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.75rem' }}>
                    {language === 'en' ? 'You must be logged in to write reviews.' : 'تبصرہ لکھنے کے لیے لاگ ان کرنا ضروری ہے۔'}
                  </p>
                  <Link href="/auth/login" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '0.4rem' }}>
                    {language === 'en' ? 'Login to Review' : 'لاگ ان کریں'}
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* 3. Accordion FAQ Section */}
      <section style={{ marginTop: '3.5rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Info style={{ color: 'var(--primary)' }} />
          <span>{language === 'en' ? 'Frequently Asked Questions' : 'عام طور پر پوچھے گئے سوالات'}</span>
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            ...(product.faqs || []).map(f => ({ q: f.question, a: f.answer })),
            ...faqData
          ].map((faq, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '1rem 1.5rem', border: '1px solid var(--border)' }}>
              <button 
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  width: '100%', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  textAlign: 'start', 
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: 'inherit'
                }}
              >
                <span>{faq.q[language] || faq.q.en}</span>
                {openFaq === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {openFaq === idx && (
                <div style={{ marginTop: '0.75rem', opacity: 0.85, fontSize: '0.95rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', lineHeight: 1.6 }}>
                  {faq.a[language] || faq.a.en}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. Related Products Section */}
      {relatedProducts.length > 0 && (
        <section style={{ marginTop: '3.5rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem' }}>
            {language === 'en' ? 'You May Also Like' : 'مماثل مصنوعات'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {relatedProducts.map((p) => (
              <div key={p._id} className="product-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '160px', overflow: 'hidden' }}>
                  <img src={p.images[0]} alt={p.title.en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <h4 style={{ fontWeight: 800, fontSize: '0.95rem', height: '2.8rem', overflow: 'hidden' }}>
                    {language === 'en' ? p.title.en : language === 'ur' ? p.title.ur : p.title.sd}
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>Rs. {p.price.toLocaleString()}</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}><MapPin size={10} />{p.sellerId.location}</span>
                  </div>
                  <Link href={`/product/${p._id}`} className="btn btn-outline" style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem', marginTop: '0.5rem', borderRadius: '0.4rem' }}>
                    {language === 'en' ? 'View Details' : 'تفصیلات'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .product-split-view {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}
