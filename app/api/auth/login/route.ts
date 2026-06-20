import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { phone } = await request.json();

    if (!phone || phone.length < 9) {
      return NextResponse.json(
        { error: 'Invalid phone number format.' },
        { status: 400 }
      );
    }

    const { normalizePhoneNumber, sendSMS } = require('@/lib/sms');
    const normalizedPhone = normalizePhoneNumber(phone);

    // Find or pre-create user to store temporary verification states
    let user = await User.findOne({ phone: normalizedPhone });
    const isNewUser = !user;

    if (!user) {
      user = await User.create({
        phone: normalizedPhone,
        name: `User_${normalizedPhone.slice(-4)}`,
        role: 'buyer',
        location: 'Karachi',
        failedLoginAttempts: 0,
        pin: '',
        bio: {
          en: 'Welcome to my HunarAangan store!',
          ur: 'ہنر آنگن اسٹور پر خوش آمدید!',
          sd: 'هنر آنگن اسٽور تي ڀليڪار!'
        }
      });
    }

    // Check if user has already configured their secure login PIN
    if (user.pin && user.pin.trim() !== '') {
      return NextResponse.json({
        success: true,
        hasPin: true,
        isNewUser: false
      });
    }

    // Dynamic OTP Generation
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // Expires in 5 minutes

    user.tempOtp = otpCode;
    user.tempOtpExpiry = expiry;

    // Send real verification code SMS using TextBee
    const smsMsg = `Your HunarAangan verification code is: ${otpCode}`;
    const smsRes = await sendSMS(normalizedPhone, smsMsg);
    
    if (smsRes.success && smsRes.smsId) {
      user.tempOtpSmsId = smsRes.smsId;
    }
    
    await user.save();

    console.log(`[AUTH] Sent dynamic OTP ${otpCode} to ${normalizedPhone}. SMS ID: ${user.tempOtpSmsId}`);

    return NextResponse.json({
      success: true,
      hasPin: false,
      isNewUser,
      smsId: user.tempOtpSmsId || ''
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
