import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Category } from '../entities/Category';
import { ApiError } from '../middlewares/errorHandler';
import { File } from '../entities/Files';
import { storageService } from '../services/storage.service';

// Extend File type to include url
type FileWithUrl = File & { url?: string };
type GameWithUrls = {
  id: string;
  title: string;
  description?: string;
  thumbnailFile?: FileWithUrl;
  gameFile?: FileWithUrl;
  [key: string]: any;
};

const categoryRepository = AppDataSource.getRepository(Category);

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve a list of all categories. Accessible by admins.
 *     tags: [Categories]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for category name
 *     responses:
 *       200:
 *         description: A list of categories
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    const queryBuilder = categoryRepository.createQueryBuilder('category');

    // Apply search filter if provided
    if (search) {
      queryBuilder.where('category.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // Get total count for pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder
      .skip((pageNumber - 1) * limitNumber)
      .take(limitNumber)
      .orderBy('category.name', 'ASC');

    const categories = await queryBuilder.getMany();

    res.status(200).json({
      success: true,
      count: categories.length,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     description: Retrieve a single category by its ID. Accessible by admins.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the category to retrieve
 *     responses:
 *       200:
 *         description: Category found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await categoryRepository.findOne({
      where: { id },
      relations: ['games', 'games.thumbnailFile', 'games.gameFile'],
    });

    if (!category) {
      return next(ApiError.notFound(`Category with id ${id} not found`));
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     description: Create a new category. Accessible by admins.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description } = req.body;

    // Check if category with the same name already exists
    const existingCategory = await categoryRepository.findOne({
      where: { name },
    });

    if (existingCategory) {
      return next(
        ApiError.badRequest(`Category with name "${name}" already exists`)
      );
    }

    // Create new category
    const category = categoryRepository.create({
      name,
      description,
    });

    await categoryRepository.save(category);

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category
 *     description: Update a category by its ID. Accessible by admins.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the category to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      return next(ApiError.notFound(`Category with id ${id} not found`));
    }

    // Check if name is being updated and if it already exists
    if (name && name !== category.name) {
      const existingCategory = await categoryRepository.findOne({
        where: { name },
      });

      if (existingCategory && existingCategory.id !== id) {
        return next(
          ApiError.badRequest(`Category with name "${name}" already exists`)
        );
      }

      category.name = name;
    }

    // Update description if provided
    if (description !== undefined) {
      category.description = description;
    }

    await categoryRepository.save(category);

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     description: Delete a category by its ID. Accessible by admins.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the category to delete
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Bad request - Cannot delete category with associated games
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await categoryRepository.findOne({
      where: { id },
      relations: ['games'],
    });

    if (!category) {
      return next(ApiError.notFound(`Category with id ${id} not found`));
    }

    // Check if category has associated games
    if (category.games && category.games.length > 0) {
      return next(
        ApiError.badRequest(
          `Cannot delete category with ${category.games.length} associated games`
        )
      );
    }

    await categoryRepository.remove(category);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
