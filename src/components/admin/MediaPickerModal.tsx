import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { mediaService, StorageBucket } from '@/services/mediaService';
import { Loader2, Check, Image as ImageIcon, Search, Upload, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ImageDropzone } from './ImageDropzone';
import { formatBytes, OptimizationResult } from '@/utils/imageOptimizer';

interface MediaPickerModalProps {
  onSelect: (url: string) => void;
  trigger?: React.ReactNode;
  title?: string;
  multiple?: boolean;
  defaultBucket?: StorageBucket;
}

export function MediaPickerModal({ 
  onSelect, 
  trigger, 
  title = "Select Media", 
  multiple = true,
  defaultBucket = 'products' 
}: MediaPickerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBucket, setSelectedBucket] = useState<StorageBucket>(defaultBucket);
  const [isUploadingMultiple, setIsUploadingMultiple] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<OptimizationResult | null>(null);
  const queryClient = useQueryClient();

  const { data: mediaItems = [], isLoading } = useQuery({
    queryKey: ['media', selectedBucket],
    queryFn: () => mediaService.getMedia(selectedBucket)
  });

  const handleMultipleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setIsUploadingMultiple(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        setUploadStatusText(`Optimizing ${i + 1}/${files.length}...`);
        
        const newItem = await mediaService.uploadFile(
          file, 
          selectedBucket,
          {},
          (step, stats) => {
            if (step === 'optimizing') setUploadStatusText(`Optimizing ${file.name}...`);
            else if (step === 'uploading') {
              setUploadStatusText(`Uploading ${file.name}...`);
              if (stats) setLastResult(stats);
            }
          }
        );

        if (newItem?.url) {
          onSelect(newItem.url);
          successCount++;
        }
      } catch (err: any) {
        console.warn('Individual image upload error:', err);
        toast.error(err.message || `Failed to upload ${file.name}`);
      }
    }

    setUploadStatusText(null);
    queryClient.invalidateQueries({ queryKey: ['media'] });
    toast.success(`Successfully optimized and uploaded ${successCount} file(s)!`);
    setIsUploadingMultiple(false);
    if (!multiple) setIsOpen(false);
  };

  const filteredMedia = mediaItems.filter((item: any) => 
    item.file_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (url: string) => {
    onSelect(url);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Select Image</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Images are automatically compressed to WebP format before storage upload.
          </DialogDescription>
        </DialogHeader>

        {/* Bucket Selector & Upload */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-2">
          <div className="flex flex-wrap gap-1 bg-secondary/50 p-1 rounded-lg w-full sm:w-auto">
            {(['products', 'categories', 'banners', 'logos', 'cms'] as StorageBucket[]).map((bucket) => (
              <button
                key={bucket}
                type="button"
                onClick={() => setSelectedBucket(bucket)}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                  selectedBucket === bucket 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {bucket}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              id="modal-image-upload"
              onChange={handleMultipleFileUpload}
              disabled={isUploadingMultiple}
            />
            <label htmlFor="modal-image-upload">
              <Button type="button" size="sm" variant="default" className="cursor-pointer" disabled={isUploadingMultiple} asChild>
                <span>
                  {isUploadingMultiple ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {uploadStatusText || 'Select Files'}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <ImageDropzone 
          bucket={selectedBucket}
          multiple={multiple}
          className="mb-3 py-3"
          label={`Drag & drop image(s) directly into [${selectedBucket}] bucket`}
          onUploadSuccess={(urls) => {
            urls.forEach(url => onSelect(url));
            if (!multiple && urls.length > 0) setIsOpen(false);
          }}
        />
        
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search media files..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-[250px] border rounded-xl p-4 bg-secondary/10">
          {isLoading ? (
            <div className="flex items-center justify-center h-full py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {filteredMedia.map((media: any) => (
                <div 
                  key={media.id || media.url} 
                  className="group relative rounded-xl border border-border bg-background overflow-hidden hover:border-primary cursor-pointer transition-all hover:ring-2 hover:ring-primary/50"
                  onClick={() => handleSelect(media.url)}
                >
                  <div className="aspect-square bg-secondary/20 relative flex items-center justify-center">
                    <img src={media.url} alt={media.file_name || 'Media'} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-primary text-primary-foreground rounded-full p-2 transform scale-75 group-hover:scale-100 transition-transform">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <div className="p-2 truncate text-xs font-medium text-center bg-secondary/10">
                    {media.file_name || 'Uploaded'}
                  </div>
                </div>
              ))}
              
              {filteredMedia.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  <ImageIcon className="mx-auto h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm">No images found in {selectedBucket} bucket.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
