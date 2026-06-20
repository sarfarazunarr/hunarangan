import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter.' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const { userId, name, location, bio, profileImage, email, cnic, address, gender, role, lang } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter.' }, { status: 400 });
    }

    const updatedFields: any = {};
    if (name !== undefined) updatedFields.name = name;
    if (location !== undefined) updatedFields.location = location;
    if (profileImage !== undefined) updatedFields.profileImage = profileImage;
    if (email !== undefined) updatedFields.email = email;
    if (cnic !== undefined) updatedFields.cnic = cnic;
    if (address !== undefined) updatedFields.address = address;
    if (gender !== undefined) updatedFields.gender = gender;
    if (role !== undefined) updatedFields.role = role;

    if (bio !== undefined) {
      if (typeof bio === 'object' && bio !== null) {
        updatedFields.bio = bio;
      } else if (typeof bio === 'string') {
        const activeLang = lang || 'en';
        if (['en', 'ur', 'sd'].includes(activeLang)) {
          updatedFields[`bio.${activeLang}`] = bio;
        } else {
          updatedFields['bio.en'] = bio;
          updatedFields['bio.ur'] = bio;
          updatedFields['bio.sd'] = bio;
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updatedFields },
      { returnDocument: 'after' }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
