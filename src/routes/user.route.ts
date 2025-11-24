import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    updateUser
} from "../controllers/user.controller"
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";


const router = Router();

router
    .route("/register")
    .post(registerUser);

router
    .route("/login")
    .post(loginUser);

router
    .route("/logout")
    .post(verifyJWT, logoutUser);

router
    .route("/refresh-token")
    .post(refreshAccessToken);

router
    .route("/me")
    .get(verifyJWT, getCurrentUser);

router
    .route("/update")
    .patch(
        verifyJWT,
        upload.single("avatar"),
        updateUser
    );



export default router;