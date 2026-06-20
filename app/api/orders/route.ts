import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role'); // 'buyer' | 'seller'

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter.' }, { status: 400 });
    }

    let filter = {};
    if (role === 'seller') {
      filter = { sellerId: userId };
    } else {
      filter = { buyerId: userId };
    }

    const orders = await Order.find(filter)
      .populate('productId')
      .populate('buyerId', 'name phone location')
      .populate('sellerId', 'name phone location')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const { orderId, deliveryStatus, paymentStatus } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId parameter.' }, { status: 400 });
    }

    const updateFields: any = {};
    if (deliveryStatus) updateFields.deliveryStatus = deliveryStatus;
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(
      orderId,
      { $set: updateFields },
      { new: true }
    )
      .populate('productId')
      .populate('buyerId', 'name phone location')
      .populate('sellerId', 'name phone location');

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Send SMS updates
    const prodName = order.productId ? (order.productId.title?.en || 'Handcrafted Product') : (order.customOfferDetails?.title || 'Custom Work');
    const buyerPhone = order.recipientPhone || (order.buyerId && (order.buyerId as any).phone);
    const buyerName = order.recipientName || (order.buyerId && (order.buyerId as any).name) || 'Customer';
    const sellerPhone = order.sellerId && (order.sellerId as any).phone;
    const sellerName = (order.sellerId && (order.sellerId as any).name) || 'Artisan';

    // Import sendSMS inside to avoid server start cycle issues or from header
    const { sendSMS } = require('@/lib/sms');

    if (deliveryStatus && buyerPhone) {
      const deliveryMsg = `Dear ${buyerName}, your order ${order._id} for "${prodName}" has been updated to "${deliveryStatus}" by the artisan. Please check HunarAangan dashboard to track.`;
      sendSMS(buyerPhone, deliveryMsg).catch((err: any) => console.error('Delivery status SMS failed:', err));
    }

    if (paymentStatus === 'Released_To_Seller') {
      if (sellerPhone) {
        const sellerMsg = `Dear ${sellerName}, payment of Rs. ${order.amount} for order ${order._id} has been released to your account. Thank you for using HunarAangan!`;
        sendSMS(sellerPhone, sellerMsg).catch((err: any) => console.error('Seller payment SMS failed:', err));
      }
      if (buyerPhone) {
        const buyerMsg = `Dear ${buyerName}, payment of Rs. ${order.amount} for order ${order._id} has been released to the artisan. Thank you for supporting local women artisans!`;
        sendSMS(buyerPhone, buyerMsg).catch((err: any) => console.error('Buyer payment SMS failed:', err));
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
