import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const messageId = formData.get('messageId') as string | null;
    const message = formData.get('message') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Generate a folder path based on date and optional message ID
    const date = new Date();
    const folderPath = messageId 
      ? `messages/${messageId}` 
      : `uploads/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

    // Upload the file to Supabase Storage
    const { path, url } = await uploadFile(file, `${folderPath}/${file.name}`);

    let finalMessageId = messageId;

    // If a message text and ID were provided, create or update a message in the database
    if (message && messageId) {
      const { error } = await supabase
        .from('messages')
        .upsert({
          id: messageId,
          content: message,
          image_paths: [path],
          image_urls: [url],
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating message:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to create message' },
          { status: 500 }
        );
      }
    } 
    // If only a message text was provided, create a new message
    else if (message) {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: message,
          image_paths: [path],
          image_urls: [url]
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating message:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to create message' },
          { status: 500 }
        );
      }

      finalMessageId = data?.id;
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        path,
        url,
        messageId: finalMessageId
      }
    });
  } catch (error) {
    console.error('Error in upload-image route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Handle uploading multiple files
export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const messageId = formData.get('messageId') as string | null;
    const message = formData.get('message') as string | null;
    
    // Get all files from the form data
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file') && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    // Generate a folder path based on date and optional message ID
    const date = new Date();
    const folderPath = messageId 
      ? `messages/${messageId}` 
      : `uploads/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

    // Upload all files and collect paths and URLs
    const uploadResults = await Promise.all(
      files.map(file => uploadFile(file, `${folderPath}/${file.name}`))
    );

    const paths = uploadResults.map(result => result.path);
    const urls = uploadResults.map(result => result.url);

    let finalMessageId = messageId;

    // If a message text and ID were provided, create or update a message
    if (message && messageId) {
      const { error } = await supabase
        .from('messages')
        .upsert({
          id: messageId,
          content: message,
          image_paths: paths,
          image_urls: urls,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating message:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update message' },
          { status: 500 }
        );
      }
    } 
    // If only a message text was provided, create a new message
    else if (message) {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: message,
          image_paths: paths,
          image_urls: urls
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating message:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to create message' },
          { status: 500 }
        );
      }

      finalMessageId = data?.id;
    }

    return NextResponse.json({
      success: true,
      message: `${files.length} files uploaded successfully`,
      data: {
        paths,
        urls,
        messageId: finalMessageId
      }
    });
  } catch (error) {
    console.error('Error in upload-image route (PUT):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload files' },
      { status: 500 }
    );
  }
} 