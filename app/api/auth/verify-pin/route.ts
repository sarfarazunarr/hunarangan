import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'hunarangan-super-secret-key-123456';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { phone, pin } = await request.json();

    if (!phone || !pin) {
      return NextResponse.json({ error: 'Phone and PIN are required.' }, { status: 400 });
    }

    const { normalizePhoneNumber, sendSMS } = require('@/lib/sms');
    const normalizedPhone = normalizePhoneNumber(phone);

    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Verify PIN match
    if (user.pin === pin) {
      // Success! Reset failed attempts count
      user.failedLoginAttempts = 0;
      await user.save();

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
    } else {
      // Increment failed login count
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      
      if (user.failedLoginAttempts >= 5) {
        // Trigger auto lockout reset: Generate new OTP and reset fails
        user.failedLoginAttempts = 0;
        
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        
        user.tempOtp = otpCode;
        user.tempOtpExpiry = expiry;
        
        const smsMsg = `Too many failed login attempts. Your HunarAangan reset code is: ${otpCode}`;
        const smsRes = await sendSMS(normalizedPhone, smsMsg);
        
        if (smsRes.success && smsRes.smsId) {
          user.tempOtpSmsId = smsRes.smsId;
        }
        
        await user.save();
        
        console.log(`[LOCKOUT] User ${normalizedPhone} locked out. Sent reset OTP ${otpCode}. SMS ID: ${user.tempOtpSmsId}`);
        
        return NextResponse.json({
          success: false,
          error: 'Too many incorrect attempts. A verification reset code has been sent to your phone.',
          resetRequired: true,
          smsId: user.tempOtpSmsId || ''
        });
      } else {
        await user.save();
        const remaining = 5 - user.failedLoginAttempts;
        return NextResponse.json({
          success: false,
          error: `Incorrect PIN. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`,
          attemptsRemaining: remaining
        });
      }
    }
  } catch (error: any) {
    console.error('Verify PIN error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
