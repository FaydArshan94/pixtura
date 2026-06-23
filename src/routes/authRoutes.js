import express from "express";
import { signup, login, generateApiKey } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();



router.post("/signup", signup )
router.post("/login", login )
router.post("/generate-api-key", authMiddleware, generateApiKey)



export default router;