// server/src/utils/s3.util.js
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

/**
 * Initialise the S3 client – only if the required env vars exist.
 */
const {
  // R2
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
  // AWS S3
  S3_BUCKET,
  S3_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
} = process.env;

const r2Configured =
  R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME;

const s3Configured =
  !r2Configured &&
  S3_BUCKET &&
  S3_REGION &&
  AWS_ACCESS_KEY_ID &&
  AWS_SECRET_ACCESS_KEY;

if (!r2Configured && !s3Configured) {
  console.warn(
    "⚠️  Remote storage (S3/R2) not fully configured – s3.util.js will throw if used."
  );
}

// Helper to get client and bucket
const getStorageConfig = () => {
  if (r2Configured) {
    return {
      client: new S3Client({
        region: "auto",
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        forcePathStyle: true, // Required for R2
        // Prevent SDK from adding checksums to the signature/URL
        requestChecksumCalculation: "WHEN_REQUIRED",
        responseChecksumValidation: "WHEN_REQUIRED",
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
      }),
      bucket: R2_BUCKET_NAME,
      publicUrlBase: R2_PUBLIC_URL,
      isR2: true,
    };
  }

  if (s3Configured) {
    return {
      client: new S3Client({
        region: S3_REGION,
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
      }),
      bucket: S3_BUCKET,
      publicUrlBase: `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`,
      isR2: false,
    };
  }

  throw new Error("Storage not configured");
};

/**
 * Returns a pre‑signed URL for an object stored in the bucket.
 *
 * @param {string} key – the object key inside the bucket (e.g. `kyc/abc123.png`)
 * @param {number} expiresInSec – how long the URL stays valid (default 300 s)
 * @returns {Promise<string>} – the signed URL
 */
export async function getObjectSignedUrl(key, expiresInSec = 300) {
  const { client, bucket } = getStorageConfig();

  // Strip bucket name from key if it's accidentally included
  // e.g., "cryptians/trades/..." should become "trades/..."
  let cleanKey = key;
  if (cleanKey.startsWith(`${bucket}/`)) {
    cleanKey = cleanKey.substring(bucket.length + 1);
    console.log(`⚠️ Stripped bucket name from key: "${key}" -> "${cleanKey}"`);
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: cleanKey,
  });

  // The SDK will sign the request and give us a URL we can safely expose.
  const signedUrl = await getSignedUrl(client, command, {
    expiresIn: expiresInSec,
  });

  return signedUrl;
}

/**
 * Generate pre-signed POST/PUT URL for direct browser upload
 * NOTE: R2 does not support POST uploads well (501 Not Implemented).
 * We automatically switch to PUT for R2.
 *
 * @param {string} key - S3 object key
 * @param {object} options - Upload options
 * @returns {Promise<{uploadUrl: string, fields: object, fileUrl: string, method: string}>}
 */
export async function generatePresignedUploadUrl(key, options = {}) {
  const { isR2 } = getStorageConfig();

  // If R2, forced to use PUT because POST is not implemented/reliable on R2
  if (isR2) {
    return generatePresignedPutUrl(key, options.contentType, options.expiresIn);
  }

  // AWS S3: Use POST (Standard FormData upload)
  const {
    contentType = "image/jpeg",
    maxSizeBytes = 5 * 1024 * 1024,
    expiresIn = 300,
  } = options;

  const { client, bucket, publicUrlBase } = getStorageConfig();

  const { url, fields } = await createPresignedPost(client, {
    Bucket: bucket,
    Key: key,
    Conditions: [
      ["content-length-range", 0, maxSizeBytes],
      ["starts-with", "$Content-Type", ""],
    ],
    Fields: {
      "Content-Type": contentType,
      "success_action_status": "200",
    },
    Expires: expiresIn,
  });

  return {
    uploadUrl: url,
    method: "POST",
    fields,
    fileUrl: `${publicUrlBase}/${key}`,
  };
}

/**
 * Generate pre-signed PUT URL for direct browser upload
 * Supported by both AWS S3 and Cloudflare R2
 *
 * @param {string} key - S3 object key
 * @param {string} contentType - MIME type
 * @param {number} expiresIn - URL expiry in seconds
 * @returns {Promise<{uploadUrl: string, fields: object, fileUrl: string, method: string}>}
 */
export async function generatePresignedPutUrl(
  key,
  contentType = "image/jpeg",
  expiresIn = 300
) {
  const { client, bucket, publicUrlBase } = getStorageConfig();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ChecksumAlgorithm: undefined, // Disable checksum for simpler client uploads
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn,
    unhoistableHeaders: new Set(["x-amz-checksum-crc32"]),
  });

  return {
    uploadUrl,
    method: "PUT",
    fields: {}, // Empty fields for PUT
    fileUrl: `${publicUrlBase}/${key}`,
  };
}