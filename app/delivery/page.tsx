'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { Truck, MapPin, Search, Check, RefreshCw, ChevronRight, User, Phone, ArrowLeft, Loader } from 'lucide-react';

interface ActiveOrder {
  _id: string;
  productId?: { title: { en: string; ur: string; sd: string }; price: number };
  customOfferDetails?: { title: string; amount: number };
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryStatus: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  createdAt: string;
  shipmentHistory?: { location: string; status: string; timestamp: string }[];
}

export default function DeliveryPortalPage() {
  const { language } = useLanguage();
  const { showToast, success: showSuccessToast, error: showErrorToast } = useToast();
  const router = useRouter();

  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ActiveOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Shipment Log Form States
  const [locationInput, setLocationInput] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchActiveOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders?activeOnly=true');
      const data = await res.json();
      if (data.success) {
        setActiveOrders(data.orders || []);
      } else {
        showErrorToast('Failed to load shipments.');
      }
    } catch (e) {
      console.error(e);
      showErrorToast('Failed to load shipments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders?orderId=${searchQuery.trim()}`);
      const data = await res.json();
      if (res.ok && data.success && data.order) {
        setSelectedOrder(data.order);
      } else {
        showErrorToast('Order ID not found.');
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Error retrieving order details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLocationUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !locationInput.trim()) {
      showErrorToast('Please enter location details.');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          shipmentUpdate: {
            location: locationInput.trim(),
            status: statusInput.trim() || 'In Transit'
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccessToast('Shipment status updated successfully!');
        setSelectedOrder(data.order);
        setLocationInput('');
        setStatusInput('');
        fetchActiveOrders();
      } else {
        showErrorToast(data.error || 'Failed to update shipment log.');
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Connection failed.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!selectedOrder) return;
    const confirmDelivered = window.confirm('Are you sure you want to mark this package as DELIVERED? This will automatically release escrow payment to the artisan.');
    if (!confirmDelivered) return;

    setIsUpdating(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          deliveryStatus: 'Delivered',
          shipmentUpdate: {
            location: 'Buyer Address',
            status: 'Delivered to recipient. Escrow payment released.'
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccessToast('Order delivered! Payout released to seller.');
        setSelectedOrder(null);
        fetchActiveOrders();
      } else {
        showErrorToast(data.error || 'Failed to deliver shipment.');
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Delivery update failed.');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = activeOrders.filter(
    (o) =>
      o._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.recipientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container" style={{ marginTop: '1.5rem', paddingBottom: '4rem' }}>
      
      {/* Navigation Return */}
      <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} />
        <span>Return to Marketplace</span>
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Truck size={28} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>HunarAangan Delivery Portal</h2>
        </div>
        <button onClick={fetchActiveOrders} className="btn btn-outline" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.25rem', fontSize: '0.9rem' }}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2.5rem' }} className="responsive-profile-grid">
        
        {/* Left Side: Active Shipments and Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Search & Active Packages</h3>
          
          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
              <input
                type="text"
                placeholder="Search Order ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.6rem 0.6rem 0.6rem 2.2rem', borderRadius: '0.5rem', outline: 'none', width: '100%', fontSize: '0.9rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>Search</button>
          </form>

          {/* Shipments List */}
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <div className="spinner"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '0.75rem', border: '1px dashed var(--border)' }}>
              No active shipments.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '55vh', overflowY: 'auto' }}>
              {filteredOrders.map((o) => {
                const isSelected = selectedOrder?._id === o._id;
                const prodTitle = o.productId ? (o.productId.title[language] || o.productId.title.en) : o.customOfferDetails?.title;
                
                return (
                  <div
                    key={o._id}
                    onClick={() => {
                      setSelectedOrder(o);
                      setLocationInput('');
                      setStatusInput('');
                    }}
                    className="glass-card"
                    style={{
                      padding: '1rem',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: isSelected ? 'rgba(10, 77, 52, 0.02)' : 'white',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ fontSize: '0.95rem', display: 'block', color: 'var(--primary)' }}>{prodTitle}</strong>
                        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Order ID: {o._id}</span>
                      </div>
                      <ChevronRight size={16} style={{ opacity: 0.5 }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.85 }}>
                      <span>To: <strong>{o.recipientName}</strong></span>
                      <span style={{ background: 'rgba(194, 125, 56, 0.1)', color: 'var(--secondary)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                        {o.deliveryStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Selected Shipment Operations */}
        <div>
          {selectedOrder ? (
            <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--border)' }}>
              
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                  Shipment Operations Panel
                </h3>
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Tracking Details for Order ID: {selectedOrder._id}</span>
              </div>

              {/* Recipient card details */}
              <div style={{ background: 'var(--input-bg)', padding: '1.25rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <User size={16} style={{ color: 'var(--secondary)' }} />
                  <span>Recipient: <strong>{selectedOrder.recipientName}</strong></span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Phone size={16} style={{ color: 'var(--secondary)' }} />
                  <span>Phone: <strong>{selectedOrder.recipientPhone}</strong></span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <MapPin size={16} style={{ color: 'var(--secondary)', marginTop: '0.15rem', flexShrink: 0 }} />
                  <span>Address: <strong>{selectedOrder.shippingAddress}</strong></span>
                </div>
              </div>

              {/* Timeline Updates */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Current Shipment History</h4>
                {!selectedOrder.shipmentHistory || selectedOrder.shipmentHistory.length === 0 ? (
                  <p style={{ fontStyle: 'italic', opacity: 0.6, fontSize: '0.85rem' }}>No updates logged yet. Add your current location below.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedOrder.shipmentHistory.map((hist, hIdx) => (
                      <div key={hIdx} style={{ fontSize: '0.85rem', background: 'rgba(0,0,0,0.02)', padding: '0.6rem 0.8rem', borderRadius: '0.4rem', borderLeft: '3px solid var(--secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{hist.location}</strong>
                          {hist.status && <span style={{ opacity: 0.8, marginLeft: '0.5rem', fontSize: '0.75rem' }}>- {hist.status}</span>}
                        </div>
                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(hist.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add shipment update log form */}
              <form onSubmit={handleAddLocationUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Log Transit Milestone</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Current Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Sukkur Sorting Hub"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.85rem' }}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Transit Status / Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Package arrived at Sukkur facility"
                      value={statusInput}
                      onChange={(e) => setStatusInput(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdating || !locationInput.trim()}
                  className="btn btn-secondary"
                  style={{ padding: '0.6rem', fontSize: '0.85rem', width: '100%', borderRadius: '0.4rem', marginTop: '0.25rem' }}
                >
                  {isUpdating ? 'Adding update...' : 'Append Log Milestone'}
                </button>
              </form>

              {/* Deliver and release payout */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Finalize Delivery</h4>
                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                  Verify that the buyer has received the correct package. Confirming delivery will mark the order completed and instantly transfer payment from escrow to the artisan's balance.
                </p>
                <button
                  onClick={handleMarkDelivered}
                  disabled={isUpdating}
                  className="btn btn-primary"
                  style={{ padding: '0.8rem', width: '100%', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}
                >
                  {isUpdating ? <Loader className="spin" size={18} /> : <Check size={18} />}
                  <span>Mark Delivered & Release Payment</span>
                </button>
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'rgba(0,0,0,0.01)', borderRadius: '1rem', border: '1px dashed var(--border)' }}>
              <Truck size={48} style={{ color: 'var(--primary)', opacity: 0.3, margin: '0 auto 1.5rem' }} />
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, opacity: 0.7 }}>Select a package shipment to begin logging updates.</h4>
              <p style={{ opacity: 0.5, fontSize: '0.85rem', marginTop: '0.5rem' }}>Search by Order ID or select from the active shipment tracking list on the left.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
