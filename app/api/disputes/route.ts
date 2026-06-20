import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import ChatRoom from '@/models/ChatRoom';
import Order from '@/models/Order';
import { pusherServer } from '@/lib/pusher';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    // Fetch all rooms where a dispute is active
    const disputes = await ChatRoom.find({ isDisputed: true })
      .populate('buyerId', 'name phone location')
      .populate('sellerId', 'name phone location');

    return NextResponse.json({ success: true, disputes });
  } catch (error: any) {
    console.error('Fetch disputes error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { roomId, action, resolution } = await request.json(); // resolution: 'refund_buyer' | 'pay_seller'

    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId parameter.' }, { status: 400 });
    }

    // Flag room as disputed
    if (action === 'flag') {
      const room = await ChatRoom.findOneAndUpdate(
        { roomId },
        { $set: { isDisputed: true } },
        { returnDocument: 'after' }
      );
      
      // Post system dispute message in logs
      room.messages.push({
        senderId: room.buyerId, // represent dispute initiator
        text: `⚠️ A formal dispute has been filed for this transaction. A human operator from HunarAangan will review chat logs shortly.`,
        timestamp: new Date()
      });
      await room.save();

      if (pusherServer) {
        try {
          await pusherServer.trigger(roomId, 'room-refresh', { isDisputed: true });
        } catch (e) {
          console.error(e);
        }
      }

      return NextResponse.json({ success: true, room });
    }

    // Resolve dispute
    if (action === 'resolve') {
      const room = await ChatRoom.findOneAndUpdate(
        { roomId },
        { $set: { isDisputed: false } },
        { returnDocument: 'after' }
      );

      if (!room) {
        return NextResponse.json({ error: 'Chat room not found.' }, { status: 404 });
      }

      // Find active Escrow Order between parties
      const order = await Order.findOne({
        buyerId: room.buyerId,
        sellerId: room.sellerId,
        paymentStatus: 'Paid_Escrow'
      });

      if (order) {
        if (resolution === 'pay_seller') {
          order.paymentStatus = 'Released_To_Seller';
          order.deliveryStatus = 'Delivered';
        } else if (resolution === 'refund_buyer') {
          order.paymentStatus = 'Pending'; // Refunded/Cancelled state
          order.deliveryStatus = 'Placed';
        }
        await order.save();
      }

      // Append system message in chat
      const resolutionText = resolution === 'pay_seller' 
        ? "System Dispute Resolution: Funds released to Seller/Artisan." 
        : "System Dispute Resolution: Escrow transaction cancelled. Refunded to Buyer.";
      
      room.messages.push({
        senderId: room.sellerId, // generic resolution sender
        text: `✅ ${resolutionText}`,
        timestamp: new Date()
      });
      await room.save();

      if (pusherServer) {
        try {
          await pusherServer.trigger(roomId, 'room-refresh', { isDisputed: false, resolved: true });
        } catch (e) {
          console.error(e);
        }
      }

      return NextResponse.json({ success: true, room });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error: any) {
    console.error('Dispute operation error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
