import multer from 'multer';
import path from 'path';
import fsPromises from 'fs/promises';

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const { contactId } = req.params;
            const uploadPath = path.join(process.cwd(), "uploads", "chat", contactId);
            await fsPromises.mkdir(uploadPath, { recursive: true });

            cb(null, uploadPath);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

export const chatUpload = multer({
    storage,
    limits: { fileSize: 16 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/") || file.mimetype.startsWith("audio/") || file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only images, videos, audio and PDF files are allowed"));
        }
    }
});
