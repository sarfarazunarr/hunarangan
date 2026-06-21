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
    const orderId = searchParams.get('orderId');
    const activeOnly = searchParams.get('activeOnly');

    // 1. Fetch single order if orderId provided
    if (orderId) {
      const order = await Order.findById(orderId)
        .populate('productId')
        .populate('buyerId', 'name phone location address')
        .populate('sellerId', 'name phone location');
      if (!order) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, order });
    }

    // 2. Fetch active shipments for delivery agent
    if (activeOnly === 'true') {
      const orders = await Order.find({ deliveryStatus: { $ne: 'Delivered' } })
        .populate('productId')
        .populate('buyerId', 'name phone location address')
        .populate('sellerId', 'name phone location')
        .sort({ createdAt: -1 });
      return NextResponse.json({ success: true, orders });
    }

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
      .populate('buyerId', 'name phone location address')
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
    const { orderId, deliveryStatus, paymentStatus, shipmentUpdate } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId parameter.' }, { status: 400 });
    }

    const updateFields: any = {};
    if (deliveryStatus) {
      updateFields.deliveryStatus = deliveryStatus;
      if (deliveryStatus === 'Delivered') {
        updateFields.paymentStatus = 'Released_To_Seller';
      }
    }
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;

    let order;
    if (shipmentUpdate && shipmentUpdate.location) {
      const updateObj = {
        location: shipmentUpdate.location,
        status: shipmentUpdate.status || '',
        timestamp: new Date()
      };
      
      order = await Order.findByIdAndUpdate(
        orderId,
        { 
          $push: { shipmentHistory: updateObj },
          $set: updateFields
        },
        { new: true }
      );
    } else {
      order = await Order.findByIdAndUpdate(
        orderId,
        { $set: updateFields },
        { new: true }
      );
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Populate order properties
    order = await Order.findById(order._id)
      .populate('productId')
      .populate('buyerId', 'name phone location')
      .populate('sellerId', 'name phone location');

    // Send SMS updates
    const prodName = order.productId ? (order.productId.title?.en || 'Handcrafted Product') : (order.customOfferDetails?.title || 'Custom Work');
    const buyerPhone = order.recipientPhone || (order.buyerId && (order.buyerId as any).phone);
    const buyerName = order.recipientName || (order.buyerId && (order.buyerId as any).name) || 'Customer';
    const sellerPhone = order.sellerId && (order.sellerId as any).phone;
    const sellerName = (order.sellerId && (order.sellerId as any).name) || 'Artisan';

    const { sendSMS } = require('@/lib/sms');

    if (deliveryStatus && buyerPhone) {
      const deliveryMsg = `Dear ${buyerName}, your order ${order._id} for "${prodName}" has been updated to "${deliveryStatus}" by the logistics team. Please check HunarAangan dashboard to track.`;
      sendSMS(buyerPhone, deliveryMsg).catch((err: any) => console.error('Delivery status SMS failed:', err));
    }

    if (order.paymentStatus === 'Released_To_Seller' || paymentStatus === 'Released_To_Seller') {
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
