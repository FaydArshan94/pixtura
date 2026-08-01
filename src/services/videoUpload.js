import fs from "fs/promises";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";

import Media from "../models/media.model.js";
import { uploadFileToS3 } from "../services/s3Service.js";
import { getVideoMetadata, generateThumbnail } from "../utils/video.js";

export const processVideoUpload = async ({ file, userId, folderId }) => {
  const uniqueId = uuidv4();

  const videoKey = `${uniqueId}-${file.originalname}`;

  const thumbnailKey = `${uniqueId}-thumbnail.jpg`;

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pixtura-"));

  const tempVideoPath = path.join(tempDir, file.originalname);

  await fs.writeFile(tempVideoPath, file.buffer);

  const metadata = await getVideoMetadata(tempVideoPath);

  const thumbnailPath = await generateThumbnail(tempVideoPath, tempDir);

  const thumbnailBuffer = await fs.readFile(thumbnailPath);

  await uploadFileToS3(videoKey, file.buffer, file.mimetype);

  await uploadFileToS3(thumbnailKey, thumbnailBuffer, "image/jpeg");

  const media = await Media.create({
    userId,
    folderId,

    mediaType: "video",

    mimetype: file.mimetype,

    s3Key: videoKey,

    originalName: file.originalname,
    displayName: file.originalname,

    size: file.size,

    width: metadata.width,
    height: metadata.height,

    url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${videoKey}`,

    thumbnailUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbnailKey}`,

    videoMetadata: {
      duration: metadata.duration,
      fps: metadata.fps,
      videoCodec: metadata.codec,
    },
  });

  return media;

  await fs.rm(tempDir, {
    recursive: true,
    force: true,
  });
};
