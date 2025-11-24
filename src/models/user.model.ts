import { Schema, model } from "mongoose";
import { UserSchema } from "./types/index";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";



const userSchema = new Schema<UserSchema>({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minLength: [2, 'First name must be at least 2 characters long'],
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minLength: [2, 'Last name must be at least 2 characters long'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        validate: {
            validator: function (v: string): boolean {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please provide a valid email address'
        },
        index: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [8, 'Password must be at least 8 characters long'],
        validate: {
            validator: function (v: string): boolean {
                return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(v);
            },
            message: 'Password must contain at least one letter, one number, and one special character (@$!%*#?&)'
        }
    },
    avatar: {
        type: {
            url: String,
            publicId: String
        }
    },
    refreshToken: {
        type: String,
        select: false
    }

}, { timestamps: true });

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});


userSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            firstName: this.firstName,
            lastName: this.lastName
        },
        process.env.ACCESS_TOKEN_SECRET as string,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY as jwt.SignOptions['expiresIn']
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET as string,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY as jwt.SignOptions['expiresIn']
        }
    )
}

const User = model("User", userSchema);

export default User;