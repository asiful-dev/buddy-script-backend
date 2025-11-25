import { Router } from "express";
import { healthcheck } from "../controllers/healthcheck.controller";

const router = Router();

/**
 * @swagger
 * /api:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running and healthy
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
 *                   example: OK
 *                 data:
 *                   type: string
 *                   example: Health check passed
 */
router
.route("/")
.get(healthcheck);

export default router;
