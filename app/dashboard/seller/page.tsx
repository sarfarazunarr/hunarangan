'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { ShoppingCart, Package, MessageSquare, Sparkles, Plus, Check, User, PlusCircle, ArrowRight, Trash2, Loader, X, Send, Edit3, Save, Coins } from 'lucide-react';
import Link from 'next/link';
import { PAKISTAN_CITIES } from '@/lib/cities';

interface OrderItem {
  _id: string;
  productId?: { title: { en: string; ur: string; sd: string }; price: number };
  customOfferDetails?: { title: string; amount: number };
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryStatus: string;
  createdAt: string;
  buyerId: { name: string; phone: string };
  recipientName?: string;
  recipientPhone?: string;
  shippingAddress?: string;
  notes?: string;
  shipmentHistory?: { location: string; status: string; timestamp: string }[];
}

interface ProductItem {
  _id: string;
  title: { en: string; ur: string; sd: string };
  price: number;
  category: string;
  isCustomService: boolean;
}

interface ChatItem {
  roomId: string;
  buyerId: { _id: string; name: string };
  messages: { text: string; timestamp: string }[];
}

export default function SellerDashboard() {
  const { language, t, dir } = useLanguage();
  const { showToast, success: showSuccessToast, error: showErrorToast } = useToast();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'chats' | 'ask_ai' | 'profile' | 'investments'>('orders');

  // Backend States
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);

  // Edit State
  const [editProductId, setEditProductId] = useState<string | null>(null);

  // Dynamic Payout States
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);

  // Manual Product Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualCategory, setManualCategory] = useState('Rilli');
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [manualShortDesc, setManualShortDesc] = useState('');
  const [manualFaqs, setManualFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [manualIsCustom, setManualIsCustom] = useState(false);
  const [manualImage, setManualImage] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);

  // Investment / Funding request states
  const [fundingRequests, setFundingRequests] = useState<any[]>([]);
  const [fundingBusinessName, setFundingBusinessName] = useState('');
  const [fundingBusinessDetails, setFundingBusinessDetails] = useState('');
  const [fundingAmount, setFundingAmount] = useState('');
  const [fundingPurpose, setFundingPurpose] = useState('');
  const [isSubmittingFunding, setIsSubmittingFunding] = useState(false);
  const [isFetchingFunding, setIsFetchingFunding] = useState(false);

  const handleAddFaqField = () => {
    setManualFaqs(prev => [...prev, { question: '', answer: '' }]);
  };

  const handleRemoveFaqField = (index: number) => {
    setManualFaqs(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    setManualFaqs(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // AI Listing Assistant States (Text uploader replacement)
  const [draftText, setDraftText] = useState('');
  const [draftProduct, setDraftProduct] = useState<any>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Ask AI Text Stats states
  const [statsInput, setStatsInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // Profile Editor States
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileLocation, setProfileLocation] = useState('Karachi');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [profileCnic, setProfileCnic] = useState('');
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
    if (user.role !== 'seller') {
      router.push('/dashboard/buyer');
      return;
    }
    setCurrentUser(user);

    // Load full profile details from DB
    const loadProfile = async () => {
      if (!stored) return;
      try {
        const u = JSON.parse(stored);
        const res = await fetch(`/api/profile?userId=${u.id}`);
        const data = await res.json();
        if (data.success && data.user) {
          const profile = data.user;
          setProfileName(profile.name || '');
          setProfileEmail(profile.email || '');
          setProfileLocation(profile.location || 'Karachi');
          setProfileAddress(profile.address || '');
          setProfileCnic(profile.cnic || '');
          setProfileImage(profile.profileImage || '');
          setProfileBio(profile.bio?.[language] || profile.bio?.en || '');
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadProfile();

    // Check search params query on mount
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['orders', 'products', 'chats', 'ask_ai', 'profile', 'investments'].includes(tab)) {
        setActiveTab(tab as any);
      }
    }
  }, []);

  const fetchPayoutDetails = async () => {
    const stored = localStorage.getItem('hunarangan-user');
    if (!stored) return;
    try {
      const user = JSON.parse(stored);
      const res = await fetch(`/api/payouts?sellerId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setAvailableBalance(data.availableBalance || 0);
        setPayoutHistory(data.requests || []);
      }
    } catch (e) {
      console.error('Failed to load payout details:', e);
    }
  };

  const fetchFundingDetails = async () => {
    const stored = localStorage.getItem('hunarangan-user');
    if (!stored) return;
    setIsFetchingFunding(true);
    try {
      const user = JSON.parse(stored);
      const res = await fetch(`/api/investments?sellerId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setFundingRequests(data.requests || []);
      }
    } catch (e) {
      console.error('Failed to load funding details:', e);
    } finally {
      setIsFetchingFunding(false);
    }
  };

  const handleRequestFunding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundingBusinessName || !fundingBusinessDetails || !fundingAmount || !fundingPurpose) {
      showErrorToast(language === 'en' ? 'Please fill all required fields.' : 'براہ کرم تمام مطلوبہ فیلڈز پُر کریں۔');
      return;
    }
    const amt = parseFloat(fundingAmount);
    if (isNaN(amt) || amt <= 0) {
      showErrorToast(language === 'en' ? 'Please enter a valid positive amount.' : 'براہ کرم ایک درست رقم درج کریں۔');
      return;
    }

    setIsSubmittingFunding(true);
    try {
      const res = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: currentUser.id,
          name: profileName || currentUser.name,
          cnic: profileCnic || currentUser.cnic,
          phone: currentUser.phone,
          businessName: fundingBusinessName,
          businessDetails: fundingBusinessDetails,
          amountRequested: amt,
          purpose: fundingPurpose
        })
      });
      if (res.ok) {
        showSuccessToast(language === 'en' ? 'Investment request submitted successfully!' : 'سرمایہ کاری کی درخواست کامیابی سے جمع ہو گئی ہے!');
        setFundingBusinessName('');
        setFundingBusinessDetails('');
        setFundingAmount('');
        setFundingPurpose('');
        fetchFundingDetails();
      } else {
        const err = await res.json();
        showErrorToast('Failed: ' + err.error);
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Connection failed.');
    } finally {
      setIsSubmittingFunding(false);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAmount || !payoutDetails) {
      showErrorToast('Please enter amount and details.');
      return;
    }
    const amt = parseFloat(payoutAmount);
    if (isNaN(amt) || amt <= 0) {
      showErrorToast('Please enter a valid positive amount.');
      return;
    }
    if (amt > availableBalance) {
      showErrorToast(`Cannot request more than available balance (Rs. ${availableBalance}).`);
      return;
    }

    setIsRequestingPayout(true);
    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: currentUser.id, amount: amt, paymentDetails: payoutDetails })
      });
      if (res.ok) {
        showSuccessToast(language === 'en' ? 'Payout requested successfully!' : 'رقم منتقلی کی درخواست بھیج دی گئی ہے!');
        setPayoutAmount('');
        setPayoutDetails('');
        fetchPayoutDetails();
      } else {
        const err = await res.json();
        showErrorToast('Failed: ' + err.error);
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Connection failed.');
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const fetchSellerDashboardData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setFetchError(false);
    try {
      fetchPayoutDetails();
      fetchFundingDetails();
      const orderRes = await fetch(`/api/orders?userId=${currentUser.id}&role=seller`);
      if (!orderRes.ok) throw new Error('Failed to fetch sales');
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.error || 'Failed to fetch sales');
      
      const prodRes = await fetch(`/api/products?sellerId=${currentUser.id}`);
      if (!prodRes.ok) throw new Error('Failed to fetch products');
      const prodData = await prodRes.json();
      if (!prodData.success) throw new Error(prodData.error || 'Failed to fetch products');

      const chatRes = await fetch(`/api/chat/rooms?userId=${currentUser.id}`);
      if (!chatRes.ok) throw new Error('Failed to fetch chats');
      const chatData = await chatRes.json();

      setOrders(orderData.orders || []);
      setProducts(prodData.products || []);
      setChats(chatData.rooms || []);

      // Initialize welcome message in Ask AI tab
      setAiMessages([
        { 
          sender: 'bot', 
          text: language === 'en' 
            ? "Hello! Ask me stats like 'how many orders did I do today?' or ask me to draft listing details." 
            : "السلام علیکم! مجھ سے اپنے آرڈرز، فروخت کی معلومات پوچھیں یا کوئی مصنوعات شامل کرنے میں مدد لیں۔" 
        }
      ]);

    } catch (e) {
      console.error(e);
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchSellerDashboardData();
    }
  }, [currentUser]);

  // AI Listing Assistant summary text submit
  const handleDraftFromText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftText.trim()) return;
    setIsParsing(true);
    setDraftProduct(null);

    try {
      const parseRes = await fetch('/api/products/parse-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: draftText })
      });
      const parseData = await parseRes.json();
      
      if (parseData.success && parseData.draft) {
        const d = parseData.draft;
        setManualTitle(d.title?.en || '');
        setManualDesc(d.description?.en || '');
        setManualShortDesc(d.shortDescription?.en || d.description?.en?.slice(0, 100) || '');
        setManualPrice(d.price ? d.price.toString() : '');
        setManualImage(d.image || '');

        const cat = d.category || 'Rilli';
        const standardCategories = ['Rilli', 'Ajrak', 'Food', 'Embroidery', 'Handicrafts', 'Sindhi Hurmucha'];
        if (standardCategories.includes(cat)) {
          setManualCategory(cat);
          setCustomCategoryText('');
        } else {
          setManualCategory('Other');
          setCustomCategoryText(cat);
        }

        setEditProductId(null); // Ensure add mode
        setShowAddForm(true);
        setDraftText('');
        showSuccessToast(language === 'en' ? 'AI has drafted your listing! Please review and publish.' : 'اے آئی نے لسٹنگ کا خاکہ بنا دیا ہے! براہ کرم چیک کریں اور شائع کریں۔');
      } else {
        showErrorToast('AI parsing failed.');
      }
    } catch (e) {
      console.error(e);
      showErrorToast('AI parsing error.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleStartEditProduct = (product: any) => {
    setEditProductId(product._id);
    setManualTitle(product.title?.en || '');
    setManualDesc(product.description?.en || '');
    setManualShortDesc(product.shortDescription?.en || '');
    setManualPrice(product.price?.toString() || '');
    setManualImage(product.images?.[0] || '');
    
    // Set custom categories
    const standardCategories = ['Rilli', 'Ajrak', 'Food', 'Embroidery', 'Handicrafts', 'Sindhi Hurmucha'];
    if (standardCategories.includes(product.category)) {
      setManualCategory(product.category);
      setCustomCategoryText('');
    } else {
      setManualCategory('Other');
      setCustomCategoryText(product.category);
    }
    
    // Set FAQs
    if (product.faqs && product.faqs.length > 0) {
      setManualFaqs(product.faqs.map((f: any) => ({
        question: f.question?.en || f.question || '',
        answer: f.answer?.en || f.answer || ''
      })));
    } else {
      setManualFaqs([]);
    }
    
    setManualIsCustom(!!product.isCustomService);
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setManualTitle('');
    setManualDesc('');
    setManualShortDesc('');
    setManualFaqs([]);
    setManualPrice('');
    setManualImage('');
    setCustomCategoryText('');
    setManualIsCustom(false);
    setEditProductId(null);
    setShowAddForm(false);
  };

  const handleManualAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualPrice) return;

    const finalCategory = manualCategory === 'Other' ? customCategoryText : manualCategory;
    if (!finalCategory) {
      showErrorToast(language === 'en' ? 'Please specify a category.' : 'براہ کرم زمرہ منتخب یا درج کریں۔');
      return;
    }

    setIsAdding(true);

    try {
      const payload = {
        sellerId: currentUser.id,
        title: manualTitle,
        description: manualDesc,
        shortDescription: manualShortDesc,
        price: parseFloat(manualPrice),
        category: finalCategory,
        isCustomService: manualIsCustom,
        images: manualImage ? [manualImage] : undefined,
        faqs: manualFaqs
      };

      const url = editProductId ? `/api/products/${editProductId}` : '/api/products';
      const method = editProductId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setManualTitle('');
        setManualDesc('');
        setManualShortDesc('');
        setManualFaqs([]);
        setManualPrice('');
        setManualImage('');
        setCustomCategoryText('');
        setManualIsCustom(false);
        setEditProductId(null);
        setShowAddForm(false);
        
        const successMsg = editProductId 
          ? (language === 'en' ? 'Product updated successfully!' : 'مصنوعات کامیابی سے اپ ڈیٹ ہو گئی ہیں!')
          : (language === 'en' ? 'Product published successfully!' : 'مصنوعات کامیابی سے شائع ہو گئی ہیں!');
          
        showSuccessToast(successMsg);
        fetchSellerDashboardData();
      } else {
        const errData = await res.json();
        showErrorToast('Failed: ' + errData.error);
      }
    } catch (e) {
      console.error(e);
      showErrorToast('Connection failed.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const confirmDelete = window.confirm(language === 'en'
      ? 'Are you sure you want to delete this product from your shop?'
      : 'کیا آپ واقعی یہ پروڈکٹ دکان سے ختم کرنا چاہتے ہیں؟');

    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showSuccessToast(language === 'en' ? 'Product deleted successfully.' : 'مصنوعات کامیابی سے حذف ہو گئی ہیں۔');
        fetchSellerDashboardData();
      } else {
        const errData = await res.json();
        showErrorToast('Failed: ' + errData.error);
      }
    } catch (e) {
      console.error(e);
      showErrorToast('Connection failed.');
    }
  };

  // Chat with AI Stats assistant
  const handleSendStatsQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statsInput.trim()) return;

    const query = statsInput;
    setAiMessages(prev => [...prev, { sender: 'user', text: query }]);
    setStatsInput('');
    setIsStatsLoading(true);

    try {
      // Direct call to chatbot with context info
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, lang: language, context: 'seller', sellerId: currentUser.id })
      });
      const data = await res.json();

      let answer = '';
      if (res.ok) {
        answer = data.responseText[language];
      } else {
        // Fallback matching logic
        const lowercaseQuery = query.toLowerCase();
        if (lowercaseQuery.includes('order') || lowercaseQuery.includes('sale') || lowercaseQuery.includes('فروخت') || lowercaseQuery.includes('آرڈر')) {
          answer = language === 'en'
            ? `You have received ${orders.length} orders total in your profile. Their current status steps are packing or shipped.`
            : `آپ کو کل ${orders.length} آرڈرز موصول ہوئے ہیں۔ ان کے شپمنٹ کا عمل جاری ہے۔`;
        } else if (lowercaseQuery.includes('balance') || lowercaseQuery.includes('payout') || lowercaseQuery.includes('رقم') || lowercaseQuery.includes('بیلنس')) {
          answer = language === 'en'
            ? `Your available payout balance is Rs. ${availableBalance.toLocaleString()}. You can request a payout direct transfer from your dashboard.`
            : `آپ کا دستیاب بیلنس ${availableBalance.toLocaleString()} روپے ہے۔ آپ اپنے ڈیش بورڈ سے براہ راست رقم نکلوانے کی درخواست کر سکتے ہیں۔`;
        } else {
          answer = language === 'en'
            ? "I am here to help you manage your artisan shop. You can ask me about orders, payouts, or help writing descriptions."
            : "میں آپ کی دکان کے انتظام میں مدد کے لیے حاضر ہوں۔ آپ مجھ سے آرڈرز، رقم، یا مصنوعات کی معلومات لکھنے کا پوچھ سکتے ہیں۔";
        }
      }

      setAiMessages(prev => [...prev, { sender: 'bot', text: answer }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const updateDeliveryStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, deliveryStatus: status })
      });
      if (res.ok) {
        fetchSellerDashboardData();
        showSuccessToast(language === 'en' ? 'Shipment status updated!' : 'آرڈر کی ترسیل کی صورتحال اپ ڈیٹ کر دی گئی ہے!');
      } else {
        showErrorToast('Failed to update status.');
      }
    } catch (e) {
      console.error(e);
      showErrorToast('Connection failed.');
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
        showSuccessToast(language === 'en' ? 'Profile picture uploaded!' : 'پروفائل تصویر اپ لوڈ ہو گئی ہے!');
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
          cnic: profileCnic,
          bio: profileBio,
          lang: language
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfileSuccess(true);
        showSuccessToast(language === 'en' ? 'Profile saved successfully!' : 'پروفائل محفوظ ہو گئی ہے!');
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

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingProductImage(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'product');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setManualImage(data.url);
        showSuccessToast(language === 'en' ? 'Product image uploaded to Cloudinary!' : 'پروڈکٹ کی تصویر کلاؤڈ نری پر اپ لوڈ ہو گئی ہے!');
      } else {
        showErrorToast('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Upload connection failed.');
    } finally {
      setIsUploadingProductImage(false);
    }
  };

  return (
    <div className="container" style={{ direction: dir, marginTop: '1rem' }}>
      
      {/* Dashboard Top bar info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            {language === 'en' ? `Artisan Dashboard: ${currentUser?.name}` : `کاریگر ڈیش بورڈ: ${currentUser?.name}`}
          </h2>
          <p style={{ opacity: 0.7 }}>{currentUser?.phone}</p>
        </div>

        {/* Quick swap dashboard switch */}
        <Link href="/dashboard/buyer" className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          {t('buyerSellerSwitch')}
        </Link>
      </div>

      {/* Tab Navigation header */}
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

        <button onClick={() => setActiveTab('products')} style={{
          flex: 1, padding: '0.8rem 1rem', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          background: activeTab === 'products' ? 'var(--primary)' : 'transparent',
          color: activeTab === 'products' ? 'white' : 'inherit',
          fontSize: '1rem'
        }}>
          <Package size={18} />
          <span>{t('productsTab')}</span>
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

        <button onClick={() => setActiveTab('investments')} style={{
          flex: 1, padding: '0.8rem 1rem', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          background: activeTab === 'investments' ? 'var(--primary)' : 'transparent',
          color: activeTab === 'investments' ? 'white' : 'inherit',
          fontSize: '1rem'
        }}>
          <Coins size={18} />
          <span>{language === 'en' ? 'Get Funding' : 'انوسٹمنٹ'}</span>
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

      {/* Main Tab content panes */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div>
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '2rem' }} className="responsive-profile-grid">
              {/* Active list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{language === 'en' ? 'Active Sales' : 'آرڈرز کی فہرست'}</h3>
                
                {fetchError ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem', background: 'rgba(220, 38, 38, 0.05)', borderRadius: '1rem', border: '1px solid rgba(220, 38, 38, 0.1)' }}>
                    <p style={{ color: 'var(--accent)', fontWeight: 700 }}>
                      {language === 'en' ? 'Failed to fetch sales. Please try again.' : 'آرڈرز لوڈ کرنے میں خرابی۔ دوبارہ کوشش کریں۔'}
                    </p>
                    <button onClick={fetchSellerDashboardData} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '1rem auto 0', padding: '0.5rem 1.25rem' }}>
                      <RefreshCw size={14} />
                      <span>{language === 'en' ? 'Try Again' : 'دوبارہ کوشش کریں'}</span>
                    </button>
                  </div>
                ) : orders.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '0.75rem', border: '1px dashed var(--border)' }}>
                    {language === 'en' ? 'No active sales.' : 'کوئی فعال سیلز نہیں ہیں۔'}
                  </div>
                ) : (
                  orders.map((order) => {
                    const steps = ['Placed', 'Packed', 'Shipped', 'Delivered'];
                    const currentStepIdx = steps.indexOf(order.deliveryStatus);
                    const prodName = order.productId ? (order.productId.title[language] || order.productId.title.en) : order.customOfferDetails?.title;
                    const isExpanded = expandedOrderId === order._id;
                    
                    return (
                      <div key={order._id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: isExpanded ? '2px solid var(--primary)' : '1px solid var(--border)', transition: 'all 0.2s ease' }}>
                        
                        {/* Summary Header */}
                        <div 
                          onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}
                        >
                          <div>
                            <h4 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>{prodName}</h4>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem', fontSize: '0.8rem', opacity: 0.7 }}>
                              <span>ID: {order._id}</span>
                              <span>•</span>
                              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ fontSize: '1.15rem', display: 'block' }}>Rs. {order.amount.toLocaleString()}</strong>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                background: order.deliveryStatus === 'Delivered' ? 'rgba(15, 110, 71, 0.1)' : 'rgba(194, 125, 56, 0.1)', 
                                color: order.deliveryStatus === 'Delivered' ? 'var(--primary)' : 'var(--secondary)', 
                                padding: '0.15rem 0.5rem', 
                                borderRadius: '9999px', 
                                fontWeight: 700 
                              }}>
                                {t(`status${order.deliveryStatus}`)}
                              </span>
                            </div>
                            <span style={{ fontSize: '1.1rem', opacity: 0.6, fontWeight: 'bold' }}>
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </div>
                        </div>

                        {/* Collapsible content */}
                        {isExpanded && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', animation: 'fadeIn 0.2s ease-out' }}>
                            
                            {/* Details Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.02)', padding: '0.85rem', borderRadius: '0.5rem' }}>
                              <div>
                                <span style={{ opacity: 0.6, display: 'block', fontSize: '0.75rem' }}>BUYER CUSTOMER:</span>
                                <strong>{order.buyerId.name} ({order.buyerId.phone})</strong>
                              </div>
                              <div>
                                <span style={{ opacity: 0.6, display: 'block', fontSize: '0.75rem' }}>RECIPIENT NAME / CONTACT:</span>
                                <strong>{order.recipientName || 'N/A'} ({order.recipientPhone || 'N/A'})</strong>
                              </div>
                              <div>
                                <span style={{ opacity: 0.6, display: 'block', fontSize: '0.75rem' }}>PAYMENT DETAIL:</span>
                                <strong>{order.paymentMethod} ({order.paymentStatus})</strong>
                              </div>
                              {order.notes && (
                                <div>
                                  <span style={{ opacity: 0.6, display: 'block', fontSize: '0.75rem' }}>CUSTOMER NOTES:</span>
                                  <strong>{order.notes}</strong>
                                </div>
                              )}
                              <div style={{ gridColumn: 'span 2' }}>
                                <span style={{ opacity: 0.6, display: 'block', fontSize: '0.75rem' }}>SHIPPING ADDRESS:</span>
                                <strong>{order.shippingAddress || 'N/A'}</strong>
                              </div>
                            </div>

                            {/* Stepper progress representation */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', position: 'relative' }}>
                              <div style={{ position: 'absolute', left: '5%', right: '5%', top: '50%', height: '3px', background: 'rgba(0,0,0,0.1)', zIndex: 1, transform: 'translateY(-50%)' }}></div>
                              <div style={{ position: 'absolute', left: '5%', width: `${(currentStepIdx / 3) * 90}%`, top: '50%', height: '3px', background: 'var(--primary)', zIndex: 2, transform: 'translateY(-50%)', transition: 'width 0.5s ease' }}></div>

                              {steps.map((step, idx) => {
                                const isActive = idx <= currentStepIdx;
                                const label = t(`status${step}`);
                                return (
                                  <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative', flex: 1 }}>
                                    <div style={{
                                      width: '1.75rem',
                                      height: '1.75rem',
                                      borderRadius: '50%',
                                      background: isActive ? 'var(--primary)' : 'white',
                                      border: isActive ? 'none' : '2px solid rgba(0,0,0,0.15)',
                                      color: isActive ? 'white' : 'rgba(0,0,0,0.4)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 700,
                                      fontSize: '0.8rem',
                                      boxShadow: 'var(--shadow-sm)'
                                    }}>
                                      {isActive ? <Check size={12} /> : idx + 1}
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: isActive ? 700 : 500, opacity: isActive ? 1 : 0.6, marginTop: '0.35rem' }}>
                                      {label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Shipment updates timeline logs */}
                            <div style={{ borderTop: '1px dotted var(--border-light)', paddingTop: '0.5rem' }}>
                              <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.35rem', color: 'var(--primary)' }}>
                                {language === 'en' ? 'Shipment Transit History Logs' : 'ٹرانزٹ شپمنٹ لاگ'}
                              </strong>
                              {!order.shipmentHistory || order.shipmentHistory.length === 0 ? (
                                <p style={{ fontSize: '0.8rem', opacity: 0.6, fontStyle: 'italic' }}>
                                  {language === 'en' ? 'No courier locations registered. Use the delivery agent portal to log updates.' : 'ابھی تک کوئی لاگ درج نہیں کیا گیا ہے۔'}
                                </p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}>
                                  {order.shipmentHistory.map((hist, hIdx) => (
                                    <div key={hIdx} style={{ fontSize: '0.8rem', background: 'var(--input-bg)', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', borderLeft: '3px solid var(--secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div>
                                        <strong>{hist.location}</strong>
                                        {hist.status && <span style={{ opacity: 0.85, marginLeft: '0.5rem', fontSize: '0.75rem' }}>- {hist.status}</span>}
                                      </div>
                                      <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{new Date(hist.timestamp).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Stepper advancement controls */}
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                              {order.deliveryStatus === 'Placed' && (
                                <button onClick={() => updateDeliveryStatus(order._id, 'Packed')} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '0.3rem' }}>
                                  Mark Packed
                                </button>
                              )}
                              {order.deliveryStatus === 'Packed' && (
                                <button onClick={() => updateDeliveryStatus(order._id, 'Shipped')} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '0.3rem' }}>
                                  Mark Shipped
                                </button>
                              )}
                            </div>

                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>

              {/* Sidebar Payout module */}
              <div>
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {language === 'en' ? 'Payout Manager' : 'رقم کی واپسی کا انتظام'}
                  </h3>
                  
                  <div>
                    <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Available Balance:</span>
                    <h2 style={{ fontSize: '2.0rem', fontWeight: 800, color: 'var(--primary)', margin: '0.25rem 0' }}>
                      Rs. {availableBalance.toLocaleString()}
                    </h2>
                    <span style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block' }}>
                      (Calculated from completed orders)
                    </span>
                  </div>

                  {/* Request Payout Form */}
                  <form onSubmit={handleRequestPayout} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Amount (PKR)</label>
                      <input
                        type="number"
                        placeholder="e.g. 3000"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', borderRadius: '0.4rem', border: '1px solid var(--border)', outline: 'none' }}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>EasyPaisa / Bank Account Details</label>
                      <textarea
                        placeholder="e.g. EasyPaisa 03001234567 (Zainab Bibi)"
                        value={payoutDetails}
                        onChange={(e) => setPayoutDetails(e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', borderRadius: '0.4rem', border: '1px solid var(--border)', outline: 'none', height: '60px', resize: 'none', fontFamily: 'inherit' }}
                        required
                      />
                    </div>
                    <button type="submit" disabled={isRequestingPayout || availableBalance <= 0} className="btn btn-primary" style={{ width: '100%', borderRadius: '0.5rem', padding: '0.5rem', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {isRequestingPayout ? 'Submitting...' : (language === 'en' ? 'Submit Request' : 'درخواست بھیجیں')}
                    </button>
                  </form>

                  {/* Payout History List */}
                  {payoutHistory.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Request History</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                         {payoutHistory.map((req) => (
                          <div key={req._id} style={{ background: 'var(--input-bg)', padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <strong>Rs. {req.amount}</strong>
                                <span style={{ display: 'block', opacity: 0.6, fontSize: '0.65rem' }}>{new Date(req.createdAt).toLocaleDateString()}</span>
                              </div>
                              <span style={{
                                padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.65rem',
                                background: req.status === 'Approved' ? 'rgba(15, 110, 71, 0.1)' : req.status === 'Rejected' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                                color: req.status === 'Approved' ? 'var(--primary)' : req.status === 'Rejected' ? 'var(--accent)' : 'var(--secondary)'
                              }}>
                                {req.status}
                              </span>
                            </div>
                            
                            {/* Approved Payout Transaction reference details */}
                            {req.status === 'Approved' && (req.transactionId || req.transactionDetails) && (
                              <div style={{ padding: '0.35rem', background: 'rgba(10,77,52,0.04)', borderRadius: '0.2rem', marginTop: '0.25rem', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.1rem', borderLeft: '2px solid var(--primary)' }}>
                                {req.transactionId && <div>Tx ID: <strong>{req.transactionId}</strong></div>}
                                {req.transactionDetails && <div>Details: {req.transactionDetails}</div>}
                                {req.resolvedAt && <div>Sent: {new Date(req.resolvedAt).toLocaleDateString()}</div>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS CATALOGUE & TEXT DRAFTING */}
          {activeTab === 'products' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }} className="responsive-profile-grid">
              
              {/* Product catalog list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{language === 'en' ? 'Published Offerings' : 'آپ کی دکان کی فہرست'}</h3>
                  <button 
                    onClick={() => { if (showAddForm) { handleCancelEdit(); } else { setShowAddForm(true); } }} 
                    className="btn btn-primary" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', gap: '0.25rem', borderRadius: '0.5rem' }}
                  >
                    {showAddForm ? <X size={14} /> : <Plus size={14} />}
                    <span>{showAddForm ? (language === 'en' ? 'Cancel' : 'منسوخ کریں') : (language === 'en' ? 'Add Product' : 'مصنوعات شامل کریں')}</span>
                  </button>
                </div>

                {/* Manual Product Form */}
                {showAddForm && (
                  <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border)' }}>
                    <h4 style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>
                      {editProductId 
                        ? (language === 'en' ? 'Edit Product Details' : 'پروڈکٹ کی تفصیلات تبدیل کریں')
                        : (language === 'en' ? 'Publish New Item (AI Translates)' : 'مصنوعات شامل کریں (اے آئی ترجمہ کرے گا)')}
                    </h4>
                    
                    <form onSubmit={handleManualAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="responsive-profile-grid">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Product Title</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Red Rilli Suit" 
                            value={manualTitle} 
                            onChange={(e) => setManualTitle(e.target.value)} 
                            style={{ padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }}
                            required 
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Price (PKR)</label>
                          <input 
                            type="number" 
                            placeholder="e.g. 4000" 
                            value={manualPrice} 
                            onChange={(e) => setManualPrice(e.target.value)} 
                            style={{ padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }}
                            required 
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Short Description (1-2 sentences)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Premium quality handmade red patchwork quilt with traditional Sindhi patterns." 
                          value={manualShortDesc} 
                          onChange={(e) => setManualShortDesc(e.target.value)} 
                          style={{ padding: '0.6rem', borderRadius: '0.5rem', outline: 'none' }}
                          required 
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Product Description</label>
                        <textarea 
                          placeholder="Describe your handmade craft..." 
                          value={manualDesc} 
                          onChange={(e) => setManualDesc(e.target.value)} 
                          style={{ padding: '0.6rem', borderRadius: '0.5rem', outline: 'none', height: '80px', fontFamily: 'inherit' }}
                          required 
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="responsive-profile-grid">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Category / Niche</label>
                          <select 
                            value={manualCategory} 
                            onChange={(e) => setManualCategory(e.target.value)} 
                            style={{ padding: '0.6rem', borderRadius: '0.5rem', outline: 'none', background: 'var(--card)' }}
                          >
                            <option value="Rilli">Rilli</option>
                            <option value="Ajrak">Ajrak</option>
                            <option value="Food">Food</option>
                            <option value="Embroidery">Embroidery</option>
                            <option value="Handicrafts">Handicrafts</option>
                            <option value="Sindhi Hurmucha">Sindhi Hurmucha</option>
                            <option value="Other">Other (Specify below)</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Product Image (Cloudinary)</label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleProductImageUpload} 
                              style={{ padding: '0.3rem', fontSize: '0.8rem', flex: 1 }}
                              disabled={isUploadingProductImage}
                            />
                            {manualImage && (
                              <img src={manualImage} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '0.25rem', objectFit: 'cover' }} />
                            )}
                          </div>
                          {isUploadingProductImage && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Uploading image...</span>}
                        </div>
                      </div>

                      {manualCategory === 'Other' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Specify Custom Category</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Handmade Pottery" 
                            value={customCategoryText} 
                            onChange={(e) => setCustomCategoryText(e.target.value)} 
                            style={{ padding: '0.6rem', borderRadius: '0.5rem', outline: 'none', border: '1px solid var(--primary)' }}
                            required 
                          />
                        </div>
                      )}

                      {/* FAQs section */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px dashed var(--border)', padding: '0.75rem', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Product FAQs (Optional)</label>
                          <button 
                            type="button" 
                            onClick={handleAddFaqField} 
                            className="btn btn-outline" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                          >
                            <Plus size={12} />
                            <span>Add FAQ</span>
                          </button>
                        </div>
                        
                        {manualFaqs.map((faq, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderBottom: idx < manualFaqs.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>FAQ #{idx + 1}</span>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveFaqField(idx)} 
                                style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <input 
                              type="text" 
                              placeholder="Question (e.g. Can this be washed?)" 
                              value={faq.question} 
                              onChange={(e) => handleFaqChange(idx, 'question', e.target.value)} 
                              style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border)', fontSize: '0.8rem', outline: 'none' }}
                              required
                            />
                            <textarea 
                              placeholder="Answer (e.g. Yes, wash gently with cold water.)" 
                              value={faq.answer} 
                              onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)} 
                              style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border)', fontSize: '0.8rem', outline: 'none', height: '50px', fontFamily: 'inherit', resize: 'none' }}
                              required
                            />
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <input 
                          type="checkbox" 
                          id="isCustom" 
                          checked={manualIsCustom} 
                          onChange={(e) => setManualIsCustom(e.target.checked)} 
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="isCustom" style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                          This is a custom-made order (آرڈر پر تیار شدہ کام)
                        </label>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {editProductId && (
                          <button type="button" onClick={handleCancelEdit} className="btn btn-outline" style={{ flex: 1, padding: '0.8rem' }}>
                            {language === 'en' ? 'Cancel' : 'منسوخ کریں'}
                          </button>
                        )}
                        <button type="submit" disabled={isAdding} className="btn btn-primary" style={{ flex: 2, padding: '0.8rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                          {isAdding ? <Loader size={18} className="spin" /> : editProductId ? <Save size={18} /> : <PlusCircle size={18} />}
                          <span>
                            {editProductId 
                              ? (language === 'en' ? 'Save Changes' : 'تبدیلیاں محفوظ کریں')
                              : (language === 'en' ? 'Publish Listing' : 'شائع کریں')}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Grid Catalog Display */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-profile-grid">
                  {products.map((product) => (
                    <div key={product._id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                      
                      {/* Edit Button */}
                      <button 
                        onClick={() => handleStartEditProduct(product)}
                        style={{
                          position: 'absolute',
                          top: '0.75rem',
                          right: dir === 'ltr' ? '3rem' : 'auto',
                          left: dir === 'rtl' ? '3rem' : 'auto',
                          background: 'rgba(15, 110, 71, 0.1)',
                          color: 'var(--primary)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '2rem',
                          height: '2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title={language === 'en' ? 'Edit Product' : 'ترمیم کریں'}
                      >
                        <Edit3 size={14} />
                      </button>

                      {/* Delete Button */}
                      <button 
                        onClick={() => handleDeleteProduct(product._id)}
                        style={{
                          position: 'absolute',
                          top: '0.75rem',
                          right: dir === 'ltr' ? '0.75rem' : 'auto',
                          left: dir === 'rtl' ? '0.75rem' : 'auto',
                          background: 'rgba(220, 38, 38, 0.1)',
                          color: 'var(--accent)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '2rem',
                          height: '2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>

                      <h4 style={{ fontWeight: 800, fontSize: '0.95rem', paddingRight: dir === 'ltr' ? '1.5rem' : '0', paddingLeft: dir === 'rtl' ? '1.5rem' : '0' }}>
                        {language === 'en' ? product.title.en : language === 'ur' ? product.title.ur : product.title.sd}
                      </h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: 'auto', borderTop: '1px dotted var(--border)', paddingTop: '0.5rem' }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary)' }}>Rs. {product.price}</span>
                        <span style={{ opacity: 0.7 }}>{product.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Listing Assistant (Text replacement of voice-to-store) */}
              <div>
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border)' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={20} style={{ color: 'var(--secondary)' }} />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                      {language === 'en' ? 'AI Listing Assistant' : 'اے آئی لسٹنگ اسسٹنٹ'}
                    </h3>
                  </div>

                  <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                    {language === 'en'
                      ? 'Type details like "red rilli suit 4000 rupees 3 days" and let AI automatically generate the listing.'
                      : 'پروڈکٹ کی تفصیل لکھیں جیسے "سرخ رلی سوٹ 4000 روپے 3 دن" اور اے آئی خود لسٹنگ بنائے گا۔'}
                  </p>

                  <form onSubmit={handleDraftFromText} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <textarea
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      placeholder={language === 'en' ? 'e.g. blue ajrak shawl Rs 2500 ready in 4 days...' : 'تفصیل درج کریں...'}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        minHeight: '60px',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                      required
                    />
                    <button type="submit" disabled={isParsing} className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.85rem', borderRadius: '0.4rem' }}>
                      {isParsing ? 'AI is drafting...' : 'Draft with AI'}
                    </button>
                  </form>



                </div>
              </div>

            </div>
          )}

          {/* TAB 3: CHATS THREADS */}
          {activeTab === 'chats' && (
            <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                {language === 'en' ? 'Active Buyer Conversations' : 'گاہکوں کے ساتھ بات چیت'}
              </h3>
              {chats.map((chat) => (
                <div key={chat.roomId} className="glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{chat.buyerId.name}</h4>
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

          {/* TAB 4: ASK AI PERFORMANCE STATS ASSISTANT (Text Chat Overlay) */}
          {activeTab === 'ask_ai' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }} className="glass-card">
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
                
                <div style={{ textAlign: 'center' }}>
                  <Sparkles size={36} style={{ color: 'var(--secondary)', margin: '0 auto' }} />
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.5rem' }}>
                    {language === 'en' ? 'Artisan Statistics Assistant' : 'دکان کے اعداد و شمار کا مددگار'}
                  </h3>
                  <p style={{ opacity: 0.7, fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    {language === 'en' 
                      ? 'Type questions regarding your orders, payouts, or request advice.' 
                      : 'اپنی سیلز، بیلنس یا مشورے کے بارے میں سوال لکھیں۔'}
                  </p>
                </div>

                {/* Chat Log Window */}
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
                    {isStatsLoading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.6 }}>
                        <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                        <span style={{ fontSize: '0.8rem' }}>Assistant is typing...</span>
                      </div>
                    )}
                  </div>
                  
                  <form onSubmit={handleSendStatsQuery} style={{ display: 'flex', padding: '0.75rem', borderTop: '1px solid var(--border)', background: 'var(--card)', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={statsInput}
                      onChange={(e) => setStatsInput(e.target.value)}
                      placeholder={language === 'en' ? 'Ask about sales, balance, or descriptions...' : 'سیلز، رقم یا ڈسکرپشن کے بارے میں پوچھیں...'}
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
                    <button type="submit" disabled={isStatsLoading || !statsInput.trim()} className="btn btn-primary" style={{ width: '2.2rem', height: '2.2rem', padding: 0, borderRadius: '50%', flexShrink: 0 }}>
                      <Send size={14} />
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {/* TAB 6: INVESTMENTS / FUNDING REQUESTS */}
          {activeTab === 'investments' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }} className="responsive-profile-grid fade-in">
              {/* Left Side: Submit request form */}
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PlusCircle size={20} />
                  <span>{language === 'en' ? 'Submit Funding Request' : 'فنڈنگ کی درخواست جمع کروائیں'}</span>
                </h3>

                <form onSubmit={handleRequestFunding} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Notice about profile auto-fill */}
                  <div style={{ background: 'rgba(10, 77, 52, 0.05)', color: 'var(--primary)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                    {language === 'en' 
                      ? 'ℹ Profile details (Name, CNIC, Phone) are auto-filled from your profile setup.' 
                      : 'ℹ پروفائل کی تفصیلات (نام، شناختی کارڈ، فون) خود بخود اپ لوڈ ہو جائیں گی۔'}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-profile-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Name</label>
                      <input type="text" value={profileName || currentUser?.name || ''} disabled style={{ padding: '0.6rem', borderRadius: '0.5rem', opacity: 0.7 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>CNIC Number</label>
                      <input type="text" value={profileCnic || currentUser?.cnic || ''} disabled style={{ padding: '0.6rem', borderRadius: '0.5rem', opacity: 0.7 }} placeholder="Complete in Profile" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Contact Phone</label>
                    <input type="text" value={currentUser?.phone || ''} disabled style={{ padding: '0.6rem', borderRadius: '0.5rem', opacity: 0.7 }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Business Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Zainab Sindhi Embroidery"
                      value={fundingBusinessName}
                      onChange={(e) => setFundingBusinessName(e.target.value)}
                      style={{ padding: '0.6rem', borderRadius: '0.5rem' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Business Details & Niche</label>
                    <textarea 
                      placeholder="Describe your business, products, number of working artisans, and current scale..."
                      value={fundingBusinessDetails}
                      onChange={(e) => setFundingBusinessDetails(e.target.value)}
                      style={{ padding: '0.6rem', borderRadius: '0.5rem', height: '80px', fontFamily: 'inherit' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Amount Requested (PKR)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 50000"
                      value={fundingAmount}
                      onChange={(e) => setFundingAmount(e.target.value)}
                      style={{ padding: '0.6rem', borderRadius: '0.5rem' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Purpose of Funds & Growth Plan</label>
                    <textarea 
                      placeholder="How will these funds help your business grow? (e.g. purchasing cotton cloth, hiring 2 more embroidery artisans, marketing)..."
                      value={fundingPurpose}
                      onChange={(e) => setFundingPurpose(e.target.value)}
                      style={{ padding: '0.6rem', borderRadius: '0.5rem', height: '80px', fontFamily: 'inherit' }}
                      required
                    />
                  </div>

                  {(!profileCnic && !currentUser?.cnic) && (
                    <div style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600 }}>
                      ⚠️ Please complete your CNIC number in the "Profile" tab first to submit a request.
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={isSubmittingFunding || (!profileCnic && !currentUser?.cnic)}
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', marginTop: '0.5rem' }}
                  >
                    {isSubmittingFunding ? 'Submitting...' : 'Submit Application'}
                  </button>
                </form>
              </div>

              {/* Right Side: Requests History */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{language === 'en' ? 'Funding Request History' : 'درخواستوں کی تاریخ'}</h3>
                
                {isFetchingFunding ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner"></div></div>
                ) : fundingRequests.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '0.75rem', border: '1px dashed var(--border)' }}>
                    No investment requests submitted yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {fundingRequests.map((req) => (
                      <div key={req._id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>Rs. {req.amountRequested.toLocaleString()}</strong>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '9999px', 
                            fontWeight: 700,
                            background: req.status === 'Pending' ? 'rgba(217, 119, 6, 0.1)' : req.status === 'Approved' ? 'rgba(10, 77, 52, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                            color: req.status === 'Pending' ? 'var(--secondary)' : req.status === 'Approved' ? 'var(--primary)' : 'var(--accent)'
                          }}>
                            {req.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                          <strong>Business:</strong> {req.businessName}
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.6, borderTop: '1px solid var(--border)', paddingTop: '0.25rem', marginTop: '0.25rem' }}>
                          Submitted: {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                        {req.resolvedAt && (
                          <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                            Resolved: {new Date(req.resolvedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PROFILE MANAGEMENT */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }} className="glass-card fade-in">
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
                  {language === 'en' ? 'Edit Artisan Profile Details' : 'پروفائل تبدیل کریں'}
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
                        profileName.charAt(0) || 'A'
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
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>{language === 'en' ? 'CNIC Number (Verification)' : 'شناختی کارڈ نمبر'}</label>
                    <input 
                      type="text" 
                      value={profileCnic} 
                      onChange={(e) => setProfileCnic(e.target.value)} 
                      placeholder="e.g. 41303-1234567-8"
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
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>{language === 'en' ? 'Artisan Workshop / Shipping Address' : 'دکان یا کارخانے کا پتہ'}</label>
                    <textarea 
                      value={profileAddress} 
                      onChange={(e) => setProfileAddress(e.target.value)} 
                      placeholder="Enter workshop no, street, sector..."
                      style={{ padding: '0.6rem', borderRadius: '0.5rem', outline: 'none', height: '80px', fontFamily: 'inherit', resize: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>{language === 'en' ? 'Profile Bio' : 'پروفائل بائیو'}</label>
                    <textarea 
                      value={profileBio} 
                      onChange={(e) => setProfileBio(e.target.value)} 
                      placeholder={language === 'en' ? 'Tell buyers about yourself, your craftsmanship, and history...' : 'اپنے بارے میں، اپنے ہنر اور تجربے کے بارے میں لکھیں...'}
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

      <style jsx>{`
        @media (max-width: 768px) {
          .responsive-profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
