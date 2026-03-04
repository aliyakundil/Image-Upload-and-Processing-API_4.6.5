import path from "path";
import type { Request, Response } from "express";
import fileDirName from "../utils/dirname.js";
import { processImage as processImageService, addWatermark, createThumbnail } from "../services/imageService.js";

interface MyParams {
  filename?: string;
}

interface ResizeBody {
  width?: number;
  height?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'gif';
  sharpen?: boolean;
}

const { __dirname } = fileDirName(import.meta.url);

export async function processImage(
  req: Request<MyParams, any, ResizeBody>,
  res: Response
) {
  try {
    const { filename } = req.params;
    if (!filename) return res.status(400).json({ error: "Filename is required" });

    const { width, height, format = 'jpeg', sharpen = false } = req.body;

    const inputPath = path.join(__dirname, '..', '..', 'uploads', filename);
    const processedName = `${Date.now()}_${filename}`;
    const processedPath = path.join(__dirname, '..', '..', 'processed', processedName);

    // 1. Основная обработка изображения
    await processImageService({
      inputPath,
      outputPath: processedPath,
      width:  width ?? 800,
      height: height ?? 600,
      format,
      sharpen
    });

    // 2. Добавление водяного знака
    const watermarkedName = `wm-${processedName}`;
    const watermarkedPath = path.join(__dirname, '..', '..', 'processed', watermarkedName);
    const watermarkFile = path.join(__dirname, '..', '..', 'assets', 'logo.png');
    await addWatermark(processedPath, watermarkedPath, watermarkFile);

    // 3. Создание миниатюры
    const thumbName = `thumb-${processedName}`;
    const thumbPath = path.join(__dirname, '..', '..', 'processed', thumbName);
    await createThumbnail(processedPath, thumbPath, 200);

    // Отправка JSON с тремя вариантами
    res.json({
      success: true,
      images: {
        original: `/processed/${processedName}`,
        watermarked: `/processed/${watermarkedName}`,
        thumbnail: `/processed/${thumbName}`
      },
      width,
      height,
      format
    });

  } catch (err: any) {
    console.error("Processing error:", err);
    res.status(500).json({ error: err.message });
  }
}