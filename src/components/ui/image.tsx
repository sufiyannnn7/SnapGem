import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string;
}

export function Image({ src, alt, className, fallbackClassName, ...props }: ImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || error) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-muted text-muted-foreground", className, fallbackClassName)}>
        <ImageOff className="h-10 w-10 mb-2 opacity-50" />
        <span className="text-xs font-medium uppercase tracking-wider">{alt || 'Image not found'}</span>
      </div>
    );
  }

  return (
    <>
      <div className={cn("absolute inset-0 animate-pulse bg-muted", className, loaded ? "hidden" : "block")} />
      <img
        src={src}
        alt={alt}
        className={cn(className, !loaded ? "opacity-0" : "opacity-100 transition-opacity duration-300")}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        {...props}
      />
    </>
  );
}
