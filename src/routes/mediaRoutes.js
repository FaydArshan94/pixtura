import express from "express";
import { upload } from "../config/multer.js";
import { deleteMedia, getMedia, uploadMedia } from "../controllers/mediaController.js";
import { signup, login } from "../controllers/auth.controller.js";
import { validateApiKey } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/upload", validateApiKey, upload.single("file"), uploadMedia);
router.get("/:fileName", getMedia)
router.post("/delete/:fileName", deleteMedia)





export default router;