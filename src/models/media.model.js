import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    s3Key: {
      type: String,
    },
    originalName: {
      type: String,
    },
    format: {
      type: String,
    },
    size: {
      type: Number,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    url: {
      type: String,
    },

    folderId: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null }
  },
  { timestamps: true },
);

const Media = mongoose.model("Media", mediaSchema);
export default Media;
