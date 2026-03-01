import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed file types
const ALLOWED_EXTENSIONS = ['.pdf', '.txt'];
const ALLOWED_MIMETYPES = [
    'application/pdf',
    'text/plain',
];

// Max file size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        // prefix with timestamp to avoid collisions
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        cb(new AppError(`File type not allowed. Supported: ${ALLOWED_EXTENSIONS.join(', ')}`, 400) as any);
        return;
    }

    // Also check MIME type if available
    if (file.mimetype && !ALLOWED_MIMETYPES.includes(file.mimetype)) {
        cb(new AppError(`MIME type not allowed: ${file.mimetype}`, 400) as any);
        return;
    }

    cb(null, true);
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
});

/**
 * Middleware to handle multer errors with user-friendly messages.
 */
export const handleUploadError = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('File too large. Maximum size is 5 MB.', 400));
        }
        return next(new AppError(`Upload error: ${err.message}`, 400));
    }
    next(err);
};
