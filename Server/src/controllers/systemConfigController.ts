import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { SystemConfig } from '../entities/SystemConfig';
import { File } from '../entities/Files';
import { ApiError } from '../middlewares/errorHandler';
import { storageService } from '../services/storage.service';
import multer from 'multer';
import redis from '../config/redisClient';

const systemConfigRepository = AppDataSource.getRepository(SystemConfig);
const fileRepository = AppDataSource.getRepository(File);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.match('application/pdf|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  }
});

// Middleware to handle file uploads
export const uploadTermsFile = upload.single('file');

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
    const cacheKey = `system-configs:all:${JSON.stringify(req.query)}`;

    // Try to get cached data
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('[Redis] Cache HIT for getAllSystemConfigs:', cacheKey);
      res.status(200).json(JSON.parse(cached));
      return;
    }
    console.log('[Redis] Cache MISS for getAllSystemConfigs:', cacheKey);
    
    const queryBuilder = systemConfigRepository.createQueryBuilder('config');
    
    if (search) {
      queryBuilder.where(
        'config.key ILIKE :search OR config.description ILIKE :search',
        { search: `%${search}%` }
      );
    }
    
    const configs = await queryBuilder.getMany();
    
    // Process file-based configs
    for (const config of configs) {
      if (config.key === 'terms' && config.value?.fileId) {
        const file = await fileRepository.findOne({
          where: { id: config.value.fileId }
        });
        
        if (file) {
          // Transform storage key to full URL
          const fileWithUrl = {
            ...file,
            s3Key: storageService.getPublicUrl(file.s3Key)
          };
          
          // Add file data to config value
          config.value = {
            ...config.value,
            file: fileWithUrl
          };
        }
      }
    }
    
    const response = {
      success: true,
      count: configs.length,
      data: configs,
    };

    // Cache the result for 30 minutes (system configs rarely change)
    await redis.set(cacheKey, JSON.stringify(response), 'EX', 1800);
    
    res.status(200).json(response);
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
    const cacheKey = `system-configs:key:${key}`;

    // Try to get cached data
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('[Redis] Cache HIT for getSystemConfigByKey:', cacheKey);
      res.status(200).json(JSON.parse(cached));
      return;
    }
    console.log('[Redis] Cache MISS for getSystemConfigByKey:', cacheKey);
    
    const config = await systemConfigRepository.findOne({
      where: { key }
    });
    
    if (!config) {
      res.status(200).json({ success: false, message: 'No config found.' });
      return;
    }
    
    // Handle file-based configs (like 'terms')
    if (key === 'terms' && config.value?.fileId) {
      const file = await fileRepository.findOne({
        where: { id: config.value.fileId }
      });
      
      if (file) {
        // Transform storage key to full URL
        const fileWithUrl = {
          ...file,
          s3Key: storageService.getPublicUrl(file.s3Key)
        };
        
        // Add file data to config value
        config.value = {
          ...config.value,
          file: fileWithUrl
        };
      }
    }
    
    const response = {
      success: true,
      data: config,
    };

    // Cache the result for 30 minutes
    await redis.set(cacheKey, JSON.stringify(response), 'EX', 1800);
    
    res.status(200).json(response);
  } catch (error) {
    console.error(`Error in getSystemConfigByKey:`, error);
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
    const cacheKey = 'system-configs:formatted';

    // Try to get cached data
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('[Redis] Cache HIT for getFormattedSystemConfigs:', cacheKey);
      res.status(200).json(JSON.parse(cached));
      return;
    }
    console.log('[Redis] Cache MISS for getFormattedSystemConfigs:', cacheKey);
    
    const configs = await systemConfigRepository.find();
    
    const formattedConfigs = configs.reduce<Record<string, any>>((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {});
    
    // Process file-based configs for formatted response
    for (const config of configs) {
      if (config.key === 'terms' && config.value?.fileId) {
        const file = await fileRepository.findOne({
          where: { id: config.value.fileId }
        });
        
        if (file) {
          // Transform storage key to full URL
          const fileWithUrl = {
            ...file,
            s3Key: storageService.getPublicUrl(file.s3Key)
          };
          
          // Add file data to formatted config
          formattedConfigs[config.key] = {
            ...config.value,
            file: fileWithUrl
          };
        }
      }
    }
    
    const response = {
      success: true,
      data: formattedConfigs,
    };

    // Cache the result for 30 minutes
    await redis.set(cacheKey, JSON.stringify(response), 'EX', 1800);
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /system-configs:
 *   post:
 *     summary: Create or update a system configuration
 *     description: Create a new system configuration or update an existing one if the key already exists. Accessible by admins.
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
 *       200:
 *         description: Configuration updated successfully
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
  // Start a transaction
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { key, description } = req.body;
    const file = req.file;

    if (key === 'terms' && !file) {
      return next(ApiError.badRequest('File is required for terms configuration'));
    }

    // Check if config with the same key already exists
    let config = await systemConfigRepository.findOne({
      where: { key }
    });

    let isNewConfig = false;

    if (key === 'terms' && file) {
      // Upload file to storage
      const uploadResult = await storageService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        'terms'
      );

      // Create file record
      const fileRecord = await queryRunner.manager.create(File, {
        s3Key: uploadResult.key,
        type: 'terms'
      });
      await queryRunner.manager.save(fileRecord);

      const value = {
        fileId: fileRecord.id,
        uploadedAt: new Date()
      };

      if (config) {
        // Update existing config
        config.value = value;
        if (description !== undefined) {
          config.description = description;
        }
      } else {
        // Create new config
        isNewConfig = true;
        config = systemConfigRepository.create({
          key,
          value,
          description
        });
      }
    } else {
      const value = req.body.value;
      
      if (config) {
        // Update existing config
        config.value = value;
        if (description !== undefined) {
          config.description = description;
        }
      } else {
        // Create new config
        isNewConfig = true;
        config = systemConfigRepository.create({
          key,
          value,
          description
        });
      }
    }

    await queryRunner.manager.save(config);
    await queryRunner.commitTransaction();

    // Invalidate system configs cache
    const keys = await redis.keys('system-configs:*');
    if (keys.length > 0) await redis.del(keys);

    // Fetch the saved config with file data if applicable
    const savedConfig = await systemConfigRepository.findOne({
      where: { key: config.key }
    });

    if (savedConfig && key === 'terms' && savedConfig.value?.fileId) {
      const file = await fileRepository.findOne({
        where: { id: savedConfig.value.fileId }
      });
      
      if (file) {
        // Transform storage key to full URL
        const fileWithUrl = {
          ...file,
          s3Key: storageService.getPublicUrl(file.s3Key)
        };
        
        // Add file data to config value
        savedConfig.value = {
          ...savedConfig.value,
          file: fileWithUrl
        };
      }
    }

    res.status(isNewConfig ? 201 : 200).json({
      success: true,
      message: isNewConfig ? 'Configuration created successfully' : 'Configuration updated successfully',
      data: savedConfig || config,
    });
  } catch (error) {
    await queryRunner.rollbackTransaction();
    next(error);
  } finally {
    await queryRunner.release();
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
    
    // Invalidate system configs cache
    const keys = await redis.keys('system-configs:*');
    if (keys.length > 0) await redis.del(keys);
    
    // Handle file-based configs for response
    if (key === 'terms' && config.value?.fileId) {
      const file = await fileRepository.findOne({
        where: { id: config.value.fileId }
      });
      
      if (file) {
        // Transform storage key to full URL
        const fileWithUrl = {
          ...file,
          s3Key: storageService.getPublicUrl(file.s3Key)
        };
        
        // Add file data to config value
        config.value = {
          ...config.value,
          file: fileWithUrl
        };
      }
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
    
    // Invalidate system configs cache
    const keys = await redis.keys('system-configs:*');
    if (keys.length > 0) await redis.del(keys);
    
    res.status(200).json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
