import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendSMS } from '@/lib/twilio';
import { getPublicUrl } from '@/lib/storage';
import { Message } from '@/lib/types';

// Helper function to fetch and send messages
async function fetchAndSendMessage(messageId: string | null, phoneNumber: string | null) {
  // Use the default phone number if none provided
  const targetPhone = phoneNumber || process.env.TARGET_PHONE_NUMBER;

  if (!targetPhone) {
    return {
      success: false,
      error: 'Phone number is required as a parameter or in environment variables',
      status: 400
    };
  }

  // Query to fetch message data
const query = messageId
  ? supabase.from('messages').select('*').eq('id', messageId)
  : supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(1);

const { data: messageData, error: messageError } = await query;


  if (messageError || !messageData || messageData.length === 0) {
    console.error('Error fetching message:', messageError);
    return {
      success: false,
      error: 'Failed to fetch message from Supabase',
      status: 500
    };
  }

  const message = messageData[0] as Message;

  // Check if the message has images
  let mediaUrls: string[] = [];
  
  // First check for image URLs that are already stored
  if (message.image_urls && Array.isArray(message.image_urls) && message.image_urls.length > 0) {
    mediaUrls = message.image_urls;
  } 
  // If we have image paths but no URLs, generate the public URLs
  else if (message.image_paths && Array.isArray(message.image_paths) && message.image_paths.length > 0) {
    mediaUrls = message.image_paths.map(path => getPublicUrl(path));
    
    // Update the message with the generated URLs for future use
    const { error: updateError } = await supabase
      .from('messages')
      .update({ image_urls: mediaUrls })
      .eq('id', message.id);
      
    if (updateError) {
      console.error('Error updating image URLs:', updateError);
    }
  }
  // Backward compatibility with old image_url field
  else if (message.image_url) {
    // If it's a string, add it to the mediaUrls array
    if (typeof message.image_url === 'string') {
      mediaUrls.push(message.image_url);
    } 
    // If it's an array, add all items to the mediaUrls array
    else if (Array.isArray(message.image_url)) {
      mediaUrls = message.image_url;
    }
  }

  try {
    // Send the SMS with media URLs if available
    const response = await sendSMS(message.content, targetPhone, mediaUrls.length > 0 ? mediaUrls : undefined);

    return {
      success: true,
      message: 'Message sent successfully',
      details: {
        messageId: message.id,
        content: message.content,
        imageUrls: mediaUrls,
        twilioResponse: response
      }
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: 'Failed to send SMS',
      status: 500
    };
  }
}

export async function GET(request: Request) {
  try {
    // Get message ID from URL parameters if provided, otherwise fetch the latest
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const phoneNumber = searchParams.get('phoneNumber');

    const result = await fetchAndSendMessage(messageId, phoneNumber);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in send-supabase-message route (GET):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get message ID and phone number from request body
    const { messageId, phoneNumber } = await request.json();

    const result = await fetchAndSendMessage(messageId, phoneNumber);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in send-supabase-message route (POST):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
} 
