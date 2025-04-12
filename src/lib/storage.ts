import { supabase } from './supabase';

// The bucket name to use for uploads
const BUCKET_NAME = 'message-images';

/**
 * Upload a file to Supabase Storage
 * @param file The file to upload
 * @param path Optional path within the bucket
 * @returns The full path and public URL of the uploaded file
 */
export async function uploadFile(file: File, path?: string): Promise<{ path: string; url: string }> {
  try {
    // Generate a unique filename if not provided
    const filename = path || `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: publicUrl
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Upload multiple files to Supabase Storage
 * @param files Array of files to upload
 * @param basePath Optional base path for all files
 * @returns Array of objects containing the paths and URLs of the uploaded files
 */
export async function uploadMultipleFiles(
  files: File[],
  basePath?: string
): Promise<Array<{ path: string; url: string }>> {
  const uploadPromises = files.map(file => {
    const path = basePath ? `${basePath}/${file.name.replace(/\s+/g, '_')}` : undefined;
    return uploadFile(file, path);
  });

  return Promise.all(uploadPromises);
}

/**
 * Get a signed URL for a file in Supabase Storage that expires after a set time
 * @param path The path of the file in storage
 * @param expiresIn Expiration time in seconds (default: 60 minutes)
 * @returns The signed URL
 */
export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
}

/**
 * Get the public URL for a file in Supabase Storage
 * @param path The path of the file in storage
 * @returns The public URL
 */
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage
 * @param path The path of the file to delete
 * @returns Success status
 */
export async function deleteFile(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
} 