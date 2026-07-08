import express from "express";
import { createFolder, getFolders, getFolderById, deleteFolder } from "../controllers/folder.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();


router.post("/create/folders", authMiddleware, createFolder);
router.get("/get/folders", authMiddleware, getFolders);
router.get("/get/folder/:id", authMiddleware, getFolderById);
router.delete("/delete/folder/:id", authMiddleware, deleteFolder);


export default router;