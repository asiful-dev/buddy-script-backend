import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import { AsyncHandler } from "../utils/AsyncHandler";
import { AppError } from "../utils/AppError";
import { AppResponse } from "../utils/AppResponse";
import Comment from "../models/comment.model";
import Post from "../models/post.model";
import Like from "../models/like.model";
import User from "../models/user.model";



// Create root comment on a post
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



// Create reply to a comment
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




// FETCH ROOT COMMENTS — paginated (no N+1)
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

    // batch users
    const users = await User.find({
        _id: { $in: authorIds }
    }).select("firstName lastName avatar").lean();

    const userMap = new Map(users.map(u => [String(u._id), u]));

    // batch like counts
    const likeCounts = await Like.aggregate([
        { $match: { targetType: "comment", targetId: { $in: commentIds } } },
        { $group: { _id: "$targetId", count: { $sum: 1 } } }
    ]);

    const likeCountMap = new Map(likeCounts.map(c => [String(c._id), c.count]));

    // batch user-like states
    const userLikes = await Like.find({
        targetType: "comment",
        targetId: { $in: commentIds },
        userId
    }).lean();

    const userLikedSet = new Set(userLikes.map(l => String(l.targetId)));

    // batch reply counts
    const replyCounts = await Comment.aggregate([
        { $match: { parentCommentId: { $in: commentIds } } },
        { $group: { _id: "$parentCommentId", count: { $sum: 1 } } }
    ]);

    const replyCountMap = new Map(replyCounts.map(r => [String(r._id), r.count]));

    const merged = comments.map(c => ({
        ...c,
        author: userMap.get(String(c.author)) || null,
        likeCount: likeCountMap.get(String(c._id)) || 0,
        userHasLiked: userLikedSet.has(String(c._id)),
        replyCount: replyCountMap.get(String(c._id)) || 0
    }));
    

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




// FETCH REPLIES FOR A COMMENT
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

    const likeCounts = await Like.aggregate([
        { $match: { targetType: "comment", targetId: { $in: replyIds } } },
        { $group: { _id: "$targetId", count: { $sum: 1 } } }
    ]);

    const likeCountMap = new Map(likeCounts.map(l => [String(l._id), l.count]));

    const userLikes = await Like.find({
        targetType: "comment",
        targetId: { $in: replyIds },
        userId
    }).lean();

    const userLikedSet = new Set(userLikes.map(l => String(l.targetId)));

    const merged = replies.map(r => ({
        ...r,
        author: userMap.get(String(r.author)) || null,
        likeCount: likeCountMap.get(String(r._id)) || 0,
        userHasLiked: userLikedSet.has(String(r._id))
    }));

    return res.status(200).json(
        new AppResponse(200, "Replies fetched", merged)
    );
});
