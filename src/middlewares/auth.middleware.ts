import { AppError } from "../utils/AppError";
import { AsyncHandler } from "../utils/AsyncHandler";
import User from "../models/user.model";
import jwt from "jsonwebtoken"
import {
    Request,
    Response,
    NextFunction
} from "express";
import { AuthenticatedRequest } from "../types/request";

export const verifyJWT = AsyncHandler(async (req: AuthenticatedRequest, _: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        console.log(token);

        if (!token) {
            throw new AppError(401, "Unauthorized: No token provided", true);
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as jwt.JwtPayload;
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");

        if (!user) {
            throw new AppError(401, "Unauthorized: Invalid token", true);
        }
        req.user = user;
        next();

    } catch (error) {
        throw new AppError(
            401,
            error instanceof Error ? error.message : "Invalid access token",
            true,
        )
    }
});