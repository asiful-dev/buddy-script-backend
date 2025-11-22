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


router
    .route("/post/:postId")
    .post(createComment)
    .get(getCommentsForPost);

router
    .route("/reply/:commentId")
    .post(createReply)
    .get(getReplies);



export default router;
