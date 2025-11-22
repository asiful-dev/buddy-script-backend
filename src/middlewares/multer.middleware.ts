import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { AppError } from "../utils/AppError";
import { Request } from "express";
import { allowedMimeTypes, allowedExt,fileSizeLimit } from "../constants";


const tempDir = path.resolve("public/temp");
fs.mkdirSync(tempDir, { recursive: true });


const storage = multer.diskStorage({
    destination: function (_req:Request, _file: Express.Multer.File, cb) {
        cb(null, tempDir);
    },
    filename: function (_req:Request, file: Express.Multer.File, cb) {
        const ext = path.extname(file.originalname);
        const filename = crypto.randomUUID();
        cb(null, `${filename}-${Date.now()}${ext}`);
    }
});


const fileFilter = (_req:Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    
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
        fileSize: fileSizeLimit
    },
    fileFilter
})

