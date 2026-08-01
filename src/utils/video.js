import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import path from "path";

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

export const getVideoMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === "video",
      );

      const [num, den] = (videoStream?.r_frame_rate || "0/1")
        .split("/")
        .map(Number);

      const fps = den ? num / den : 0;

      resolve({
        duration: metadata.format.duration,
        width: videoStream?.width,
        height: videoStream?.height,
        codec: videoStream?.codec_name,
        fps: fps,
      });
    });
  });
};

export const generateThumbnail = (videoPath, outputDir) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ["1"],
        filename: "thumbnail.jpg",
        folder: outputDir,
        size: "640x?",
      })
      .on("end", () => {
        resolve(path.join(outputDir, "thumbnail.jpg"));
      })
      .on("error", reject);
  });
};
