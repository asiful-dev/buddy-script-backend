import { Document } from "mongoose"

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