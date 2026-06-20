import { NextResponse } from 'next/server';
import { getSMSStatus } from '@/lib/sms';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const smsId = searchParams.get('smsId');

    if (!smsId) {
      return NextResponse.json({ error: 'Missing smsId parameter.' }, { status: 400 });
    }

    const status = await getSMSStatus(smsId);
    
    if (status) {
      return NextResponse.json({
        success: true,
        data: status
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Unable to retrieve status from SMS gateway.'
      }, { status: 502 });
    }
  } catch (error: any) {
    console.error('Fetch SMS status error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
