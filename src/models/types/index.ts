import { Document, Types } from "mongoose"


type Visibility = 'public' | 'private';
type ObjectId = Types.ObjectId;
type TargetType = 'post' | 'comment';


export interface UserSchema extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    avatar?: string;
    refreshToken?: string;



    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
}

export interface PostSchema extends Document {
    author: ObjectId;
    content: string;
    image?: string | null;
    visibility: Visibility;

}

export interface CommentSchema extends Document {
    post: ObjectId;
    author: ObjectId;
    content: string;
    parentComment?: ObjectId | null;
}

export interface LikeSchema extends Document {
    targetType: TargetType;
    targetId: ObjectId;
    user: ObjectId;
}