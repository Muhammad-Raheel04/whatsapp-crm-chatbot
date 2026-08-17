import multer from 'multer';
import path from 'path';
import fsPromises from 'fs/promises';

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const { productId } = req.params;
            const { category } = req.body;
            const uploadPath = path.join(process.cwd(), "uploads", category, productId);
            await fsPromises.mkdir(uploadPath, { recursive: true });

            cb(null, `uploads/${category}/${productId}`);
        } catch (err) {
            cb(err)
        }
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

export const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/") || file.mimetype.startsWith("audio/")) {
            cb(null, true)
        }
        else {
            cb(new Error("Only images,videos and audio files are allowed"));
        }
    }
});