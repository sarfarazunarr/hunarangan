import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import InvestmentRequest from '@/models/InvestmentRequest';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');
    const admin = searchParams.get('admin');

    if (admin === 'true') {
      // Fetch all investment requests for admin dashboard
      const requests = await InvestmentRequest.find({})
        .populate('sellerId', 'name phone location')
        .sort({ createdAt: -1 });

      return NextResponse.json({ success: true, requests });
    }

    if (!sellerId) {
      return NextResponse.json({ error: 'Missing sellerId parameter.' }, { status: 400 });
    }

    // Fetch requests for a specific seller
    const requests = await InvestmentRequest.find({ sellerId }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      requests
    });
  } catch (error: any) {
    console.error('Fetch investments error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { sellerId, name, cnic, phone, businessName, businessDetails, amountRequested, purpose } = await request.json();

    if (!sellerId || !name || !cnic || !phone || !businessName || !businessDetails || !amountRequested || !purpose) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    const amount = parseFloat(amountRequested);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid funding request amount.' }, { status: 400 });
    }

    // Create investment request
    const newRequest = await InvestmentRequest.create({
      sellerId,
      name,
      cnic,
      phone,
      businessName,
      businessDetails,
      amountRequested: amount,
      purpose,
      status: 'Pending'
    });

    return NextResponse.json({ success: true, investmentRequest: newRequest });
  } catch (error: any) {
    console.error('Create investment request error:', error);
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
      return NextResponse.json({ error: 'Invalid investment status.' }, { status: 400 });
    }

    const investmentReq = await InvestmentRequest.findById(requestId);
    if (!investmentReq) {
      return NextResponse.json({ error: 'Investment request not found.' }, { status: 404 });
    }

    investmentReq.status = status;
    investmentReq.resolvedAt = new Date();
    await investmentReq.save();

    return NextResponse.json({ success: true, investmentRequest: investmentReq });
  } catch (error: any) {
    console.error('Resolve investment error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
