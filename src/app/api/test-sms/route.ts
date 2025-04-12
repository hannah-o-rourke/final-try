import { NextResponse } from 'next/server';
import { sendSMS } from '@/lib/twilio';

export async function GET() {
  try {
    const testMessage = 'This is a test message with an image from your Next.js application!';
    const targetPhoneNumber = process.env.TARGET_PHONE_NUMBER!;
    
    // Example image URL - replace with an actual publicly accessible image URL
    const mediaUrl = 'https://images.unsplash.com/photo-1500622944204-b135684e99fd?q=80&w=1000';
    
    await sendSMS(testMessage, targetPhoneNumber, [mediaUrl]);

    return NextResponse.json({
      success: true,
      message: 'Test SMS with image sent successfully'
    });
  } catch (error) {
    console.error('Error in test-sms route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send test SMS' },
      { status: 500 }
    );
  }
} 