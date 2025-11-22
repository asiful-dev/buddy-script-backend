import { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<any>;

export const AsyncHandler =
    (asyncRequestHandler: AsyncRequestHandler): RequestHandler =>
        (req, res, next) => {
            Promise.resolve(asyncRequestHandler(req, res, next)).catch(next);
        };
