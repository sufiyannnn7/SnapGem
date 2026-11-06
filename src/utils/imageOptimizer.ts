export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.80 - 0.85
  bucket?: string;
  preserveGif?: boolean;
}

export interface OptimizationResult {
  file: File;
  originalSize: number;
  optimizedSize: number;
  savedBytes: number;
  savedPercentage: number;
  width: number;
  height: number;
  format: string;
}

const MAX_ORIGINAL_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Format raw byte size into human readable string (e.g. 2.4 MB, 380 KB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get recommended maximum dimensions for different storage buckets
 */
export function getMaxDimensionsForBucket(bucket?: string): { maxWidth: number; maxHeight: number } {
  switch (bucket) {
    case 'banners':
      return { maxWidth: 1920, maxHeight: 1080 };
    case 'categories':
      return { maxWidth: 1200, maxHeight: 1200 };
    case 'logos':
      return { maxWidth: 1000, maxHeight: 1000 };
    case 'favicon':
      return { maxWidth: 512, maxHeight: 512 };
    case 'cms':
      return { maxWidth: 1600, maxHeight: 1600 };
    case 'products':
    default:
      return { maxWidth: 1600, maxHeight: 1600 };
  }
}

/**
 * Browser-Side Image Optimizer
 * Converts uploaded images to WebP format, resizes within aspect ratio, and reduces file size
 * BEFORE uploading to Supabase Storage.
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizationResult> {
  const originalSize = file.size;

  // 1. Validate File Type Security
  if (!file.type || (!file.type.startsWith('image/') && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()))) {
    throw new Error(`File "${file.name}" is not a valid image format.`);
  }

  // 2. Validate Original File Size (15 MB Max)
  if (originalSize > MAX_ORIGINAL_SIZE_BYTES) {
    throw new Error(`Image "${file.name}" is too large (${formatBytes(originalSize)}). Please select an image below 15 MB.`);
  }

  // 3. Preserve GIF Animation
  if (file.type.toLowerCase() === 'image/gif' && options.preserveGif !== false) {
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      savedBytes: 0,
      savedPercentage: 0,
      width: 0,
      height: 0,
      format: 'image/gif'
    };
  }

  // 4. Determine Max Dimensions
  const bucketDims = getMaxDimensionsForBucket(options.bucket);
  const maxWidth = options.maxWidth || bucketDims.maxWidth;
  const maxHeight = options.maxHeight || bucketDims.maxHeight;
  const quality = options.quality || 0.82;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const naturalWidth = img.naturalWidth || img.width;
      const naturalHeight = img.naturalHeight || img.height;

      // 5. Calculate Scale (DO NOT UPSCALE if image is already smaller)
      let targetWidth = naturalWidth;
      let targetHeight = naturalHeight;

      if (naturalWidth > maxWidth || naturalHeight > maxHeight) {
        const ratio = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight);
        targetWidth = Math.round(naturalWidth * ratio);
        targetHeight = Math.round(naturalHeight * ratio);
      }

      // 6. Draw Image to Canvas
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to create 2D canvas context for image optimization.'));
        return;
      }

      // Preserve alpha channel transparency for PNG/WebP
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Helper to generate clean WebP File from canvas blob
      const createOptimizedFile = (blob: Blob, mimeType: string, extension: string) => {
        // Sanitize original base name
        const rawBase = file.name.replace(/\.[^/.]+$/, '');
        const sanitizedBase = rawBase
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 30);
        
        const timestamp = Date.now().toString(36);
        const uniqueName = `${sanitizedBase}-${timestamp}.${extension}`;

        const optimizedFile = new File([blob], uniqueName, {
          type: mimeType,
          lastModified: Date.now()
        });

        const optimizedSize = optimizedFile.size;
        
        // If optimization didn't reduce file size (e.g. image was already tiny), use original if smaller
        if (optimizedSize >= originalSize && targetWidth === naturalWidth && targetHeight === naturalHeight) {
          resolve({
            file,
            originalSize,
            optimizedSize: originalSize,
            savedBytes: 0,
            savedPercentage: 0,
            width: naturalWidth,
            height: naturalHeight,
            format: file.type
          });
          return;
        }

        const savedBytes = Math.max(0, originalSize - optimizedSize);
        const savedPercentage = Math.round((savedBytes / originalSize) * 100);

        resolve({
          file: optimizedFile,
          originalSize,
          optimizedSize,
          savedBytes,
          savedPercentage,
          width: targetWidth,
          height: targetHeight,
          format: mimeType
        });
      };

      // 7. Try converting to WebP
      canvas.toBlob(
        (webpBlob) => {
          if (webpBlob) {
            createOptimizedFile(webpBlob, 'image/webp', 'webp');
          } else {
            // Fallback to JPEG if WebP blob generation fails
            canvas.toBlob(
              (jpgBlob) => {
                if (jpgBlob) {
                  createOptimizedFile(jpgBlob, 'image/jpeg', 'jpg');
                } else {
                  // Final fallback to original file
                  resolve({
                    file,
                    originalSize,
                    optimizedSize: originalSize,
                    savedBytes: 0,
                    savedPercentage: 0,
                    width: naturalWidth,
                    height: naturalHeight,
                    format: file.type
                  });
                }
              },
              'image/jpeg',
              quality
            );
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image "${file.name}" for optimization.`));
    };

    img.src = objectUrl;
  });
}
