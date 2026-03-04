import { Router } from "express";
import { getHomePage, postResizeImages } from "../controllers/uploadController.js";
import { uploadMiddleware } from "../middleware/validation.js";

const router = Router();

router.get('/', getHomePage);
router.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});
router.post('/responsive', uploadMiddleware, postResizeImages);

export default router;