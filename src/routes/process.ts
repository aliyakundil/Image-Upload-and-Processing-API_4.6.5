import { Router } from "express";
import { processImage } from "../controllers/processController.js";
import { validateProcessParams } from "../middleware/processValidation.js";

const router = Router();

router.post('/:filename', validateProcessParams, processImage);

export default router;