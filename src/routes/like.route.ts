import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
    reactToTarget,
    removeReaction,
    getReactions
} from "../controllers/like.controller";

const router = Router();
router.use(verifyJWT);

router
    .route("/")
    .post(reactToTarget)         
    .delete(removeReaction);     

router
    .route("/:targetType/:targetId")
    .get(getReactions); 

    
export default router;
