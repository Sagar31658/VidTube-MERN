import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET
  });

const uploadToCloudinary = async (localfilePath) => {
    try {
        if(!localfilePath) return null
        const response = await cloudinary.uploader.upload(localfilePath, {
            resource_type: 'auto',
        })
        console.log("File has been Successfully Uploaded!", response.url)
        return response
    } catch (error) {
        fs.unlinkSync(localfilePath)
        return null
    }
}

export {uploadToCloudinary}