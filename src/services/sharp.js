import sharp from "sharp";

const formats = ["jpeg", "png", "webp", "avif"];

export async function transform(buffer, params) {
  const { w, h, format, quality, fit } = params;

  // Validate format if provided
  if (format && !formats.includes(format)) {
    throw new Error(
      `Invalid image format: ${format}. Supported formats are: ${formats.join(", ")}`,
    );
  }

  const metadata = await sharp(buffer).metadata();

  let pipeline = sharp(buffer);

  if (w || h) {
    pipeline = pipeline.resize({
      width: w ? parseInt(w) : null,
      height: h ? parseInt(h) : null,
      fit: fit || "inside",
      withoutEnlargement: true,
    });
  }

  if (format === "webp")
    pipeline = pipeline.webp({ quality: quality ? parseInt(quality) : 80 });
  else if (format === "avif")
    pipeline = pipeline.avif({ quality: quality ? parseInt(quality) : 70 });
  else if (format === "jpeg")
    pipeline = pipeline.jpeg({ quality: quality ? parseInt(quality) : 85 });
  else if (format === "png") pipeline = pipeline.png();
  else {
    // If no format is specified, use the original format
    pipeline = pipeline.toFormat(metadata.format, {
      quality: quality ? parseInt(quality) : 85,
    });
  }

  return {
    buffer: await pipeline.toBuffer(),
    format: format || metadata.format,
  };
}
