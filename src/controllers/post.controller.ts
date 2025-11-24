import { Request, Response } from "express";
import { AsyncHandler } from "../utils/AsyncHandler";
import { AppResponse } from "../utils/AppResponse";
import { AppError } from "../utils/AppError";
import { AuthenticatedRequest } from "../types";
import Post from "../models/post.model";
import { Visibility, ReactionType, likeTargetType } from "../constants";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/Cloudinary";
import User from "../models/user.model";
import Like from "../models/like.model";
import Comment from "../models/comment.model";

export const createPost = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { content, visibility } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        throw new AppError(401, "Unauthorized! Please log in.");
    }

    if (!content || content.trim() === "") {
        throw new AppError(400, "Post content cannot be empty");
    }

    if (visibility && !Object.values(Visibility).includes(visibility)) {
        throw new AppError(400, "Invalid visibility value");
    }

    let postImage;

    // With memory storage, file is in req.file.buffer (not req.file.path)
    if (req.file && req.file.buffer) {
        // Pass buffer and originalname to uploadToCloudinary
        postImage = await uploadToCloudinary(req.file.buffer, req.file.originalname);
        
        if (!postImage?.url) {
            throw new AppError(500, "Failed to upload image to Cloudinary!");
        }
    }

    const post = await Post.create({
        author: userId,
        content,
        visibility: visibility || Visibility.PUBLIC,
        image: {
            url: postImage?.url || "",
            publicId: postImage?.publicId || "",
        },
    });

    if (!post) {
        throw new AppError(500, "Failed to create post");
    }

    return res.status(200).json(
        new AppResponse(200, "Post created successfully", post)
    );
}); 

export const deletePost = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { postId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
        throw new AppError(401, "Unauthorized! Please log in.");
    }
    const post = await Post.findById(postId);

    if (!post) {
        throw new AppError(404, "Post not found");
    }

    if (post.author.toString() !== userId.toString()) {
        throw new AppError(403, "You are not authorized to delete this post");
    }
    if (post.image?.publicId) {
        const result = await deleteFromCloudinary(post.image.publicId);
        if (!result) {
            throw new AppError(500, "Failed to delete post image from cloudinary");
        }
    }

    await Post.findByIdAndDelete(postId);

    return res
        .status(200)
        .json(
            new AppResponse(
                200,
                "Post deleted successfully",
                {}
            )
        )
});

export const updatePost = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { postId } = req.params;
    const { content, visibility } = req.body;
    const userId = req.user?._id;
    if (!userId) {
        throw new AppError(401, "Unauthorized! Please log in.");
    }
    const post = await Post.findById(postId);

    if (!post) {
        throw new AppError(404, "Post not found");
    }

    if (!content || content.trim() === "") {
        throw new AppError(400, "Post content cannot be empty");
    }
    if (visibility && !Object.values(Visibility).includes(visibility)) {
        throw new AppError(400, "Invalid visibility value");
    }

    if (post.author.toString() !== userId.toString()) {
        throw new AppError(403, "You are not authorized to update this post");
    }

    const imageBuffer = req?.file?.buffer || undefined;
    let updatedPostImage = post.image;
    if (imageBuffer) {
        if (post.image?.publicId) {
            const deletionResult = await deleteFromCloudinary(post.image.publicId);
            if (!deletionResult) {
                throw new AppError(500, "Failed to delete old image from cloudinary");
            }
        }
        const newImage = await uploadToCloudinary(imageBuffer, req?.file?.originalname || "");
        if (!newImage?.url || !newImage?.publicId) {
            throw new AppError(500, "Failed to upload new image to cloudinary");
        }
        updatedPostImage = newImage;
    }

    const updatedPost = await Post.findByIdAndUpdate(
        postId,
        {
            $set: {
                content,
                visibility: visibility || post.visibility,
                image: {
                    url: updatedPostImage?.url || "",
                    publicId: updatedPostImage?.publicId || ""
                }
            }
        },
        { new: true }
    )

    if (!updatedPost) {
        throw new AppError(500, "Failed to update post");
    }

    return res
        .status(200)
        .json(
            new AppResponse(
                200,
                "Post updated successfully",
                updatedPost
            )
        )



});

