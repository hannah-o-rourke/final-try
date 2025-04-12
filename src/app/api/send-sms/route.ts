import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendSMS } from '@/lib/twilio';

export async function GET() {
  try {
    // Fetch data from Supabase
    const { data, error } = await supabase
      .from('memories_final')
      .select('*')
      .limit(1);

    if (error) {
      throw error;
    }

    // Format the message
    const message = `Daily Update: ${JSON.stringify(data)}`;

    // Send SMS
    await sendSMS(message);

    return NextResponse.json({ success: true, message: 'SMS sent successfully' });
  } catch (error) {
    console.error('Error in send-sms route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
} 