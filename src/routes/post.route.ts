import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import {
    createPost,
    deletePost,
    updatePost,
    getPostById,
    getFeed,
} from "../controllers/post.controller"

const router = Router();
router.use(verifyJWT);

/**
 * @swagger
 * /api/posts/feed:
 *   get:
 *     summary: Get paginated feed of posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Cursor for pagination (ISO date string)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of posts to return
 *     responses:
 *       200:
 *         description: Feed fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Feed fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     posts:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Post'
 *                           - type: object
 *                             properties:
 *                               author:
 *                                 $ref: '#/components/schemas/User'
 *                               reactions:
 *                                 $ref: '#/components/schemas/ReactionBreakdown'
 *                               totalReactions:
 *                                 type: number
 *                                 example: 8
 *                               userReaction:
 *                                 type: string
 *                                 nullable: true
 *                                 enum: [like, love, haha, care, angry]
 *                                 example: like
 *                               commentCount:
 *                                 type: number
 *                                 example: 3
 *                     nextCursor:
 *                       type: string
 *                       nullable: true
 *                       format: date-time
 *                     hasMore:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized
 */
router
    .route("/feed")
    .get(getFeed);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: This is my post content
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *                 default: public
 *                 example: public
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Post created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Unauthorized
 */
router
    .route("/")
    .post(
        upload.single("image"),
        createPost
    );

/**
 * @swagger
 * /api/posts/{postId}:
 *   get:
 *     summary: Get a post by ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Post fetched successfully
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       403:
 *         description: Not authorized to view this post
 *       404:
 *         description: Post not found
 *   patch:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: Updated post content
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *                 example: public
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Post updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         description: Not authorized to update this post
 *       404:
 *         description: Post not found
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Post deleted successfully
 *                 data:
 *                   type: object
 *       403:
 *         description: Not authorized to delete this post
 *       404:
 *         description: Post not found
 */
router
    .route("/:postId")
    .get(getPostById)
    .patch(
        upload.single("image"),
        updatePost
    )
    .delete(deletePost);

export default router;
