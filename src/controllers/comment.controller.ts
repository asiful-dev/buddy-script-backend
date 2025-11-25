import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import { AsyncHandler } from "../utils/AsyncHandler";
import { AppError } from "../utils/AppError";
import { AppResponse } from "../utils/AppResponse";
import Comment from "../models/comment.model";
import Post from "../models/post.model";
import Like from "../models/like.model";
import User from "../models/user.model";
import { ReactionType, likeTargetType } from "../constants";

export const createComment = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        throw new AppError(400, "Comment content is required");
    }

    const post = await Post.findById(postId).lean();
    if (!post) {
        throw new AppError(404, "Post not found");
    }

    if (post.visibility === "private" && post.author.toString() !== userId) {
        throw new AppError(403, "Unauthorized to comment on a private post");
    }

    const comment = await Comment.create({
        post: postId,
        author: userId,
        content: content.trim(),
        parentComment: null
    });

    return res.status(201).json(
        new AppResponse(201, "Comment added", comment)
    );
});

export const createReply = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        throw new AppError(400, "Reply content is required");
    }

    const parent = await Comment.findById(commentId).lean();
    if (!parent) {
        throw new AppError(404, "Parent comment not found");
    }

    const post = await Post.findById(parent.post).lean();
    if (!post) {
        throw new AppError(404, "Post not found");
    }

    if (post.visibility === "private" && post.author.toString() !== userId) {
        throw new AppError(403, "Unauthorized to reply on this comment");
    }

    const reply = await Comment.create({
        post: parent.post,
        author: userId,
        content: content.trim(),
        parentComment: commentId
    });

    return res.status(201).json(
        new AppResponse(201, "Reply added", reply)
    );
});

export const getCommentsForPost = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { postId } = req.params;

    let cursor: Date | null = null;

    if (req.query.cursor) {
        const d = new Date(String(req.query.cursor));
        if (isNaN(d.getTime())) throw new AppError(400, "Invalid cursor");
        cursor = d;
    }

    const limit = Number(req.query.limit) || 10;
    if (limit < 1) throw new AppError(400, "Invalid limit");

    const post = await Post.findById(postId).lean();
    if (!post) throw new AppError(404, "Post not found");

    if (post.visibility === "private" && post.author.toString() !== userId) {
        throw new AppError(403, "Unauthorized to view comments");
    }

    const query: any = {
        post: postId,
        parentComment: null
    };

    if (cursor) {
        query.createdAt = { $lt: cursor };
    }

    const comments = await Comment.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    const commentIds = comments.map(c => c._id);
    const authorIds = comments.map(c => c.author);

    const users = await User.find({
        _id: { $in: authorIds }
    }).select("firstName lastName avatar").lean();

    const userMap = new Map(users.map(u => [String(u._id), u]));

    const reactions = await Like.aggregate([
        { $match: { targetType: likeTargetType.COMMENT, targetId: { $in: commentIds } } },
        { 
            $group: { 
                _id: { targetId: "$targetId", reactionType: "$reactionType" },
                count: { $sum: 1 },
                userIds: { $push: "$user" }
            } 
        }
    ]);

    const reactionMap = new Map<string, Record<string, { count: number; userIds: string[] }>>();
    commentIds.forEach(id => {
        const commentIdStr = String(id);
        reactionMap.set(commentIdStr, {});
        Object.values(ReactionType).forEach(type => {
            reactionMap.get(commentIdStr)![type] = { count: 0, userIds: [] };
        });
    });

    reactions.forEach(reaction => {
        const commentIdStr = String(reaction._id.targetId);
        const reactionType = reaction._id.reactionType;
        if (reactionMap.has(commentIdStr) && reactionMap.get(commentIdStr)![reactionType]) {
            reactionMap.get(commentIdStr)![reactionType].count = reaction.count;
            reactionMap.get(commentIdStr)![reactionType].userIds = reaction.userIds.map((id: any) => String(id));
        }
    });

    const userReactions = await Like.find({
        targetType: likeTargetType.COMMENT,
        targetId: { $in: commentIds },
        user: userId
    }).lean();

    const userReactionMap = new Map<string, string>();
    userReactions.forEach(reaction => {
        userReactionMap.set(String(reaction.targetId), reaction.reactionType);
    });

    const replyCounts = await Comment.aggregate([
        { $match: { parentComment: { $in: commentIds } } },
        { $group: { _id: "$parentComment", count: { $sum: 1 } } }
    ]);

    const replyCountMap = new Map(replyCounts.map(r => [String(r._id), r.count]));

    const merged = comments.map(c => {
        const commentIdStr = String(c._id);
        const reactions = reactionMap.get(commentIdStr) || {};
        const totalReactions = Object.values(reactions).reduce((sum, r) => sum + r.count, 0);
        
        return {
            ...c,
            author: userMap.get(String(c.author)) || null,
            reactions,
            totalReactions,
            userReaction: userReactionMap.get(commentIdStr) || null,
            replyCount: replyCountMap.get(commentIdStr) || 0
        };
    });

    const nextCursor =
        merged.length > 0
            ? merged[merged.length - 1].createdAt.toISOString()
            : null;

    return res
        .status(200)
        .json(
            new AppResponse(
                200,
                "Comments fetched",
                {
                    comments: merged,
                    nextCursor
                }
            )
        );
});

