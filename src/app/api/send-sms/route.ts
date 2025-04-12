import { NextResponse } from 'next/server';
import { sendSMS } from '@/lib/twilio';

export async function POST(request: Request) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { success: false, error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Send SMS
    await sendSMS(message, phoneNumber);

    return NextResponse.json({ success: true, message: 'SMS sent successfully' });
  } catch (error) {
    console.error('Error in send-sms route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
} 