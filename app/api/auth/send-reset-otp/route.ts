import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const { normalizePhoneNumber, sendSMS } = require('@/lib/sms');
    const normalizedPhone = normalizePhoneNumber(phone);

    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      return NextResponse.json({ error: 'Account not found with this phone number.' }, { status: 404 });
    }

    // Generate random 6-digit OTP code for reset
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.tempOtp = otpCode;
    user.tempOtpExpiry = expiry;

    // Send SMS via TextBee
    const smsMsg = `Your HunarAangan PIN reset code is: ${otpCode}`;
    const smsRes = await sendSMS(normalizedPhone, smsMsg);
    
    if (smsRes.success && smsRes.smsId) {
      user.tempOtpSmsId = smsRes.smsId;
    }
    
    await user.save();

    console.log(`[AUTH] Sent forgot-PIN reset OTP ${otpCode} to ${normalizedPhone}. SMS ID: ${user.tempOtpSmsId}`);

    return NextResponse.json({
      success: true,
      message: 'Reset OTP sent successfully.',
      smsId: user.tempOtpSmsId || ''
    });
  } catch (error: any) {
    console.error('Send reset OTP error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
