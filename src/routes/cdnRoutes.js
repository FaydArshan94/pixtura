import express from "express";
import { getMediaByCdn } from "../controllers/cdn.controller.js";

const router = express.Router();

router.get("/tr/:transformations/:publicId", getMediaByCdn);
router.get("/:publicId", getMediaByCdn);

export default router;
