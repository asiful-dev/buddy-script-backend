/**
 * Updated uploadToCloudinary function to work with buffers
 * 
 * This version accepts a buffer instead of a file path,
 * which is required for Vercel/serverless functions
 */

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

/**
 * Upload file buffer directly to Cloudinary
 * @param fileBuffer - File buffer from multer memory storage
 * @param originalName - Original filename for metadata
 * @returns Object with url and publicId
 */
const uploadToCloudinary = async (
    fileBuffer: Buffer,
    originalName: string
): Promise<{ url: string; publicId: string } | null> => {
    try {
        return new Promise((resolve, reject) => {
            // Create upload stream
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "image",
                    folder: "posts",
                    // Optional: add original filename as public_id prefix
                    // public_id: `posts/${originalName.split('.')[0]}`,
                },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary upload error:", error);
                        reject(error);
                    } else if (result) {
                        resolve({
                            url: result.secure_url,
                            publicId: result.public_id,
                        });
                    } else {
                        reject(new Error("Cloudinary upload returned no result"));
                    }
                }
            );

            // Write buffer to upload stream
            uploadStream.end(fileBuffer);
        });
    } catch (error) {
        console.error("Failed to upload to Cloudinary:", error);
        return null;
    }
};

/**
 * Delete image from Cloudinary
 * @param publicId - Cloudinary public ID
 * @returns Boolean indicating success
 */
const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === "ok";
    } catch (error) {
        console.log("Failed to delete image from cloudinary:", error);
        return false;
    }
};

export { uploadToCloudinary, deleteFromCloudinary };