export const getReplies = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { commentId } = req.params;

    const parent = await Comment.findById(commentId).lean();
    if (!parent) throw new AppError(404, "Comment not found");

    const post = await Post.findById(parent.post).lean();
    if (!post) throw new AppError(404, "Post not found");

    if (post.visibility === "private" && post.author.toString() !== userId) {
        throw new AppError(403, "Unauthorized to view replies");
    }

    const replies = await Comment.find({
        parentComment: commentId
    })
        .sort({ createdAt: 1 })
        .lean();

    const replyIds = replies.map(r => r._id);
    const authorIds = replies.map(r => r.author);

    const users = await User.find({
        _id: { $in: authorIds }
    }).select("firstName lastName avatar").lean();

    const userMap = new Map(users.map(u => [String(u._id), u]));

    const replyReactions = await Like.aggregate([
        { $match: { targetType: likeTargetType.COMMENT, targetId: { $in: replyIds } } },
        { 
            $group: { 
                _id: { targetId: "$targetId", reactionType: "$reactionType" },
                count: { $sum: 1 },
                userIds: { $push: "$user" }
            } 
        }
    ]);

    const replyReactionMap = new Map<string, Record<string, { count: number; userIds: string[] }>>();
    replyIds.forEach(id => {
        const replyIdStr = String(id);
        replyReactionMap.set(replyIdStr, {});
        Object.values(ReactionType).forEach(type => {
            replyReactionMap.get(replyIdStr)![type] = { count: 0, userIds: [] };
        });
    });

    replyReactions.forEach(reaction => {
        const replyIdStr = String(reaction._id.targetId);
        const reactionType = reaction._id.reactionType;
        if (replyReactionMap.has(replyIdStr) && replyReactionMap.get(replyIdStr)![reactionType]) {
            replyReactionMap.get(replyIdStr)![reactionType].count = reaction.count;
            replyReactionMap.get(replyIdStr)![reactionType].userIds = reaction.userIds.map((id: any) => String(id));
        }
    });

    const userReplyReactions = await Like.find({
        targetType: likeTargetType.COMMENT,
        targetId: { $in: replyIds },
        user: userId
    }).lean();

    const userReplyReactionMap = new Map<string, string>();
    userReplyReactions.forEach(reaction => {
        userReplyReactionMap.set(String(reaction.targetId), reaction.reactionType);
    });

    const merged = replies.map(r => {
        const replyIdStr = String(r._id);
        const reactions = replyReactionMap.get(replyIdStr) || {};
        const totalReactions = Object.values(reactions).reduce((sum, r) => sum + r.count, 0);
        
        return {
            ...r,
            author: userMap.get(String(r.author)) || null,
            reactions,
            totalReactions,
            userReaction: userReplyReactionMap.get(replyIdStr) || null
        };
    });

    return res.status(200).json(
        new AppResponse(200, "Replies fetched", merged)
    );
});
