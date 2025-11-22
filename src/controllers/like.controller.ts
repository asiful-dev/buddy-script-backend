import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import { AsyncHandler } from "../utils/AsyncHandler";
import { AppError } from "../utils/AppError";
import { AppResponse } from "../utils/AppResponse";
import Like from "../models/like.model";
import Post from "../models/post.model";
import Comment from "../models/comment.model";
import { likeTargetType } from "../constants";



const validateTarget = async (targetType: string, targetId: string, userId: string) => {
    if (!targetType || !targetId) {
        throw new AppError(400, "targetType and targetId are required");
    }

    if (targetType !== likeTargetType.POST && targetType !== likeTargetType.COMMENT) {
        throw new AppError(400, "Invalid targetType");
    }


    if (targetType === likeTargetType.POST) {
        const post = await Post.findById(targetId).lean();
        if (!post) throw new AppError(404, "Post not found");

        if (post.visibility === "private" && post.author.toString() !== userId) {
            throw new AppError(403, "Unauthorized access to private post");
        }
    }


    if (targetType === likeTargetType.COMMENT) {
        const comment = await Comment.findById(targetId).lean();
        if (!comment) throw new AppError(404, "Comment not found");
    }
};





export const likeTarget = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { targetType, targetId } = req.body;

    await validateTarget(targetType, targetId, userId);

    const exists = await Like.findOne({
        targetType,
        targetId,
        user: userId
    });

    if (exists) {
        throw new AppError(400, "Already liked");
    }

    const like = await Like.create({
        targetType,
        targetId,
        user: userId
    });

    return res.status(201).json(
        new AppResponse(
            201,
            "Liked successfully",
            like
        )
    );
});





export const unlikeTarget = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { targetType, targetId } = req.body;

    await validateTarget(targetType, targetId, userId);

    const result = await Like.findOneAndDelete({
        targetType,
        targetId,
        userId
    });

    if (!result) {
        throw new AppError(400, "You haven't liked this target");
    }

    return res.status(200).json(
        new AppResponse(
            200,
            "Unliked successfully",
            null
        )
    );
});





export const getLikes = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { targetType, targetId } = req.params;

    if (!targetType || !targetId) {
        throw new AppError(400, "targetType and targetId are required");
    }

    if (targetType !== likeTargetType.POST && targetType !== likeTargetType.COMMENT) {
        throw new AppError(400, "Invalid targetType");
    }


    if (targetType === likeTargetType.POST) {
        const post = await Post.findById(targetId).lean();
        if (!post) throw new AppError(404, "Post not found");
    } else {
        const comment = await Comment.findById(targetId).lean();
        if (!comment) throw new AppError(404, "Comment not found");
    }

    const likes = await Like.find({
        targetType,
        targetId
    }).lean();

    const likeCount = likes.length;
    const userIds = likes.map(l => l.user);

    return res.status(200).json(
        new AppResponse(
            200,
            "Like info fetched",
            {
                likeCount,
                userIds
            }
        )
    );
});
