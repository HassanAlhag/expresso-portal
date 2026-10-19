import multer from "multer";
import { uploadFileFilter } from "../../utils/uploadPolicy.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 250 * 1024 * 1024, files: 20 },
  fileFilter: uploadFileFilter,
});
