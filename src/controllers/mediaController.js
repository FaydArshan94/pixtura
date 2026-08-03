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
import crypto from "crypto";
import { generateSignature, verifySignature } from "../utils/signature.js";
import { processImageUpload } from "../services/imageUpload.js";
import { processVideoUpload } from "../services/videoUpload.js";
import { getStorageInsights as getStorageInsightsService } from "../services/storageInsightsService.js";
import { bulkMoveToTrashService } from "../services/bulkMediaService.js";
import { streamMediaCdn } from "../services/streamMedia.js";

const streamMedia = async (media, req, res) => {
  const buffer = await getFileFromS3(media.s3Key);

  if (!buffer) {
    return res.status(404).json({
      message: "File not found",
    });
  }

  const transformedImage = await transform(buffer, req.query);

  res.set(
    "Content-Type",
    `image/${req.query.format || transformedImage.format}`,
  );

  res.set("Cache-Control", "public, max-age=31536000");

  return res.send(transformedImage.buffer);
};

export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const mediaType = req.file.mimetype.split("/")[0];

    if (mediaType === "image" && req.file.size > 20 * 1024 * 1024) {
      return res.status(400).json({
        message: "Images cannot exceed 20 MB",
      });
    }

    if (mediaType === "image") {
      const media = await processImageUpload(
        req.file,
        req.user._id,
        req.body.folderId || null,
      );

      return res.status(200).json({
        message: "File uploaded successfully",
        media,
      });
    }

    if (mediaType === "video" && req.file.size > 500 * 1024 * 1024) {
      return res.status(400).json({
        message: "Videos cannot exceed 500 MB",
      });
    }

    if (mediaType === "video") {
      const media = await processVideoUpload({
        file: req.file,
        userId: req.user._id,
        folderId: req.body.folderId || null,
      });

      return res.status(200).json({
        message: "File uploaded successfully",
        media,
      });
    }
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
    const { expires, signature } = req.query;

    const media = await Media.findOne({
      s3Key: fileName,
    });

    if (!media) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    if (media.isPublic) {
      return streamMedia(media, req, res);
    }

    if (!expires || !signature) {
      return res.status(403).json({
        message: "This image is private",
      });
    }

    const currentTime = Math.floor(Date.now() / 1000);

    if (currentTime > Number(expires)) {
      return res.status(403).json({
        message: "Signed URL has expired",
      });
    }

    const isValid = verifySignature(media.s3Key, expires, signature);

    if (!isValid) {
      return res.status(403).json({
        message: "Invalid signature",
      });
    }

    return streamMedia(media, req, res);
  } catch (error) {
    console.error("Error retrieving file:", error);

    return res.status(500).json({
      message: "Error retrieving file",
      error: error.message,
    });
  }
};

export const getMediaByCdn = async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({ message: "Public ID is required" });
    }

    const { stream, contentType, contentLength, etag, lastModified } =
      await streamMediaCdn(publicId);

    res.setHeader("Content-Type", contentType);

    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    if (etag) {
      res.setHeader("ETag", etag);
    }

    if (lastModified) {
      res.setHeader("Last-Modified", lastModified.toUTCString());
    }

    // We'll change this later when CloudFront is the origin
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    stream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(404).json({
      message: error.message,
    });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const permanent = req.query.permanent === "true";

    const image = await Media.findOne({ _id: fileId, userId: req.user._id });

    if (!image) {
      return res.status(404).json({ message: "File not found" });
    }

    if (permanent) {
      await deleteFileFromS3(image.s3Key);
      await Media.deleteOne({ _id: fileId });
      return res.status(200).json({ message: "File permanently deleted" });
    }

    image.deletedAt = new Date();
    await image.save();

    res.status(200).json({ message: "File moved to trash successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res
      .status(500)
      .json({ message: "Error deleting file", error: error.message });
  }
};

export const moveToTrash = async (req, res) => {
  try {
    const fileId = req.params.fileId;

    const image = await Media.findOne({ _id: fileId, userId: req.user._id });

    if (!image) {
      return res.status(404).json({ message: "File not found" });
    }

    image.deletedAt = new Date();
    await image.save();

    res.status(200).json({ message: "File moved to trash successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res
      .status(500)
      .json({ message: "Error deleting file", error: error.message });
  }
};

export const restoreMedia = async (req, res) => {
  try {
    const fileId = req.params.fileId;

    const image = await Media.findOne({ _id: fileId, userId: req.user._id });

    if (!image) {
      return res.status(404).json({ message: "File not found" });
    }

    image.deletedAt = null;
    await image.save();

    res.status(200).json({ message: "File restored successfully" });
  } catch (error) {
    console.error("Error restoring file:", error);
    res
      .status(500)
      .json({ message: "Error restoring file", error: error.message });
  }
};

export const getStorageInsights = async (req, res) => {
  try {
    const insights = await getStorageInsightsService(req.user._id);

    return res.status(200).json(insights);
  } catch (error) {
    console.error("Error retrieving storage insights:", error);
    return res.status(500).json({
      message: "Error retrieving storage insights",
      error: error.message,
    });
  }
};

export const getAllMedia = async (req, res) => {
  try {
    const isTrashRoute = req.path === "/trash";
    const query = {
      userId: req.user._id,
      deletedAt: isTrashRoute ? { $ne: null } : null,
    };

    const media = await Media.find(query).sort({ createdAt: -1 });
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
    const { folderId, newFolderId } = req.body;
    const targetFolderId = folderId ?? newFolderId;

    const media = await Media.findOne({ _id: fileId, userId: req.user._id });

    if (!media) {
      return res.status(404).json({ message: "File not found" });
    }

    if (targetFolderId) {
      const folder = await Folder.findOne({
        _id: targetFolderId,
        userId: req.user._id,
      });

      if (!folder) {
        return res.status(404).json({ message: "Target folder not found" });
      }
    }

    media.folderId = targetFolderId || null;
    await media.save();

    res.status(200).json({ message: "File moved successfully", media });
  } catch (error) {
    console.error("Error moving file:", error);
    res
      .status(500)
      .json({ message: "Error moving file", error: error.message });
  }
};

export const renameMedia = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { displayName, newName } = req.body;
    const nameToSet = displayName?.trim() || newName?.trim();

    if (!nameToSet) {
      return res.status(400).json({ message: "New file name is required." });
    }

    const updateMedia = await Media.findByIdAndUpdate(
      { _id: fileId, userId: req.user._id },
      { $set: { displayName: nameToSet } },
      { new: true },
    );

    return res
      .status(200)
      .json({ message: "File renamed successfully", media: updateMedia });
  } catch (error) {
    console.error("Error renaming file:", error);
    res
      .status(500)
      .json({ message: "Error renaming file", error: error.message });
  }
};

