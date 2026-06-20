'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Sparkles, MapPin, Layers, Package, ArrowLeft, Filter, Sliders, Heart } from 'lucide-react';
import Link from 'next/link';
import { PAKISTAN_CITIES } from '@/lib/cities';

interface ProductItem {
  _id: string;
  title: { en: string; ur: string; sd: string };
  description: { en: string; ur: string; sd: string };
  price: number;
  images: string[];
  category: string;
  isCustomService: boolean;
  sellerId: {
    name: string;
    location: string;
  };
}

export default function CategoryLandingPage() {
  const { language, t, dir } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const categoryName = params.name as string;

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [filterCustom, setFilterCustom] = useState<'all' | 'ready' | 'custom'>('all');
  const [filterCity, setFilterCity] = useState('All');
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [isLoading, setIsLoading] = useState(true);

  // Localization resources for category headers
  const categoryHeaders: {
    [key: string]: {
      title: { en: string; ur: string; sd: string };
      desc: { en: string; ur: string; sd: string };
      bannerUrl: string;
    };
  } = {
    rilli: {
      title: { en: 'Rilli Patchwork & Quilts', ur: 'روایتی رلی پیچ ورک', sd: 'روايتي رلي پيچ ورڪ' },
      desc: {
        en: 'Centuries-old geometric textile quilting pattern hand-stitched by skilled female artisans in Sindh and South Punjab.',
        ur: 'سندھ اور جنوبی پنجاب کی خواتین کاریگروں کے ہاتھ سے سلی ہوئی صدیوں پرانی جیومیٹرک ڈیزائن کی رلیاں۔',
        sd: 'سنڌ ۽ ڏکڻ پنجاب جي سگهڙ عورتن جي هٿن جي سيباڻ سان ٺهيل صديون پراڻي جاميٽريڪل رلي ڊيزائن.'
      },
      bannerUrl: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=1200&auto=format&fit=crop&q=80'
    },
    ajrak: {
      title: { en: 'Hand-block Printed Ajrak', ur: 'اجرک بلاک پرنٹنگ', sd: 'اجرڪ بلاڪ پرنٽنگ' },
      desc: {
        en: 'Authentic organic cotton shawls and fabrics printed using hand-carved wooden blocks and natural herbal dyes.',
        ur: 'خالص سوتی کپڑے اور قدرتی جڑی بوٹیوں کے رنگوں اور لکڑی کے ٹھپوں سے تیار کردہ روایتی اجرک۔',
        sd: 'لکڙي جي بلاڪن ۽ قدرتي رنگن مان تيار ڪيل سنڌ جي تهذيب ۽ ثقافت جي نشاني اجرڪ شالون.'
      },
      bannerUrl: 'https://images.unsplash.com/photo-1606744824163-985d376605aa?w=1200&auto=format&fit=crop&q=80'
    },
    food: {
      title: { en: 'Artisan Home Cooking', ur: 'گھریلو لذیذ پکوان', sd: 'گهر جا لذيذ کاڌا' },
      desc: {
        en: 'Freshly prepared local delicacies, spices, pickles, and dynamic home meals cooked cleanly by passionate home chefs.',
        ur: 'گھر کے صاف ستھرے ماحول میں تیار کردہ لذیذ پکوان، نامیاتی مصالحے، اچار اور روایتی کھانے۔',
        sd: 'گهر جي صاف سٿري ماحول ۾ تيار ڪيل لذيذ طعام، مصالحا، آچار ۽ روايتي کاڌا.'
      },
      bannerUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&auto=format&fit=crop&q=80'
    },
    embroidery: {
      title: { en: 'Hand Embroidery & Apparel', ur: 'ہاتھ کی سوئی کڑھائی', sd: 'هٿ جي سئي ڪڙهائي' },
      desc: {
        en: 'Exquisite thread work including phulkari, mirror stitching, and traditional kurtis hand-designed with love.',
        ur: 'شیشے کے کام، پھولکاری اور نفیس سوئی دھاگے کے کام سے تیار کردہ خواتین کے خوبصورت لباس۔',
        sd: 'شيشي جو ڪم، ڦلڪاري ۽ سئي ڌاڳي جي ڪم مان تيار ڪيل عورتن جا خوبصورت ڪپڙا.'
      },
      bannerUrl: 'https://images.unsplash.com/photo-1594582760822-261e479a04a0?w=1200&auto=format&fit=crop&q=80'
    },
    handicrafts: {
      title: { en: 'Local Handicrafts & Clay Pots', ur: 'دستکاری اور مٹی کے برتن', sd: 'هٿ جي دستڪاري ۽ مٽي جا ٿانءَ' },
      desc: {
        en: 'Clay pottery, home decor, woven baskets, and traditional regional crafts hand-shaped by local women creators.',
        ur: 'مٹی کے برتن، گھر کی سجاوٹ کا سامان، ہاتھ سے بنے ٹوکرے اور روایتی علاقائی دستکاری کا مجموعہ۔',
        sd: 'مٽي جا ٿانءَ، گهر جي سجاوٽ جون شيون، هٿ سان ٺهيل کاريون ۽ روايتي ثقافتي هٿ جا هنر.'
      },
      bannerUrl: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=1200&auto=format&fit=crop&q=80'
    }
  };

  // Safe fetch helper for key normalization
  const key = categoryName.toLowerCase();
  const currentMeta = categoryHeaders[key] || {
    title: { en: `${categoryName} Collection`, ur: `${categoryName} کیٹلاگ`, sd: `${categoryName} ڪليڪشن` },
    desc: {
      en: `Explore authentic hand-made product configurations in our premium ${categoryName} catalog.`,
      ur: `ہمارے بہترین اور معیاری ${categoryName} مجموعے میں ہاتھ کا نفیس کام دریافت کریں۔`,
      sd: `اسان جي بهترين ۽ معياري ${categoryName} مجموعي ۾ هٿ جو نفيس ڪم ڳوليو.`
    },
    bannerUrl: 'https://images.unsplash.com/photo-1594582760822-261e479a04a0?w=1200&auto=format&fit=crop&q=80'
  };

  const cities = ['All', ...PAKISTAN_CITIES];

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products?category=${categoryName}`);
        const data = await res.json();

        if (data.products && data.products.length > 0) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategoryProducts();
  }, [categoryName]);

  // Apply filters locally on state
  const filteredProducts = products.filter((p) => {
    // City filter
    if (filterCity !== 'All' && p.sellerId.location !== filterCity) return false;
    // Price filter
    if (p.price > maxPrice) return false;
    // Service type filter
    if (filterCustom === 'ready' && p.isCustomService) return false;
    if (filterCustom === 'custom' && !p.isCustomService) return false;

    return true;
  });

  return (
    <div className="container" style={{ direction: dir, marginTop: '1rem' }}>
      
      {/* Back button */}
      <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} />
        <span>{language === 'en' ? 'Back to Home' : 'ہوم پیج پر جائیں'}</span>
      </button>

      {/* Hero Header Card with Banner Background */}
      <div 
        className="glass-card" 
        style={{ 
          position: 'relative', 
          height: '260px', 
          borderRadius: 'var(--radius-lg)', 
          overflow: 'hidden', 
          marginBottom: '2rem',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10, 77, 52, 0.85)', zIndex: 2 }}></div>
        <img 
          src={currentMeta.bannerUrl} 
          alt={categoryName} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, zIndex: 1 }} 
        />
        
        <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '0 2.5rem', color: 'white', gap: '0.75rem', maxWidth: '800px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'var(--secondary)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-sm)', width: 'fit-content' }}>
            {categoryName}
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>
            {currentMeta.title[language] || currentMeta.title.en}
          </h1>
          <p style={{ opacity: 0.9, fontSize: '1.05rem', lineHeight: 1.6 }}>
            {currentMeta.desc[language] || currentMeta.desc.en}
          </p>
        </div>
      </div>

      {/* Main filter split grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem' }} className="responsive-layout">
        
        {/* Sidebar Filters */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--border)', background: 'var(--card)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <Filter size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                {language === 'en' ? 'Filters' : 'فلٹرز'}
              </h3>
            </div>

            {/* City Location Select */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8 }}>
                {language === 'en' ? 'Artisan Region' : 'کاریگر کا علاقہ'}
              </label>
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--card)', outline: 'none', color: 'inherit' }}
              >
                <option value="All">{language === 'en' ? 'All Pakistan' : 'پورے پاکستان سے'}</option>
                {cities.filter(c => c !== 'All').map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Price Filter slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, opacity: 0.8 }}>
                <span>{language === 'en' ? 'Max Price' : 'زیادہ سے زیادہ قیمت'}</span>
                <span style={{ color: 'var(--primary)' }}>Rs. {maxPrice}</span>
              </div>
              <input
                type="range"
                min="500"
                max="15000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.5 }}>
                <span>Rs. 500</span>
                <span>Rs. 15,000</span>
              </div>
            </div>

            {/* Custom Services type checks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8, marginBottom: '0.2rem' }}>
                {language === 'en' ? 'Delivery Configuration' : 'ڈیلیوری کی قسم'}
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="serviceType" 
                  checked={filterCustom === 'all'} 
                  onChange={() => setFilterCustom('all')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>{language === 'en' ? 'Show All' : 'تمام مصنوعات'}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="serviceType" 
                  checked={filterCustom === 'ready'} 
                  onChange={() => setFilterCustom('ready')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>{t('readyToShip')}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="serviceType" 
                  checked={filterCustom === 'custom'} 
                  onChange={() => setFilterCustom('custom')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>{t('customServices')}</span>
              </label>
            </div>

          </div>
        </aside>

        {/* Product Grid Panel */}
        <div>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
              <div className="spinner"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'rgba(0,0,0,0.02)', borderRadius: '1rem' }}>
              <p style={{ opacity: 0.6, fontSize: '1.1rem', fontWeight: 600 }}>
                {language === 'en' 
                  ? 'No Products' 
                  : 'کوئی پروڈکٹ دستیاب نہیں ہے'}
              </p>
            </div>
          ) : (
            <div className="discovery-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {filteredProducts.map((product) => (
                <div key={product._id} className="product-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Image Frame */}
                  <div style={{ position: 'relative', height: '200px', overflow: 'hidden', background: '#e0e0e0' }}>
                    <img
                      src={product.images[0]}
                      alt={product.title.en}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    
                    {product.isCustomService && (
                      <span style={{
                        position: 'absolute',
                        bottom: '0.75rem',
                        [dir === 'ltr' ? 'right' : 'left']: '0.75rem',
                        background: 'var(--secondary)',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.8rem',
                        fontWeight: 800
                      }}>
                        {t('customServices')}
                      </span>
                    )}
                  </div>

                  {/* Details Content */}
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                    
                    {/* Title */}
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', height: '3.2rem', overflow: 'hidden' }}>
                      {language === 'en' ? product.title.en : language === 'ur' ? product.title.ur : product.title.sd}
                    </h4>

                    {/* Price & Location */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                        Rs. {product.price.toLocaleString()}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', opacity: 0.7, fontWeight: 600 }}>
                        <MapPin size={12} />
                        <span>{product.sellerId.location}</span>
                      </span>
                    </div>

                    {/* Creator Info footer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                      <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                        {product.sellerId.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>{product.sellerId.name}</p>
                        <p style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 600 }}>{t('verifiedArtisan')}</p>
                      </div>
                    </div>

                    {/* Action Link */}
                    <Link href={`/product/${product._id}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem', width: '100%', fontSize: '0.9rem', borderRadius: '0.5rem' }}>
                      {language === 'en' ? 'View Details' : 'تفصیلات دیکھیں'}
                    </Link>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .responsive-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
