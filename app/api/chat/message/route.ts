import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import ChatRoom from '@/models/ChatRoom';
import { pusherServer } from '@/lib/pusher';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { roomId, senderId, text, audioUrl } = await request.json();

    if (!roomId || !senderId) {
      return NextResponse.json({ error: 'Missing roomId or senderId.' }, { status: 400 });
    }

    const messagePayload = {
      senderId: new mongoose.Types.ObjectId(senderId),
      text: text || '',
      audioUrl: audioUrl || null,
      timestamp: new Date()
    };

    // Update ChatRoom array
    const chatRoom = await ChatRoom.findOneAndUpdate(
      { roomId },
      { 
        $push: { messages: messagePayload } 
      },
      { returnDocument: 'after', upsert: true }
    );

    // Trigger Pusher event
    if (pusherServer) {
      try {
        await pusherServer.trigger(roomId, 'new-message', {
          ...messagePayload,
          senderId: senderId.toString()
        });
      } catch (pusherErr) {
        console.error('Pusher trigger failed, continuing with DB update:', pusherErr);
      }
    }

    return NextResponse.json({
      success: true,
      chatRoom
    });
  } catch (error: any) {
    console.error('Chat message endpoint error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
