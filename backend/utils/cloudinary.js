import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

export const uploadImageToCloudinary = async (file, folderName = "img") => {
  if (!file) return null;

  const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  const uploadResult = await cloudinary.uploader.upload(fileBase64, {
    folder: folderName,
  });

  return cloudinary.url(uploadResult.public_id, {
    fetch_format: "auto",
    quality: "auto",
  });
};
