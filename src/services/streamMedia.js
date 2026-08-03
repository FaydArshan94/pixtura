import Media from "../models/media.model.js";
import { getFileFromS3 } from "./s3Service.js";

export const streamMediaCdn = async (publicId) => {
  if (!publicId) {
    throw new Error("Public ID is required");
  }

  const media = await Media.findOne({ publicId });

  if (!media) {
    throw new Error("Media not found");
  }

  const file = await getFileFromS3(media.s3Key);

  return {
    stream: file.Body,
    contentType: file.ContentType,
    contentLength: file.ContentLength,
    etag: file.ETag,
    lastModified: file.LastModified,
  };
};