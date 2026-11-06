import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService, StorageBucket } from '@/services/mediaService';
import { formatBytes, OptimizationResult } from '@/utils/imageOptimizer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Copy, FileImage, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function MediaLibrary() {
  const [selectedBucket, setSelectedBucket] = useState<StorageBucket | 'all'>('all');
  const [uploadStatusText, setUploadStatusText] = useState<string | null>(null);
  const [lastStats, setLastStats] = useState<OptimizationResult | null>(null);
  const queryClient = useQueryClient();

  const { data: mediaItems = [], isLoading } = useQuery({
    queryKey: ['media_library', selectedBucket],
    queryFn: () => mediaService.getMedia(selectedBucket)
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, url, folder }: { id: string, url: string, folder: string }) => mediaService.deleteMedia(id, url, folder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media_library'] });
      toast.success('File deleted successfully');
    },
    onError: (e: any) => toast.error(`Failed to delete: ${e.message}`)
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const targetBucket: StorageBucket = selectedBucket === 'all' ? 'products' : selectedBucket;

    try {
      const item = await mediaService.uploadFile(
        file, 
        targetBucket, 
        {},
        (step, stats) => {
          if (step === 'optimizing') setUploadStatusText(`Optimizing ${file.name}...`);
          else if (step === 'uploading') {
            setUploadStatusText(`Uploading WebP (${file.name})...`);
            if (stats) setLastStats(stats);
          }
        }
      );

      queryClient.invalidateQueries({ queryKey: ['media_library'] });

      if (item?.optimizationStats && item.optimizationStats.savedPercentage > 0) {
        toast.success(`Uploaded to ${targetBucket}! Saved ${item.optimizationStats.savedPercentage}% storage (${formatBytes(item.optimizationStats.originalSize)} → ${formatBytes(item.optimizationStats.optimizedSize)})`);
      } else {
        toast.success(`File uploaded to ${targetBucket} bucket`);
      }
    } catch (error: any) {
      toast.error('Upload failed: ' + (error.message || 'File error'));
    } finally {
      setUploadStatusText(null);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const isUploading = !!uploadStatusText;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Media Library</h2>
          <p className="text-muted-foreground mt-2">Manage files across Supabase Storage buckets (products, categories, banners, logos, cms).</p>
        </div>
        
        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <label htmlFor="file-upload">
            <Button asChild disabled={isUploading}>
              <span className="cursor-pointer">
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {uploadStatusText || 'Upload File'}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Real Compression Statistics Banner */}
      {lastStats && lastStats.savedPercentage > 0 && (
        <div className="p-4 border rounded-2xl bg-emerald-500/10 border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Latest Image Optimization Result</span>
          </div>
          <div className="flex items-center gap-3 font-mono font-semibold">
            <span>Original: {formatBytes(lastStats.originalSize)}</span>
            <span>→</span>
            <span>Optimized: {formatBytes(lastStats.optimizedSize)}</span>
            <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
              Saved {lastStats.savedPercentage}%
            </span>
          </div>
        </div>
      )}

      {/* Bucket Filter Tabs */}
      <div className="flex flex-wrap gap-2 bg-secondary/30 p-1.5 rounded-xl border">
        {(['all', 'products', 'categories', 'banners', 'logos', 'cms'] as const).map((b) => (
          <button
            key={b}
            onClick={() => setSelectedBucket(b)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-colors ${
              selectedBucket === b 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {b === 'all' ? 'All Buckets' : b}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="capitalize">
            {selectedBucket === 'all' ? 'All Storage Files' : `${selectedBucket} Bucket`}
          </CardTitle>
          <CardDescription>
            Images are auto-compressed to WebP before storing in Supabase Storage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : mediaItems.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl border-border">
              <FileImage className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-1">No media files in this bucket</h3>
              <p className="text-muted-foreground text-sm mb-4">Upload an image to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {mediaItems.map((item: any) => (
                <div key={item.id || item.url} className="group relative aspect-square border rounded-xl overflow-hidden bg-secondary/30 flex items-center justify-center">
                  <img 
                    src={item.url} 
                    alt={item.file_name || 'Media'} 
                    className="object-cover w-full h-full"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="w-24 gap-2 text-xs h-8"
                      onClick={() => copyToClipboard(item.url)}
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="w-24 gap-2 text-xs h-8"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this image?')) {
                          deleteMutation.mutate({ id: item.id, url: item.url, folder: item.folder || 'products' });
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                  </div>
                  
                  {/* Bucket Tag & File Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-white text-[11px] truncate flex justify-between items-center">
                    <span className="truncate">{item.file_name}</span>
                    <span className="text-[9px] uppercase px-1 rounded bg-zinc-700 shrink-0 ml-1">{item.folder || 'products'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
