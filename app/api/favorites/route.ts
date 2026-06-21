import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import Product from '@/models/Product';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId.' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid userId.' }, { status: 400 });
    }

    const user = await User.findById(userId).populate({
      path: 'favorites',
      model: Product,
      populate: {
        path: 'sellerId',
        select: 'name location phone'
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, favorites: user.favorites || [] });
  } catch (error: any) {
    console.error('Get favorites error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { userId, productId } = await request.json();

    if (!userId || !productId) {
      return NextResponse.json({ error: 'Missing userId or productId.' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ error: 'Invalid userId or productId.' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Initialize favorites if not present
    if (!user.favorites) {
      user.favorites = [];
    }

    // Convert elements to string to check index correctly
    const favStrings = user.favorites.map((id: any) => id.toString());
    const index = favStrings.indexOf(productId);
    let isSaved = false;

    if (index === -1) {
      user.favorites.push(new mongoose.Types.ObjectId(productId));
      isSaved = true;
    } else {
      user.favorites.splice(index, 1);
      isSaved = false;
    }

    await user.save();

    return NextResponse.json({ success: true, isSaved, favorites: user.favorites });
  } catch (error: any) {
    console.error('Toggle favorite error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
