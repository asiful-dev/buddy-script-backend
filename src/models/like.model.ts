import {
    Schema,
    model,
    Types
} from "mongoose";
import { LikeSchema } from "./types";
import { likeTargetType } from "../constants";


const likeSchema = new Schema<LikeSchema>({
    targetType: {
        type: String,
        enum: Object.values(likeTargetType),
        required: true,
        index: true
    },
    targetId: {
        type: Types.ObjectId,
        required: true,
        index: true,
    },
    user: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    }
}, { timestamps: true });

likeSchema.index(
    { targetType: 1, targetId: 1, user: 1 },
    { unique: true }
);

const Like = model<LikeSchema>("Like", likeSchema);

export default Like;