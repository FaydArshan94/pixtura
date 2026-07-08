import express from "express";
import { upload } from "../config/multer.js";
import { deleteMedia, getMedia, uploadMedia, getAllMedia, getMediaById, moveMedia } from "../controllers/mediaController.js";
import { signup, login } from "../controllers/auth.controller.js";
import { authMiddleware, validateApiKey } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/upload", validateApiKey, upload.single("file"), uploadMedia);
router.post("/upload/dashboard", authMiddleware, upload.single("file"), uploadMedia);

router.patch("/update/:fileId", authMiddleware, moveMedia);

router.delete("/delete/:fileId", authMiddleware, deleteMedia);
router.get("/", authMiddleware, getAllMedia);
router.get("/:fileId", authMiddleware, getMediaById);
router.get("/:fileName", validateApiKey, getMedia);
export default router;