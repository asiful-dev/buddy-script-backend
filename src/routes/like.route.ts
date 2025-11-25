import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
    reactToTarget,
    removeReaction,
    getReactions
} from "../controllers/like.controller";

const router = Router();
router.use(verifyJWT);

/**
 * @swagger
 * /api/likes:
 *   post:
 *     summary: Add or update a reaction on a post or comment
 *     tags: [Reactions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetType
 *               - targetId
 *               - reactionType
 *             properties:
 *               targetType:
 *                 type: string
 *                 enum: [post, comment]
 *                 example: post
 *                 description: Type of target to react to
 *               targetId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *                 description: ID of the post or comment
 *               reactionType:
 *                 type: string
 *                 enum: [like, love, haha, care, angry]
 *                 example: like
 *                 description: Type of reaction. Clicking same reaction removes it (toggle)
 *     responses:
 *       201:
 *         description: Reaction added successfully
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
 *                   example: Reaction added successfully
 *                 data:
 *                   $ref: '#/components/schemas/Reaction'
 *       200:
 *         description: Reaction updated or removed successfully
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
 *                   example: Reaction updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Reaction'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         description: Unauthorized access to private post
 *       404:
 *         description: Post or comment not found
 *   delete:
 *     summary: Remove any reaction from a post or comment
 *     tags: [Reactions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetType
 *               - targetId
 *             properties:
 *               targetType:
 *                 type: string
 *                 enum: [post, comment]
 *                 example: post
 *               targetId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Reaction removed successfully
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
 *                   example: Reaction removed successfully
 *                 data:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: You haven't reacted to this target
 *       404:
 *         description: Post or comment not found
 */
router
    .route("/")
    .post(reactToTarget)         
    .delete(removeReaction);     

/**
 * @swagger
 * /api/likes/{targetType}/{targetId}:
 *   get:
 *     summary: Get reaction breakdown for a post or comment
 *     tags: [Reactions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [post, comment]
 *         description: Type of target
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post or comment
 *     responses:
 *       200:
 *         description: Reactions fetched successfully
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
 *                   example: Reactions fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalReactions:
 *                       type: number
 *                       example: 8
 *                     userReaction:
 *                       type: string
 *                       nullable: true
 *                       enum: [like, love, haha, care, angry]
 *                       example: like
 *                     reactions:
 *                       $ref: '#/components/schemas/ReactionBreakdown'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Post or comment not found
 */
router
    .route("/:targetType/:targetId")
    .get(getReactions); 

export default router;
