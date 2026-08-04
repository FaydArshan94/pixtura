import sharp from "sharp";

const SUPPORTED_FORMATS = ["jpeg", "png", "webp", "avif"];

const SUPPORTED_FITS = [
  "cover",
  "contain",
  "fill",
  "inside",
  "outside",
];

export async function transform(buffer, options = {}) {
  const {
    width,
    height,
    format,
    quality,
    fit = "inside",
  } = options;

  if (!Buffer.isBuffer(buffer)) {
    throw new Error("Invalid image buffer");
  }

  // Validate format
  if (format && !SUPPORTED_FORMATS.includes(format)) {
    throw new Error(
      `Unsupported format "${format}". Supported formats: ${SUPPORTED_FORMATS.join(", ")}`
    );
  }

  // Validate fit
  if (fit && !SUPPORTED_FITS.includes(fit)) {
    throw new Error(
      `Unsupported fit "${fit}". Supported fits: ${SUPPORTED_FITS.join(", ")}`
    );
  }

  // Validate quality
  const q =
    quality !== undefined
      ? Math.min(100, Math.max(1, Number(quality)))
      : undefined;

  const metadata = await sharp(buffer).metadata();

  let pipeline = sharp(buffer);

  // Resize
  if (width || height) {
    pipeline = pipeline.resize({
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      fit,
      withoutEnlargement: true,
    });
  }

  // Format Conversion
  switch (format || metadata.format) {
    case "jpeg":
      pipeline = pipeline.jpeg({
        quality: q ?? 85,
      });
      break;

    case "png":
      pipeline = pipeline.png();
      break;

    case "webp":
      pipeline = pipeline.webp({
        quality: q ?? 80,
      });
      break;

    case "avif":
      pipeline = pipeline.avif({
        quality: q ?? 70,
      });
      break;

    default:
      // Fallback for unsupported original formats
      pipeline = pipeline.jpeg({
        quality: q ?? 85,
      });
      break;
  }

  const outputBuffer = await pipeline.toBuffer();

  return {
    buffer: outputBuffer,
    contentType: `image/${format || metadata.format || "jpeg"}`,
  };
}