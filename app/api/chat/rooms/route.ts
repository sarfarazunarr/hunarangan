import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import ChatRoom from '@/models/ChatRoom';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const roomId = searchParams.get('roomId');

    // 1. Fetch details of a single room
    if (roomId) {
      const room = await ChatRoom.findOne({ roomId })
        .populate('buyerId', 'name phone location')
        .populate('sellerId', 'name phone location');
      
      if (!room) {
        return NextResponse.json({ error: 'Chat room not found.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, room });
    }

    // 2. Fetch list of rooms for a specific user
    if (userId) {
      const rooms = await ChatRoom.find({
        $or: [{ buyerId: userId }, { sellerId: userId }]
      })
        .populate('buyerId', 'name phone location')
        .populate('sellerId', 'name phone location')
        .sort({ updatedAt: -1 });

      return NextResponse.json({ success: true, rooms });
    }

    return NextResponse.json({ error: 'Missing parameters.' }, { status: 400 });
  } catch (error: any) {
    console.error('Get rooms error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { buyerId, sellerId } = await request.json();

    if (!buyerId || !sellerId) {
      return NextResponse.json({ error: 'Missing buyerId or sellerId.' }, { status: 400 });
    }

    const roomId = `${buyerId}_${sellerId}`;

    let room = await ChatRoom.findOne({ roomId });
    if (!room) {
      room = await ChatRoom.create({
        roomId,
        buyerId,
        sellerId,
        messages: [],
        isDisputed: false
      });
      
      // Add a default welcoming message
      const seller = await User.findById(sellerId);
      const sellerName = seller ? seller.name : 'Artisan';
      
      room.messages.push({
        senderId: sellerId,
        text: `Assalam-o-Alaikum! Welcome to my store. How can I help you today?`,
        timestamp: new Date()
      });
      await room.save();
    }

    return NextResponse.json({ success: true, roomId, room });
  } catch (error: any) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
