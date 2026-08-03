import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import s3Client from "../config/s3.js";
import dotenv from "dotenv";
dotenv.config();

export const uploadFileToS3 = async (fileName, fileBuffer, mimeType) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
  });
  await s3Client.send(command);
};

export const getFileFromS3 = async (fileName) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
  });
  return await s3Client.send(command);
};

export const deleteFileFromS3 = async (fileName) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
  });
  await s3Client.send(command);
};
