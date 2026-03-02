import { Request, Response, NextFunction } from "express";
import { backgroundJobService } from "../services/background-job.service";

export const getBackgroundJobs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jobs = await backgroundJobService.listUserJobs(req.user!.id, 50);
    res.status(200).json({
      status: "success",
      results: jobs.length,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};
