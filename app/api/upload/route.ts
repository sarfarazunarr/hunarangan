import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary from Env variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isCloudinaryConfigured = cloudName && apiKey && apiSecret;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
} else {
  console.warn(
    'Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing. Running in simulated upload fallback mode.'
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'profile' or 'product'

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // Fallback Data URL conversion is disabled. Reject if Cloudinary is not configured.
    if (!isCloudinaryConfigured) {
      return NextResponse.json(
        { error: 'Cloudinary environment variables are not configured. Upload failed.' },
        { status: 400 }
      );
    }

    // Parse file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload Stream to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'hunarangan',
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      cloudinary: true
    });

  } catch (err: any) {
    console.error('Upload endpoint error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed.' }, { status: 500 });
  }
}
