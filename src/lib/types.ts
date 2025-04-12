export interface Message {
  id: string;
  content: string;
  image_paths?: string[] | null;
  image_urls?: string[] | null;
  image_url?: string | string[] | null; // For backward compatibility
  sent?: boolean;
  sent_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UploadResult {
  path: string;
  url: string;
} 