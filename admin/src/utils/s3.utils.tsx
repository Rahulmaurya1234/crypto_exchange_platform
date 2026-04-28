// admin/src/utils/s3.utils.tsx
import { store } from '../store/index'; // Import your Redux store
import { authApi } from '../store/api/authApi';

/**
 * Extract S3 object key from full S3 URL
 * Example: "https://bucket.s3.region.amazonaws.com/trades/123/payment.jpg"
 * Returns: "trades/123/payment.jpg"
 */
export function extractS3Key(s3Url: string): string | null {
  if (!s3Url) return null;

  try {
    // Pattern: https://bucket.s3.region.amazonaws.com/key
    const match = s3Url.match(/\.s3\.[^.]+\.amazonaws\.com\/(.+)$/);
    if (match) return decodeURIComponent(match[1]);

    // Pattern: https://account.r2.cloudflarestorage.com/bucket/key
    const r2Match = s3Url.match(/\.r2\.cloudflarestorage\.com\/[^/]+\/(.+)$/);
    if (r2Match) return decodeURIComponent(r2Match[1]);

    // If not an S3 URL, return as-is
    if (!s3Url.startsWith('http')) return s3Url;

    return null;
  } catch (err) {
    console.error('Failed to extract S3 key:', err);
    return null;
  }
}

/**
 * Check if URL is an S3 URL
 */
export function isS3Url(url: string): boolean {
  if (!url) return false;
  return (
    (url.includes('.s3.') && url.includes('.amazonaws.com')) ||
    url.includes('.r2.cloudflarestorage.com')
  );
}

/**
 * Get signed URL for viewing S3 object using RTK Query
 */
export async function getSignedUrlForViewing(s3Url: string): Promise<string> {
  if (!s3Url) return s3Url;

  // If already signed, return as-is
  if (s3Url.includes('X-Amz-Signature') || s3Url.includes('Signature=')) {
    return s3Url;
  }

  // If not S3 URL, return as-is
  if (!isS3Url(s3Url)) {
    return s3Url;
  }

  const key = extractS3Key(s3Url);
  if (!key) {
    console.warn('Could not extract S3 key from:', s3Url);
    return s3Url;
  }

  try {
    // Dispatch the RTK Query endpoint manually
    const result = await store.dispatch(
      authApi.endpoints.getSignedUrl.initiate(key)
    );

    if ('data' in result && result.data?.url) {
      return result.data.url;
    }

    console.warn('No signed URL in response, using original');
    return s3Url;
  } catch (err: any) {
    console.error('Failed to get signed URL:', err);
    return s3Url; // Fallback to original
  }
}