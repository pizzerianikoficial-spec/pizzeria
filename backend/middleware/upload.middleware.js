import multer from "multer";

const storage = multer.memoryStorage();
const MAX_SIZE = 4 * 1024 * 1024; // 4 MB
export const upload = multer({ storage, limits: { fileSize: MAX_SIZE } });
