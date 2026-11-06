import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { mediaService, StorageBucket } from '@/services/mediaService';
import { formatBytes, OptimizationResult } from '@/utils/imageOptimizer';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ImageDropzoneProps {
  onUploadSuccess: (urls: string[]) => void;
  bucket?: StorageBucket;
  multiple?: boolean;
  className?: string;
  label?: string;
}

export function ImageDropzone({
  onUploadSuccess,
  bucket = 'products',
  multiple = true,
  className = '',
  label = 'Drag & drop image(s) here or click to browse'
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<OptimizationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;

    const uploadedUrls: string[] = [];
    let successCount = 0;
    setLastResult(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        toast.error(`File "${file.name}" is not an image.`);
        continue;
      }

      try {
        setStatusText(`Optimizing ${i + 1}/${files.length}...`);
        
        const item = await mediaService.uploadFile(
          file, 
          bucket, 
          {}, 
          (step, stats) => {
            if (step === 'optimizing') {
              setStatusText(`Optimizing image (${file.name})...`);
            } else if (step === 'uploading') {
              setStatusText(`Uploading optimized WebP (${file.name})...`);
              if (stats) setLastResult(stats);
            } else if (step === 'complete') {
              setStatusText(`Upload complete!`);
            }
          }
        );

        if (item?.url) {
          uploadedUrls.push(item.url);
          successCount++;
        }
      } catch (err: any) {
        console.error('Error uploading file:', err);
        toast.error(err.message || `Failed to upload ${file.name}`);
      }
    }

    setStatusText(null);
    queryClient.invalidateQueries({ queryKey: ['media'] });

    if (uploadedUrls.length > 0) {
      toast.success(`Uploaded ${successCount} optimized image(s)!`);
      onUploadSuccess(uploadedUrls);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      handleFiles(multiple ? filesArray : [filesArray[0]]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      handleFiles(multiple ? filesArray : [filesArray[0]]);
    }
  };

  const isProcessing = !!statusText;

  return (
    <div className="space-y-2">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all ${
          isProcessing ? 'pointer-events-none opacity-80 border-primary bg-primary/5' : 'cursor-pointer'
        } ${
          isDragging
            ? 'border-primary bg-primary/10 scale-[1.01]'
            : 'border-border/80 hover:border-foreground hover:bg-secondary/40'
        } ${className}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple={multiple}
          disabled={isProcessing}
          className="hidden"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-2 text-primary py-2">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-wider">{statusText}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-12 h-12 rounded-full bg-secondary/80 flex items-center justify-center text-foreground mb-1">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">Auto-compressed to WebP (Max 15MB)</p>
          </div>
        )}
      </div>

      {/* Real Optimization Statistics Callout */}
      {lastResult && lastResult.savedPercentage > 0 && (
        <div className="p-3 border rounded-xl bg-emerald-500/10 border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Image auto-optimized to WebP</span>
          </div>
          <div className="flex items-center gap-3 font-mono font-semibold">
            <span>Original: {formatBytes(lastResult.originalSize)}</span>
            <span>→</span>
            <span>Optimized: {formatBytes(lastResult.optimizedSize)}</span>
            <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
              Saved {lastResult.savedPercentage}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
