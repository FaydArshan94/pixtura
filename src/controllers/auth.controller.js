import user from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const exists = await user.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res
        .status(409)
        .json({ message: "Username or email already in use." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await user.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    res.status(201).json({
      message: "User created successfully",
      id: newUser._id,
      email: newUser.email,
      username: newUser.username,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email && !username) {
      return res
        .status(400)
        .json({ message: "Email or username is required." });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    const User = await user
      .findOne({ $or: [{ email }, { username }] })
      .select("+password");
    if (!User) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, User.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ userId: User._id }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7200000,
    });

    res.status(200).json({
      message: "Login successful",
      id: User._id,
      email: User.email,
      username: User.username,
      token: token,

    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateApiKey = async (req, res) => {
  try {
    const apiKey = crypto.randomBytes(32).toString("hex");
    const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex");

    await user.findByIdAndUpdate(
      req.user._id,
      { apiKey: hashedKey },
      { new: true },
    );

    res.status(200).json({ apiKey, hasApiKey: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const User = await user.findById(req.user._id).select("-password +apiKey");
    if (!User) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      id: User._id,
      email: User.email,
      username: User.username,
      hasApiKey: Boolean(User.apiKey),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  return res.status(200).json({ message: "Logout successful" });
};