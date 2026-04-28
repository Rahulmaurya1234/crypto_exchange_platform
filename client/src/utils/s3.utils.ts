// client/src/utils/s3.utils.ts
import api from '../api/axios';

/**
 * Extract S3 object key from full S3 URL
 * Example: "https://bucket.s3.region.amazonaws.com/trades/123/payment.jpg"
 * Returns: "trades/123/payment.jpg"
 */
export function extractS3Key(s3Url: string): string | null {
  if (!s3Url) return null;

  try {
    // Pattern 1: https://bucket.s3.region.amazonaws.com/key
    const match1 = s3Url.match(/\.s3\.[^.]+\.amazonaws\.com\/(.+)$/);
    if (match1) return decodeURIComponent(match1[1]);

    // Pattern 2: https://s3.region.amazonaws.com/bucket/key
    const match2 = s3Url.match(/s3\.[^.]+\.amazonaws\.com\/[^/]+\/(.+)$/);
    if (match2) return decodeURIComponent(match2[1]);

    // Pattern 3: Cloudflare R2 (Path Style)
    // https://<account>.r2.cloudflarestorage.com/<bucket>/key
    // or custom public URL
    const match3 = s3Url.match(/\.r2\.cloudflarestorage\.com\/[^/]+\/(.+)$/);
    if (match3) return decodeURIComponent(match3[1]);

    // Pattern 3: already just a key (no https)
    if (!s3Url.startsWith('http')) return s3Url;

    return null;
  } catch (err) {
    console.error('Failed to extract S3 key from URL:', s3Url, err);
    return null;
  }
}

/**
 * Fetch a presigned URL for viewing an S3 object
 * Uses the GET /api/v1/upload/:key endpoint
 */
export async function getSignedUrlForViewing(s3Url: string): Promise<string> {
  if (!s3Url) throw new Error('No S3 URL provided');

  // If it's already a presigned URL (contains signature), return as-is
  if (s3Url.includes('X-Amz-Signature') || s3Url.includes('Signature=')) {
    return s3Url;
  }

  const key = extractS3Key(s3Url);
  if (!key) throw new Error('Could not extract S3 key from URL');

  try {
    // Call backend to get signed URL
    const response = await api.get(`/api/v1/upload/${encodeURIComponent(key)}`);
    const signedUrl = response.data?.url || response.data?.data?.url;

    if (!signedUrl) throw new Error('No signed URL returned from server');

    return signedUrl;
  } catch (err: any) {
    console.error('Failed to get signed URL:', err);
    throw new Error(err?.response?.data?.message || 'Failed to load image');
  }
}

/**
 * Check if a URL is an S3 URL that needs signing
 */
export function isS3Url(url: string): boolean {
  if (!url) return false;
  return (
    (url.includes('.s3.') && url.includes('.amazonaws.com')) ||
    url.includes('.r2.cloudflarestorage.com')
  );
}
