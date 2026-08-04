import { streamMediaCdn } from "../services/cdn/streamMedia.js";

export const getMediaByCdn = async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({ message: "Public ID is required" });
    }

    const { w, h, fit, format, q } = req.query;


    const options = parseTransformations(req.params.transformations);

    const { buffer, contentType, contentLength, etag, lastModified } =
      await streamMediaCdn(publicId, options);

    res.setHeader("Content-Type", contentType);

    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    if (etag) {
      res.setHeader("ETag", etag);
    }

    if (lastModified) {
      res.setHeader("Last-Modified", lastModified.toUTCString());
    }

    // We'll change this later when CloudFront is the origin
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(404).json({
      message: error.message,
    });
  }
};
