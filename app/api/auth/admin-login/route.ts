import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    // Secure credentials check - default fallback values for demonstration/live ready
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'adminpassword123';

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
    }

    // Ensure admin user exists in database for reference/population purposes
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        phone: '+923000000000',
        role: 'admin',
        name: 'Platform Administrator',
        location: 'Islamabad',
        bio: {
          en: 'System administrator for HunarAangan',
          ur: 'ہنر آنگن سسٹم ایڈمنسٹریٹر',
          sd: 'هنر آنگن سسٽم ايڊمنسٽريٽر'
        },
        cnic: '00000-0000000-0',
        address: 'HunarAangan Head Office, Islamabad'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin authentication successful.',
      user: {
        id: adminUser._id,
        name: adminUser.name,
        phone: adminUser.phone,
        role: adminUser.role,
        location: adminUser.location
      }
    });
  } catch (error: any) {
    console.error('Admin API login error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
