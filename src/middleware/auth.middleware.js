import jwt from "jsonwebtoken";
import user from "../models/user.model.js";
import crypto from "crypto";

export const authMiddleware = async (req, res, next) => {
  const cookieToken = req.cookies?.token;

  if (!cookieToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = cookieToken;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const User = await user.findById(decoded.userId).select("-password");

    if (!User) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = User;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Invalid token" });
  }
};

export const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex");

    const User = await user.findOne({ apiKey: hashedKey }).select("-password");

    if (!User) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = User;

    next();
  } catch (error) {
    console.error("Error validating API key:", error);
    return res.status(500).json({ message: "Error validating API key" });
  }
};