// client/src/components/SecureImage.tsx
import { useState, useEffect } from 'react';
import { getSignedUrlForViewing, isS3Url } from '../utils/s3.utils';

interface SecureImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onError?: (error: Error) => void;
  fallbackComponent?: React.ReactNode;
}

/**
 * SecureImage component that automatically handles S3 presigned URLs
 *
 * Usage:
 * <SecureImage
 *   src="https://bucket.s3.region.amazonaws.com/path/to/image.jpg"
 *   alt="Payment proof"
 *   className="w-full rounded-xl"
 * />
 */
export default function SecureImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  onError,
  fallbackComponent,
}: SecureImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!src) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // If it's an S3 URL, get signed URL
        if (isS3Url(src)) {
          const signed = await getSignedUrlForViewing(src);
          if (isMounted) {
            setSignedUrl(signed);
          }
        } else {
          // Not an S3 URL, use as-is
          if (isMounted) {
            setSignedUrl(src);
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load image');
        if (isMounted) {
          setError(error);
          onError?.(error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [src, onError]);

  if (error) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }
    return (
      <div className={`flex items-center justify-center bg-white/5 rounded-xl border-2 border-white/10 text-white/50 p-4 ${className}`}>
        <div className="text-center">
          <p className="text-sm mb-1">Failed to load image</p>
          <p className="text-xs text-white/30">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !signedUrl) {
    return (
      <div className={`flex items-center justify-center bg-white/5 rounded-xl border-2 border-white/10 ${className}`}>
        <div className="animate-pulse flex flex-col items-center gap-2 p-4">
          <div className="w-8 h-8 border-4 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Loading image...</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={signedUrl}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => {
        const imgError = new Error('Image failed to render');
        setError(imgError);
        onError?.(imgError);
      }}
    />
  );
}
