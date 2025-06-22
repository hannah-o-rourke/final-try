import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendSMS } from '@/lib/twilio';
import { getPublicUrl } from '@/lib/storage';
import { Message } from '@/lib/types';

export async function GET(request: Request) {
  try {
    // Get limit from URL parameters if provided
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1', 10);
    const targetPhoneNumber = searchParams.get('phoneNumber') || process.env.TARGET_PHONE_NUMBER;

    if (!targetPhoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Target phone number is required as a query parameter or in environment variables' },
        { status: 400 }
      );
    }

    // Fetch messages that haven't been sent yet
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('sent', false) // Assuming you have a 'sent' column to track which messages have been sent
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch messages from Supabase' },
        { status: 500 }
      );
    }
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new messages to send',
        count: 0,
        messages
      });
    }

    // Process each message
    const results = await Promise.all(
      messages.map(async (message: Message) => {
        // Check if the message has images
        let mediaUrls: string[] = [];
        
        // First check for image URLs that are already stored
        if (message.image_urls && Array.isArray(message.image_urls) && message.image_urls.length > 0) {
          mediaUrls = message.image_urls;
        } 
        // If we have image paths but no URLs, generate the public URLs
        else if (message.image_paths && Array.isArray(message.image_paths) && message.image_paths.length > 0) {
          mediaUrls = message.image_paths.map((path: string) => getPublicUrl(path));
          
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
          // Send the SMS
          const twilioResponse = await sendSMS(
            message.content, 
            targetPhoneNumber, 
            mediaUrls.length > 0 ? mediaUrls : undefined
          );

          // Update the message status in Supabase
          const { error: updateError } = await supabase
            .from('messages')
            .update({ 
              sent: true, 
              sent_at: new Date().toISOString(),
              // Store the final URLs that were sent
              image_urls: mediaUrls.length > 0 ? mediaUrls : null
            })
            .eq('id', message.id);

          if (updateError) {
            console.error('Error updating message status:', updateError);
          }

          return {
            id: message.id,
            content: message.content,
            success: true,
            mediaCount: mediaUrls.length,
            twilioMessageId: twilioResponse.sid
          };
        } catch (error) {
          console.error(`Error sending message ${message.id}:`, error);
          return {
            id: message.id,
            content: message.content,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    // Prepare response summary
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} messages. ${successCount} succeeded, ${failureCount} failed.`,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Error in scheduled-sms route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process scheduled SMS' },
      { status: 500 }
    );
  }
} 
