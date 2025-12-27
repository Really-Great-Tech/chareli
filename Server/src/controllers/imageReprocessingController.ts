import { Request, Response, NextFunction } from 'express';
import { imageReprocessingService } from '../services/imageReprocessing.service';
import logger from '../utils/logger';

/**
 * Get reprocessing status
 */
export const getReprocessingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const status = await imageReprocessingService.getStatus();
    const errors = await imageReprocessingService.getErrors();

    res.status(200).json({
      success: true,
      data: {
        ...status,
        errors,
      },
    });
  } catch (error) {
    logger.error('Error getting reprocessing status:', error);
    next(error);
  }
};

/**
 * Start image reprocessing
 */
export const startReprocessing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { batchSize } = req.body;

    await imageReprocessingService.start(batchSize);

    res.status(200).json({
      success: true,
      message: 'Image reprocessing started',
    });
  } catch (error) {
    logger.error('Error starting reprocessing:', error);
    next(error);
  }
};

/**
 * Pause image reprocessing
 */
export const pauseReprocessing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await imageReprocessingService.pause();

    res.status(200).json({
      success: true,
      message: 'Image reprocessing paused',
    });
  } catch (error) {
    logger.error('Error pausing reprocessing:', error);
    next(error);
  }
};

/**
 * Resume image reprocessing
 */
export const resumeReprocessing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await imageReprocessingService.resume();

    res.status(200).json({
      success: true,
      message: 'Image reprocessing resumed',
    });
  } catch (error) {
    logger.error('Error resuming reprocessing:', error);
    next(error);
  }
};

/**
 * Reset reprocessing status and errors
 */
export const resetReprocessing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await imageReprocessingService.reset();

    res.status(200).json({
      success: true,
      message: 'Image reprocessing status reset',
    });
  } catch (error) {
    logger.error('Error resetting reprocessing:', error);
    next(error);
  }
};
