import { Request } from "express";
import { UserSchema } from "../models/types";

export interface AuthenticatedRequest extends Request {
    user?: UserSchema;
}
