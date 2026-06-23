import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    apiKey: { type: String, select: false, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("user", userSchema);
