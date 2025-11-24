import { Document, Types } from "mongoose"


type Visibility = 'public' | 'private';
type ObjectId = Types.ObjectId;
type TargetType = 'post' | 'comment';
type ReactionType = 'like' | 'love' | 'haha' | 'care' | 'angry';
type imageUpload = {
    url: string | "";
    publicId: string | "";
}


export interface UserSchema extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    avatar?: imageUpload;
    refreshToken?: string;



    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
}

export interface PostSchema extends Document {
    author: ObjectId;
    content: string;
    image?: imageUpload | null;
    visibility: Visibility;
    createdAt: Date;
    updatedAt: Date;

}

export interface CommentSchema extends Document {
    post: ObjectId;
    author: ObjectId;
    content: string;
    parentComment?: ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface LikeSchema extends Document {
    targetType: TargetType;
    targetId: ObjectId;
    user: ObjectId;
    reactionType: ReactionType;
    createdAt: Date;
    updatedAt: Date;
}