import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import ChatRoom from '@/models/ChatRoom';
import Order from '@/models/Order';
import { pusherServer } from '@/lib/pusher';
import mongoose from 'mongoose';
import User from '@/models/User';
import { sendSMS } from '@/lib/sms';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { roomId, senderId, offerAction, offerDetails, messageId } = await request.json();

    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId.' }, { status: 400 });
    }

    // Action 1: Create a new custom offer
    if (offerAction === 'create') {
      const { title, description, amount, deliveryTime } = offerDetails;
      
      const newOfferMessage = {
        senderId: new mongoose.Types.ObjectId(senderId),
        text: `Custom Offer: ${title}`,
        customOffer: {
          title,
          description,
          amount: parseFloat(amount),
          deliveryTime: parseInt(deliveryTime),
          status: 'pending' as const
        },
        timestamp: new Date()
      };

      const chatRoom = await ChatRoom.findOneAndUpdate(
        { roomId },
        { $push: { messages: newOfferMessage } },
        { returnDocument: 'after', upsert: true }
      );

      // Emit Pusher notification
      if (pusherServer) {
        try {
          await pusherServer.trigger(roomId, 'new-message', {
            ...newOfferMessage,
            senderId: senderId.toString()
          });
        } catch (e) {
          console.error('Pusher trigger failed:', e);
        }
      }

      return NextResponse.json({ success: true, chatRoom });
    }

    // Action 2: Approve or Decline or Complete an existing custom offer
    if (offerAction === 'update') {
      if (!messageId) {
        return NextResponse.json({ error: 'Missing messageId.' }, { status: 400 });
      }

      const { status } = offerDetails; // 'approved' | 'declined' | 'completed'

      // Find the Chat Room and specific message
      const chatRoom = await ChatRoom.findOne({ roomId });
      if (!chatRoom) {
        return NextResponse.json({ error: 'Chat room not found.' }, { status: 404 });
      }

      const message = chatRoom.messages.id(messageId);
      if (!message || !message.customOffer) {
        return NextResponse.json({ error: 'Custom offer message not found.' }, { status: 404 });
      }

      // Shift status
      message.customOffer.status = status;
      await chatRoom.save();

      // If approved, initialize the escrow transaction and create Order
      let orderId = null;
      if (status === 'approved') {
        // Fetch buyer and seller details for SMS and autofilling
        const buyer = await User.findById(chatRoom.buyerId);
        const seller = await User.findById(chatRoom.sellerId);

        const order = await Order.create({
          buyerId: chatRoom.buyerId,
          sellerId: chatRoom.sellerId,
          amount: message.customOffer.amount,
          paymentMethod: 'Mock_Card', // Escrow mock payment
          paymentStatus: 'Paid_Escrow', // Funds locked
          deliveryStatus: 'Placed',
          shippingAddress: buyer ? buyer.address : '',
          recipientPhone: buyer ? buyer.phone : '',
          recipientName: buyer ? buyer.name : '',
          customOfferDetails: {
            title: message.customOffer.title,
            description: message.customOffer.description,
            deliveryTime: message.customOffer.deliveryTime
          }
        });
        orderId = order._id;

        if (seller && seller.phone) {
          const sellerMsg = `Dear ${seller.name}, your custom offer "${message.customOffer.title}" for Rs. ${message.customOffer.amount} has been approved by ${buyer ? buyer.name : 'the buyer'}. Escrow payment is secured. You can start working on the order.`;
          sendSMS(seller.phone, sellerMsg).catch(err => console.error('Custom offer approved seller SMS failed:', err));
        }
        if (buyer && buyer.phone) {
          const buyerMsg = `Dear ${buyer.name}, you have approved custom offer "${message.customOffer.title}" for Rs. ${message.customOffer.amount}. Escrow payment of Rs. ${message.customOffer.amount} is secured. The artisan has been notified.`;
          sendSMS(buyer.phone, buyerMsg).catch(err => console.error('Custom offer approved buyer SMS failed:', err));
        }

        // Append helper system message notifying approval
        const systemMessage = {
          senderId: chatRoom.buyerId,
          text: `Approved the Custom Offer: "${message.customOffer.title}". Escrow Payment Secured. Order Created!`,
          timestamp: new Date()
        };
        chatRoom.messages.push(systemMessage);
        await chatRoom.save();
      }

      // If marked complete by the artisan, let's notify buyer in timeline
      if (status === 'completed') {
        // Find matching Escrow Order and shift delivery status to Delivered
        const order = await Order.findOne({
          buyerId: chatRoom.buyerId,
          sellerId: chatRoom.sellerId,
          amount: message.customOffer.amount,
          paymentStatus: 'Paid_Escrow'
        });
        if (order) {
          order.deliveryStatus = 'Delivered';
          await order.save();
        }

        const systemMessage = {
          senderId: chatRoom.sellerId,
          text: `Marked the task "${message.customOffer.title}" as Complete. Funds are ready to be released from Escrow!`,
          timestamp: new Date()
        };
        chatRoom.messages.push(systemMessage);
        await chatRoom.save();
      }

      // Emit Pusher notification
      if (pusherServer) {
        try {
          await pusherServer.trigger(roomId, 'room-refresh', { messageId, status, orderId });
        } catch (e) {
          console.error(e);
        }
      }

      return NextResponse.json({ success: true, chatRoom, orderId });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (error: any) {
    console.error('Custom offer error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
