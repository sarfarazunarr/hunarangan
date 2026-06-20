import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Order from '@/models/Order';
import PayoutRequest from '@/models/PayoutRequest';
import { queryAIFinder } from '@/lib/openai';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { query, lang, context, sellerId, userId } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Missing query parameter.' }, { status: 400 });
    }

    const language = lang || 'en';

    // 1. Process custom seller context queries (Sales Stats / Payouts)
    if (context === 'seller' && sellerId) {
      const lowercaseQuery = query.toLowerCase();
      const isSalesQuery = lowercaseQuery.includes('order') || lowercaseQuery.includes('sale') || lowercaseQuery.includes('فروخت') || lowercaseQuery.includes('آرڈر');
      const isBalanceQuery = lowercaseQuery.includes('balance') || lowercaseQuery.includes('payout') || lowercaseQuery.includes('رقم') || lowercaseQuery.includes('بیلنس');

      if (isSalesQuery || isBalanceQuery) {
        const sellerOrders = await Order.find({ sellerId });
        const count = sellerOrders.length;
        
        let totalSales = sellerOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

        if (isSalesQuery) {
          const responseText = language === 'ur'
            ? `آپ کی دکان پر کل ${count} آرڈرز موصول ہوئے ہیں، جن کی کل مالیت ${totalSales.toLocaleString()} روپے ہے۔`
            : language === 'sd'
            ? `توهان جي دڪان تي ڪل ${count} آرڊر مليا آهن، جن جي ڪل قيمت ${totalSales.toLocaleString()} رپيا آهي.`
            : `Your shop has received ${count} orders total, amounting to a total sales volume of Rs. ${totalSales.toLocaleString()}.`;

          return NextResponse.json({
            action: 'info',
            responseText: { en: responseText, ur: responseText, sd: responseText }
          });
        } else {
          // Calculate actual balance
          const releasedOrders = await Order.find({ sellerId, paymentStatus: 'Released_To_Seller' });
          const totalReleased = releasedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
          
          const requestedPayouts = await PayoutRequest.find({ sellerId, status: { $in: ['Pending', 'Approved'] } });
          const totalRequested = requestedPayouts.reduce((sum, r) => sum + (r.amount || 0), 0);
          
          const availableBalance = Math.max(0, totalReleased - totalRequested);

          const responseText = language === 'ur'
            ? `آپ کا دستیاب بیلنس ${availableBalance.toLocaleString()} روپے ہے۔ آپ اپنی دکان کے پینل سے رقم نکلوانے کی درخواست کر سکتے ہیں۔`
            : language === 'sd'
            ? `توهان جو اڪائونٽ بيلنس ${availableBalance.toLocaleString()} رپيا آهي. توهان پنهنجي دڪان جي پينل مان رقم منتقل ڪرڻ جي درخواست ڪري سگهو ٿا.`
            : `Your current available balance is Rs. ${availableBalance.toLocaleString()}. You can request a payout transfer directly from your Seller Panel.`;

          return NextResponse.json({
            action: 'info',
            responseText: { en: responseText, ur: responseText, sd: responseText }
          });
        }
      }
    }

    // 2. Process custom buyer context queries (Package Stepper Lookup)
    if (context === 'buyer' && userId) {
      const lowercaseQuery = query.toLowerCase();
      const isOrderQuery = lowercaseQuery.includes('order') || lowercaseQuery.includes('kahan') || lowercaseQuery.includes('ترسیل') || lowercaseQuery.includes('آرڈر');

      if (isOrderQuery) {
        const buyerOrders = await Order.find({ buyerId: userId }).populate('productId').sort({ createdAt: -1 });
        const latestOrder = buyerOrders[0];

        let responseText = '';
        if (latestOrder) {
          const prodTitle = latestOrder.productId ? (latestOrder.productId.title[language] || latestOrder.productId.title.en) : latestOrder.customOfferDetails?.title || 'Handmade Item';
          responseText = language === 'ur'
            ? `آپ کا آرڈر "${prodTitle}" اس وقت "${latestOrder.deliveryStatus}" مرحلے میں ہے اور رقم ایسکرو میں محفوظ ہے۔`
            : language === 'sd'
            ? `توهان جو آرڊر "${prodTitle}" هن وقت "${latestOrder.deliveryStatus}" مرحلي ۾ آهي ۽ رقم ايسڪرو ۾ محفوظ آهي.`
            : `Your order for "${prodTitle}" is currently in "${latestOrder.deliveryStatus}" status. Escrow payment is secured.`;
        } else {
          responseText = language === 'ur'
            ? "ہمارے ریکارڈ کے مطابق آپ کا کوئی آرڈر فعال نہیں ہے۔ مصنوعات خریدنے کے لیے ایکسپلور کریں۔"
            : language === 'sd'
            ? "اسان جي رڪارڊ مطابق توهان جو ڪو به آرڊر چالو ناهي. شيون خريد ڪرڻ لاءِ ڳولا ڪريو."
            : "You do not have any active orders right now. Tap Explore to browse our catalog.";
        }

        return NextResponse.json({
          action: 'info',
          responseText: { en: responseText, ur: responseText, sd: responseText }
        });
      }
    }

    // 3. Standard trilingual FAQ / routing chatbot query
    const finderResult = await queryAIFinder(query, language);

    return NextResponse.json(finderResult);
  } catch (error: any) {
    console.error('Chatbot API route error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
