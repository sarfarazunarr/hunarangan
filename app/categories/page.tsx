'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Sparkles, MapPin, Layers, Package, HelpCircle, User, Grid, Scissors, Utensils, Palette, Gift, Search } from 'lucide-react';

interface ProductItem {
  _id: string;
  title: { en: string; ur: string; sd: string };
  price: number;
  images: string[];
  category: string;
  isCustomService: boolean;
  sellerId: {
    name: string;
    location: string;
  };
}

function CategoriesContent() {
  const { language, t, dir } = useLanguage();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [filterCustom, setFilterCustom] = useState<'all' | 'ready' | 'custom'>('all');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Platform standard categories
  const standardCategories = [
    { name: 'All', en: 'All Items', ur: 'تمام ہنر', sd: 'سڀ شيون' },
    { name: 'Rilli', en: 'Rilli Patchwork', ur: 'رلی پیچ ورک', sd: 'رلي پيچ ورڪ' },
    { name: 'Ajrak', en: 'Ajrak Blocks', ur: 'اجرک بلاک پرنٹ', sd: 'اجرڪ بلاڪ پرنٽ' },
    { name: 'Food', en: 'Artisan Food', ur: 'گھر کا کھانا', sd: 'گهر جو کاڌو' },
    { name: 'Embroidery', en: 'Hand Embroidery', ur: 'ہاتھ کی کڑھائی', sd: 'هٿ جي ڪڙهائي' },
    { name: 'Handicrafts', en: 'Handicrafts', ur: 'دستکاری', sd: 'دستڪاري' }
  ];

  const categoryIcons: { [key: string]: React.ReactNode } = {
    All: <Grid size={16} />,
    Rilli: <Scissors size={16} />,
    Ajrak: <Layers size={16} />,
    Food: <Utensils size={16} />,
    Embroidery: <Palette size={16} />,
    Handicrafts: <Gift size={16} />
  };

  // Simulated User-generated regional micro-niches
  const userMicroNiches = [
    { name: 'Sindhi Hurmucha', en: 'Hurmucha Stitches', ur: 'سندھی ہرمچا ٹانکہ', sd: 'سنڌي هرمزہ ٽانڪو', count: 3 },
    { name: 'Balochi Sheesha Kaam', en: 'Balochi Mirror Work', ur: 'بلوچی شیشہ کڑھائی', sd: 'بلوچي آرسي جو ڪم', count: 5 },
    { name: 'Kashmiri Kashida', en: 'Kashmiri Crewel', ur: 'کشمیری کشیدہ کاری', sd: 'ڪشميري ڪشيده ڪاري', count: 2 },
    { name: 'Organic Multani Clay', en: 'Multani Blue Pottery', ur: 'ملتانی نیلی مٹی کے برتن', sd: 'ملتاني نيري مٽي جا ٿانءَ', count: 4 },
    { name: 'Tharparkar Shawls', en: 'Thar Khaddi Weaving', ur: 'تھرپارکر کھڈی شالیں', sd: 'ٿرپارڪر کڏي شالون', count: 3 }
  ];

  useEffect(() => {
    const fetchFilteredProducts = async () => {
      setIsLoading(true);
      try {
        let isCustomParam = '';
        if (filterCustom === 'ready') isCustomParam = 'false';
        if (filterCustom === 'custom') isCustomParam = 'true';

        const categoryFilter = activeCategory === 'All' ? '' : activeCategory;
        
        const res = await fetch(`/api/products?category=${categoryFilter}&isCustomService=${isCustomParam}`);
        const data = await res.json();

        if (data.products && data.products.length > 0) {
          setProducts(data.products);
        } else {
          // Mock data generation if DB yields empty response
          const fallbackList: ProductItem[] = [
            {
              _id: 'p1',
              title: { en: 'Red Rilli Design Quilt', ur: 'سرخ رلی رضائی', sd: 'ڳاڙهي رلي' },
              price: 4500,
              images: ['https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&auto=format&fit=crop&q=80'],
              category: 'Rilli',
              isCustomService: false,
              sellerId: { name: 'Mai Bhagi', location: 'Hyderabad' }
            },
            {
              _id: 'p2',
              title: { en: 'Handblock Printed Indigo Ajrak', ur: 'اجرک شال', sd: 'اجرڪ شال' },
              price: 2800,
              images: ['https://images.unsplash.com/photo-1606744824163-985d376605aa?w=800&auto=format&fit=crop&q=80'],
              category: 'Ajrak',
              isCustomService: false,
              sellerId: { name: 'Zainab Bibi', location: 'Karachi' }
            },
            {
              _id: 'p3',
              title: { en: 'Spicy Chicken Biryani Plate', ur: 'خصوصی بریانی', sd: 'خاص برياني' },
              price: 600,
              images: ['https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80'],
              category: 'Food',
              isCustomService: true,
              sellerId: { name: 'Ayesha Khan', location: 'Lahore' }
            },
            {
              _id: 'p4',
              title: { en: 'Hand Embroidered Shawl', ur: 'کڑھائی والی شال', sd: 'ڪڙهائي واري شال' },
              price: 3200,
              images: ['https://images.unsplash.com/photo-1594582760822-261e479a04a0?w=800&auto=format&fit=crop&q=80'],
              category: 'Embroidery',
              isCustomService: false,
              sellerId: { name: 'Shazia Marvi', location: 'Quetta' }
            },
            {
              _id: 'p5',
              title: { en: 'Hurmucha Stitched Balochi Kurti', ur: 'بلوچی ہرمچا کرتی', sd: 'بلوچي هرمزہ ڪرتي' },
              price: 3500,
              images: ['https://images.unsplash.com/photo-1594582760822-261e479a04a0?w=800&auto=format&fit=crop&q=80'],
              category: 'Sindhi Hurmucha',
              isCustomService: true,
              sellerId: { name: 'Mai Bhagi', location: 'Hyderabad' }
            }
          ];

          let filtered = fallbackList;
          if (activeCategory !== 'All') {
            filtered = filtered.filter(p => p.category.toLowerCase().includes(activeCategory.toLowerCase()));
          }
          if (filterCustom === 'ready') {
            filtered = filtered.filter(p => !p.isCustomService);
          } else if (filterCustom === 'custom') {
            filtered = filtered.filter(p => p.isCustomService);
          }
          setProducts(filtered);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilteredProducts();
  }, [activeCategory, filterCustom]);

  const displayProducts = products.filter((product) => {
    if (!searchQuery.trim()) return true;
    const search = searchQuery.toLowerCase().trim();
    const titleEn = (product.title?.en || '').toLowerCase();
    const titleUr = (product.title?.ur || '').toLowerCase();
    const titleSd = (product.title?.sd || '').toLowerCase();
    const cat = (product.category || '').toLowerCase();
    const seller = (product.sellerId?.name || '').toLowerCase();
    const loc = (product.sellerId?.location || '').toLowerCase();

    return (
      titleEn.includes(search) ||
      titleUr.includes(search) ||
      titleSd.includes(search) ||
      cat.includes(search) ||
      seller.includes(search) ||
      loc.includes(search)
    );
  });

  return (
    <div className="container" style={{ direction: dir, marginTop: '1.5rem' }}>
      
      {/* Page Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
          {language === 'en' ? 'Explore Art & Skills' : language === 'ur' ? 'ہنر اور فن کی تلاش' : 'هنر ۽ فن جي ڳولا'}
        </h1>
        <p style={{ opacity: 0.7 }}>
          {language === 'en' 
            ? 'Browse standard collections or artisan-created micro-niches near you.' 
            : 'روایتی ڈیزائن یا کاریگروں کے اپنے مخصوص ہنر دریافت کریں۔'}
        </p>

        {/* Live Search Bar */}
        <div style={{ maxWidth: '550px', margin: '1.25rem auto 0 auto', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', [dir === 'ltr' ? 'left' : 'right']: '1rem', opacity: 0.5 }}>
            <Search size={18} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            style={{
              width: '100%',
              padding: dir === 'ltr' ? '0.75rem 1rem 0.75rem 2.8rem' : '0.75rem 2.8rem 0.75rem 1rem',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              fontSize: '0.95rem',
              outline: 'none',
              background: 'var(--input-bg)'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem', flexWrap: 'wrap' }} className="responsive-layout">
        
        {/* Main Content Pane */}
        <div>
          {/* Categories Horizontal Directory Selector */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {standardCategories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => {
                  setActiveCategory(cat.name);
                  setSearchQuery('');
                }}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '9999px',
                  border: activeCategory === cat.name ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  background: activeCategory === cat.name ? 'var(--primary)' : 'var(--card-light)',
                  color: activeCategory === cat.name ? 'white' : 'inherit',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.95rem'
                }}
              >
                <span>{categoryIcons[cat.name]}</span>{' '}
                <span>{language === 'en' ? cat.en : language === 'ur' ? cat.ur : cat.sd}</span>
              </button>
            ))}
          </div>

          {/* Visual Filters switch */}
          <div style={{
            background: 'var(--card-light)',
            border: '1px solid var(--border-light)',
            padding: '0.5rem',
            borderRadius: '1rem',
            display: 'inline-flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <button
              onClick={() => setFilterCustom('all')}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                background: filterCustom === 'all' ? 'var(--primary)' : 'transparent',
                color: filterCustom === 'all' ? 'white' : 'inherit',
                fontSize: '0.95rem'
              }}
            >
              {language === 'en' ? 'Show All' : 'تمام مصنوعات'}
            </button>
            
            <button
              onClick={() => setFilterCustom('ready')}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                background: filterCustom === 'ready' ? 'var(--primary)' : 'transparent',
                color: filterCustom === 'ready' ? 'white' : 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.95rem'
              }}
            >
              <Package size={15} />
              <span>{t('readyToShip')}</span>
            </button>

            <button
              onClick={() => setFilterCustom('custom')}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                background: filterCustom === 'custom' ? 'var(--primary)' : 'transparent',
                color: filterCustom === 'custom' ? 'white' : 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.95rem'
              }}
            >
              <Layers size={15} />
              <span>{t('customServices')}</span>
            </button>
          </div>

          {/* Product grid feed */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner"></div>
            </div>
          ) : displayProducts.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '1rem' }}>
              <p style={{ opacity: 0.6, fontSize: '1.1rem', fontWeight: 600 }}>
                {language === 'en' ? 'No items found matching the search.' : 'کوئی پروڈکٹ نہیں ملی۔'}
              </p>
            </div>
          ) : (
            <div className="discovery-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {displayProducts.map((product) => (
                <div key={product._id} className="product-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
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
                      <span style={{ fontSize: '0.8rem', display: 'flex', gap: '0.25rem', opacity: 0.7 }}><MapPin size={12} />{product.sellerId.location}</span>
                    </div>
                    <Link href={`/product/${product._id}`} className="btn btn-outline" style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      {t('viewDetailsBtn')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Dynamic Micro-Niche Directory */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
              <Sparkles size={18} />
              <span>{t('nicheDirectory')}</span>
            </h3>
            
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem' }}>
              {language === 'en' 
                ? 'User-generated regional specialties, handcrafted in small batches.' 
                : 'کاریگروں کے اپنے ہاتھ کی مخصوص علاقائی کاریگری کا مجموعہ۔'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {userMicroNiches.map((niche) => (
                <button
                  key={niche.name}
                  onClick={() => {
                    setActiveCategory(niche.name);
                    setSearchQuery('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '0.5rem',
                    border: activeCategory === niche.name ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                    background: activeCategory === niche.name ? 'rgba(15, 110, 71, 0.05)' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    textAlign: 'start',
                    width: '100%',
                    fontWeight: 700
                  }}
                >
                  <span style={{ color: activeCategory === niche.name ? 'var(--primary)' : 'inherit' }}>
                    {language === 'en' ? niche.en : language === 'ur' ? niche.ur : niche.sd}
                  </span>
                  <span style={{ background: 'rgba(0,0,0,0.05)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                    {niche.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

      </div>

      <style jsx>{`
        .spinner {
          width: 28px;
          height: 28px;
          border: 3px solid var(--border-light);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .responsive-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>}>
      <CategoriesContent />
    </Suspense>
  );
}
