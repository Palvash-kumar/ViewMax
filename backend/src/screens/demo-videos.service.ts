import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DemoVideo, DemoVideoDocument } from './schemas/demo-video.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const LOCAL_VIDEO_DIR = path.join(process.cwd(), 'uploads', 'demo-videos');
const MAX_CLOUDINARY_SIZE = 50 * 1024 * 1024; // 50 MB

@Injectable()
export class DemoVideosService {
  constructor(
    @InjectModel(DemoVideo.name)
    private demoVideoModel: Model<DemoVideoDocument>,
    private cloudinaryService: CloudinaryService,
  ) {
    // Ensure local upload directory exists
    if (!fs.existsSync(LOCAL_VIDEO_DIR)) {
      fs.mkdirSync(LOCAL_VIDEO_DIR, { recursive: true });
    }
  }

  async findByScreen(screenId: string): Promise<DemoVideoDocument[]> {
    return this.demoVideoModel
      .find({ screenId: new Types.ObjectId(screenId) })
      .sort({ order: 1 })
      .exec();
  }

  async create(
    screenId: string,
    title: string,
    posterFile: Express.Multer.File,
    videoFile: Express.Multer.File,
  ): Promise<DemoVideoDocument> {
    if (!posterFile) {
      throw new BadRequestException('Poster image is required');
    }
    if (!videoFile) {
      throw new BadRequestException('Video file is required');
    }

    // Upload poster to Cloudinary (always — posters are small images)
    const posterResult = await this.cloudinaryService.uploadImage(
      posterFile,
      'viewmax/demo-posters',
    );

    let videoUrl: string;
    let videoStorage: 'cloudinary' | 'local';
    let videoPublicId: string | undefined;

    if (videoFile.size <= MAX_CLOUDINARY_SIZE) {
      // Upload to Cloudinary for files ≤ 50 MB
      const videoResult = await this.cloudinaryService.uploadVideo(videoFile);
      videoUrl = videoResult.secure_url;
      videoStorage = 'cloudinary';
      videoPublicId = videoResult.public_id;
    } else {
      // Save locally for files > 50 MB
      const ext = path.extname(videoFile.originalname) || '.mp4';
      const filename = `${uuidv4()}${ext}`;
      const filePath = path.join(LOCAL_VIDEO_DIR, filename);
      fs.writeFileSync(filePath, videoFile.buffer);
      videoUrl = `/uploads/demo-videos/${filename}`;
      videoStorage = 'local';
    }

    // Determine next order number
    const count = await this.demoVideoModel.countDocuments({
      screenId: new Types.ObjectId(screenId),
    });

    const demoVideo = new this.demoVideoModel({
      screenId: new Types.ObjectId(screenId),
      title,
      posterUrl: posterResult.secure_url,
      posterPublicId: posterResult.public_id,
      videoUrl,
      videoStorage,
      videoPublicId,
      order: count,
    });

    return demoVideo.save();
  }

  async delete(id: string): Promise<void> {
    const demoVideo = await this.demoVideoModel.findById(id).exec();
    if (!demoVideo) throw new NotFoundException('Demo video not found');

    // Clean up poster from Cloudinary
    if (demoVideo.posterPublicId) {
      try {
        await this.cloudinaryService.deleteImage(demoVideo.posterPublicId);
      } catch {
        // Non-fatal — continue even if cloud cleanup fails
      }
    }

    // Clean up video
    if (demoVideo.videoStorage === 'cloudinary' && demoVideo.videoPublicId) {
      try {
        await this.cloudinaryService.deleteVideo(demoVideo.videoPublicId);
      } catch {
        // Non-fatal
      }
    } else if (demoVideo.videoStorage === 'local') {
      const localPath = path.join(process.cwd(), demoVideo.videoUrl);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }

    await this.demoVideoModel.findByIdAndDelete(id).exec();
  }
}
