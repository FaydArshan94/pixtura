import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(),

  fileFilter: (req, file, cb) => {
    const mediaType = file.mimetype.split("/")[0];

    if (["image", "video", "audio"].includes(mediaType)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },

  limits: {
    fileSize: 500 * 1024 * 1024,
  },
});
