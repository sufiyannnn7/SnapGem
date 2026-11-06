import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface MediaItem {
  id: string;
  url: string;
  folder: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  alt_text?: string;
  created_at: string;
}

const BUCKET_NAME = 'media_library';

export const storageService = {
  /**
   * Upload a file to Supabase Storage and create a record in the media_library table.
   */
  async uploadFile(file: File, folder: string = 'uncategorized'): Promise<MediaItem> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file to storage:', uploadError);
      throw new Error(uploadError.message);
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    // 3. Save to media_library table
    const { data: record, error: dbError } = await supabase
      .from('media_library')
      .insert({
        url: publicUrl,
        folder,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving media record:', dbError);
      throw new Error(dbError.message);
    }

    return record;
  },

  /**
   * Delete a file from Supabase Storage and remove its record.
   */
  async deleteFile(id: string, url: string): Promise<void> {
    try {
      // Extract the path from the URL.
      // E.g., https://.../storage/v1/object/public/media_library/folder/file.jpg
      // Path is 'folder/file.jpg'
      const urlParts = url.split(`${BUCKET_NAME}/`);
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([filePath]);
          
        if (storageError) {
           console.error('Failed to remove from storage, continuing to delete record', storageError);
        }
      }

      const { error: dbError } = await supabase
        .from('media_library')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
    } catch (err) {
      console.error('Error deleting file:', err);
      throw err;
    }
  },

  /**
   * Fetch all media items with optional folder filtering
   */
  async getMedia(folder?: string): Promise<MediaItem[]> {
    let query = supabase.from('media_library').select('*').order('created_at', { ascending: false });
    
    if (folder && folder !== 'all') {
      query = query.eq('folder', folder);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching media:', error);
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Get unique folders currently in use
   */
  async getFolders(): Promise<string[]> {
    // In PostgreSQL, to get distinct we often just fetch all and map, or we could create an RPC.
    // Given the scale, fetching and extracting unique folders is fine for now, 
    // or we can just fetch the folder column.
    const { data, error } = await supabase
      .from('media_library')
      .select('folder');
      
    if (error) {
      console.error('Error fetching folders:', error);
      return [];
    }

    const folders = new Set(data.map(item => item.folder));
    return Array.from(folders);
  }
};
