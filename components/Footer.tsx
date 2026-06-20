'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Heart, Mail, Phone, MapPin, Globe, Shield, HelpCircle, Award } from 'lucide-react';

export default function Footer() {
  const { language, dir } = useLanguage();

  const content = {
    about: {
      en: 'HunarAangan is a dedicated, trilingual e-commerce marketplace empowering female artisans, home chefs, and creators across Pakistan. We connect traditional craftsmanship with buyers everywhere.',
      ur: 'ہنر آنگن پاکستان بھر کی خواتین کاریگروں، ہوم شیفس اور تخلیق کاروں کو بااختیار بنانے کے لیے ایک مخصوص، سہ لسانی ای کامرس مارکیٹ پلیس ہے۔ ہم روایتی دستکاری کو خریداروں سے جوڑتے ہیں۔',
      sd: 'هنر آنگن سڄي پاڪستان جي عورتن ڪاريگرن، هوم شيفس ۽ تخليق ڪارن کي بااختيار بڻائڻ لاءِ هڪ مخصوص، ٽه-ٻولي اي ڪامرس مارڪيٽ پليس آهي. اسان روايتي دستڪاري کي خريدارن سان ڳنڍيندا آهيون.'
    },
    mission: {
      en: 'Empowering Women Through Craft & Culinary Art',
      ur: 'دستکاری اور کھانا پکانے کے ہنر سے خواتین کی خودمختاری',
      sd: 'دستڪاري ۽ کاڌي جي هنر سان عورتن جي خودمختياري'
    },
    quickLinks: {
      en: 'Quick Links',
      ur: 'فوری لنکس',
      sd: 'فوري لنڪس'
    },
    categories: {
      en: 'Categories',
      ur: 'کیٹیگریز',
      sd: 'زمرا'
    },
    support: {
      en: 'Support & Safety',
      ur: 'مدد اور تحفظ',
      sd: 'مدد ۽ تحفظ'
    },
    terms: {
      en: 'Terms & Conditions',
      ur: 'شرائط و ضوابط',
      sd: 'شرطون ۽ ضابطا'
    },
    privacy: {
      en: 'Privacy Policy',
      ur: 'رازداری کی پالیسی',
      sd: 'رازداري جي پاليسي'
    },
    help: {
      en: 'Artisan Support Desk',
      ur: 'کاریگر ہیلپ ڈیسک',
      sd: 'ڪاريگر هيلپ ڊيسڪ'
    },
    copyright: {
      en: 'HunarAangan. All rights reserved. Handcrafted with',
      ur: 'ہنر آنگن۔ جملہ حقوق محفوظ ہیں۔ دستکاری اور محبت کے ساتھ تیار کردہ',
      sd: 'هنر آنگن. سڀ حق محفوظ آهن. هٿ جي محنت ۽ محبت سان تيار ڪيل'
    },
    pakistan: {
      en: 'in Pakistan',
      ur: 'پاکستان میں',
      sd: 'پاڪستان ۾'
    }
  };

  const currentT = (key: keyof typeof content) => {
    return content[key][language] || content[key]['en'];
  };

  return (
    <footer className="footer-container" style={{ direction: dir }}>
      <div className="footer-grid container">
        
        {/* About Column */}
        <div className="footer-col about-col">
          <h3 className="footer-logo">Hunar<span>Aangan</span></h3>
          <p className="footer-mission-tag">{currentT('mission')}</p>
          <p className="footer-desc">{currentT('about')}</p>
          <div className="artisan-badge">
            <Award size={16} className="text-emerald-600" />
            <span>100% Verified Artisans</span>
          </div>
        </div>

        {/* Categories Link Column */}
        <div className="footer-col">
          <h4 className="footer-heading">{currentT('categories')}</h4>
          <ul className="footer-links">
            <li><Link href="/categories/rilli">Rilli & Patchwork</Link></li>
            <li><Link href="/categories/ajrak">Ajrak Prints</Link></li>
            <li><Link href="/categories/embroidery">Embroidery Work</Link></li>
            <li><Link href="/categories/food">Home-cooked Food</Link></li>
            <li><Link href="/categories/handicrafts">Local Handicrafts</Link></li>
          </ul>
        </div>

        {/* Support Link Column */}
        <div className="footer-col">
          <h4 className="footer-heading">{currentT('support')}</h4>
          <ul className="footer-links">
            <li>
              <Link href="/dashboard/buyer?tab=orders" className="flex items-center gap-2">
                <Shield size={14} />
                <span>Escrow Payments</span>
              </Link>
            </li>
            <li>
              <Link href="/help" className="flex items-center gap-2">
                <HelpCircle size={14} />
                <span>{currentT('help')}</span>
              </Link>
            </li>
            <li><Link href="/terms">{currentT('terms')}</Link></li>
            <li><Link href="/privacy">{currentT('privacy')}</Link></li>
          </ul>
        </div>

        {/* Contact info column */}
        <div className="footer-col contact-col">
          <h4 className="footer-heading">
            {language === 'en' ? 'Get In Touch' : language === 'ur' ? 'رابطہ کریں' : 'رابطو ڪريو'}
          </h4>
          <ul className="footer-contact-info">
            <li>
              <MapPin size={16} className="text-emerald-600" />
              <span>Sindh & Punjab Craft Hubs, Pakistan</span>
            </li>
            <li>
              <Phone size={16} className="text-emerald-600" />
              <span>+92 300 000 0000</span>
            </li>
            <li>
              <Mail size={16} className="text-emerald-600" />
              <span>support@hunarangan.pk</span>
            </li>
            <li>
              <Globe size={16} className="text-emerald-600" />
              <span>www.hunarangan.pk</span>
            </li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-content">
          <p>
            &copy; {new Date().getFullYear()} {currentT('copyright')}{' '}
            <Heart size={14} className="heart-icon inline-block text-rose-500 mx-1" />{' '}
            {currentT('pakistan')}
          </p>
        </div>
      </div>
    </footer>
  );
}
