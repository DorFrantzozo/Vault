import { getCloudinary } from '../config/cloudinary.js';
import { UploadApiResponse } from 'cloudinary';
import { AppError } from './AppError.js';

export interface IUploadResult {
  secureUrl: string;
  publicId: string;
}

export const uploadImageStream = (buffer: Buffer, folder: string = 'receipts'): Promise<IUploadResult> => {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || cloudName.trim().toLowerCase() === 'root') {
      return reject(
        new AppError(
          `שגיאת הגדרות Cloudinary: CLOUDINARY_CLOUD_NAME בקובץ backend/.env שגוי (הוזן '${cloudName}', שזה שם המפתח ולא שם הענן). יש להעתיק את ה-Cloud Name המדויק מעמוד ה-Dashboard ב-Cloudinary.com.`,
          400
        )
      );
    }

    if (!apiKey || !apiSecret) {
      return reject(new AppError('שגיאת הגדרות Cloudinary: חסרים מפתחות API KEY או API SECRET בקובץ backend/.env', 400));
    }

    const cloudinary = getCloudinary();
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          console.error('[Cloudinary Upload Error Details]:', error);
          return reject(
            new AppError(`כישלון בהעלאת קובץ ל-Cloudinary: ${error?.message || 'שגיאת שרת לא ידועה'}`, 500)
          );
        }
        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    stream.end(buffer);
  });
};

export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    if (!publicId) return;
    const cloudinary = getCloudinary();
    await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    console.error(`Cloudinary Delete Error for ID ${publicId}:`, error.message);
  }
};
