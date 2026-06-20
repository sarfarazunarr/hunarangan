'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { AlertOctagon, Scale, ShieldAlert, Check, X, ArrowLeft, RefreshCw, ChevronRight, Coins } from 'lucide-react';

interface DisputeRoom {
  roomId: string;
  isDisputed: boolean;
  buyerId: { _id: string; name: string; phone: string };
  sellerId: { _id: string; name: string; phone: string };
  messages: { senderId: string; text: string; timestamp: string }[];
}

export default function AdminDisputePanel() {
  const { language } = useLanguage();
  const { showToast, success: showSuccessToast, error: showErrorToast } = useToast();
  const router = useRouter();

  const [disputes, setDisputes] = useState<DisputeRoom[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<DisputeRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);

  // Tab states
  const [activeTab, setActiveTab] = useState<'disputes' | 'payouts' | 'investments'>('disputes');
  const [payouts, setPayouts] = useState<any[]>([]);
  const [isPayoutLoading, setIsPayoutLoading] = useState(false);
  const [isResolvingPayout, setIsResolvingPayout] = useState(false);

  // Investment states
  const [investments, setInvestments] = useState<any[]>([]);
  const [isInvestmentsLoading, setIsInvestmentsLoading] = useState(false);
  const [isResolvingInvestment, setIsResolvingInvestment] = useState(false);

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/disputes');
      const data = await res.json();
      if (data.success) {
        setDisputes(data.disputes);
        if (data.disputes.length > 0) {
          setSelectedDispute(data.disputes[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayouts = async () => {
    setIsPayoutLoading(true);
    try {
      const res = await fetch('/api/payouts?admin=true');
      const data = await res.json();
      if (data.success) {
        setPayouts(data.requests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPayoutLoading(false);
    }
  };

  const fetchInvestments = async () => {
    setIsInvestmentsLoading(true);
    try {
      const res = await fetch('/api/investments?admin=true');
      const data = await res.json();
      if (data.success) {
        setInvestments(data.requests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsInvestmentsLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('hunarangan-user');
    if (!stored) {
      router.push('/auth/admin');
      return;
    }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin') {
      router.push('/auth/admin');
      return;
    }
    fetchDisputes();
    fetchPayouts();
    fetchInvestments();
  }, []);

  const handleResolvePayout = async (requestId: string, status: 'Approved' | 'Rejected') => {
    setIsResolvingPayout(true);
    try {
      const res = await fetch('/api/payouts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status })
      });
      if (res.ok) {
        showSuccessToast(`Payout request ${status.toLowerCase()} successfully!`);
        fetchPayouts();
      } else {
        const err = await res.json();
        showErrorToast('Failed to resolve: ' + err.error);
      }
    } catch (e) {
      console.error(e);
      showErrorToast('Connection error.');
    } finally {
      setIsResolvingPayout(false);
    }
  };

  const handleResolveInvestment = async (requestId: string, status: 'Approved' | 'Rejected') => {
    setIsResolvingInvestment(true);
    try {
      const res = await fetch('/api/investments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status })
      });
      if (res.ok) {
        showSuccessToast(`Funding request ${status.toLowerCase()} successfully!`);
        fetchInvestments();
      } else {
        const err = await res.json();
        showErrorToast('Failed to resolve: ' + err.error);
      }
    } catch (e) {
      console.error(e);
      showErrorToast('Connection error.');
    } finally {
      setIsResolvingInvestment(false);
    }
  };

  const handleResolve = async (resolution: 'refund_buyer' | 'pay_seller') => {
    if (!selectedDispute) return;
    setIsResolving(true);
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedDispute.roomId,
          action: 'resolve',
          resolution
        })
      });

      if (res.ok) {
        showSuccessToast(`Dispute resolved successfully: ${resolution === 'pay_seller' ? 'Paid Seller' : 'Refunded Buyer'}`);
        setSelectedDispute(null);
        fetchDisputes();
      }
    } catch (e) {
      console.error(e);
      showErrorToast('Failed to resolve dispute.');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: '1.5rem' }}>
      
      {/* Back to Home */}
      <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} />
        <span>Return to Marketplace</span>
      </button>

      {/* Header title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertOctagon size={28} style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            HunarAangan Admin Management Console
          </h2>
        </div>
        <button onClick={activeTab === 'disputes' ? fetchDisputes : activeTab === 'payouts' ? fetchPayouts : fetchInvestments} className="btn btn-outline" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.25rem', fontSize: '0.9rem' }}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs navigation */}
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.03)', padding: '0.4rem', borderRadius: '1rem', gap: '0.5rem', marginBottom: '2rem', maxWidth: '500px' }}>
        <button 
          onClick={() => setActiveTab('disputes')} 
          style={{
            flex: 1, padding: '0.6rem 1rem', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 700,
            background: activeTab === 'disputes' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'disputes' ? 'white' : 'inherit',
            fontSize: '0.9rem'
          }}
        >
          Disputes
        </button>
        <button 
          onClick={() => setActiveTab('payouts')} 
          style={{
            flex: 1, padding: '0.6rem 1rem', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 700,
            background: activeTab === 'payouts' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'payouts' ? 'white' : 'inherit',
            fontSize: '0.9rem'
          }}
        >
          Payouts
        </button>
        <button 
          onClick={() => setActiveTab('investments')} 
          style={{
            flex: 1, padding: '0.6rem 1rem', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 700,
            background: activeTab === 'investments' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'investments' ? 'white' : 'inherit',
            fontSize: '0.9rem'
          }}
        >
          Investments
        </button>
      </div>

      {activeTab === 'disputes' && (
        isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner"></div>
          </div>
        ) : disputes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(0,0,0,0.02)', borderRadius: '1rem' }}>
            <ShieldAlert size={48} style={{ color: 'var(--primary)', margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--primary)' }}>
              All Operations Clear
            </h3>
            <p style={{ opacity: 0.7, marginTop: '0.25rem' }}>
              There are currently no active transaction dispute cases registered.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem' }} className="admin-grid-layout">
            
            {/* Left panel list of disputed chat sessions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Disputed Conversations ({disputes.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {disputes.map((disp) => {
                  const isSelected = selectedDispute?.roomId === disp.roomId;
                  return (
                    <div
                      key={disp.roomId}
                      onClick={() => setSelectedDispute(disp)}
                      className="glass-card"
                      style={{
                        padding: '1rem',
                        cursor: 'pointer',
                        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-light)',
                        background: isSelected ? 'rgba(220, 38, 38, 0.03)' : 'white',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.95rem' }}>{disp.buyerId.name} ➔ {disp.sellerId.name}</strong>
                        <ChevronRight size={16} style={{ opacity: 0.5 }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block', marginTop: '0.25rem' }}>
                        Room ID: {disp.roomId}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right panel inspected chat timeline logs & resolution */}
            {selectedDispute && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Profile Context */}
                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-light)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Scale size={18} />
                    <span>Case Inspection Room</span>
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                    <div>
                      <span style={{ opacity: 0.6, fontSize: '0.8rem', display: 'block' }}>BUYER:</span>
                      <strong>{selectedDispute.buyerId.name}</strong> ({selectedDispute.buyerId.phone})
                    </div>
                    <div>
                      <span style={{ opacity: 0.6, fontSize: '0.8rem', display: 'block' }}>ARTISAN / SELLER:</span>
                      <strong>{selectedDispute.sellerId.name}</strong> ({selectedDispute.sellerId.phone})
                    </div>
                  </div>
                </div>

                {/* Chronological logs */}
                <div style={{
                  background: 'var(--card-light)',
                  border: '1px solid var(--border-light)',
                  padding: '1.5rem',
                  borderRadius: '1rem',
                  height: '40vh',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.6, borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                    CHAT HISTORY TRANSCRIPTION
                  </h4>
                  {selectedDispute.messages.map((msg, idx) => {
                    const isSeller = msg.senderId.toString() === selectedDispute.sellerId._id.toString();
                    const isSystem = msg.text.startsWith('⚠️') || msg.text.startsWith('✅') || msg.text.includes('System');

                    if (isSystem) {
                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'center' }}>
                          <span style={{ fontStyle: 'italic', color: 'var(--secondary)', fontSize: '0.8rem', textAlign: 'center', background: 'rgba(217, 119, 6, 0.05)', padding: '0.25rem 0.75rem', borderRadius: '0.25rem' }}>
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isSeller ? 'flex-end' : 'flex-start' }}>
                        <span style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 700 }}>
                          {isSeller ? 'SELLER' : 'BUYER'}
                        </span>
                        <div style={{
                          background: isSeller ? 'rgba(15, 110, 71, 0.08)' : 'rgba(0,0,0,0.04)',
                          padding: '0.5rem 0.8rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.9rem',
                          marginTop: '0.15rem',
                          maxWidth: '80%'
                        }}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Resolution Panel */}
                <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 style={{ fontWeight: 800 }}>Authorize Resolution Verdict</h4>
                  <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                    Verifying all text details. Authorizing the payout releases standard escrow amounts or resolves refunds.
                  </p>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    
                    <button
                      onClick={() => handleResolve('refund_buyer')}
                      disabled={isResolving}
                      className="btn"
                      style={{
                        flex: 1,
                        padding: '0.8rem',
                        background: 'rgba(220, 38, 38, 0.1)',
                        color: 'var(--accent)',
                        border: '1px solid var(--accent)',
                        display: 'flex',
                        gap: '0.5rem',
                        borderRadius: '0.5rem'
                      }}
                    >
                      <X size={18} />
                      <span>Refund Buyer</span>
                    </button>

                    <button
                      onClick={() => handleResolve('pay_seller')}
                      disabled={isResolving}
                      className="btn btn-primary"
                      style={{
                        flex: 1,
                        padding: '0.8rem',
                        display: 'flex',
                        gap: '0.5rem',
                        borderRadius: '0.5rem'
                      }}
                    >
                      <Check size={18} />
                      <span>Release to Seller</span>
                    </button>

                  </div>
                </div>

              </div>
            )}

          </div>
        )
      )}

      {activeTab === 'payouts' && (
        isPayoutLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Pending Requests list */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Pending Requests</h3>
              {payouts.filter(p => p.status === 'Pending').length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '0.75rem', border: '1px dashed var(--border)' }}>
                  No pending payouts found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {payouts.filter(p => p.status === 'Pending').map((req) => (
                    <div key={req._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '1.1rem' }}>Rs. {req.amount.toLocaleString()}</strong>
                          <span style={{ fontSize: '0.75rem', background: 'rgba(217, 119, 6, 0.1)', color: 'var(--secondary)', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 700 }}>
                            Pending Approval
                          </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', opacity: 0.8 }}>
                          Seller: <strong>{req.sellerId?.name || 'Unknown'}</strong> ({req.sellerId?.phone || 'No phone'}) - {req.sellerId?.location || 'No location'}
                        </p>
                        <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', padding: '0.5rem', background: 'var(--input-bg)', borderRadius: '0.25rem', fontFamily: 'monospace' }}>
                          Payment Details: {req.paymentDetails}
                        </p>
                        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>Requested: {new Date(req.createdAt).toLocaleString()}</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleResolvePayout(req._id, 'Rejected')}
                          disabled={isResolvingPayout}
                          className="btn"
                          style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--accent)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleResolvePayout(req._id, 'Approved')}
                          disabled={isResolvingPayout}
                          className="btn btn-primary"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          Approve & Send
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resolved payouts audit trail */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Payout Requests Archive</h3>
              {payouts.filter(p => p.status !== 'Pending').length === 0 ? (
                <div style={{ padding: '1.5rem', fontStyle: 'italic', opacity: 0.6 }}>No archived payout requests.</div>
              ) : (
                <div style={{ overflowX: 'auto', background: 'var(--card)', border: '1px solid var(--border-light)', borderRadius: '0.75rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-light)' }}>
                        <th style={{ padding: '0.75rem' }}>Artisan</th>
                        <th style={{ padding: '0.75rem' }}>Amount</th>
                        <th style={{ padding: '0.75rem' }}>Method Details</th>
                        <th style={{ padding: '0.75rem' }}>Requested Date</th>
                        <th style={{ padding: '0.75rem' }}>Status</th>
                        <th style={{ padding: '0.75rem' }}>Resolved Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.filter(p => p.status !== 'Pending').map((req) => (
                        <tr key={req._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '0.75rem' }}><strong>{req.sellerId?.name || 'Unknown'}</strong></td>
                          <td style={{ padding: '0.75rem' }}>Rs. {req.amount}</td>
                          <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{req.paymentDetails}</td>
                          <td style={{ padding: '0.75rem' }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{
                              padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                              background: req.status === 'Approved' ? 'rgba(15, 110, 71, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                              color: req.status === 'Approved' ? 'var(--primary)' : 'var(--accent)'
                            }}>
                              {req.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>{req.resolvedAt ? new Date(req.resolvedAt).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )
      )}

      {activeTab === 'investments' && (
        isInvestmentsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Pending Requests list */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Pending Investment/Funding Applications</h3>
              {investments.filter(p => p.status === 'Pending').length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '0.75rem', border: '1px dashed var(--border)' }}>
                  No pending funding applications found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {investments.filter(p => p.status === 'Pending').map((req) => (
                    <div key={req._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                      <div style={{ flex: 1, minWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>Rs. {req.amountRequested.toLocaleString()}</strong>
                          <span style={{ fontSize: '0.75rem', background: 'rgba(217, 119, 6, 0.1)', color: 'var(--secondary)', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 700 }}>
                            Pending Verification
                          </span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '0.75rem', background: 'var(--input-bg)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                          <div>
                            <span style={{ opacity: 0.6, display: 'block', fontSize: '0.75rem' }}>ARTISAN:</span>
                            <strong>{req.name || req.sellerId?.name || 'Unknown'}</strong>
                          </div>
                          <div>
                            <span style={{ opacity: 0.6, display: 'block', fontSize: '0.75rem' }}>CNIC NUMBER:</span>
                            <strong>{req.cnic}</strong>
                          </div>
                          <div>
                            <span style={{ opacity: 0.6, display: 'block', fontSize: '0.75rem' }}>PHONE CONTACT:</span>
                            <strong>{req.phone || req.sellerId?.phone}</strong>
                          </div>
                          <div>
                            <span style={{ opacity: 0.6, display: 'block', fontSize: '0.75rem' }}>LOCATION:</span>
                            <strong>{req.sellerId?.location || 'Unknown'}</strong>
                          </div>
                        </div>

                        <div style={{ marginBottom: '0.5rem' }}>
                          <span style={{ opacity: 0.6, fontSize: '0.8rem', display: 'block' }}>BUSINESS NAME & DETAILS:</span>
                          <strong style={{ fontSize: '0.95rem' }}>{req.businessName}</strong>
                          <p style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.2rem' }}>{req.businessDetails}</p>
                        </div>

                        <div>
                          <span style={{ opacity: 0.6, fontSize: '0.8rem', display: 'block' }}>PURPOSE OF FUNDS:</span>
                          <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>{req.purpose}</p>
                        </div>

                        <span style={{ fontSize: '0.75rem', opacity: 0.5, display: 'block', marginTop: '0.75rem' }}>Requested: {new Date(req.createdAt).toLocaleString()}</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'center' }}>
                        <button
                          onClick={() => handleResolveInvestment(req._id, 'Rejected')}
                          disabled={isResolvingInvestment}
                          className="btn"
                          style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--accent)', padding: '0.6rem 1.2rem', fontSize: '0.85rem', borderRadius: '0.5rem' }}
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleResolveInvestment(req._id, 'Approved')}
                          disabled={isResolvingInvestment}
                          className="btn btn-primary"
                          style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', borderRadius: '0.5rem' }}
                        >
                          Approve Funding
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resolved payouts audit trail */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Application Archive</h3>
              {investments.filter(p => p.status !== 'Pending').length === 0 ? (
                <div style={{ padding: '1.5rem', fontStyle: 'italic', opacity: 0.6 }}>No archived investment applications.</div>
              ) : (
                <div style={{ overflowX: 'auto', background: 'var(--card)', border: '1px solid var(--border-light)', borderRadius: '0.75rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-light)' }}>
                        <th style={{ padding: '0.75rem' }}>Artisan</th>
                        <th style={{ padding: '0.75rem' }}>Business Name</th>
                        <th style={{ padding: '0.75rem' }}>Amount</th>
                        <th style={{ padding: '0.75rem' }}>Requested Date</th>
                        <th style={{ padding: '0.75rem' }}>Status</th>
                        <th style={{ padding: '0.75rem' }}>Resolved Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investments.filter(p => p.status !== 'Pending').map((req) => (
                        <tr key={req._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '0.75rem' }}>
                            <strong>{req.name || req.sellerId?.name || 'Unknown'}</strong>
                            <span style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block' }}>CNIC: {req.cnic}</span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>{req.businessName}</td>
                          <td style={{ padding: '0.75rem' }}>Rs. {req.amountRequested.toLocaleString()}</td>
                          <td style={{ padding: '0.75rem' }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{
                              padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                              background: req.status === 'Approved' ? 'rgba(15, 110, 71, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                              color: req.status === 'Approved' ? 'var(--primary)' : 'var(--accent)'
                            }}>
                              {req.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>{req.resolvedAt ? new Date(req.resolvedAt).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )
      )}

      <style jsx>{`
        .spinner {
          width: 32px;
          height: 32px;
          border: 4px solid var(--border-light);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .admin-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
