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
    displayName: {
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
    isPublic: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },

    share: {
      enabled: {
        type: Boolean,
        default: false,
      },
      token: {
        type: String,
        default: null,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true },
);

const Media = mongoose.model("Media", mediaSchema);
export default Media;
