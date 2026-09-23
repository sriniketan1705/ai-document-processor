import crypto from 'crypto';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { env } from '../config/env';
import { MIME_TO_TYPE } from '../services/textExtractor';
import { UPLOAD_DIR } from '../services/processService';
import { AppError } from '../utils/AppError';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // random name so two users uploading "resume.pdf" never clash
    const unique = crypto.randomBytes(12).toString('hex');
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (MIME_TO_TYPE[file.mimetype]) return cb(null, true);
    cb(new AppError('Only PDF, PNG, JPG and TXT files are allowed', 400));
  },
});
