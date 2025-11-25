import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
    createComment,
    createReply,
    getCommentsForPost,
    getReplies
} from "../controllers/comment.controller";

const router = Router();
router.use(verifyJWT);

/**
 * @swagger
 * /api/comments/post/{postId}:
 *   post:
 *     summary: Create a root comment on a post
 *     tags: [Comments]
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: This is a comment
 *     responses:
 *       201:
 *         description: Comment added successfully
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
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Comment added
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         description: Unauthorized to comment on a private post
 *       404:
 *         description: Post not found
 *   get:
 *     summary: Get paginated comments for a post
 *     tags: [Comments]
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
 *           default: 10
 *         description: Number of comments to return
 *     responses:
 *       200:
 *         description: Comments fetched successfully
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
 *                   example: Comments fetched
 *                 data:
 *                   type: object
 *                   properties:
 *                     comments:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Comment'
 *                           - type: object
 *                             properties:
 *                               author:
 *                                 $ref: '#/components/schemas/User'
 *                               reactions:
 *                                 $ref: '#/components/schemas/ReactionBreakdown'
 *                               totalReactions:
 *                                 type: number
 *                                 example: 4
 *                               userReaction:
 *                                 type: string
 *                                 nullable: true
 *                                 enum: [like, love, haha, care, angry]
 *                                 example: like
 *                               replyCount:
 *                                 type: number
 *                                 example: 2
 *                     nextCursor:
 *                       type: string
 *                       nullable: true
 *                       format: date-time
 *       403:
 *         description: Unauthorized to view comments
 *       404:
 *         description: Post not found
 */
router
    .route("/post/:postId")
    .post(createComment)
    .get(getCommentsForPost);

/**
 * @swagger
 * /api/comments/reply/{commentId}:
 *   post:
 *     summary: Create a reply to a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: This is a reply
 *     responses:
 *       201:
 *         description: Reply added successfully
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
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Reply added
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         description: Unauthorized to reply on this comment
 *       404:
 *         description: Parent comment or post not found
 *   get:
 *     summary: Get all replies for a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent comment ID
 *     responses:
 *       200:
 *         description: Replies fetched successfully
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
 *                   example: Replies fetched
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Comment'
 *                       - type: object
 *                         properties:
 *                           author:
 *                             $ref: '#/components/schemas/User'
 *                           reactions:
 *                             $ref: '#/components/schemas/ReactionBreakdown'
 *                           totalReactions:
 *                             type: number
 *                             example: 2
 *                           userReaction:
 *                             type: string
 *                             nullable: true
 *                             enum: [like, love, haha, care, angry]
 *                             example: love
 *       403:
 *         description: Unauthorized to view replies
 *       404:
 *         description: Comment or post not found
 */
router
    .route("/reply/:commentId")
    .post(createReply)
    .get(getReplies);

export default router;
