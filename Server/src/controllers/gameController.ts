import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Game, GameStatus } from '../entities/Games';
import { Category } from '../entities/Category';
import { File } from '../entities/Files';
import { ApiError } from '../middlewares/errorHandler';
import { RoleType } from '../entities/Role';

const gameRepository = AppDataSource.getRepository(Game);
const categoryRepository = AppDataSource.getRepository(Category);
const fileRepository = AppDataSource.getRepository(File);

/**
 * @swagger
 * /games:
 *   get:
 *     summary: Get all games
 *     description: Retrieve a list of all games with pagination and filtering options. Accessible by admins.
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, disabled]
 *         description: Filter by game status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for game title or description
 *       - in: query
 *         name: createdById
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by creator ID
 *     responses:
 *       200:
 *         description: A list of games
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const getAllGames = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      categoryId, 
      status, 
      search,
      createdById 
    } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    
    const queryBuilder = gameRepository.createQueryBuilder('game')
      .leftJoinAndSelect('game.category', 'category')
      .leftJoinAndSelect('game.thumbnailFile', 'thumbnailFile')
      .leftJoinAndSelect('game.gameFile', 'gameFile')
      .leftJoinAndSelect('game.createdBy', 'createdBy');
    
    // Apply category filter if provided
    if (categoryId) {
      queryBuilder.andWhere('game.categoryId = :categoryId', { categoryId });
    }
    
    // Apply status filter if provided
    if (status) {
      queryBuilder.andWhere('game.status = :status', { status });
    }
    
    // Apply creator filter if provided
    if (createdById) {
      queryBuilder.andWhere('game.createdById = :createdById', { createdById });
    }
    
    // Apply search filter if provided
    if (search) {
      queryBuilder.andWhere(
        '(game.title ILIKE :search OR game.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }
    
    // Get total count for pagination
    const total = await queryBuilder.getCount();
    
    // Apply pagination
    queryBuilder
      .skip((pageNumber - 1) * limitNumber)
      .take(limitNumber)
      .orderBy('game.createdAt', 'DESC');
    
    const games = await queryBuilder.getMany();
    
    res.status(200).json({
      success: true,
      count: games.length,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: games,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /games/{id}:
 *   get:
 *     summary: Get game by ID
 *     description: Retrieve a single game by its ID with related entities. Accessible by admins.
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the game to retrieve
 *     responses:
 *       200:
 *         description: Game found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Game not found
 *       500:
 *         description: Internal server error
 */
