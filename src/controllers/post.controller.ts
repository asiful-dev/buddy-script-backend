import { Request, Response } from "express";
import { AsyncHandler } from "../utils/AsyncHandler";
import { AppResponse } from "../utils/AppResponse";
import { AppError } from "../utils/AppError";
import { AuthenticatedRequest } from "../types";
import Post from "../models/post.model";
import { Visibility } from "../constants";

export const createPost = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { content, visibility } = req.body;

    if (!content || content.trim() === "") {
        throw new AppError(400, "Post content cannot be empty");
    }
    if (visibility && !Object.values(Visibility).includes(visibility)) {
        throw new AppError(400, "Invalid visibility value");
    }
    const imageLocalPath = req.file ? req.file.path : undefined;
    if(imageLocalPath){

    }
  
});