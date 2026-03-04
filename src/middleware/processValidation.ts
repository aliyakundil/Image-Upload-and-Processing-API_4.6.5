import type { Request, Response, NextFunction } from "express";

export function validateProcessParams(req: Request, res: Response, next: NextFunction) {
  const { width, height, format, quality, sharpen } = req.body;

  if (!width || typeof width !== "number" || width <= 0) {
    return res.status(400).json({ error: "Width must be a positive number" });
  }

  if (!height || typeof height !== "number" || height <= 0) {
    return res.status(400).json({ error: "Height must be a positive number" });
  }

  const allowedFormats = ["jpeg", "png", "webp", "gif"];
  if (format && !allowedFormats.includes(format)) {
    return res.status(400).json({ error: `Format must be one of: ${allowedFormats.join(", ")}` });
  }

  if (quality && (typeof quality !== "number" || quality < 0 || quality > 100)) {
    return res.status(400).json({ error: "Quality must be a number between 0 and 100" });
  }

  if (sharpen !== undefined && typeof sharpen !== "boolean") {
    return res.status(400).json({ error: "Sharpen must be a boolean" });
  }

  next();
}