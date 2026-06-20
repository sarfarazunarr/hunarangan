import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'hunarangan-super-secret-key-123456';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { phone, otp, pin } = await request.json();

    if (!phone || !otp || !pin) {
      return NextResponse.json({ error: 'Phone, OTP, and PIN are required.' }, { status: 400 });
    }

    const { normalizePhoneNumber } = require('@/lib/sms');
    const normalizedPhone = normalizePhoneNumber(phone);

    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Check if temporary OTP is correct and has not expired
    if (!user.tempOtp || user.tempOtp !== otp) {
      return NextResponse.json({ error: 'Incorrect verification code.' }, { status: 400 });
    }

    if (user.tempOtpExpiry && new Date() > new Date(user.tempOtpExpiry)) {
      return NextResponse.json({ error: 'Verification code has expired.' }, { status: 400 });
    }

    // OTP is valid! Save new secure PIN
    user.pin = pin;
    
    // Clear temporary verification state
    user.tempOtp = undefined;
    user.tempOtpExpiry = undefined;
    user.tempOtpSmsId = undefined;
    user.failedLoginAttempts = 0;
    
    await user.save();

    console.log(`[AUTH] Successfully verified OTP and set PIN for user ${normalizedPhone}`);

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
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
