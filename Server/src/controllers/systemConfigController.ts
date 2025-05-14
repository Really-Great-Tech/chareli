import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { SystemConfig } from '../entities/SystemConfig';
import { ApiError } from '../middlewares/errorHandler';

const systemConfigRepository = AppDataSource.getRepository(SystemConfig);

/**
 * @swagger
 * /system-configs:
 *   get:
 *     summary: Get all system configurations
 *     description: Retrieve a list of all system configurations. Accessible by admins.
 *     tags: [SystemConfigs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for config key or description
 *     responses:
 *       200:
 *         description: A list of system configurations
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const getAllSystemConfigs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search } = req.query;
    
    const queryBuilder = systemConfigRepository.createQueryBuilder('config');
    
    if (search) {
      queryBuilder.where(
        'config.key ILIKE :search OR config.description ILIKE :search',
        { search: `%${search}%` }
      );
    }
    
    const configs = await queryBuilder.getMany();
    
    res.status(200).json({
      success: true,
      count: configs.length,
      data: configs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /system-configs/{key}:
 *   get:
 *     summary: Get system configuration by key
 *     description: Retrieve a single system configuration by its key.
 *     tags: [SystemConfigs]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Key of the configuration to retrieve
 *     responses:
 *       200:
 *         description: Configuration found
 *       404:
 *         description: Configuration not found
 *       500:
 *         description: Internal server error
 */
export const getSystemConfigByKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { key } = req.params;
    
    const config = await systemConfigRepository.findOne({
      where: { key }
    });
    
    if (!config) {
      return next(ApiError.notFound(`Configuration with key ${key} not found`));
    }
    
    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /system-configs/formatted:
 *   get:
 *     summary: Get all system configurations in a formatted object
 *     description: Retrieve all system configurations as a key-value object.
 *     tags: [SystemConfigs]
 *     responses:
 *       200:
 *         description: Formatted configurations
 *       500:
 *         description: Internal server error
 */
export const getFormattedSystemConfigs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const configs = await systemConfigRepository.find();
    
    const formattedConfigs = configs.reduce<Record<string, any>>((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {});
    
    res.status(200).json({
      success: true,
      data: formattedConfigs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /system-configs:
 *   post:
 *     summary: Create a new system configuration
 *     description: Create a new system configuration. Accessible by admins.
 *     tags: [SystemConfigs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: object
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Configuration created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const createSystemConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { key, value, description } = req.body;
    
    // Check if config with the same key already exists
    const existingConfig = await systemConfigRepository.findOne({
      where: { key }
    });
    
    if (existingConfig) {
      return next(ApiError.badRequest(`Configuration with key ${key} already exists`));
    }
    
    // Create new config
    const config = systemConfigRepository.create({
      key,
      value,
      description
    });
    
    await systemConfigRepository.save(config);
    
    res.status(201).json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /system-configs/{key}:
 *   put:
 *     summary: Update a system configuration
 *     description: Update a system configuration by its key. Accessible by admins.
 *     tags: [SystemConfigs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Key of the configuration to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: object
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Configuration not found
 *       500:
 *         description: Internal server error
 */
export const updateSystemConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    
    const config = await systemConfigRepository.findOne({
      where: { key }
    });
    
    if (!config) {
      return next(ApiError.notFound(`Configuration with key ${key} not found`));
    }
    
    // Update config
    config.value = value;
    if (description !== undefined) {
      config.description = description;
    }
    
    await systemConfigRepository.save(config);
    
    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /system-configs/{key}:
 *   delete:
 *     summary: Delete a system configuration
 *     description: Delete a system configuration by its key. Accessible by admins.
 *     tags: [SystemConfigs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Key of the configuration to delete
 *     responses:
 *       200:
 *         description: Configuration deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Configuration not found
 *       500:
 *         description: Internal server error
 */
export const deleteSystemConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { key } = req.params;
    
    const config = await systemConfigRepository.findOne({
      where: { key }
    });
    
    if (!config) {
      return next(ApiError.notFound(`Configuration with key ${key} not found`));
    }
    
    await systemConfigRepository.remove(config);
    
    res.status(200).json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
