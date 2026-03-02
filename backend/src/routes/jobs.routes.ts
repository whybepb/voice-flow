import { Router } from "express";
import { authGuard } from "../middlewares/auth.middleware";
import { getBackgroundJobs } from "../controllers/jobs.controller";

const router = Router();

router.use(authGuard);
router.get("/", getBackgroundJobs);

export default router;
