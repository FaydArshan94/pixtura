import Media from "../models/media.model.js";
import { STORAGE_LIMIT } from "../config/storage.js";

export const getStorageInsights = async (userId) => {
  const [insights] = await Media.aggregate([
    {
      $match: {
        userId,
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        images: {
          $sum: {
            $cond: [{ $eq: ["$mediaType", "image"] }, 1, 0],
          },
        },
        videos: {
          $sum: {
            $cond: [{ $eq: ["$mediaType", "video"] }, 1, 0],
          },
        },
        totalStorage: { $sum: "$size" },
        imageStorage: {
          $sum: {
            $cond: [
              { $eq: ["$mediaType", "image"] },
              "$size",
              0,
            ],
          },
        },
        videoStorage: {
          $sum: {
            $cond: [
              { $eq: ["$mediaType", "video"] },
              "$size",
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalFiles: 1,
        images: 1,
        videos: 1,
        totalStorage: 1,
        imageStorage: 1,
        videoStorage: 1,
      },
    },
  ]);

  const defaultInsights = {
    totalFiles: 0,
    images: 0,
    videos: 0,
    totalStorage: 0,
    imageStorage: 0,
    videoStorage: 0,
  };

  const data = insights || defaultInsights;
  const remainingStorage = Math.max(STORAGE_LIMIT - data.totalStorage, 0);
  const usagePercentage = Math.min(
    Math.round((data.totalStorage / STORAGE_LIMIT) * 100),
    100,
  );

  return {
    ...data,
    storageLimit: STORAGE_LIMIT,
    remainingStorage,
    usagePercentage,
  };
};
