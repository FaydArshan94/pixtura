import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { uploadFileToS3 } from "../services/s3Service.js";
import Media from "../models/media.model.js";

export const processImageUpload = async (file, userId, folderId) => {
  const uploadFile = file?.file ?? file;
  const buffer = uploadFile?.buffer;

  if (!uploadFile?.originalname || !buffer || buffer.length === 0) {
    throw new Error("Invalid image input: missing file buffer or filename");
  }
  console.log(uploadFile)

  const uniqueId = uuidv4();
  const fileName = `${uniqueId}-${uploadFile.originalname}`;

  await uploadFileToS3(fileName, buffer, uploadFile.mimetype);

  const metadata = await sharp(buffer).metadata();

  const media = await Media.create({
    userId,
    mediaType: "image",
    mimetype: uploadFile.mimetype,
    folderId: folderId,
    s3Key: fileName,
    originalName: uploadFile.originalname,
    displayName: uploadFile.originalname,

    size: uploadFile.size,
    width: metadata.width,
    height: metadata.height,

    url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
  });

  return media;
};
