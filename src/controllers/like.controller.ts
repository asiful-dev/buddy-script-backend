import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import { AsyncHandler } from "../utils/AsyncHandler";
import { AppError } from "../utils/AppError";
import { AppResponse } from "../utils/AppResponse";
import Like from "../models/like.model";
import Post from "../models/post.model";
import Comment from "../models/comment.model";
import { likeTargetType, ReactionType } from "../constants";
import { Types } from "mongoose";


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





export const reactToTarget = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { targetType, targetId, reactionType } = req.body;

    if (!reactionType || !Object.values(ReactionType).includes(reactionType)) {
        throw new AppError(400, "Valid reactionType is required (like, love, haha, care, angry)");
    }

    await validateTarget(targetType, targetId, userId);

    const existingReaction = await Like.findOne({
        targetType,
        targetId: new Types.ObjectId(targetId),
        user: new Types.ObjectId(userId)
    });

    if (existingReaction) {
        if (existingReaction.reactionType === reactionType) {
            await Like.findByIdAndDelete(existingReaction._id);
            return res.status(200).json(
                new AppResponse(
                    200,
                    "Reaction removed successfully",
                    null
                )
            );
        } else {
            existingReaction.reactionType = reactionType as ReactionType;
            await existingReaction.save();
            return res.status(200).json(
                new AppResponse(
                    200,
                    "Reaction updated successfully",
                    existingReaction
                )
            );
        }
    }

    const reaction = await Like.create({
        targetType,
        targetId: new Types.ObjectId(targetId),
        user: new Types.ObjectId(userId),
        reactionType: reactionType as ReactionType
    });

    return res.status(201).json(
        new AppResponse(
            201,
            "Reaction added successfully",
            reaction
        )
    );
});





export const removeReaction = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { targetType, targetId } = req.body;

    await validateTarget(targetType, targetId, userId);

    const result = await Like.findOneAndDelete({
        targetType,
        targetId: new Types.ObjectId(targetId),
        user: new Types.ObjectId(userId)
    });
    

    if (!result) {
        throw new AppError(400, "You haven't reacted to this target");
    }

    return res.status(200).json(
        new AppResponse(
            200,
            "Reaction removed successfully",
            null
        )
    );
});





export const getReactions = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
        if (!comment)         throw new AppError(404, "Comment not found");
    }

    const reactions = await Like.find({
        targetType,
        targetId: new Types.ObjectId(targetId)
    }).lean();

    const reactionBreakdown: Record<string, { count: number; userIds: string[] }> = {};
    
    Object.values(ReactionType).forEach(type => {
        reactionBreakdown[type] = { count: 0, userIds: [] };
    });

    reactions.forEach(reaction => {
        const type = reaction.reactionType;
        if (reactionBreakdown[type]) {
            reactionBreakdown[type].count++;
            reactionBreakdown[type].userIds.push(reaction.user.toString());
        }
    });

    const totalReactions = reactions.length;

    const userReaction = reactions.find(r => r.user.toString() === req.user!._id.toString());

    return res.status(200).json(
        new AppResponse(
            200,
            "Reactions fetched successfully",
            {
                totalReactions,
                userReaction: userReaction ? userReaction.reactionType : null,
                reactions: reactionBreakdown
            }
        )
    );
});
