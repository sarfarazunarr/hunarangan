'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import { MessageSquare, X, Send, HelpCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  action?: 'search' | 'info';
  targetRoute?: string;
  categoryName?: string;
}

export default function PlatformHelpChatbot() {
  const { language, t, dir } = useLanguage();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Default welcome message when language changes or chatbot mounts
  useEffect(() => {
    const welcomeMessages = {
      en: "Hello! I am your HunarAangan assistant. Ask me about payment methods, delivery times, or type a product category (e.g., 'Ajrak', 'Rilli', 'Food').",
      ur: "السلام علیکم! میں آپ کا ہنر آنگن اسسٹنٹ ہوں۔ مجھ سے ادائیگی کے طریقوں، ڈیلیوری، یا کسی پروڈکٹ کی کیٹیگری (جیسے 'اجرک'، 'رلی'، 'کھانا') کے بارے میں پوچھیں۔",
      sd: "اسلام عليڪم! مان توهان جو هنر آنگن اسسٽنٽ آهيان. مون کان ادائيگي جي طريقن، ڊليوري، يا ڪنهن شيءِ جي زمري (جهڙوڪ 'اجرڪ'، 'رلي'، 'کاڌو') باريان پڇو."
    };
    
    setMessages([
      { sender: 'bot', text: welcomeMessages[language] }
    ]);
  }, [language]);

  // Scroll to bottom on message update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const samplePrompts = {
    en: [
      { label: "Ajrak block prints", text: "Find Ajrak block print suits" },
      { label: "Delivery time", text: "How long does delivery take?" },
      { label: "Payment options", text: "How can I pay without a credit card?" }
    ],
    ur: [
      { label: "رلی کے ڈیزائن", text: "روایتی رلی سوٹ دکھائیں" },
      { label: "ڈیلیوری کا وقت", text: "ڈیلیوری میں کتنے دن لگیں گے؟" },
      { label: "ادائیگی کا طریقہ", text: "پیمنٹ کیسے کریں؟" }
    ],
    sd: [
      { label: "اجرڪ شال", text: "مونکي اجرڪ شال ڏيکاريو" },
      { label: "ڊليوري وقت", text: "ڊليوري ڪيتري وقت ۾ ٿيندي؟" },
      { label: "ادائيگي جو طريقو", text: "ادائيگي ڪيئن ڪجي؟" }
    ]
  };

  const executeChatQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    // Append user message
    const userMsg: ChatMessage = { sender: 'user', text: queryText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, lang: language }),
      });
      const data = await res.json();

      if (res.ok) {
        // Find category name for display
        let categoryName = '';
        if (data.action === 'search' && data.targetRoute) {
          const catKey = data.targetRoute.split('/').pop() || '';
          categoryName = catKey.charAt(0).toUpperCase() + catKey.slice(1);
        }

        const botMsg: ChatMessage = {
          sender: 'bot',
          text: data.responseText[language] || data.responseText['en'],
          action: data.action,
          targetRoute: data.targetRoute,
          categoryName
        };

        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error('Failed to get answer');
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: language === 'en' 
          ? "I am having trouble connecting right now. Please try again." 
          : "رابطے میں کچھ مسئلہ آ رہا ہے۔ دوبارہ کوشش کریں۔"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    executeChatQuery(inputText);
  };

  const isRtl = dir === 'rtl';

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          [isRtl ? 'left' : 'right']: '2rem',
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-lg)',
          cursor: 'pointer',
          border: 'none',
          zIndex: 100,
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        aria-label="Toggle Help Chatbot"
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </button>

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div 
          className="glass-card fade-in"
          style={{
            position: 'fixed',
            bottom: '6.5rem',
            [isRtl ? 'left' : 'right']: '2rem',
            width: '360px',
            height: '480px',
            maxHeight: 'calc(100vh - 10rem)',
            maxWidth: 'calc(100vw - 4rem)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 99,
            overflow: 'hidden',
            direction: dir,
            border: '1px solid var(--border)'
          }}
        >
          {/* Chatbot Header */}
          <div style={{
            background: 'var(--primary)',
            color: '#ffffff',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HelpCircle size={18} />
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>
                  {language === 'en' ? 'HunarAangan Helper' : language === 'ur' ? 'ہنر آنگن مددگار' : 'هنر آنگن مددگار'}
                </h4>
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Online Assistant</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Window */}
          <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            background: 'var(--card)'
          }}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' 
                }}
              >
                {/* Text Bubble */}
                <div style={{
                  background: msg.sender === 'user' ? 'var(--primary)' : 'var(--input-bg)',
                  color: msg.sender === 'user' ? '#ffffff' : 'var(--text)',
                  padding: '0.6rem 0.9rem',
                  borderRadius: '0.75rem',
                  borderBottomRightRadius: msg.sender === 'user' ? 0 : '0.75rem',
                  borderBottomLeftRadius: msg.sender === 'bot' ? 0 : '0.75rem',
                  fontSize: '0.9rem',
                  maxWidth: '85%',
                  boxShadow: 'var(--shadow-sm)',
                  lineHeight: 1.5
                }}>
                  <p>{msg.text}</p>
                </div>

                {/* Search Category Link Button */}
                {msg.action === 'search' && msg.targetRoute && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      router.push(msg.targetRoute!);
                    }}
                    style={{
                      marginTop: '0.4rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      background: 'rgba(194, 125, 56, 0.1)',
                      color: 'var(--secondary)',
                      border: '1.5px solid var(--secondary)',
                      padding: '0.4rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      transition: 'var(--transition)'
                    }}
                  >
                    <span>{language === 'en' ? `Browse ${msg.categoryName}` : language === 'ur' ? `${t(msg.categoryName! || '')} دیکھيں` : `${t(msg.categoryName! || '')} ڏسو`}</span>
                    {isRtl ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
                  </button>
                )}
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.6 }}>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                <span style={{ fontSize: '0.8rem' }}>AI is thinking...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQ Suggestion Chips */}
          <div style={{
            padding: '0.5rem 1rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--card)',
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            flexShrink: 0
          }}>
            {samplePrompts[language].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => executeChatQuery(chip.text)}
                style={{
                  flexShrink: 0,
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '9999px',
                  padding: '0.3rem 0.7rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Form Footer */}
          <form 
            onSubmit={handleFormSubmit}
            style={{
              display: 'flex',
              padding: '0.75rem 1rem',
              borderTop: '1px solid var(--border)',
              background: 'var(--card)',
              gap: '0.5rem',
              flexShrink: 0
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={language === 'en' ? 'Type a question...' : 'سوال لکھیں...'}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                border: '1px solid var(--border)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="btn btn-primary"
              style={{
                width: '2.2rem',
                height: '2.2rem',
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
        </div>
      )}
    </>
  );
}
