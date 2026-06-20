'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ur' | 'sd';

export interface TranslationDict {
  [key: string]: {
    en: string;
    ur: string;
    sd: string;
  };
}

export const translations: TranslationDict = {
  appName: {
    en: 'HunarAangan',
    ur: 'ہنر آنگن',
    sd: 'هنر آنگن'
  },
  tagline: {
    en: 'Artisan Marketplace for Pakistani Creators',
    ur: 'پاکستانی خواتین کاریگروں اور شیفس کا مرکز',
    sd: 'پاڪستاني عورتن ڪاريگرن ۽ شيفس جو مرڪز'
  },
  // Header / Auth
  login: {
    en: 'Login',
    ur: 'لاگ ان کریں',
    sd: 'لاگ ان ٿيو'
  },
  logout: {
    en: 'Logout',
    ur: 'لاگ آؤٹ',
    sd: 'لاگ آئوٽ'
  },
  phonePlaceholder: {
    en: 'Enter Phone Number (e.g. 03001234567)',
    ur: 'فون نمبر درج کریں (مثال کے طور پر 03001234567)',
    sd: 'فون نمبر داخل ڪريو (مثال طور 03001234567)'
  },
  sendOTP: {
    en: 'Send Code',
    ur: 'کوڈ بھیجیں',
    sd: 'ڪوڊ موڪليو'
  },
  verifyOTP: {
    en: 'Verify Code',
    ur: 'کوڈ کی تصدیق کریں',
    sd: 'ڪوڊ جي تصديق ڪريو'
  },
  otpPlaceholder: {
    en: 'Enter 6-digit Code (e.g. 123456)',
    ur: '6 ہندسوں کا کوڈ درج کریں',
    sd: '6 انگن جو ڪوڊ داخل ڪريو'
  },
  // Homepage
  heroTitle: {
    en: 'Support local talent with your voice',
    ur: 'اپنی آواز کے ساتھ مقامی کاریگروں کی مدد کریں',
    sd: 'پنهنجي آواز سان مقامي ڪاريگرن جي مدد ڪريو'
  },
  heroCta: {
    en: 'Tap the mic and tell me what you are looking for today',
    ur: 'مائیک دبائیں اور مجھے بتائیں کہ آپ آج کیا تلاش کر رہے ہیں',
    sd: 'مائيڪ تي ڪلڪ ڪريو ۽ ٻڌايو ته توهان اڄ ڇا ڳولي رهيا آهيو'
  },
  proximityFilter: {
    en: 'Artisans Near You',
    ur: 'آپ کے قریب ترین کاریگر',
    sd: 'توهان جي ويجهو ڪاريگر'
  },
  citySelect: {
    en: 'Select City/Province',
    ur: 'شہر یا صوبہ منتخب کریں',
    sd: 'شهر يا صوبو چونڊيو'
  },
  // Tabs
  ordersTab: {
    en: 'Orders',
    ur: 'آرڈرز',
    sd: 'آرڊر'
  },
  productsTab: {
    en: 'Products',
    ur: 'مصنوعات',
    sd: 'شيون'
  },
  chatsTab: {
    en: 'Chats',
    ur: 'بات چیت',
    sd: 'ڳالهه ٻولهه'
  },
  askAiTab: {
    en: 'Ask AI Assistant',
    ur: 'اے آئی اسسٹنٹ',
    sd: 'اي آءِ اسسٽنٽ'
  },
  // Buttons / Actions
  startChat: {
    en: 'Start Conversation',
    ur: 'بات چیت شروع کریں',
    sd: 'ڳالهه ٻولهه شروع ڪريو'
  },
  buyNow: {
    en: 'Buy Now',
    ur: 'ابھی خریدیں',
    sd: 'هاڻي خريد ڪريو'
  },
  askProductCta: {
    en: 'Ask voice question about this product',
    ur: 'اس پروڈکٹ کے بارے میں آواز سے سوال پوچھیں',
    sd: 'هن شيءِ باريان آواز سان سوال پڇو'
  },
  createCustomOffer: {
    en: 'Create Custom Offer',
    ur: 'کسٹم آفر بنائیں',
    sd: 'ڪسٽم آڇ ٺاهيو'
  },
  approve: {
    en: 'Approve',
    ur: 'منظور کریں',
    sd: 'منظور ڪريو'
  },
  decline: {
    en: 'Decline',
    ur: 'مسترد کریں',
    sd: 'رد ڪريو'
  },
  markComplete: {
    en: 'Mark Complete',
    ur: 'مکمل نشان زد کریں',
    sd: 'مڪمل نشان لڳايو'
  },
  fileDispute: {
    en: 'File Dispute',
    ur: 'شکایت درج کریں',
    sd: 'شڪايت داخل ڪريو'
  },
  // Product Form
  voiceListingCta: {
    en: 'Tap to list product by speaking',
    ur: 'بول کر مصنوعات شامل کرنے کے لیے دبائیں',
    sd: 'ڳالهائي شيءِ شامل ڪرڻ لاءِ ڪلڪ ڪريو'
  },
  priceLabel: {
    en: 'Price (PKR)',
    ur: 'قیمت (روپے)',
    sd: 'قيمت (روپيا)'
  },
  deliveryDays: {
    en: 'Delivery Time (Days)',
    ur: 'ڈیلیوری کا وقت (دن)',
    sd: 'ڊليوري وقت (ڏينهن)'
  },
  categoryLabel: {
    en: 'Category / Micro-Niche',
    ur: 'کیٹیگری یا مخصوص ہنر',
    sd: 'زمرو يا خاص هٿ جو ڪم'
  },
  publish: {
    en: 'Publish Listing',
    ur: 'مصنوعات شائع کریں',
    sd: 'شايع ڪريو'
  },
  aiEnhancer: {
    en: 'AI Photo Enhancement Active',
    ur: 'تصویر کی اے آئی سے بہتری فعال ہے',
    sd: 'تصوير جي اي آءِ سان بهتري فعال آهي'
  },
  // Order Stepper
  statusPlaced: {
    en: 'Placed',
    ur: 'آرڈر موصول ہوا',
    sd: 'آرڊر مليو'
  },
  statusPacked: {
    en: 'Packed',
    ur: 'پیک ہو گیا',
    sd: 'پيڪ ٿي ويو'
  },
  statusShipped: {
    en: 'Shipped',
    ur: 'بھیج دیا گیا',
    sd: 'موڪليو ويو'
  },
  statusDelivered: {
    en: 'Delivered',
    ur: 'مل گیا',
    sd: 'ملي ويو'
  },
  escrowPaid: {
    en: 'Escrow Secured',
    ur: 'رقم ایسکرو میں محفوظ ہے',
    sd: 'رقم ايسڪرو ۾ محفوظ آهي'
  },
  escrowReleased: {
    en: 'Released to Artisan',
    ur: 'رقم کاریگر کو منتقل کر دی گئی',
    sd: 'رقم ڪاريگر کي منتقل ڪئي وئي'
  },
  // Checkout
  paymentMethods: {
    en: 'Payment Method',
    ur: 'ادائیگی کا طریقہ',
    sd: 'ادائيگي جو طريقو'
  },
  cod: {
    en: 'Cash on Delivery (COD)',
    ur: 'کیش آن ڈیلیوری (COD)',
    sd: 'ڪيش آن ڊليوري (COD)'
  },
  easypaisa: {
    en: 'EasyPaisa Mobile Wallet',
    ur: 'ایزی پیسہ موبائل والٹ',
    sd: 'ايزي پيسا موبائيل والٽ'
  },
  jazzcash: {
    en: 'JazzCash Mobile Wallet',
    ur: 'جاز کیش موبائل والٹ',
    sd: 'جاز ڪيش موبائيل والٽ'
  },
  card: {
    en: 'Credit or Debit Card',
    ur: 'کریڈٹ یا ڈیبٹ کارڈ',
    sd: 'ڪريڊٽ يا ڊيبيٽ ڪارڊ'
  },
  completeCheckout: {
    en: 'Complete Purchase',
    ur: 'خریداری مکمل کریں',
    sd: 'خريداري مڪمل ڪريو'
  },
  buyerSellerSwitch: {
    en: 'Switch Dashboard',
    ur: 'ڈیش بورڈ تبدیل کریں',
    sd: 'ڊيش بورڊ تبديل ڪريو'
  },
  verifiedArtisan: {
    en: 'Verified Artisan',
    ur: 'تصدیق شدہ کاریگر',
    sd: 'تصديق ٿيل ڪاريگر'
  },
  nicheDirectory: {
    en: 'Custom Micro-Niches',
    ur: 'مخصوص علاقائی ہنر',
    sd: 'مخصوص علائقائي هٿ جو هنر'
  },
  readyToShip: {
    en: 'Ready to Ship',
    ur: 'فوری ڈیلیوری',
    sd: 'فوري موڪلڻ لاءِ تيار'
  },
  customServices: {
    en: 'Custom Services',
    ur: 'آرڈر پر تیار شدہ کام',
    sd: 'آرڊر تي ٺهڻ جو ڪم'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
  fontFamily: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Read from localStorage if set
    const saved = localStorage.getItem('hunarangan-lang') as Language;
    if (saved && (saved === 'en' || saved === 'ur' || saved === 'sd')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('hunarangan-lang', lang);
  };

  const t = (key: string): string => {
    if (!translations[key]) return key;
    return translations[key][language] || translations[key]['en'] || key;
  };

  const dir = language === 'en' ? 'ltr' : 'rtl';

  let fontFamily = 'var(--font-inter)';
  if (language === 'ur') {
    fontFamily = 'var(--font-noto-urdu)';
  } else if (language === 'sd') {
    fontFamily = 'var(--font-noto-sindhi)';
  }

  // Update HTML tag direction and class
  useEffect(() => {
    const html = document.querySelector('html');
    if (html) {
      html.setAttribute('dir', dir);
      html.setAttribute('lang', language);
      html.style.fontFamily = fontFamily;
    }
  }, [dir, language, fontFamily]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir, fontFamily }}>
      <div style={{ fontFamily }}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
