import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Product from '@/models/Product';
import User from '@/models/User';
import { translateText } from '@/lib/openai';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const isCustom = searchParams.get('isCustomService'); // 'true' | 'false'
    const sellerId = searchParams.get('sellerId');

    const query: any = {};

    // 1. Seller specific filtering
    if (sellerId) {
      query.sellerId = sellerId;
    }

    // 2. Category filtering
    if (category) {
      // Case-insensitive regex match to support subcategories
      query.category = { $regex: new RegExp(category, 'i') };
    }

    // 3. Custom services filter
    if (isCustom !== null && isCustom !== undefined) {
      if (isCustom === 'true') {
        query.isCustomService = true;
      } else if (isCustom === 'false') {
        query.isCustomService = false;
      }
    }

    // 4. Proximity location filter (City/Province of the seller)
    if (city && city !== 'All') {
      const usersInCity = await User.find({ location: city, role: 'seller' }).select('_id');
      const sellerIds = usersInCity.map(u => u._id);
      query.sellerId = { $in: sellerIds };
    }

    // Fetch and populate seller info
    const products = await Product.find(query)
      .populate('sellerId', 'name location bio phone')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { sellerId, title, description, shortDescription, price, images, category, isCustomService, faqs } = await request.json();

    if (!sellerId || !title || !price || !category) {
      return NextResponse.json({ error: 'Missing required product parameters.' }, { status: 400 });
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

    const product = await Product.create({
      sellerId,
      title: finalTitle,
      description: finalDescription,
      shortDescription: finalShortDescription,
      price: parseFloat(price),
      images: images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1594582760822-261e479a04a0?w=800&auto=format&fit=crop&q=80'],
      category,
      isCustomService: !!isCustomService,
      faqs: finalFaqs
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

