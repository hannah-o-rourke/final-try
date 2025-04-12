import { NextResponse } from 'next/server';
import { sendSMS } from '@/lib/twilio';

export async function POST(request: Request) {
  try {
    const { phoneNumber, message, mediaUrls } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { success: false, error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Send SMS with optional media
    await sendSMS(message, phoneNumber, mediaUrls);

    return NextResponse.json({ success: true, message: 'SMS sent successfully' });
  } catch (error) {
    console.error('Error in send-sms route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Get phone number, message and mediaUrl from URL parameters
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');
    const message = searchParams.get('message');
    const mediaUrl = searchParams.get('mediaUrl');
    
    // Parse multiple media URLs if provided as comma-separated list
    const mediaUrls = mediaUrl ? mediaUrl.split(',') : undefined;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { success: false, error: 'Phone number and message are required as query parameters' },
        { status: 400 }
      );
    }

    // Send SMS with optional media
    await sendSMS(message, phoneNumber, mediaUrls);

    return NextResponse.json({ success: true, message: 'SMS sent successfully' });
  } catch (error) {
    console.error('Error in send-sms route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
} 