import Media from "../models/media.model.js";

export const bulkMoveToTrashService = async (fileIds, userId) => {
  const result = await Media.updateMany(
    {
      _id: { $in: fileIds },
      userId,
      deletedAt: null,
    },
    {
      $set: {
        deletedAt: new Date(),
      },
    },
  );

  return {
    message: "Files moved to trash successfully.",
    modifiedCount: result.modifiedCount,
    requestedCount: fileIds.length,
  };
};
