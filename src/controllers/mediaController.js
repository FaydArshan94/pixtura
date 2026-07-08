import {
  deleteFileFromS3,
  getFileFromS3,
  uploadFileToS3,
} from "../services/s3Service.js";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { transform } from "../services/sharp.js";
import Media from "../models/media.model.js";
import Folder from "../models/folder.model.js";

export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uniqueId = uuidv4();
    const fileName = `${uniqueId}-${req.file.originalname}`;

    await uploadFileToS3(fileName, req.file.buffer, req.file.mimetype);

    const metdata = await sharp(req.file.buffer).metadata();

    await Media.create({
      userId: req.user._id,
      folderId: req.body.folderId || null,
      s3Key: fileName,
      originalName: req.file.originalname,
      format: req.file.mimetype.split("/")[1],
      size: req.file.size,
      width: metdata.width,
      height: metdata.height,
      url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
    });


    res.status(200).json({ message: "File uploaded successfully",
        userId: req.user._id,
        folderId: req.body.folderId || null,
        s3Key: fileName,
        originalName: req.file.originalname,
        format: req.file.mimetype.split("/")[1],
        size: req.file.size,
        width: metdata.width,
        height: metdata.height,
        url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
     });
  } catch (error) {
    console.error("Error uploading file:", error);
    res
      .status(500)
      .json({ message: "Error uploading file", error: error.message });
  }
};

export const getMedia = async (req, res) => {
  try {
    const { fileName } = req.params;

    const buffer = await getFileFromS3(fileName);

    if (!buffer) {
      return res.status(404).json({ message: "File not found" });
    }

    const transformedImage = await transform(buffer, req.query);

    res.set(
      "Content-Type",
      `image/${req.query.format || transformedImage.format}`,
    );

    res.set("Cache-Control", "public, max-age=31536000");

    res.send(transformedImage.buffer);
  } catch (error) {
    console.error("Error retrieving file:", error);
    res
      .status(500)
      .json({ message: "Error retrieving file", error: error.message });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const fileId = req.params.fileId;

    const image = await Media.findOne({ _id: fileId, userId: req.user._id });

    if (!image) {
      return res.status(404).json({ message: "File not found" });
    }

    await deleteFileFromS3(image.s3Key);
    await Media.deleteOne({ _id: fileId });

    res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res
      .status(500)
      .json({ message: "Error deleting file", error: error.message });
  }
};

export const getAllMedia = async (req, res) => {
  try {
    const media = await Media.find({ userId: req.user._id });
    res.status(200).json({ media });
  } catch (error) {
    console.error("Error retrieving media:", error);
    res
      .status(500)
      .json({ message: "Error retrieving media", error: error.message });
  }
};

export const getMediaById = async (req, res) => {
  try {
    const { fileId } = req.params;
    const media = await Media.findOne({ _id: fileId, userId: req.user._id });

    if (!media) {
      return res.status(404).json({ message: "File not found" });
    }

    res.status(200).json({ media });
  } catch (error) {
    console.error("Error retrieving media:", error);
    res
      .status(500)
      .json({ message: "Error retrieving media", error: error.message });
  }
};

export const moveMedia = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { newFolderId } = req.body;

    const media = await Media.findOne({ _id: fileId, userId: req.user._id });

    if (!media) {
      return res.status(404).json({ message: "File not found" });
    }

    console.log(newFolderId);

    if (newFolderId) {
      const folder = await Folder.findOne({
        _id: newFolderId,
        userId: req.user._id,
      });

      if (!folder) {
        return res.status(404).json({ message: "Target folder not found" });
      }
    }

    media.folderId = newFolderId || null;
    await media.save();

    res.status(200).json({ message: "File moved successfully", media });
  } catch (error) {
    console.error("Error moving file:", error);
    res
      .status(500)
      .json({ message: "Error moving file", error: error.message });
  }
};
