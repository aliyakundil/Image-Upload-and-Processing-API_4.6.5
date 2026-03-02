import path from "path";
import type { Request, Response } from "express";
import fileDirName from "../utils/dirname.js";
import reduceFileSize from "../config/sharp.js";

interface MyParams {
  filename: string;
}

interface ResizeBody {
  width: number;
  height: number;
  format?: 'jpeg' | 'png' | 'webp' | 'gif';
}

const { __dirname } = fileDirName(import.meta.url);

export async function processImage(req: Request<MyParams, any, ResizeBody>, res: Response) {
  const { filename } = req.params;
  const { width, height, format } = req.body;

  const inputPath = path.join(__dirname, '..', '..', 'uploads', filename);
  const outputName = `${Date.now()}_${filename}`;
  const outputPath = path.join(__dirname, '..', '..', 'processed', outputName);

  await reduceFileSize(inputPath, outputPath);

  res.json({
    success: true,
    url: `/processed/${outputName}`,
    width,
    height,
    format: format || 'jpeg',
  });
}