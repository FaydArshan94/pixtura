import express from "express";
import { upload } from "../config/multer.js";
import {
  deleteMedia,
  moveToTrash,
  restoreMedia,
  getMedia,
  uploadMedia,
  getAllMedia,
  getMediaById,
  moveMedia,
  renameMedia,
  updateVisibility,
  enableShare,
  disableShare,
  getSharedMedia,
  generateSignedUrl,
  getStorageInsights,
} from "../controllers/mediaController.js";
import { signup, login } from "../controllers/auth.controller.js";
import {
  authMiddleware,
  validateApiKey,
} from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/upload", validateApiKey, upload.single("file"), uploadMedia);
router.post(
  "/upload/dashboard",
  authMiddleware,
  upload.single("file"),
  uploadMedia,
);
router.post("/:fileId/sign", authMiddleware, generateSignedUrl);

router.patch("/update/:fileId", authMiddleware, moveMedia);
router.patch("/:fileId/move", authMiddleware, moveMedia);

router.delete("/delete/:fileId", authMiddleware, deleteMedia);
router.delete("/:fileId/share", authMiddleware, disableShare);

// router.delete("/:fileId", authMiddleware, deleteMedia);
router.patch("/:fileId/trash", authMiddleware, moveToTrash);
router.patch("/:fileId/restore", authMiddleware, restoreMedia);

router.get("/storage-insights", authMiddleware, getStorageInsights);
router.get("/trash", authMiddleware, getAllMedia);
router.get("/", authMiddleware, getAllMedia);
router.get("/:fileId", authMiddleware, getMediaById);
router.get("/cloud/:fileName", getMedia);
router.get("/share/:token", getSharedMedia);
router.patch("/rename/:fileId", authMiddleware, renameMedia);
router.patch("/:fileId/visibility", authMiddleware, updateVisibility);
router.patch("/:fileId/share", authMiddleware, enableShare);

export default router;
