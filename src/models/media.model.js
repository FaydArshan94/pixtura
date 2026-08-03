import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    mediaType: {
      type: String,
      enum: ["image", "video", "audio"],
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },

    s3Key: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    format: {
      type: String,
    },
    size: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    url: {
      type: String,
      required: true,
    },
    cdnUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },

    videoMetadata: {
      duration: {
        type: Number,
      },
      bitrate: {
        type: Number,
      },
      videoCodec: {
        type: String,
      },
      audioCodec: {
        type: String,
      },
      fps: {
        type: Number,
      },
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

mediaSchema.index({ userId: 1 });
mediaSchema.index({ folderId: 1 });
mediaSchema.index({ "share.token": 1 });
mediaSchema.index({ isPublic: 1 });
mediaSchema.index({ deletedAt: 1 });

const Media = mongoose.model("Media", mediaSchema);

export default Media;
