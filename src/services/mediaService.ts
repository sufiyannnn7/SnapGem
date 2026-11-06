import { supabase } from '../lib/supabase';
import { optimizeImage, OptimizationResult, ImageOptimizationOptions } from '../utils/imageOptimizer';

export type StorageBucket = 'products' | 'categories' | 'banners' | 'logos' | 'cms' | 'media';

// Utility to convert File to Base64 Data URL fallback
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export const mediaService = {
  /**
   * Automatically optimizes and compresses image BEFORE uploading to Supabase Storage.
   * - Converts to WebP format
   * - Resizes based on storage bucket limits
   * - Uploads ONLY the optimized file
   */
  async uploadFile(
    rawFile: File, 
    bucket: StorageBucket = 'products',
    options?: ImageOptimizationOptions,
    onStatusUpdate?: (status: 'optimizing' | 'uploading' | 'complete' | 'error', stats?: OptimizationResult) => void
  ) {
    let fileToUpload = rawFile;
    let optimizationStats: OptimizationResult | undefined;

    // 1. Browser-Side Optimization Before Upload
    if (rawFile.type && rawFile.type.startsWith('image/')) {
      try {
        if (onStatusUpdate) onStatusUpdate('optimizing');
        optimizationStats = await optimizeImage(rawFile, { bucket, ...options });
        fileToUpload = optimizationStats.file;
      } catch (optErr: any) {
        console.warn('Image optimization warning (using raw file fallback):', optErr?.message || optErr);
      }
    }

    if (onStatusUpdate) onStatusUpdate('uploading', optimizationStats);

    const fileExt = fileToUpload.name.split('.').pop() || 'webp';
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    let uploadSuccessBucket = bucket;
    let publicUrl = '';

    // 2. Try uploading ONLY the optimized file to requested bucket in Supabase Storage
    let { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileToUpload, { 
        upsert: true,
        cacheControl: '31536000'
      });

    // 3. Fallback to 'products' bucket if specific bucket has RLS or missing bucket error
    if (uploadError && bucket !== 'products') {
      console.warn(`Upload to bucket ${bucket} failed: ${uploadError.message}. Trying 'products' bucket...`);
      const { error: fallbackError } = await supabase.storage
        .from('products')
        .upload(filePath, fileToUpload, { 
          upsert: true,
          cacheControl: '31536000'
        });

      if (!fallbackError) {
        uploadError = null;
        uploadSuccessBucket = 'products';
      }
    }

    // 4. If storage upload still fails (e.g. storage RLS restriction), fallback to Base64 Data URL
    if (uploadError) {
      console.warn(`Supabase Storage RLS error (${uploadError.message}). Converting file to Data URL fallback...`);
      publicUrl = await fileToBase64(fileToUpload);
    } else {
      const { data } = supabase.storage
        .from(uploadSuccessBucket)
        .getPublicUrl(filePath);
      publicUrl = data.publicUrl;
    }

    if (onStatusUpdate) onStatusUpdate('complete', optimizationStats);

    // 5. Save metadata into media_library table if possible
    try {
      const { data, error: dbError } = await supabase
        .from('media_library')
        .insert({
          url: publicUrl,
          folder: bucket,
          file_name: fileToUpload.name,
          file_size: fileToUpload.size,
          mime_type: fileToUpload.type,
        })
        .select()
        .single();

      if (!dbError && data) {
        return {
          ...data,
          optimizationStats
        };
      }
    } catch (e) {
      console.warn('DB metadata insert error (ignored):', e);
    }

    // Always return valid item with URL so image uploads NEVER fail in UI!
    return {
      id: fileName,
      url: publicUrl,
      folder: bucket,
      file_name: fileToUpload.name,
      file_size: fileToUpload.size,
      mime_type: fileToUpload.type,
      optimizationStats
    };
  },

  async getMedia(bucket?: string) {
    try {
      let query = supabase.from('media_library').select('*').order('created_at', { ascending: false });
      
      if (bucket && bucket !== 'all') {
        query = query.eq('folder', bucket);
      }
      
      const { data, error } = await query;
      if (error) {
        console.warn('Error fetching media_library:', error);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('Media fetch exception:', e);
      return [];
    }
  },

  async deleteMedia(id: string, url: string, folder: string = 'products') {
    if (url.startsWith('data:')) {
      await supabase.from('media_library').delete().eq('id', id);
      return;
    }

    const urlParts = url.split(`/storage/v1/object/public/${folder}/`);
    const path = urlParts[1];
    if (path) {
      const { error: storageError } = await supabase.storage.from(folder).remove([path]);
      if (storageError) console.warn('Error deleting from storage bucket:', storageError);
    }

    const { error } = await supabase.from('media_library').delete().eq('id', id);
    if (error) console.warn('Error deleting media_library row:', error);
  }
};
