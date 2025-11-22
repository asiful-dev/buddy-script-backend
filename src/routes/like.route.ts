import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
    likeTarget,
    unlikeTarget,
    getLikes
} from "../controllers/like.controller";

const router = Router();
router.use(verifyJWT);

router
    .route("/")
    .post(likeTarget)         
    .delete(unlikeTarget)     

router
    .route("/:targetType/:targetId")
    .get(getLikes); 

    
export default router;
