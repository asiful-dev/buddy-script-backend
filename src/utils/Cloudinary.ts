import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { UploadToCloudinary } from '../types';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string,
});


const uploadToCloudinary: UploadToCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath || !fs.existsSync(localFilePath)) {
            return null;
        }

        const result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "image",
            folder: "posts"
        });

        fs.unlinkSync(localFilePath);

        return {
            url: result.secure_url,
            publicId: result.public_id
        }

    } catch (error) {
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';

    } catch (error) {
        console.log("Failed to delete image from cloudinary:", error);
        return false;
    }
}

export { uploadToCloudinary, deleteFromCloudinary }