export const getPostById = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) {
        throw new AppError(404, "Post not found");
    }

    if (post.visibility === Visibility.PRIVATE && post.author.toString() !== req.user?._id.toString()) {
        throw new AppError(403, "You are not authorized to view this post");
    }

    return res
        .status(200)
        .json(
            new AppResponse(
                200,
                "Post fetched successfully",
                post
            )
        )
});

export const getFeed = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    let cursor: Date | null = null;
    if (req.query.cursor) {
        const date = new Date(String(req.query.cursor));
        if (isNaN(date.getTime())) {
            throw new AppError(400, "Invalid cursor");
        }
        cursor = date;
    }

    
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    if (limit < 1) {
        throw new AppError(400, "Invalid limit");
    }

    
    const query: any = {
        $or: [
            { visibility: Visibility.PUBLIC },
            { author: req.user!._id, visibility: Visibility.PRIVATE }
        ]
    };

    if (cursor) {
        query.createdAt = { $lt: cursor };
    }

    
    const posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .lean();

    
    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();

    if (posts.length === 0) {
        return res.status(200).json({
            success: true,
            data: [],
            nextCursor: null,
            hasMore: false
        });
    }

    
    const postIds = posts.map(p => p._id);
    const authorIds = posts.map(p => p.author);

    
    const [authors, reactions, userReactions, commentCounts] = await Promise.all([
        
        User.find({ _id: { $in: authorIds } })
            .select("firstName lastName email avatar")
            .lean(),

        
        Like.aggregate([
            { $match: { targetType: likeTargetType.POST, targetId: { $in: postIds } } },
            { 
                $group: { 
                    _id: { targetId: "$targetId", reactionType: "$reactionType" },
                    count: { $sum: 1 },
                    userIds: { $push: "$user" }
                } 
            }
        ]),

        
        Like.find({
            targetType: likeTargetType.POST,
            targetId: { $in: postIds },
            user: req.user!._id
        }).lean(),

        
        Comment.aggregate([
            { $match: { post: { $in: postIds } } },
            { $group: { _id: "$post", count: { $sum: 1 } } }
        ])
    ]);

    
    const authorMap = new Map(authors.map(a => [String(a._id), a]));
    const commentCountMap = new Map(commentCounts.map(cc => [String(cc._id), cc.count]));
    
    // Build reaction maps by post ID
    const reactionMap = new Map<string, Record<string, { count: number; userIds: string[] }>>();
    postIds.forEach(id => {
        const postIdStr = String(id);
        reactionMap.set(postIdStr, {});
        Object.values(ReactionType).forEach(type => {
            reactionMap.get(postIdStr)![type] = { count: 0, userIds: [] };
        });
    });

    reactions.forEach(reaction => {
        const postIdStr = String(reaction._id.targetId);
        const reactionType = reaction._id.reactionType;
        if (reactionMap.has(postIdStr) && reactionMap.get(postIdStr)![reactionType]) {
            reactionMap.get(postIdStr)![reactionType].count = reaction.count;
            reactionMap.get(postIdStr)![reactionType].userIds = reaction.userIds.map((id: any) => String(id));
        }
    });

    // Build user reaction map
    const userReactionMap = new Map<string, string>();
    userReactions.forEach(reaction => {
        userReactionMap.set(String(reaction.targetId), reaction.reactionType);
    });

    
    const feed = posts.map(post => {
        const postIdStr = String(post._id);
        const reactions = reactionMap.get(postIdStr) || {};
        const totalReactions = Object.values(reactions).reduce((sum, r) => sum + r.count, 0);
        
        return {
            ...post,
            author: authorMap.get(String(post.author)) || null,
            reactions,
            totalReactions,
            userReaction: userReactionMap.get(postIdStr) || null,
            commentCount: commentCountMap.get(postIdStr) || 0
        };
    });

    
    const nextCursor = hasMore && feed.length > 0
        ? feed[feed.length - 1].createdAt.toISOString()
        : null;

    return res
        .status(200)
        .json(
            new AppResponse(
                200,
                "Feed fetched successfully",
                {
                    posts: feed,
                    nextCursor,
                    hasMore
                }
            )
        )
});