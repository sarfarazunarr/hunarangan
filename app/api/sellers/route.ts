import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    // Fetch all users with role 'seller'
    const sellers = await User.find({ role: 'seller' })
      .select('name location bio profileImage phone email cnic createdAt')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, sellers });
  } catch (error: any) {
    console.error('Fetch sellers error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
