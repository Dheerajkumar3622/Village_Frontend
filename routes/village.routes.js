import express from "express";
import { searchVillages } from "../controllers/village.controller.js";

const router = express.Router();

// GET /api/villages/search?q=bhais
router.get("/search", searchVillages);

export default router;
