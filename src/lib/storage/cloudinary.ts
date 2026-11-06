import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export function configureCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export async function uploadImage(buffer: Buffer, folder = "tech-platform") {
  const client = configureCloudinary();
  const result = await new Promise<{
    secure_url: string;
    public_id: string;
    width: number;
    height: number;
    bytes: number;
    format: string;
  }>((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error || !result) reject(error || new Error("Upload failed"));
        else resolve(result as never);
      },
    );
    stream.end(buffer);
  });
  return result;
}
