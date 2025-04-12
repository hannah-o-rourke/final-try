import { NextResponse } from 'next/server';
import { sendSMS } from '@/lib/twilio';

export async function GET() {
  try {
    const testMessage = 'This is your daily motivational message from the Newspeak House network!';
    const targetPhoneNumber = process.env.TARGET_PHONE_NUMBER!;
    
    // Example image URL - replace with an actual publicly accessible image URL
    const mediaUrl = 'https://newspeak.house/assets/lcpt-logo-b0013ce6892055718541b937d289526b76d9d0c697020488040e47d0982d8d81.png';
    
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
