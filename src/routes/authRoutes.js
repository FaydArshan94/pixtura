import express from "express";
import { signup, login, generateApiKey, getMe, logoutUser } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();



router.post("/signup", signup )
router.post("/login", login )
router.post("/generate-api-key", authMiddleware, generateApiKey)
router.get("/me", authMiddleware, getMe)
router.post("/logout", authMiddleware, logoutUser)


export default router;