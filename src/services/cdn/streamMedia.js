import Media from "../../models/media.model.js";
import { getFileFromS3 } from "../s3Service.js";
import { transform } from "../sharp.js";

export const streamMediaCdn = async (publicId, options = {}) => {
  if (!publicId) {
    throw new Error("Public ID is required");
  }

  const media = await Media.findOne({ publicId });

  if (!media) {
    throw new Error("Media not found");
  }

  // Original image from S3
  const s3Object = await getFileFromS3(media.s3Key);

  const byteArray = await s3Object.Body.transformToByteArray();
  const buffer = Buffer.from(byteArray);

  // Check if any transformation is requested
  const hasTransformations =
    options.width ||
    options.height ||
    options.format ||
    options.quality ||
    options.fit;

  if (!hasTransformations) {
    return {
      buffer,
      contentType: s3Object.ContentType,
      contentLength: buffer.length,
      etag: s3Object.ETag?.replace(/"/g, ""),
      lastModified: s3Object.LastModified,
    };
  }

  // Apply transformations
  const transformed = await transform(buffer, options);

  return {
    buffer: transformed.buffer,
    contentType: transformed.contentType,
    contentLength: transformed.buffer.length,
    etag: undefined,
    lastModified: new Date(),
  };
};
