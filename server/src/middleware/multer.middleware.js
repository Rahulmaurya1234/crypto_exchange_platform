import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { S3Client } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// projectRoot = server/
const projectRoot = path.join(__dirname, "..", "..");

// Resolve base upload dir from .env (default: src/uploads)
const resolveBaseUploadDir = () => {
  const envPath = process.env.UPLOAD_DIR || "src/uploads";

  if (path.isAbsolute(envPath)) return envPath;

  return path.join(projectRoot, envPath);
};

const BASE_UPLOAD_DIR = resolveBaseUploadDir();

// Ensure folder exists
const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Allowed file types
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
];

const fileFilter = (req, file, cb) => {
  if (!file) return cb(new Error("No file provided"), false);

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error("Invalid file type. Only JPG, PNG, and PDF files are allowed."),
      false
    );
  }
  cb(null, true);
};

// Max file size from .env (fallback 2MB)
const MAX_FILE_SIZE_RAW = process.env.MAX_FILE_SIZE;
const MAX_FILE_SIZE =
  (MAX_FILE_SIZE_RAW && Number.isFinite(Number(MAX_FILE_SIZE_RAW))
    ? Number(MAX_FILE_SIZE_RAW)
    : 2 * 1024 * 1024);

// Cloudflare R2 Configuration
const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
} = process.env;

// AWS S3 Configuration
const {
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

let s3;
let bucketName;

if (r2Configured) {
  // Initialize S3 client for R2
  s3 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true, // Required for R2
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  bucketName = R2_BUCKET_NAME;
  console.log("Cloudflare R2 configured for uploads.");
} else if (s3Configured) {
  // Initialize S3 client for AWS
  s3 = new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
  bucketName = S3_BUCKET;
  console.log("AWS S3 configured for uploads.");
} else {
  console.log(
    `Remote storage not configured. Using local disk storage at: ${BASE_UPLOAD_DIR}`
  );
}

// Factory to create storage engine for subfolder
const makeStorage = (subfolder) => {
  if (s3) {
    return multerS3({
      s3,
      bucket: bucketName,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const ext = path.extname(file.originalname); // ".png"
        const base = path.basename(file.originalname, ext);
        const safeBase = base
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_-]/g, "");
        const uniqueSuffix =
          Date.now() + "-" + Math.round(Math.random() * 1e9);
        const fullPath = `${subfolder}/${safeBase || "file"}-${uniqueSuffix}${ext}`;
        cb(null, fullPath);
      },
    });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(BASE_UPLOAD_DIR, subfolder);
      ensureDirExists(uploadDir);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname); // ".png"
      const base = path.basename(file.originalname, ext);
      const safeBase = base
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "");
      const uniqueSuffix =
        Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${safeBase || "file"}-${uniqueSuffix}${ext}`);
    },
  });
};

/**
 * KYC upload middleware
 * Fields:
 *  - aadhaar_front (Aadhaar front side)
 *  - aadhaar_back (Aadhaar back side)
 *  - pan_card (PAN card)
 *  - bank_proof (Bank statement/passbook)
 *  - selfie (Selfie photo)
 * Saves to: BASE_UPLOAD_DIR/kyc or S3 "kyc/"
 */
const kycStorage = makeStorage("kyc");

export const uploadKycDocs = multer({
  storage: kycStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).fields([
  { name: "aadhaar_front", maxCount: 1 },
  { name: "aadhaar_back", maxCount: 1 },
  { name: "pan_card", maxCount: 1 },
  { name: "bank_proof", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
]);

/**
 * Ad image upload middleware
 * Field:
 *  - image
 * Saves to: BASE_UPLOAD_DIR/ads or S3 "ads/"
 */
const adStorage = makeStorage("ads");

export const uploadAdImage = multer({
  storage: adStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single("image");

// Generic error handler for multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload failed",
    });
  }

  next();
};
