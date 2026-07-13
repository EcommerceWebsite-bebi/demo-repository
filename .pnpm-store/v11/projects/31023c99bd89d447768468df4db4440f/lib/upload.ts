import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a Buffer directly to Cloudinary bypassing filesystem.
 * Returns the secure url of the uploaded file.
 */
export async function uploadToCloudinary(fileBuffer: Buffer, folder = 'tshirt_shop_custom_designs'): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error('Cloudinary upload returned empty result'));
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

/**
 * Uploads a PDF Buffer directly to Cloudinary as raw resource.
 * Returns the secure url.
 */
export async function uploadPDFToCloudinary(pdfBuffer: Buffer, fileName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'tshirt_shop_order_pdfs',
        resource_type: 'raw',
        public_id: fileName,
        format: 'pdf'
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error('Cloudinary PDF upload returned empty result'));
        }
        resolve(result.secure_url);
      }
    );
    stream.end(pdfBuffer);
  });
}
