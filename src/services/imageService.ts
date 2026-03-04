import sharp from "../config/sharp.js";
import path from "path";

export interface ProcessImageOptions {
  inputPath: string;
  outputPath: string;
  width?: number;
  height?: number;
  format?: "jpeg" | "png" | "webp" | "gif";
  quality?: number;
  sharpen?: boolean;
}

export async function processImage(
  options: ProcessImageOptions
): Promise<void> {

  const {
    inputPath,
    outputPath,
    width,
    height,
    format = "jpeg",
    quality = 80,
    sharpen = false,
  } = options;

  let pipeline = sharp(inputPath);

  if (width || height) {
    pipeline = pipeline.resize(width, height, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  if (sharpen) {
    pipeline = pipeline.sharpen();
  }

  if (format === "jpeg" || format === "webp") {
    pipeline = pipeline.toFormat(format, { quality });
  } else {
    pipeline = pipeline.toFormat(format);
  }

  await pipeline.toFile(outputPath);
};

// Создаёт несколько версий изображения разной ширины
// нужен для адаптивной верстки 
export async function generateResponsiveSizes(
  inputPath: string,
  outputDir: string,
  format: string = "jpeg"
) {
  const sizes = [
    { width: 320, size: "small" },
    { width: 640, size: "medium" },
    { width: 1200, size: "large" }
  ];

  const results = [];

  for (const s of sizes) {
    const outputPath = `${outputDir}-${s.width}.${format}`;

    await sharp(inputPath)
      .resize({ width: s.width })
      .toFormat(format as any)
      .toFile(outputPath);

    results.push({
      size: s.size,
      width: s.width,
      url: `/processed/${path.basename(outputPath)}`
    });
  }

  return results;
}

export async function createThumbnail(
  inputPath: string,
  outputPath: string,
  size: number = 200
) {
  await sharp(inputPath)
    .resize(size, size, { fit: "cover" })
    .toFile(outputPath);

  return outputPath;
};

export async function addWatermark(
  inputPath: string,
  outputPath: string,
  watermarkPath: string
) {
  const watermark = await sharp(watermarkPath)
    .resize(100)
    .png()
    .toBuffer();

  await sharp(inputPath)
    .composite([{ input: watermark, gravity: "southeast" }])
    .toFile(outputPath);

  return {
    type: "watermark",
    url: `/processed/${path.basename(outputPath)}`
  };
}