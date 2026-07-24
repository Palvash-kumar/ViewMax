import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'viewmax',
  ): Promise<UploadApiResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 1200, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) return reject(new Error(error.message || 'Upload failed'));
          if (!result) return reject(new Error('Upload failed'));
          resolve(result);
        },
      );

      const readable = new Readable();
      readable.push(file.buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  async uploadVideo(
    file: Express.Multer.File,
    folder: string = 'viewmax/demo-videos',
  ): Promise<UploadApiResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_chunked_stream(
        {
          folder,
          resource_type: 'video',
          chunk_size: 6000000, // 6 MB chunks
          timeout: 120000, // 2 minutes timeout per chunk
        },
        (error, result) => {
          if (error) return reject(new Error(error.message || 'Upload failed'));
          if (!result) return reject(new Error('Upload failed'));

          // Apply quality auto transformation dynamically in the URL
          if (result.secure_url) {
            result.secure_url = result.secure_url.replace(
              '/video/upload/',
              '/video/upload/q_auto/',
            );
          }
          if (result.url) {
            result.url = result.url.replace(
              '/video/upload/',
              '/video/upload/q_auto/',
            );
          }

          resolve(result);
        },
      );

      const readable = new Readable();
      readable.push(file.buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  async uploadBase64(
    base64Data: string,
    folder: string = 'viewmax/qrcodes',
  ): Promise<UploadApiResponse> {
    try {
      return await cloudinary.uploader.upload(base64Data, {
        folder,
        resource_type: 'image',
      });
    } catch (error) {
      throw new BadRequestException(
        `Cloudinary upload failed: ${error.message}`,
      );
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  async deleteVideo(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
  }
}
