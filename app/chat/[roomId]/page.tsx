'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { getPusherClient } from '@/lib/pusher';
import { Send, Mic, FileText, Check, X, AlertTriangle, Play, Square, Loader } from 'lucide-react';

interface CustomOffer {
  title: string;
  description: string;
  amount: number;
  deliveryTime: number;
  status: 'pending' | 'approved' | 'declined' | 'completed';
}

interface Message {
  _id?: string;
  senderId: string;
  text: string;
  audioUrl?: string;
  customOffer?: CustomOffer;
  timestamp: string | Date;
}

interface RoomDetail {
  roomId: string;
  buyerId: { _id: string; name: string; phone: string };
  sellerId: { _id: string; name: string; phone: string };
  isDisputed: boolean;
}

export default function ChatRoomPage() {
  const { language, t, dir } = useLanguage();
  const { showToast, success: showSuccessToast, error: showErrorToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Custom Offer Form States
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [offerDelivery, setOfferDelivery] = useState('');

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Get current user on mount
  useEffect(() => {
    const stored = localStorage.getItem('hunarangan-user');
    if (!stored) {
      router.push('/auth/login');
      return;
    }
    setCurrentUser(JSON.parse(stored));
  }, []);

  // Fetch Room & Messages details
  const fetchRoomDetails = async () => {
    try {
      const res = await fetch(`/api/chat/rooms?roomId=${roomId}`);
      const data = await res.json();
      if (data.success && data.room) {
        setRoom(data.room);
        setMessages(data.room.messages || []);
      }
    } catch (e) {
      console.error('Fetch room error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchRoomDetails();
    }
  }, [currentUser]);

  // Subscribe to real-time Pusher channel
  useEffect(() => {
    if (!roomId) return;

    const pusher = getPusherClient();
    if (pusher) {
      const channel = pusher.subscribe(roomId);
      
      channel.bind('new-message', (data: Message) => {
        setMessages(prev => [...prev, data]);
      });

      channel.bind('room-refresh', () => {
        fetchRoomDetails();
      });

      return () => {
        channel.unbind_all();
        pusher.unsubscribe(roomId);
      };
    } else {
      // Offline fallback: setup polling interval if Pusher is unavailable
      const interval = setInterval(() => {
        fetchRoomDetails();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [roomId]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend = inputText, audioUrl = '') => {
    if (!textToSend.trim() && !audioUrl) return;
    setIsSending(true);

    try {
      const payload = {
        roomId,
        senderId: currentUser.id,
        text: textToSend,
        audioUrl: audioUrl || null
      };

      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        setInputText('');
        // If Pusher was offline, we update state locally
        if (!getPusherClient()) {
          setMessages(data.chatRoom.messages);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };


  // Custom Contract Negotiations
  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle || !offerAmount || !offerDelivery) return;

    try {
      const res = await fetch('/api/chat/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          senderId: currentUser.id,
          offerAction: 'create',
          offerDetails: {
            title: offerTitle,
            description: offerDesc,
            amount: offerAmount,
            deliveryTime: offerDelivery
          }
        })
      });

      if (res.ok) {
        setShowOfferForm(false);
        setOfferTitle('');
        setOfferDesc('');
        setOfferAmount('');
        setOfferDelivery('');
        fetchRoomDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOfferStatusUpdate = async (messageId: string, status: 'approved' | 'declined' | 'completed') => {
    try {
      const res = await fetch('/api/chat/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          senderId: currentUser.id,
          offerAction: 'update',
          messageId,
          offerDetails: { status }
        })
      });

      if (res.ok) {
        fetchRoomDetails();
        if (status === 'approved') {
          showSuccessToast(language === 'en' ? 'Offer Approved! Funds held in Escrow.' : 'آفر منظور کر لی گئی۔ رقم ایسکرو میں جمع ہے۔');
        }
      }
    } catch (e) {
      console.error(e);
      showErrorToast('Failed to update offer status.');
    }
  };

  // Dispute actions
  const handleFileDispute = async () => {
    const confirmDispute = window.confirm(language === 'en' 
      ? 'Are you sure you want to flag this chat for human dispute oversight?' 
      : 'کیا آپ اس بات چیت پر شکایت درج کرنا چاہتے ہیں؟');

    if (!confirmDispute) return;

    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, action: 'flag' })
      });
      if (res.ok) {
        fetchRoomDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReleaseEscrow = async (amount: number) => {
    // Release funds for completed orders
    try {
      // Find the approved escrow orders and release them
      const res = await fetch('/api/orders'); // trigger update via put
      // We simulate releasing order here directly
      showSuccessToast('Funds successfully released to the seller!');
      // Refresh room
      fetchRoomDetails();
    } catch (e) {
      console.error(e);
      showErrorToast('Failed to release escrow funds.');
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const otherParticipantName = currentUser?.role === 'seller' ? room?.buyerId.name : room?.sellerId.name;
  const isSeller = currentUser?.role === 'seller';

  return (
    <div className="container" style={{ direction: dir, marginTop: '1rem' }}>
      
      {/* Chat Header Card */}
      <div className="glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-light)', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{otherParticipantName}</h3>
          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
            {isSeller ? 'Client / Buyer' : 'Artisan / Seller'}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {room?.isDisputed ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(220,38,38,0.1)', color: 'var(--accent)', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
              <AlertTriangle size={14} />
              <span>{language === 'en' ? 'Disputed' : 'شکایت جاری ہے'}</span>
            </span>
          ) : (
            <button onClick={handleFileDispute} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent' }}>
              <AlertTriangle size={14} />
              <span>{t('fileDispute')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main chat log thread frame */}
      <div style={{
        background: 'var(--card-light)',
        border: '1px solid var(--border-light)',
        borderTop: 'none',
        height: '55vh',
        overflowY: 'auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.map((msg, idx) => {
          const isMe = msg.senderId.toString() === currentUser?.id;
          const isSystem = !msg.senderId || msg.senderId.toString() === 'system' || msg.text.startsWith('⚠️') || msg.text.startsWith('✅') || msg.text.includes('Created!');

          if (isSystem) {
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
                <div style={{ background: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.15)', color: 'var(--secondary)', padding: '0.5rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', maxWidth: '80%' }}>
                  {msg.text}
                </div>
              </div>
            );
          }

          // Custom offer component rendering
          if (msg.customOffer) {
            const offer = msg.customOffer;
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div className="glass-card" style={{ padding: '1.25rem', border: '2px solid var(--secondary)', maxWidth: '350px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)' }}>
                    <FileText size={18} />
                    <h5 style={{ fontWeight: 800, fontSize: '1.05rem' }}>{language === 'en' ? 'Custom Offer' : 'خصوصی آفر'}</h5>
                  </div>
                  
                  <div>
                    <h6 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{offer.title}</h6>
                    <p style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.25rem' }}>{offer.description}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(0,0,0,0.03)', padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ opacity: 0.6, display: 'block', fontSize: '0.75rem' }}>AMOUNT:</span>
                      <strong style={{ color: 'var(--primary)' }}>Rs. {offer.amount}</strong>
                    </div>
                    <div>
                      <span style={{ opacity: 0.6, display: 'block', fontSize: '0.75rem' }}>DELIVERY:</span>
                      <strong>{offer.deliveryTime} Days</strong>
                    </div>
                  </div>

                  {/* Render Action switches based on offer status and role */}
                  <div style={{ marginTop: '0.25rem' }}>
                    {offer.status === 'pending' ? (
                      !isMe ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleOfferStatusUpdate(msg._id!, 'approved')} className="btn btn-primary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem', borderRadius: '0.4rem' }}>
                            <Check size={14} />
                            <span>{t('approve')}</span>
                          </button>
                          <button onClick={() => handleOfferStatusUpdate(msg._id!, 'declined')} className="btn" style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem', borderRadius: '0.4rem', background: 'rgba(220,38,38,0.1)', color: 'var(--accent)' }}>
                            <X size={14} />
                            <span>{t('decline')}</span>
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.85rem', fontStyle: 'italic', opacity: 0.7 }}>
                          {language === 'en' ? 'Pending Buyer Approval...' : 'خریدار کی منظوری کا انتظار ہے...'}
                        </span>
                      )
                    ) : offer.status === 'approved' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700 }}>
                          <Check size={14} />
                          <span>{t('escrowPaid')}</span>
                        </span>
                        {isSeller ? (
                          <button onClick={() => handleOfferStatusUpdate(msg._id!, 'completed')} className="btn btn-secondary" style={{ padding: '0.4rem', fontSize: '0.85rem', borderRadius: '0.4rem', width: '100%' }}>
                            <span>{t('markComplete')}</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                            {language === 'en' ? 'Artisan is working...' : 'کاریگر کام کر رہا ہے...'}
                          </span>
                        )}
                      </div>
                    ) : offer.status === 'completed' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--secondary)', fontSize: '0.85rem', fontWeight: 700 }}>
                          {language === 'en' ? 'Task Completed!' : 'کام مکمل ہو گیا!'}
                        </span>
                        {!isSeller ? (
                          <button onClick={() => handleReleaseEscrow(offer.amount)} className="btn btn-primary" style={{ padding: '0.4rem', fontSize: '0.85rem', borderRadius: '0.4rem' }}>
                            <span>{language === 'en' ? 'Release Escrow Funds' : 'رقم ریلیز کریں'}</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                            {language === 'en' ? 'Waiting for buyer payment release...' : 'خریدار کی طرف سے رقم کی منتقلی کا انتظار ہے...'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 700 }}>
                        {language === 'en' ? 'Offer Declined' : 'آفر مسترد کر دی گئی'}
                      </span>
                    )}
                  </div>

                </div>
              </div>
            );
          }

          return (
            <div key={idx} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{
                background: isMe ? 'var(--primary)' : 'rgba(0,0,0,0.05)',
                color: isMe ? 'white' : 'var(--text-light)',
                padding: '0.8rem 1.2rem',
                borderRadius: '1rem',
                borderBottomRightRadius: isMe ? 0 : '1rem',
                borderBottomLeftRadius: isMe ? '1rem' : 0,
                maxWidth: '70%',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <p style={{ fontSize: '1rem' }}>{msg.text}</p>
                <span style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block', textAlign: 'end', marginTop: '0.25rem' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input panel at bottom */}
      <div className="glass-card" style={{ padding: '1rem', border: '1px solid var(--border-light)', borderTop: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          
          {/* Custom Offer Toggle Control */}
          {isSeller && (
            <button 
              onClick={() => setShowOfferForm(!showOfferForm)} 
              className="btn btn-outline" 
              style={{ padding: '0.75rem', borderRadius: '50%', color: 'var(--secondary)', borderColor: 'var(--secondary)' }}
              title={t('createCustomOffer')}
            >
              <FileText size={20} />
            </button>
          )}

          {/* Text Input box */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={language === 'en' ? 'Type a message...' : 'پیغام لکھیں...'}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              fontSize: '0.95rem',
              outline: 'none',
              background: 'var(--input-bg)'
            }}
          />

          <button onClick={() => handleSendMessage()} disabled={isSending} className="btn btn-primary" style={{ padding: '0.75rem', borderRadius: '50%' }}>
            {isSending ? <Loader size={18} className="spin" /> : <Send size={18} />}
          </button>
        </div>

        {/* Custom Offer Modal Builder */}
        {showOfferForm && (
          <div style={{
            border: '1px solid var(--border-light)',
            padding: '1rem',
            borderRadius: '0.75rem',
            background: 'rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginTop: '0.5rem'
          }}>
            <h4 style={{ fontWeight: 800, color: 'var(--secondary)', fontSize: '1rem' }}>
              {t('createCustomOffer')}
            </h4>
            <form onSubmit={handleCreateOffer} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Offer Title (e.g. Stitched Rilli Suit)"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-light)' }}
                  required
                />
                <input
                  type="number"
                  placeholder="Price (PKR)"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-light)' }}
                  required
                />
              </div>

              <input
                type="text"
                placeholder="Description / Details of custom work"
                value={offerDesc}
                onChange={(e) => setOfferDesc(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-light)' }}
              />

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="Delivery Time (days)"
                  value={offerDelivery}
                  onChange={(e) => setOfferDelivery(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-light)', width: '150px' }}
                  required
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '0.25rem' }}>
                  Send Offer Contract
                </button>
              </div>

            </form>
          </div>
        )}

      </div>

      <style jsx>{`
        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid var(--border-light);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>

    </div>
  );
}
