import { NextResponse } from 'next/server';
import { sendSMS } from '../../../lib/twilio';

export async function GET() {
  try {
    const testMessage = 'This is a test message from your Next.js application!';
    await sendSMS(testMessage);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test SMS sent successfully',
      details: {
        from: process.env.TWILIO_PHONE_NUMBER,
        to: process.env.TARGET_PHONE_NUMBER
      }
    });
  } catch (error) {
    console.error('Error sending test SMS:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send test SMS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 