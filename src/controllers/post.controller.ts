import { Request, Response } from "express";
import { AsyncHandler } from "../utils/AsyncHandler";
import { AppResponse } from "../utils/AppResponse";
import { AppError } from "../utils/AppError";
import { AuthenticatedRequest } from "../types";
import Post from "../models/post.model";
import { Visibility } from "../constants";
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
    const imageLocalPath = req.file ? req.file.path : undefined;
    let postImage;
    if (imageLocalPath) {
        postImage = await uploadToCloudinary(imageLocalPath);
        if (!postImage?.url) {
            throw new AppError(500, "Failed to upload image on cloudinary!");
        }
    }

    const post = await Post.create({
        author: userId,
        content,
        visibility: visibility || Visibility.PUBLIC,
        image: {
            url: postImage?.url || "",
            publicId: postImage?.publicId || ""
        }
    })

    if (!post) {
        throw new AppError(500, "Failed to create post");
    }

    return res
        .status(200)
        .json(
            new AppResponse(
                200,
                "Post created successfully",
                post
            )
        )

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

    const imageLocalPath = req.file ? req.file.path : undefined;
    let updatedPostImage = post.image;
    if (imageLocalPath) {
        if (post.image?.publicId) {
            const deletionResult = await deleteFromCloudinary(post.image.publicId);
            if (!deletionResult) {
                throw new AppError(500, "Failed to delete old image from cloudinary");
            }
        }
        const newImage = await uploadToCloudinary(imageLocalPath);
        if (!newImage?.url) {
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

export const getSinglePost = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
    // Parse and validate cursor
    let cursor: Date | null = null;
    if (req.query.cursor) {
        const date = new Date(String(req.query.cursor));
        if (isNaN(date.getTime())) {
            throw new AppError(400, "Invalid cursor");
        }
        cursor = date;
    }

    // Validate limit
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    if (limit < 1) {
        throw new AppError(400, "Invalid limit");
    }

    // Build query
    const query: any = {
        $or: [
            { visibility: Visibility.PUBLIC },
            { author: req.user!._id, visibility: Visibility.PRIVATE }
        ]
    };

    if (cursor) {
        query.createdAt = { $lt: cursor };
    }

    // Fetch posts
    const posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .lean();

    // Check for more posts
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

    // Extract IDs
    const postIds = posts.map(p => p._id);
    const authorIds = posts.map(p => p.author);

    // Fetch related data in parallel
    const [authors, likeCounts, userLikes, commentCounts] = await Promise.all([
        // Authors
        User.find({ _id: { $in: authorIds } })
            .select("firstName lastName avatar email")
            .lean(),

        // Like counts
        Like.aggregate([
            { $match: { targetType: "post", targetId: { $in: postIds } } },
            { $group: { _id: "$targetId", count: { $sum: 1 } } }
        ]),

        // User's likes
        Like.find({
            targetType: "post",
            targetId: { $in: postIds },
            userId: req.user!._id
        }).lean(),

        // Comment counts
        Comment.aggregate([
            { $match: { postId: { $in: postIds } } },
            { $group: { _id: "$postId", count: { $sum: 1 } } }
        ])
    ]);

    // Create lookup maps
    const authorMap = new Map(authors.map(a => [String(a._id), a]));
    const likeCountMap = new Map(likeCounts.map(lc => [String(lc._id), lc.count]));
    const userLikedSet = new Set(userLikes.map(l => String(l.targetId)));
    const commentCountMap = new Map(commentCounts.map(cc => [String(cc._id), cc.count]));

    // Merge data
    const feed = posts.map(post => ({
        ...post,
        author: authorMap.get(String(post.author)) || null,
        likeCount: likeCountMap.get(String(post._id)) || 0,
        userHasLiked: userLikedSet.has(String(post._id)),
        commentCount: commentCountMap.get(String(post._id)) || 0
    }));

    // Calculate next cursor
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