import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'coms-workspaces',
        allowed_formats: ['jpg', 'png', 'jpeg', 'avif', 'webp'],
    } as any,
});

const upload = multer({
    storage: storage,
    limits: {
        files: 3, // Limit to 3 files
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

export { cloudinary, upload };
