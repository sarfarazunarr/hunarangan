import { NextResponse } from 'next/server';
import { answerProductQuery } from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const { productContext, question, lang } = await request.json();

    if (!productContext || !question) {
      return NextResponse.json({ error: 'Missing product details or user question.' }, { status: 400 });
    }

    const aiAnswer = await answerProductQuery(productContext, question, lang || 'en');

    return NextResponse.json({
      success: true,
      text: aiAnswer.text
    });
  } catch (error: any) {
    console.error('Ask product API error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
