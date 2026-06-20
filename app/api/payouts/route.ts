import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Order from '@/models/Order';
import PayoutRequest from '@/models/PayoutRequest';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');
    const admin = searchParams.get('admin');

    if (admin === 'true') {
      // Fetch all payout requests for admin dashboard
      const requests = await PayoutRequest.find({})
        .populate('sellerId', 'name phone location')
        .sort({ createdAt: -1 });

      return NextResponse.json({ success: true, requests });
    }

    if (!sellerId) {
      return NextResponse.json({ error: 'Missing sellerId parameter.' }, { status: 400 });
    }

    // 1. Calculate total released orders
    const releasedOrders = await Order.find({
      sellerId,
      paymentStatus: 'Released_To_Seller'
    });

    const totalReleased = releasedOrders.reduce((sum, order) => sum + (order.amount || 0), 0);

    // 2. Calculate total requested payouts (Pending or Approved)
    const requestedPayouts = await PayoutRequest.find({
      sellerId,
      status: { $in: ['Pending', 'Approved'] }
    });

    const totalRequested = requestedPayouts.reduce((sum, req) => sum + (req.amount || 0), 0);

    // 3. Available balance
    const availableBalance = Math.max(0, totalReleased - totalRequested);

    // 4. Get payout request history
    const history = await PayoutRequest.find({ sellerId }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      availableBalance,
      totalReleased,
      totalRequested,
      requests: history
    });
  } catch (error: any) {
    console.error('Fetch payouts error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { sellerId, amount, paymentDetails } = await request.json();

    if (!sellerId || !amount || !paymentDetails) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    const payoutAmount = parseFloat(amount);
    if (isNaN(payoutAmount) || payoutAmount <= 0) {
      return NextResponse.json({ error: 'Invalid payout amount.' }, { status: 400 });
    }

    // Calculate available balance to prevent over-drawing
    const releasedOrders = await Order.find({
      sellerId,
      paymentStatus: 'Released_To_Seller'
    });
    const totalReleased = releasedOrders.reduce((sum, order) => sum + (order.amount || 0), 0);

    const requestedPayouts = await PayoutRequest.find({
      sellerId,
      status: { $in: ['Pending', 'Approved'] }
    });
    const totalRequested = requestedPayouts.reduce((sum, req) => sum + (req.amount || 0), 0);

    const availableBalance = Math.max(0, totalReleased - totalRequested);

    if (payoutAmount > availableBalance) {
      return NextResponse.json({
        error: `Insufficient balance. Available is Rs. ${availableBalance}.`
      }, { status: 400 });
    }

    // Create payout request
    const newRequest = await PayoutRequest.create({
      sellerId,
      amount: payoutAmount,
      paymentDetails,
      status: 'Pending'
    });

    return NextResponse.json({ success: true, payoutRequest: newRequest });
  } catch (error: any) {
    console.error('Request payout error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const { requestId, status } = await request.json();

    if (!requestId || !status) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payout status.' }, { status: 400 });
    }

    const payoutReq = await PayoutRequest.findById(requestId);
    if (!payoutReq) {
      return NextResponse.json({ error: 'Payout request not found.' }, { status: 404 });
    }

    payoutReq.status = status;
    payoutReq.resolvedAt = new Date();
    await payoutReq.save();

    return NextResponse.json({ success: true, payoutRequest: payoutReq });
  } catch (error: any) {
    console.error('Resolve payout error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
