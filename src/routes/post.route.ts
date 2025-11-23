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

router
    .route("/feed")
    .get(getFeed);

router
    .route("/")
    .post(
        upload.single("image"),
        createPost
    );

router
    .route("/:postId")
    .get(getPostById)
    .patch(
        upload.single("image"),
        updatePost
    )
    .delete(deletePost);

export default router;