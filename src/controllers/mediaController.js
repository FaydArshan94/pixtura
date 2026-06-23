import {
  deleteFileFromS3,
  getFileFromS3,
  uploadFileToS3,
} from "../services/s3Service.js";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { transform } from "../services/sharp.js";

export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uniqueId = uuidv4();
    const fileName = `${uniqueId}-${req.file.originalname}`;

    await uploadFileToS3(fileName, req.file.buffer, req.file.mimetype);

    res.status(200).json({ message: "File uploaded successfully" });
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
    const file = req.params.fileName.trim();

    await deleteFileFromS3(file);
    res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res
      .status(500)
      .json({ message: "Error deleting file", error: error.message });
  }
};
