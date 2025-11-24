import multer from "multer";
import { AppError } from "../utils/AppError";
import { Request } from "express";
import { allowedMimeTypes, allowedExt, fileSizeLimit } from "../constants";
import path from "path";


const storage = multer.memoryStorage();


const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedMimeTypes.includes(mime) && allowedExt.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new AppError(400, "Invalid file type. Only image files are allowed."));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: fileSizeLimit,
  },
  fileFilter,
});

