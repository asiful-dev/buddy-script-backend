import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

const uploadToCloudinary = async (
    fileBuffer: Buffer,
    originalName: string
): Promise<{ url: string; publicId: string } | null> => {
    try {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "image",
                    folder: "posts",
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

            uploadStream.end(fileBuffer);
        });
    } catch (error) {
        console.error("Failed to upload to Cloudinary:", error);
        return null;
    }
};

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

