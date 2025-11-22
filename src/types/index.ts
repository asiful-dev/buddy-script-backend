import { Request, Response, NextFunction } from 'express';
import { UserSchema } from "../models/types";


export type AsyncRequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<any>;

export interface AuthenticatedRequest extends Request {
    user?: UserSchema;
}

export type UploadToCloudinary = (localFilePath: string) => Promise<{ url: string, publicId: string } | null>;

export type DeleteFromCloudinary = (publicId: string) => Promise<boolean>;

