import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const messageSid = data.get('MessageSid');
    const from = data.get('From');
    const body = data.get('Body');

    console.log('Received message:', {
      messageSid,
      from,
      body
    });

    // Create TwiML response
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Thank you for your message! We received it.');

    // Return TwiML response
    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 