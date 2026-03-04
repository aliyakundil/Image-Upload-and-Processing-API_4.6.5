import type { Request, Response } from "express";
import path from "path";
import fileDirName from "../utils/dirname.js";
import fs from "fs/promises";
import { fileTypeFromBuffer } from "file-type";
import { generateResponsiveSizes } from "../services/imageService.js";
import File from "../models/File.js";

const { __dirname } = fileDirName(import.meta.url)

export async function getHomePage(req: Request, res: Response) {
  try {
    const homeDir = path.join(__dirname, '..', 'public', 'index.html');
    res.sendFile(homeDir);
  } catch (err: any) {
    res.status(500).json({ error: `Server error: ${err.message}` })
  }
}

export async function postResizeImages(req: Request, res: Response) {
  const files = req.files as Express.Multer.File[];
  const allResponsive: any[] = [];
  const tempPaths: string[] = [];
  const outputPaths: string[] = [];
  let validationError: string | null = null;

  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "File not found" });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
  for (const file of files) {

    const buffer = await fs.readFile(file.path);
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType || !allowedTypes.includes(fileType.mime)) {
      validationError = `Invalid file content: ${file.originalname}`;
      break;
    }

    // Проверка MIME-типа
    if (!allowedTypes.includes(file.mimetype)) {
      validationError = `Unsupported file type: ${file.originalname}`
      break; 
    };

    // Проверка расширения
    const ext = path.extname(file.originalname).toLocaleLowerCase();
    if (!allowedExts.includes(ext)) {
      validationError = `File extension not allowed: ${file.originalname}` 
      break;
    }

    tempPaths.push(file.path);
  }

  if (validationError) {
    await Promise.all(
      tempPaths.map(async (p) => {
        try {
          await fs.unlink(p)
        } catch (err) {}
      })
    )

    return res.status(400).json({ error: validationError });
  }
    
  try {
    for (const file of files) {

      const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueName = `${Date.now()}_${Math.floor(Math.random() * 10000)}_${safeName}`;
      const outputfileDir = path.join(__dirname, '..', '..', 'uploads', uniqueName);

      const buffer = await fs.readFile(file.path);
      const fileType = await fileTypeFromBuffer(buffer);

      const outputFormat =
        fileType && allowedTypes.includes(fileType.mime)
          ? fileType.ext
          : "jpeg";
      
      const responsiveImages = await generateResponsiveSizes(
        file.path,
        outputfileDir,
        outputFormat
      );

      allResponsive.push(...responsiveImages);

      const fileDoc = new File({
        originalName: file.originalname,
        savedName: uniqueName,
        savedPath: outputfileDir,
        size: file.size,
        type: file.mimetype
      });

      await fileDoc.save();

      // await fs.unlink(file.path);
    }

    return res.json({
        responsive: allResponsive
    });
  } catch (err) {
    console.error("REAL ERROR:", err);
    await Promise.all([
      ...tempPaths.map(async (p) => {
        try { await fs.unlink(p); } catch {}
      }),
      ...outputPaths.map(async (p) => {
        try { await fs.unlink(p); } catch {}
      })
    ]);

    return res.status(500).json({ responsive: [] });
  }
}