import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof AppError) {
        return res
            .status(err.statusCode)
            .json({
                success: false,
                message: err.message,
                ...(err.details && err.details.length > 0 && { errors: err.details })
            });
    }

    console.error('Unexpected Error:', err);

    return res
    .status(500)
    .json({
        success: false,
        message: "Internal Server Error"
    });
};

export { errorHandler };