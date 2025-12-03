import { AppDataSource } from '../config/database';
import { Game } from '../entities/Games';

/**
 * Convert a string to a URL-safe slug
 * @param text - The text to slugify
 * @returns URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

/**
 * Generate a unique slug for a game title
 * If slug already exists, append a numeric suffix
 * @param title - The game title
 * @param excludeId - Optional game ID to exclude from uniqueness check (for updates)
 * @returns Unique slug
 */
export async function generateUniqueSlug(
  title: string,
  excludeId?: string
): Promise<string> {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;

  const gameRepository = AppDataSource.getRepository(Game);

  while (true) {
    // Check if slug exists
    const queryBuilder = gameRepository
      .createQueryBuilder('game')
      .where('game.slug = :slug', { slug });

    // Exclude current game if updating
    if (excludeId) {
      queryBuilder.andWhere('game.id != :excludeId', { excludeId });
    }

    const existingGame = await queryBuilder.getOne();

    if (!existingGame) {
      return slug;
    }

    // Slug exists, try with counter
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