export const getGameById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const game = await gameRepository.findOne({
      where: { id },
      relations: ['category', 'thumbnailFile', 'gameFile', 'createdBy']
    });
    
    if (!game) {
      return next(ApiError.notFound(`Game with id ${id} not found`));
    }
    
    res.status(200).json({
      success: true,
      data: game,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /games:
 *   post:
 *     summary: Create a new game
 *     description: Create a new game. Accessible by admins.
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnailFileId:
 *                 type: string
 *                 format: uuid
 *               gameFileId:
 *                 type: string
 *                 format: uuid
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [active, disabled]
 *               config:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Game created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const createGame = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { 
      title, 
      description, 
      thumbnailFileId, 
      gameFileId, 
      categoryId, 
      status = GameStatus.ACTIVE,
      config = 0
    } = req.body;
    
    // Validate required fields
    if (!title) {
      return next(ApiError.badRequest('Game title is required'));
    }
    
    // Check if category exists if provided
    if (categoryId) {
      const category = await categoryRepository.findOne({
        where: { id: categoryId }
      });
      
      if (!category) {
        return next(ApiError.badRequest(`Category with id ${categoryId} not found`));
      }
    }
    
    // Check if thumbnail file exists if provided
    if (thumbnailFileId) {
      const thumbnailFile = await fileRepository.findOne({
        where: { id: thumbnailFileId }
      });
      
      if (!thumbnailFile) {
        return next(ApiError.badRequest(`Thumbnail file with id ${thumbnailFileId} not found`));
      }
      
      // Ideally, we would check if the file is an image type here
      // For now, we'll just assume it's valid
    }
    
    // Check if game file exists if provided
    if (gameFileId) {
      const gameFile = await fileRepository.findOne({
        where: { id: gameFileId }
      });
      
      if (!gameFile) {
        return next(ApiError.badRequest(`Game file with id ${gameFileId} not found`));
      }
      
      // Ideally, we would check if the file is a compressed folder type here
      // For now, we'll just assume it's valid
    }
    
    // Create new game
    const game = gameRepository.create({
      title,
      description,
      thumbnailFileId,
      gameFileId,
      categoryId,
      status,
      config,
      createdById: req.user?.userId // Set current user as creator
    });
    
    await gameRepository.save(game);
    
    // Fetch the game with relations to return
    const savedGame = await gameRepository.findOne({
      where: { id: game.id },
      relations: ['category', 'thumbnailFile', 'gameFile', 'createdBy']
    });
    
    res.status(201).json({
      success: true,
      data: savedGame,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /games/{id}:
 *   put:
 *     summary: Update a game
 *     description: Update a game by its ID. Accessible by admins.
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the game to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnailFileId:
 *                 type: string
 *                 format: uuid
 *               gameFileId:
 *                 type: string
 *                 format: uuid
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [active, disabled]
 *               config:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Game updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Game not found
 *       500:
 *         description: Internal server error
 */
export const updateGame = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      thumbnailFileId, 
      gameFileId, 
      categoryId, 
      status,
      config
    } = req.body;
    
    const game = await gameRepository.findOne({
      where: { id }
    });
    
    if (!game) {
      return next(ApiError.notFound(`Game with id ${id} not found`));
    }
    
    // Check if category exists if provided
    if (categoryId && categoryId !== game.categoryId) {
      const category = await categoryRepository.findOne({
        where: { id: categoryId }
      });
      
      if (!category) {
        return next(ApiError.badRequest(`Category with id ${categoryId} not found`));
      }
      
      game.categoryId = categoryId;
    }
    
    // Check if thumbnail file exists if provided
    if (thumbnailFileId && thumbnailFileId !== game.thumbnailFileId) {
      const thumbnailFile = await fileRepository.findOne({
        where: { id: thumbnailFileId }
      });
      
      if (!thumbnailFile) {
        return next(ApiError.badRequest(`Thumbnail file with id ${thumbnailFileId} not found`));
      }
      
      // Ideally, we would check if the file is an image type here
      // For now, we'll just assume it's valid
      
      game.thumbnailFileId = thumbnailFileId;
    }
    
    // Check if game file exists if provided
    if (gameFileId && gameFileId !== game.gameFileId) {
      const gameFile = await fileRepository.findOne({
        where: { id: gameFileId }
      });
      
      if (!gameFile) {
        return next(ApiError.badRequest(`Game file with id ${gameFileId} not found`));
      }
      
      // Ideally, we would check if the file is a compressed folder type here
      // For now, we'll just assume it's valid
      
      game.gameFileId = gameFileId;
    }
    
    // Update basic game properties
    if (title) game.title = title;
    if (description !== undefined) game.description = description;
    if (status) game.status = status as GameStatus;
    if (config !== undefined) game.config = config;
    
    await gameRepository.save(game);
    
    // Fetch the updated game with relations to return
    const updatedGame = await gameRepository.findOne({
      where: { id },
      relations: ['category', 'thumbnailFile', 'gameFile', 'createdBy']
    });
    
    res.status(200).json({
      success: true,
      data: updatedGame,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /games/{id}:
 *   delete:
 *     summary: Delete a game
 *     description: Delete a game by its ID. Accessible by admins.
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the game to delete
 *     responses:
 *       200:
 *         description: Game deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Game not found
 *       500:
 *         description: Internal server error
 */
export const deleteGame = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const game = await gameRepository.findOne({
      where: { id }
    });
    
    if (!game) {
      return next(ApiError.notFound(`Game with id ${id} not found`));
    }
    
    // Check if user has permission to delete
    // Only super admins can delete games created by other admins
    if (
      req.user?.role === RoleType.ADMIN &&
      game.createdById !== req.user.userId
    ) {
      const createdByAdmin = await gameRepository
        .createQueryBuilder('game')
        .leftJoinAndSelect('game.createdBy', 'user')
        .leftJoinAndSelect('user.role', 'role')
        .where('game.id = :id', { id })
        .andWhere('role.name IN (:...roles)', { roles: [RoleType.ADMIN, RoleType.SUPERADMIN] })
        .getOne();
      
      if (createdByAdmin) {
        return next(ApiError.forbidden('You do not have permission to delete this game'));
      }
    }
    
    await gameRepository.remove(game);
    
    res.status(200).json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
