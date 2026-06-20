import { NextResponse } from 'next/server';
import { parseVoiceListing } from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'No summary text provided.' }, { status: 400 });
    }

    // Reuse parseVoiceListing to extract details from typed text summary
    const draft = await parseVoiceListing(text);

    return NextResponse.json({
      success: true,
      draft
    });
  } catch (error: any) {
    console.error('Parse listing error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
