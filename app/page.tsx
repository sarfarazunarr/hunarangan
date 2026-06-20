'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { PAKISTAN_CITIES } from '@/lib/cities';
import { 
  MapPin, Grid, Heart, Sparkles, Filter, ChevronRight, Search, 
  Tag, Truck, Palette, ShoppingBag, Scissors, Layers, Utensils, 
  Gift, Star, Clock, ArrowRight, StarHalf, ShieldCheck
} from 'lucide-react';

interface ProductItem {
  _id: string;
  title: { en: string; ur: string; sd: string };
  price: number;
  images: string[];
  category: string;
  isCustomService: boolean;
  sellerId: {
    _id?: string;
    name: string;
    location: string;
    phone: string;
  };
}

interface SellerItem {
  _id: string;
  name: string;
  location: string;
  bio: { en: string; ur: string; sd: string };
  profileImage?: string;
}

export default function HomePage() {
  const { language, t, dir } = useLanguage();
  const router = useRouter();
  
  // Products states
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [sellers, setSellers] = useState<SellerItem[]>([]);
  
  // Filter states
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Active Promo Banner Slide
  const [activePromo, setActivePromo] = useState(0);

  // Current User Session State
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('hunarangan-user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
  }, []);

  const promoBanners = [
    {
      id: 1,
      badge: { en: 'EID BAZAAR SPECIAL', ur: 'عید بازار اسپیشل', sd: 'عيد بازار اسپيشل' },
      title: { en: 'Festive Rilli & Ajrak: 20% OFF', ur: 'روایتی اجرک اور رلی پر 20٪ چھوٹ', sd: 'روايتي اجرڪ ۽ رلي تي 20٪ ڇوٽ' },
      subtitle: { en: 'Direct support to rural women creators. Valid till Eid.', ur: 'خواتین کاریگروں کی براہ راست مدد کریں۔ عید تک کارآمد۔', sd: 'سڌو سنئون عورتن ڪاريگرن جي مدد ڪريو۔' },
      code: 'EID20',
      color: 'linear-gradient(135deg, #0a4d34 0%, #1e3a2f 100%)'
    },
    {
      id: 2,
      badge: { en: 'FREE SHIPPING', ur: 'مفت ڈیلیوری', sd: 'مفت ڊليوري' },
      title: { en: 'Free Shipping on Custom Orders', ur: 'کسٹم آرڈرز پر مفت شپنگ حاصل کریں', sd: 'ڪسٽم آرڊرز تي مفت شپنگ حاصل ڪريو' },
      subtitle: { en: 'Order customized apparel or meals above Rs. 3,000.', ur: 'روپے 3,000 سے اوپر کے آرڈرز پر لاگو۔', sd: '3,000 روپين کان مٿي جي آرڊر تي لاڳو.' },
      code: 'FREESHIP',
      color: 'linear-gradient(135deg, #c27d38 0%, #8c531d 100%)'
    }
  ];

  // Rotate banners automatically
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePromo((prev) => (prev + 1) % promoBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch products
        const prodRes = await fetch(`/api/products?city=${selectedCity}&category=${selectedCategory === 'All' ? '' : selectedCategory}`);
        const prodData = await prodRes.json();
        
        // Fetch sellers
        const sellerRes = await fetch('/api/sellers');
        const sellerData = await sellerRes.json();

        if (sellerData.success) {
          setSellers(sellerData.sellers);
        } else {
          // Mock sellers fallback
          setSellers([
            { _id: '2', name: 'Mai Bhagi', location: 'Hyderabad', bio: { en: 'Weaving traditional Ajrak block prints for 20 years.', ur: 'بلاک پرنٹنگ کے روایتی کام کی ماہر۔', sd: 'بلاک پرنٽنگ جي روايتي ڪم جي ماهر.' }, profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
            { _id: '1', name: 'Zainab Bibi', location: 'Karachi', bio: { en: 'Specialist in spicy Sindhi and Karachi style home cooked meals.', ur: 'لذیذ بریانی اور گھریلو کھانوں کی شیف۔', sd: 'لذيذ برياني ۽ گهريلو کاڌن جي شيف.' }, profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200' },
            { _id: '3', name: 'Ayesha Khan', location: 'Lahore', bio: { en: 'Designing hand embroidered shawls, kurtis, and patchwork.', ur: 'ہاتھ کی کڑھائی اور رلی پیچ ورک کی ماہر۔', sd: 'هٿ جي ڪڙهائي ۽ رلي پيچ ورڪ جي ماهر.' }, profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200' }
          ]);
        }
        
        if (prodData.products && prodData.products.length > 0) {
          setProducts(prodData.products);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCity, selectedCategory]);

  const categories = [
    { name: 'All', icon: <Grid size={18} />, en: 'All Items', ur: 'تمام مصنوعات', sd: 'سڀ شيون' },
    { name: 'Rilli', icon: <Scissors size={18} />, en: 'Rilli Patchwork', ur: 'رلی پیچ ورک', sd: 'رلي پيچ ورڪ' },
    { name: 'Ajrak', icon: <Layers size={18} />, en: 'Ajrak Blocks', ur: 'اجرک بلاک', sd: 'اجرڪ بلاڪ' },
    { name: 'Food', icon: <Utensils size={18} />, en: 'Artisan Food', ur: 'گھر کا کھانا', sd: 'گهر جو کاڌو' },
    { name: 'Embroidery', icon: <Palette size={18} />, en: 'Embroidery', ur: 'ہاتھ کی کڑھائی', sd: 'هٿ جي ڪڙهائي' },
    { name: 'Handicrafts', icon: <Gift size={18} />, en: 'Handicrafts', ur: 'دستکاری', sd: 'دستڪاري' }
  ];

  const cities = ['All', ...PAKISTAN_CITIES];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase();
    
    // Redirect to proper category pages
    if (query.includes('ajrak') || query.includes('اجرک')) {
      router.push('/categories/Ajrak');
    } else if (query.includes('rilli') || query.includes('رلی') || query.includes('patchwork')) {
      router.push('/categories/Rilli');
    } else if (query.includes('biryani') || query.includes('food') || query.includes('khana') || query.includes('برياني')) {
      router.push('/categories/Food');
    } else if (query.includes('embroidery') || query.includes('kadhai') || query.includes('کڑھائی')) {
      router.push('/categories/Embroidery');
    } else if (query.includes('handicraft') || query.includes('mitti') || query.includes('دستکاری')) {
      router.push('/categories/Handicrafts');
    }
  };

  const getHeroTitle = () => {
    if (language === 'ur') return 'پاکستانی خواتین کے ہاتھ سے بنے شاہکار دریافت کریں';
    if (language === 'sd') return 'پاڪستاني عورتن جا هٿ سان ٺهيل شاهڪار ڳوليو';
    return 'Support & Shop Authentic Pakistani Crafts';
  };

  // Local filter for search queries inside products listing
  const searchedProducts = products.filter(product => {
    const title = (product.title[language] || product.title.en).toLowerCase();
    const category = product.category.toLowerCase();
    const seller = product.sellerId.name.toLowerCase();
    const search = searchQuery.toLowerCase();
    return title.includes(search) || category.includes(search) || seller.includes(search);
  });

  // Eid / Festive special deals filter (discount simulation)
  const festivalDeals = searchedProducts.slice(0, 3);

  // Ready to Ship filter (isCustomService = false)
  const readyToShipItems = searchedProducts.filter(p => !p.isCustomService).slice(0, 4);

  // Custom Made-to-order Services (isCustomService = true)
  const customServicesItems = searchedProducts.filter(p => p.isCustomService).slice(0, 4);

  return (
    <div className="container" style={{ direction: dir, paddingBottom: '3rem' }}>
      
      {/* 1. Welcome Hero & Search Panel */}
      <section 
        className="glass-card"
        style={{
          marginTop: '1.5rem',
          padding: '3rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          border: '1px solid var(--border)',
          background: 'var(--card)'
        }}
      >
        <div style={{ display: 'inline-flex', padding: '0.4rem 1rem', background: 'rgba(10, 77, 52, 0.08)', color: 'var(--primary)', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: 700, gap: '0.25rem', alignItems: 'center' }}>
          <Sparkles size={14} />
          <span>{t('tagline')}</span>
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text)', maxWidth: '750px', lineHeight: 1.3, letterSpacing: '-0.5px' }}>
          {getHeroTitle()}
        </h1>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '600px', marginTop: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', [dir === 'ltr' ? 'left' : 'right']: '1.25rem', opacity: 0.5 }}>
              <Search size={18} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'en' ? 'Search Ajrak, Rilli, Biryani or handmade crafts...' : language === 'ur' ? 'اجرک، رلی، بریانی یا دستکاری تلاش کریں...' : 'اجرڪ، رلي، برياني يا هٿ جو ڪم ڳوليو...'}
              style={{
                width: '100%',
                padding: dir === 'ltr' ? '0.8rem 1.5rem 0.8rem 2.8rem' : '0.8rem 2.8rem 0.8rem 1.5rem',
                borderRadius: '9999px',
                border: '1px solid var(--border)',
                fontSize: '1rem',
                outline: 'none',
                background: 'var(--input-bg)'
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 1.8rem' }}>
            {language === 'en' ? 'Search' : 'تلاش'}
          </button>
        </form>
      </section>

      {/* 2. Shop by Category Grid */}
      <section style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
            {language === 'en' ? 'Shop by Category' : language === 'ur' ? 'کیٹیگریز' : 'زمرا'}
          </h2>
          <Link href="/categories" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
            <span>{language === 'en' ? 'View Directory' : 'پوری لسٹ'}</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
          gap: '1.5rem', 
          marginTop: '0.5rem'
        }} className="category-grid-home">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => {
                if (cat.name !== 'All') {
                  router.push(`/categories/${cat.name}`);
                } else {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: selectedCategory === cat.name ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: selectedCategory === cat.name ? 'rgba(10, 77, 52, 0.05)' : 'var(--card)',
                color: 'var(--text)',
                cursor: 'pointer',
                transition: 'var(--transition)',
                boxShadow: 'var(--shadow-sm)'
              }}
              className="category-card-btn"
            >
              <div style={{ 
                width: '3.5rem', 
                height: '3.5rem', 
                borderRadius: '50%', 
                background: selectedCategory === cat.name ? 'var(--primary)' : 'rgba(10, 77, 52, 0.06)', 
                color: selectedCategory === cat.name ? 'white' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: selectedCategory === cat.name ? '0 4px 12px rgba(10, 77, 52, 0.2)' : 'none',
                transition: 'var(--transition)'
              }} className="category-icon-circle">
                {cat.icon}
              </div>
              <span style={{ 
                fontWeight: 700, 
                fontSize: '0.9rem',
                fontFamily: 'var(--font-inter)'
              }}>
                {language === 'en' ? cat.en : language === 'ur' ? cat.ur : cat.sd}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Investor Banner: Get Funds from Investors */}
      <section 
        className="glass-card fade-in"
        style={{
          marginTop: '2.5rem',
          padding: '3.5rem 2.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundImage: 'linear-gradient(to right, rgba(10, 77, 52, 0.95) 0%, rgba(10, 77, 52, 0.6) 100%), url("/investor_bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem'
        }}
      >
        <div style={{ maxWidth: '650px', zIndex: 2 }}>
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 800, 
            background: 'var(--secondary)', 
            color: 'white', 
            padding: '0.3rem 0.8rem', 
            borderRadius: 'var(--radius-full)', 
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'inline-block',
            marginBottom: '0.75rem'
          }}>
            {language === 'en' ? 'Funding Opportunities' : language === 'ur' ? 'سرمایہ کاری کے مواقع' : 'سرمائيڪاري جا موقعا'}
          </span>
          <h2 style={{ 
            fontSize: '2.2rem', 
            fontWeight: 800, 
            lineHeight: 1.25,
            marginBottom: '1rem',
            fontFamily: language === 'ur' ? 'var(--font-noto-urdu)' : language === 'sd' ? 'var(--font-noto-sindhi)' : 'inherit'
          }}>
            {language === 'en' ? 'Get Funds from Investors for your business Growth' : language === 'ur' ? 'اپنے کاروبار کی ترقی کے لیے سرمایہ کاروں سے فنڈز حاصل کریں' : 'پنهنجي ڪاروبار جي ترقي لاءِ سيڙپڪارن کان فنڊ حاصل ڪريو'}
          </h2>
          <p style={{ opacity: 0.9, fontSize: '1.05rem', lineHeight: 1.6 }}>
            {language === 'en' 
              ? 'Are you an artisan looking to scale your inventory or purchase raw materials? Connect with verified investors and apply for zero-interest business grants and funding.' 
              : language === 'ur' 
              ? 'کیا آپ اپنی مصنوعات کو بڑھانے یا خام مال خریدنے کے لیے فنڈز حاصل کرنا چاہتے ہیں؟ ہمارے تصدیق شدہ سرمایہ کاروں سے رابطہ کریں اور سود سے پاک گرانٹس کے لیے اپلائی کریں۔' 
              : 'ڇا توهان پنهنجي پراڊڪٽس کي وڌائڻ يا خام مال خريد ڪرڻ لاءِ فنڊ حاصل ڪرڻ چاهيو ٿا؟ اسان جي تصديق ٿيل سيڙپڪارن سان رابطو ڪريو ۽ سود کان پاڪ گرانٽس لاءِ درخواست ڏيو.'}
          </p>
        </div>
        
        <div style={{ zIndex: 2 }}>
          <Link 
            href={currentUser?.role === 'seller' ? '/dashboard/seller?tab=investments' : '/auth/login?redirect=/dashboard/seller?tab=investments'} 
            className="btn btn-secondary" 
            style={{ 
              padding: '1rem 2rem', 
              fontSize: '1rem', 
              borderRadius: 'var(--radius-full)',
              boxShadow: '0 4px 14px rgba(194, 125, 56, 0.4)',
              fontWeight: 700
            }}
          >
            <span>
              {language === 'en' ? 'Apply for Funding' : language === 'ur' ? 'فنڈنگ حاصل کریں' : 'فنڊنگ لاءِ درخواست ڏيو'}
            </span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* 4. Eid Festive Deals Section (20% OFF) */}
      <section style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Tag size={20} style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {language === 'en' ? 'Eid Festive Deals' : 'عید کے خصوصی تحائف'}
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'white', background: 'var(--accent)', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', fontWeight: 700 }}>
            20% OFF
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {isLoading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          ) : festivalDeals.map((product) => (
            <div key={product._id} className="product-card" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              
              <span style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'var(--accent)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 800, zIndex: 10 }}>
                SAVE 20%
              </span>

              <div style={{ height: '180px', overflow: 'hidden' }}>
                <img src={product.images[0]} alt={product.title.en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <h4 style={{ fontWeight: 800, fontSize: '1.05rem', height: '3rem', overflow: 'hidden' }}>
                  {language === 'en' ? product.title.en : language === 'ur' ? product.title.ur : product.title.sd}
                </h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.2rem' }}>Rs. {Math.round(product.price * 0.8).toLocaleString()}</span>
                  <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '0.9rem' }}>Rs. {product.price.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>
                  <span>{product.sellerId.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}><MapPin size={10} />{product.sellerId.location}</span>
                </div>
                <Link href={`/product/${product._id}?deal=true`} className="btn btn-outline" style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem', marginTop: '0.5rem', borderRadius: '0.4rem' }}>
                  {language === 'en' ? 'Claim Deal' : 'ڈیل حاصل کریں'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Ready to Ship Section */}
      <section style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Truck size={20} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {language === 'en' ? 'Ready to Ship (3-Day Delivery)' : 'فوری ترسیل کے لیے تیار'}
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {isLoading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          ) : readyToShipItems.map((product) => (
            <div key={product._id} className="product-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '160px', overflow: 'hidden' }}>
                <img src={product.images[0]} alt={product.title.en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <h4 style={{ fontWeight: 800, fontSize: '0.95rem', height: '2.8rem', overflow: 'hidden' }}>
                  {language === 'en' ? product.title.en : language === 'ur' ? product.title.ur : product.title.sd}
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>Rs. {product.price.toLocaleString()}</span>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(10, 77, 52, 0.08)', color: 'var(--primary)', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                    <Clock size={10} /> 3 Days
                  </span>
                </div>
                <Link href={`/product/${product._id}`} className="btn btn-outline" style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem', marginTop: '0.5rem', borderRadius: '0.4rem' }}>
                  {language === 'en' ? 'Order Now' : 'فوری خریدیں'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Custom Craft Services Section */}
      <section style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Palette size={20} style={{ color: 'var(--secondary)' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {language === 'en' ? 'Custom Handcrafted Services' : 'آرڈر پر خصوصی کام'}
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {isLoading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          ) : customServicesItems.map((product) => (
            <div key={product._id} className="product-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '160px', overflow: 'hidden' }}>
                <img src={product.images[0]} alt={product.title.en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <h4 style={{ fontWeight: 800, fontSize: '0.95rem', height: '2.8rem', overflow: 'hidden' }}>
                  {language === 'en' ? product.title.en : language === 'ur' ? product.title.ur : product.title.sd}
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>Rs. {product.price.toLocaleString()}</span>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(194, 125, 56, 0.08)', color: 'var(--secondary)', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontWeight: 700 }}>
                    Custom Size
                  </span>
                </div>
                <Link href={`/product/${product._id}`} className="btn btn-outline" style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem', marginTop: '0.5rem', borderRadius: '0.4rem' }}>
                  {language === 'en' ? 'Customize Details' : 'آرڈر پر بنوائیں'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Proximity Location Discovery Feed */}
      <section style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={20} style={{ color: 'var(--secondary)' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              {t('proximityFilter')}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} style={{ opacity: 0.7 }} />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                fontSize: '0.95rem',
                fontWeight: 600,
                outline: 'none',
                background: 'var(--card)',
                color: 'inherit'
              }}
            >
              <option value="All">{language === 'en' ? 'All Pakistan' : 'پورے پاکستان سے'}</option>
              {cities.filter(c => c !== 'All').map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Discovery Feed Grid */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner"></div></div>
        ) : searchedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.02)', borderRadius: '1rem' }}>
            <p style={{ opacity: 0.6, fontSize: '1.1rem', fontWeight: 600 }}>
              {language === 'en' ? 'No Products' : 'کوئی پروڈکٹ دستیاب نہیں ہے'}
            </p>
          </div>
        ) : (
          <div className="discovery-grid">
            {searchedProducts.map((product) => (
              <div key={product._id} className="product-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                  <img src={product.images[0]} alt={product.title.en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', top: '0.75rem', [dir === 'ltr' ? 'left' : 'right']: '0.75rem', background: 'rgba(0, 0, 0, 0.75)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {product.category}
                  </span>
                </div>
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, height: '3.2rem', overflow: 'hidden' }}>
                    {language === 'en' ? product.title.en : language === 'ur' ? product.title.ur : product.title.sd}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>Rs. {product.price.toLocaleString()}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', opacity: 0.7, fontWeight: 600 }}><MapPin size={12} />{product.sellerId.location}</span>
                  </div>
                  <Link href={`/product/${product._id}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem', width: '100%', fontSize: '0.9rem', borderRadius: '0.5rem' }}>
                    {language === 'en' ? 'View Details' : 'تفصیلات دیکھیں'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 8. Next Level Eid/Promo Sliding Banner Carousel */}
      <section 
        className="glass-card fade-in responsive-banner-grid hero-banner-main"
        style={{
          marginTop: '3.5rem',
          color: 'var(--text)',
          borderRadius: 'var(--radius-lg)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
          minHeight: '380px'
        }}
      >
        {/* Left Side Content */}
        <div style={{ 
          padding: '3rem', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          gap: '1.2rem',
          background: 'transparent',
          zIndex: 5
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 800, 
              background: 'var(--primary)', 
              color: 'white', 
              padding: '0.3rem 0.8rem', 
              borderRadius: 'var(--radius-full)', 
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {promoBanners[activePromo].badge[language] || promoBanners[activePromo].badge.en}
            </span>
          </div>

          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 800, 
            lineHeight: 1.15,
            color: 'var(--primary)',
            fontFamily: 'var(--font-inter)'
          }}>
            {promoBanners[activePromo].title[language] || promoBanners[activePromo].title.en}
          </h2>

          <p style={{ 
            opacity: 0.85, 
            fontSize: '1.05rem', 
            lineHeight: 1.6,
            color: 'var(--text-muted)'
          }}>
            {promoBanners[activePromo].subtitle[language] || promoBanners[activePromo].subtitle.en}
          </p>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            marginTop: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <span style={{ 
              fontSize: '0.85rem', 
              fontWeight: 800, 
              border: '2px dashed var(--secondary)', 
              color: 'var(--secondary)',
              padding: '0.4rem 1rem', 
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(194, 125, 56, 0.05)'
            }}>
              CODE: {promoBanners[activePromo].code}
            </span>
            <Link href="/categories" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)' }}>
              <span>Shop Bazaar</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Right Side Image Showcase */}
        <div style={{ 
          position: 'relative',
          overflow: 'hidden',
          background: '#0a4d34',
          height: '100%'
        }} className="banner-img-pane">
          <img 
            src="/banner.png" 
            alt="Pakistani Artisan Crafts Showcase" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover'
            }}
            className="zoom-animation"
          />
          {/* Subtle overlay gradients to blend it */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to right, var(--card) 0%, transparent 20%, transparent 100%)'
          }} className="banner-gradient-overlay" />
          
          <div style={{ 
            position: 'absolute', 
            bottom: '1.5rem', 
            left: '1.5rem', 
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(8px)',
            padding: '0.5rem 1rem', 
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--primary)'
          }}>
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>100% Escrow Secured Payments</span>
          </div>
        </div>

        {/* Carousel indicators */}
        <div style={{ 
          position: 'absolute', 
          bottom: '1.5rem', 
          right: '1.5rem', 
          display: 'flex', 
          gap: '0.5rem', 
          zIndex: 10 
        }}>
          {promoBanners.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setActivePromo(idx)}
              style={{
                width: activePromo === idx ? '24px' : '8px',
                height: '8px',
                borderRadius: '50%',
                background: activePromo === idx ? 'var(--primary)' : 'rgba(10, 77, 52, 0.25)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      </section>

      {/* 9. Meet the Artisans Spotlight Section */}
      <section style={{ marginTop: '3.5rem', borderTop: '1px solid var(--border)', paddingTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Star style={{ color: 'var(--secondary)' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {language === 'en' ? 'Meet the Verified Artisans' : 'تصدیق شدہ کاریگروں سے ملیں'}
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {sellers.slice(0, 3).map((seller) => (
            <div key={seller._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', border: '1px solid var(--border)', background: 'var(--card)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
                {seller.profileImage ? (
                  <img src={seller.profileImage} alt={seller.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  seller.name.charAt(0)
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{seller.name}</h4>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
                  <MapPin size={12} />
                  {seller.location}
                </span>
                <p style={{ fontSize: '0.85rem', opacity: 0.8, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.4rem' }}>
                  {seller.bio[language] || seller.bio.en}
                </p>
                
                {/* Rating stars */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <Star size={12} style={{ fill: 'var(--secondary)', color: 'var(--secondary)' }} />
                  <Star size={12} style={{ fill: 'var(--secondary)', color: 'var(--secondary)' }} />
                  <Star size={12} style={{ fill: 'var(--secondary)', color: 'var(--secondary)' }} />
                  <Star size={12} style={{ fill: 'var(--secondary)', color: 'var(--secondary)' }} />
                  <StarHalf size={12} style={{ fill: 'var(--secondary)', color: 'var(--secondary)' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, marginLeft: '0.25rem' }}>4.8 Rating</span>
                </div>
                
                <Link href={`/seller/${seller._id}`} style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
                  <span>{language === 'en' ? 'Visit Shop' : 'دکان دیکھیں'}</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style jsx>{`
        .category-slider::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
