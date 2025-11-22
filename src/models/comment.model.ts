import {
    Schema,
    model,
    Types
} from "mongoose";

import { CommentSchema } from "./types";

const commentSchema = new Schema<CommentSchema>({
    post: {
        type: Types.ObjectId,
        ref: "Post",
        required: true,
        index: true
    },
    author: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
        trim: true,
    },
    parentComment: {
        type: Types.ObjectId,
        ref: "Comment",
        default: null,
        index: true
    }

}, { timestamps: true });

commentSchema.index({ post: 1, createdAt: -1 });



const Comment = model<CommentSchema>("Comment", commentSchema);

export default Comment;