export const updateVisibility = async (req, res) => {
  const { fileId } = req.params;
  const { isPublic } = req.body;

  try {
    const media = await Media.findOne({ _id: fileId, userId: req.user._id });

    if (!media) {
      return res.status(404).json({ message: "File not found" });
    }

    media.isPublic = isPublic;
    await media.save();

    res
      .status(200)
      .json({ message: "File visibility updated successfully", media });
  } catch (error) {
    console.error("Error updating file visibility:", error);
    res.status(500).json({
      message: "Error updating file visibility",
      error: error.message,
    });
  }
};

export const enableShare = async (req, res) => {
  const { fileId } = req.params;

  try {
    const media = await Media.findOne({
      _id: fileId,
      userId: req.user._id,
    });

    if (!media) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    if (media.share.enabled) {
      return res.status(200).json({
        message: "File is already being shared",
        shareUrl: `${process.env.APP_URL}/share/${media.share.token}`,
        expiresAt: media.share.expiresAt,
        share: {
          enabled: true,
          token: media.share.token,
          expiresAt: media.share.expiresAt,
          url: `${process.env.APP_URL}/api/media/share/${media.share.token}`,
        },
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    media.share.enabled = true;
    media.share.token = token;
    media.share.expiresAt = null;

    await media.save();

    return res.status(200).json({
      message: "Share link created successfully",
      shareUrl: `${process.env.APP_URL}/api/media/share/${token}`,
      expiresAt: null,
      share: {
        enabled: true,
        token,
        expiresAt: null,
        url: `${process.env.APP_URL}/api/media/share/${token}`,
      },
    });
  } catch (error) {
    console.error("Error enabling share:", error);

    return res.status(500).json({
      message: "Error enabling share",
      error: error.message,
    });
  }
};

export const disableShare = async (req, res) => {
  const { fileId } = req.params;

  try {
    const media = await Media.findOne({
      _id: fileId,
      userId: req.user._id,
    });

    if (!media) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    media.share.enabled = false;
    media.share.token = null;
    media.share.expiresAt = null;

    await media.save();

    return res.status(200).json({
      message: "Share disabled successfully",
      shareUrl: null,
      expiresAt: null,
    });
  } catch (error) {
    console.error("Error disabling share:", error);

    return res.status(500).json({
      message: "Error disabling share",
      error: error.message,
    });
  }
};

export const getSharedMedia = async (req, res) => {
  try {
    const { token } = req.params;

    const media = await Media.findOne({
      "share.token": token,
      "share.enabled": true,
    });

    if (!media) {
      return res.status(404).json({
        message: "Shared file not found",
      });
    }

    if (media.share.expiresAt && new Date() > media.share.expiresAt) {
      return res.status(410).json({
        message: "Share link has expired",
      });
    }

    return streamMedia(media, req, res);
  } catch (error) {
    console.error("Error retrieving shared media:", error);

    return res.status(500).json({
      message: "Error retrieving shared media",
      error: error.message,
    });
  }
};

export const generateSignedUrl = async (req, res) => {
  const { fileId } = req.params;
  const { expiresIn = 300 } = req.body;

  try {
    const media = await Media.findOne({ _id: fileId, userId: req.user._id });

    if (!media) {
      return res.status(404).json({ message: "File not found" });
    }

    const expires = Math.floor(Date.now() / 1000) + Number(expiresIn);

    const signature = generateSignature(media.s3Key, expires);

    const signedUrl = `${process.env.APP_URL}/api/media/cloud/${media.s3Key}?expires=${expires}&signature=${signature}`;

    return res.status(200).json({
      message: "Signed URL generated successfully",
      signedUrl,
      expiresAt: new Date(expires * 1000),
    });
  } catch {
    console.error("Error generating signed URL:", error);
    return res.status(500).json({
      message: "Error generating signed URL",
      error: error.message,
    });
  }
};

export const bulkMoveToTrash = async (req, res) => {
  try {
    const { fileIds } = req.body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        message: "Please provide at least one file.",
      });
    }

    const result = await bulkMoveToTrashService(fileIds, req.user._id);

    return res.status(200).json({
      message: "Files moved to trash successfully.",
      ...result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error moving files to trash.",
      error: error.message,
    });
  }
};
