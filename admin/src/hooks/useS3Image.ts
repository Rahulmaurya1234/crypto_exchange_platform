// admin/src/hooks/useS3Image.ts
import { useState, useEffect } from 'react';
import { useLazyGetSignedUrlQuery } from '../store/api/authApi';
import { extractS3Key, isS3Url } from '../utils/s3.utils';

interface UseS3ImageResult {
  url: string;
  loading: boolean;
  error: boolean;
}

/**
 * Hook to automatically fetch and cache signed URLs for S3 images
 * 
 * @param s3Url - The S3 URL to load
 * @param enabled - Whether to fetch the URL (default: true)
 * @returns Object with url, loading, and error states
 * 
 * @example
 * const { url, loading, error } = useS3Image(kyc.documents[0].frontImageUrl);
 * 
 * if (loading) return <Spinner />;
 * if (error) return <ErrorIcon />;
 * return <img src={url} alt="Document" />;
 */
export function useS3Image(
  s3Url: string | undefined,
  enabled: boolean = true
): UseS3ImageResult {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const [trigger, { data, isLoading, isError }] = useLazyGetSignedUrlQuery();

  useEffect(() => {
    if (!s3Url || !enabled) {
      setUrl('');
      setLoading(false);
      setError(false);
      return;
    }

    // If already signed, use as-is
    if (s3Url.includes('X-Amz-Signature') || s3Url.includes('Signature=')) {
      setUrl(s3Url);
      setLoading(false);
      setError(false);
      return;
    }

    // If not S3 URL, use as-is
    if (!isS3Url(s3Url)) {
      setUrl(s3Url);
      setLoading(false);
      setError(false);
      return;
    }

    // Extract key and fetch signed URL
    const key = extractS3Key(s3Url);
    if (!key) {
      console.warn('Could not extract S3 key from:', s3Url);
      setUrl(s3Url);
      setError(true);
      return;
    }

    setLoading(true);
    trigger(key);
  }, [s3Url, enabled, trigger]);

  useEffect(() => {
    if (data?.url) {
      setUrl(data.url);
      setLoading(false);
      setError(false);
    } else if (isError) {
      setUrl(s3Url || '');
      setLoading(false);
      setError(true);
    } else if (isLoading) {
      setLoading(true);
    }
  }, [data, isError, isLoading, s3Url]);

  return { url, loading, error };
}

/**
 * Hook to load multiple S3 images at once
 * 
 * @param s3Urls - Array of S3 URLs to load
 * @returns Array of results matching the input order
 * 
 * @example
 * const images = useS3Images([
 *   kyc.documents[0].frontImageUrl,
 *   kyc.documents[0].backImageUrl,
 *   kyc.documents[1].frontImageUrl
 * ]);
 * 
 * return images.map((img, i) => (
 *   <img key={i} src={img.url} loading={img.loading} />
 * ));
 */
export function useS3Images(s3Urls: (string | undefined)[]): UseS3ImageResult[] {
  const [results, setResults] = useState<UseS3ImageResult[]>(
    s3Urls.map(() => ({ url: '', loading: true, error: false }))
  );

  const [trigger] = useLazyGetSignedUrlQuery();

  useEffect(() => {
    const loadImages = async () => {
      const newResults = await Promise.all(
        s3Urls.map(async (s3Url, index) => {
          if (!s3Url) {
            return { url: '', loading: false, error: true };
          }

          // If already signed, use as-is
          if (s3Url.includes('X-Amz-Signature') || s3Url.includes('Signature=')) {
            return { url: s3Url, loading: false, error: false };
          }

          // If not S3 URL, use as-is
          if (!isS3Url(s3Url)) {
            return { url: s3Url, loading: false, error: false };
          }

          // Extract key and fetch signed URL
          const key = extractS3Key(s3Url);
          if (!key) {
            return { url: s3Url, loading: false, error: true };
          }

          try {
            const result = await trigger(key).unwrap();
            return { url: result.url, loading: false, error: false };
          } catch (err) {
            console.error('Failed to load image:', err);
            return { url: s3Url, loading: false, error: true };
          }
        })
      );

      setResults(newResults);
    };

    loadImages();
  }, [s3Urls.join(','), trigger]);

  return results;
}