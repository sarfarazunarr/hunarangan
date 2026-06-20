import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Product from '@/models/Product';
import { translateText } from '@/lib/openai';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const product = await Product.findById(id).populate('sellerId', 'name location bio phone');


    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Fetch product detail error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const { buyerId, buyerName, rating, comment } = await request.json();

    if (!buyerId || !buyerName || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required review fields.' }, { status: 400 });
    }

    const review = {
      buyerId,
      buyerName,
      rating: parseInt(rating),
      comment,
      createdAt: new Date()
    };

    const product = await Product.findByIdAndUpdate(
      id,
      { $push: { reviews: review } },
      { returnDocument: 'after' }
    );

    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, reviews: product.reviews });
  } catch (error: any) {
    console.error('Submit review error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const { title, description, shortDescription, price, images, category, isCustomService, faqs } = await request.json();

    if (!title || !price || !category) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    // Auto-translation: if single string is supplied, translate to all three languages
    let finalTitle = title;
    let finalDescription = description;
    let finalShortDescription = shortDescription;

    if (typeof title === 'string') {
      finalTitle = await translateText(title);
    }
    if (typeof description === 'string') {
      finalDescription = await translateText(description);
    } else if (!description) {
      finalDescription = { en: '', ur: '', sd: '' };
    }

    if (typeof shortDescription === 'string') {
      finalShortDescription = await translateText(shortDescription);
    } else if (!shortDescription) {
      finalShortDescription = { en: '', ur: '', sd: '' };
    }

    let finalFaqs = [];
    if (Array.isArray(faqs)) {
      for (const faq of faqs) {
        let q = faq.question;
        let a = faq.answer;
        if (typeof q === 'string') {
          q = await translateText(q);
        }
        if (typeof a === 'string') {
          a = await translateText(a);
        }
        finalFaqs.push({
          question: q || { en: '', ur: '', sd: '' },
          answer: a || { en: '', ur: '', sd: '' }
        });
      }
    }

    const updatedData: any = {
      title: finalTitle,
      description: finalDescription,
      shortDescription: finalShortDescription,
      price: parseFloat(price),
      category,
      isCustomService: !!isCustomService,
      faqs: finalFaqs
    };

    if (images && images.length > 0) {
      updatedData.images = images;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updatedData,
      { returnDocument: 'after' }
    );

    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}


