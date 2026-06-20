import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'hunarangan-super-secret-key-123456';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { phone, otp, name, role, location, gender } = await request.json();

    // Mock OTP verification check
    if (otp !== '123456') {
      return NextResponse.json({ error: 'Incorrect OTP code.' }, { status: 400 });
    }

    let user = await User.findOne({ phone });

    if (!user) {
      // Create a new user with provided or default fields
      user = await User.create({
        phone,
        role: role || 'buyer',
        name: name || `Artisan_${phone.slice(-4)}`,
        location: location || 'Karachi',
        gender: gender || '',
        bio: {
          en: 'Welcome to my HunarAangan store!',
          ur: 'ہنر آنگن اسٹور پر خوش آمدید!',
          sd: 'هنر آنگن اسٽور تي ڀليڪار!'
        }
      });
    }

    // Create JWT
    const token = jwt.sign(
      { userId: user._id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie response
    const cookie = serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        location: user.location,
        bio: user.bio
      }
    });

    response.headers.set('Set-Cookie', cookie);
    return response;
  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
