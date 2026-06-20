import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import { sendSMS } from '@/lib/sms';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { buyerId, productId, paymentMethod, shippingAddress, recipientPhone, recipientName, notes } = await request.json();

    if (!buyerId || !productId || !paymentMethod) {
      return NextResponse.json({ error: 'Missing checkout parameters.' }, { status: 400 });
    }

    // Find the product details
    const product = await Product.findById(productId).populate('sellerId');
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    // Determine Escrow or COD state
    const paymentStatus = paymentMethod === 'COD' ? 'Pending' : 'Paid_Escrow';

    const order = await Order.create({
      buyerId,
      sellerId: product.sellerId._id,
      productId: product._id,
      amount: product.price,
      paymentMethod,
      paymentStatus,
      deliveryStatus: 'Placed',
      shippingAddress: shippingAddress || '',
      recipientPhone: recipientPhone || '',
      recipientName: recipientName || '',
      notes: notes || ''
    });

    // Fetch buyer details
    const buyer = await User.findById(buyerId);
    const seller = await User.findById(product.sellerId._id);

    // Send SMS notifications
    const productTitle = product.title.en || 'Handcrafted Product';
    
    if (seller && seller.phone) {
      const sellerMsg = `Dear ${seller.name}, you have received a new order for "${productTitle}" on HunarAangan. Order ID: ${order._id}. Amount: Rs. ${order.amount}. Please log in to pack/ship.`;
      sendSMS(seller.phone, sellerMsg).catch(err => console.error('Seller SMS failed:', err));
    }

    const targetBuyerPhone = recipientPhone || (buyer ? buyer.phone : '');
    if (targetBuyerPhone) {
      const buyerMsg = `Dear ${recipientName || (buyer ? buyer.name : 'Customer')}, your order for "${productTitle}" has been placed successfully on HunarAangan. Order ID: ${order._id}. Amount: Rs. ${order.amount}. Track it on your dashboard.`;
      sendSMS(targetBuyerPhone, buyerMsg).catch(err => console.error('Buyer SMS failed:', err));
    }

    return NextResponse.json({
      success: true,
      orderId: order._id,
      order
    });
  } catch (error: any) {
    console.error('Checkout API error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
