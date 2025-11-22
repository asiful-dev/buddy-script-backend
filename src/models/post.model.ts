import {
    Schema,
    model,
    Types
} from "mongoose";
import { PostSchema } from "./types";
import { Visibility } from "../constants";

const postSchema = new Schema<PostSchema>({
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
    image: {
        type: String,
        default: null
    },
    visibility: {
        type: String,
        enum: Object.values(Visibility),
        default: Visibility.PUBLIC
    }
}, { timestamps: true });

const Post = model<PostSchema>("Post", postSchema);

postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });

export default Post;