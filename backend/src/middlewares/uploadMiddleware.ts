import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { AppError } from '../utils/AppError.js';

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, WEBP images and PDF files are allowed.', 400));
  }
};

export const uploadSingleReceipt = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single('receipt');
