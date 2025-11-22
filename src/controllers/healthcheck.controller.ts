import { AppResponse } from "../utils/AppResponse";
import { AsyncHandler } from "../utils/AsyncHandler";
import { Response } from "express";


const healthcheck = AsyncHandler(async (_, res: Response) => {
    return res
        .status(200)
        .json(new AppResponse
            (
                200,
                "OK",
                "Health check passed"
            )
        );
});

export { healthcheck };