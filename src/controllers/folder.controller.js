import Folder from "../models/folder.model.js";
import Media from "../models/media.model.js";

export const createFolder = async (req, res) => {
  try {
    const { name } = req.body;
    const folder = new Folder({ name, userId: req.user._id });
    await folder.save();
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFolders = async (req, res) => {
  try {
    const folders = await Folder.find({ userId: req.user._id });
    res.status(200).json(folders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFolderById = async (req, res) => {
  const { id } = req.params;

  try {
    const folder = await Folder.findOne({ _id: id, userId: req.user._id });

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }
    res.status(200).json(folder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteFolder = async (req, res) => {
  const { id } = req.params;

  try {
    const folder = await Folder.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Move any files that were in this folder back to root
    await Media.updateMany(
      { folderId: id, userId: req.user._id },
      { folderId: null },
    );

    res.status(200).json({ message: "Folder deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
