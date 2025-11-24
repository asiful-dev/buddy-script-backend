import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types";
import { AsyncHandler } from "../utils/AsyncHandler";
import { AppResponse } from "../utils/AppResponse";
import { AppError } from "../utils/AppError";
import User from "../models/user.model";
import jwt from "jsonwebtoken";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/Cloudinary";

// method for generating access and refresh tokens
const generateTokens = async (userId: string) => {
    const user = await User.findById(userId)

    if (!user) {
        throw new AppError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
        accessToken,
        refreshToken
    }
}


export const registerUser = AsyncHandler(async (req: Request, res: Response) => {

    const { firstName, lastName, email, password } = req.body;

    if (
        [firstName, lastName, email, password].some((field) => field?.trim() === "")
    ) {
        throw new AppError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError(409, "User with this email already exists");
    }
    const imageBuffer = req?.file?.buffer || undefined;
    let userAvatar;
    if (imageBuffer) {
        userAvatar = await uploadToCloudinary(imageBuffer, req?.file?.originalname || "");
        if (!userAvatar?.url || !userAvatar?.publicId) {
            throw new AppError(500, "Failed to upload image on cloudinary!");
        }
    }

    const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        avatar: {
            url: userAvatar?.url || "",
            publicId: userAvatar?.publicId || ""
        }
    });

    const { accessToken, refreshToken } = await generateTokens(user._id.toString());

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new AppError(500, "Failed to create user");
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new AppResponse(
                201,
                "User registered successfully",
                {
                    user: createdUser,
                    accessToken,
                    refreshToken
                }
            )
        )
});

export const loginUser = AsyncHandler(async (req: Request, res: Response) => {

    const { email, password } = req.body;

    if ([email, password].some((field) => field?.trim() === "")) {
        throw new AppError(400, "Email and Password are required");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new AppError(401, "User not found. Please register");
    } const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new AppError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateTokens(user._id.toString());

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new AppResponse(
                200,
                "User logged in successfully",
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                }
            )
        );

});

export const getCurrentUser = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return res
        .status(200)
        .json(
            new AppResponse(
                200,
                "Current user fetched successfully",
                {
                    user: req.user
                }
            )
        );
});

export const logoutUser = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset: { refreshToken: 1 }
        },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }


    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new AppResponse(
                200,
                "User logged out successfully",
                {}
            )
        );
});


export const refreshAccessToken = AsyncHandler(async (req: Request, res: Response) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new AppError(401, "Refresh token is required. Please log in again.");
    }

    // Verify JWT token - this will throw an error if invalid/expired
    let decodedRefreshToken;
    try {
        decodedRefreshToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET as string
        ) as jwt.JwtPayload;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError(401, "Refresh token has expired. Please log in again.");
        } else if (error.name === 'JsonWebTokenError') {
            throw new AppError(401, "Invalid refresh token. Please log in again.");
        }
        throw new AppError(401, `Token verification failed: ${error.message}`);
    }

    const user = await User.findById(decodedRefreshToken._id).select("+refreshToken");

    if (!user) {
        throw new AppError(401, "User not found. Please log in again.");
    }

    if (!user.refreshToken) {
        throw new AppError(401, "No refresh token found. Please log in again.");
    }

    if (user.refreshToken !== incomingRefreshToken) {
        throw new AppError(401, "Refresh token has been revoked. Please log in again.");
    }

    const { accessToken, refreshToken } = await generateTokens(user._id.toString());

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new AppResponse(
                200,
                "Access token refreshed successfully",
                {
                    accessToken,
                    refreshToken
                }
            )
        );
});

export const updateUser = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { firstName, lastName, email, password } = req.body;
    const userId = req.user?._id;
    if (!userId) {
        throw new AppError(401, "Unauthorized! Please log in.");
    }
    const user = await User.findById(userId);
    let updatedFirstName = firstName;
    if (!firstName.trim()) updatedFirstName = user?.firstName || "";
    let updatedLastName = lastName;
    if (!lastName.trim()) updatedLastName = user?.lastName || "";
    let updatedEmail = email;
    if (!email.trim()) updatedEmail = user?.email || "";
    let updatedPassword = password;
    if (!password.trim()) updatedPassword = user?.password || "";
    const imageBuffer = req?.file?.buffer || undefined;
    let userAvatar = user?.avatar;
    if (imageBuffer) {
        if (user?.avatar?.publicId) {
            const deletionResult = await deleteFromCloudinary(user?.avatar?.publicId);
            if (!deletionResult) {
                throw new AppError(500, "Failed to delete old image from cloudinary");
            }
        }
        const newImage = await uploadToCloudinary(imageBuffer, req?.file?.originalname || "");
        if (!newImage?.url || !newImage?.publicId) {
            throw new AppError(500, "Failed to upload new image to cloudinary");
        }
        userAvatar = newImage;
    }
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                firstName: updatedFirstName,
                lastName: updatedLastName,
                email: updatedEmail,
                password: updatedPassword,
                avatar: {
                    url: userAvatar?.url || "",
                    publicId: userAvatar?.publicId || ""
                }
            }

        },
        { new: true }
    )
    if (!updatedUser) {
        throw new AppError(500, "Failed to update user");
    }
    return res
        .status(200)
        .json(
            new AppResponse(
                200,
                "User updated successfully",
                updatedUser
            )
        );
});