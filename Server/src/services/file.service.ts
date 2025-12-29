import sharp from 'sharp';
import { storageService } from './storage.service';
import logger from '../utils/logger';
import type { ImageVariants, ImageDimensions } from '../entities/Files';

/**
 * Configuration for image variant sizes
 */
export const IMAGE_VARIANT_SIZES = {
  thumbnail: 256,
  small: 512,
  medium: 768,
  large: 1536,
} as const;

/**
 * Quality settings for WebP compression
 */
export const WEBP_QUALITY = {
  thumbnail: 80,
  small: 82,
  medium: 85,
  large: 90,
} as const;

/**
 * Processes an image buffer: converts to webp, compresses, and optionally resizes.
 * @param inputBuffer The original image buffer
 * @param options Options for processing
 *   - resize: boolean (if true, resize to width/height)
 *   - width: number (optional, default 512)
 *   - height: number (optional, default 512)
 *   - quality: number (optional, default 75)
 * @returns The processed image buffer in webp format
 */
export async function processImage(
  inputBuffer: Buffer,
  options: {
    resize?: boolean;
    width?: number;
    height?: number;
    quality?: number;
  } = {}
): Promise<Buffer> {
  const { resize = false, width = 512, height = 512, quality = 75 } = options;

  let transformer = sharp(inputBuffer).webp({ quality });

  if (resize) {
    transformer = transformer.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  return await transformer.toBuffer();
}

/**
 * Get dimensions of an image from buffer
 * @param buffer Image buffer
 * @returns Width and height of the image
 */
export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number }> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

/**
 * Generate multiple WebP variants from an original image
 * @param originalBuffer Original image buffer
 * @param originalKey S3 key of the original image
 * @returns Object containing variant URLs and dimensions
 */
export async function generateImageVariants(
  originalBuffer: Buffer,
  originalKey: string
): Promise<{ variants: ImageVariants; dimensions: ImageDimensions }> {
  const startTime = Date.now();
  logger.info(`🖼️  Generating variants for: ${originalKey}`);

  try {
    // Get original dimensions
    const originalDimensions = await getImageDimensions(originalBuffer);
    logger.debug(
      `Original dimensions: ${originalDimensions.width}x${originalDimensions.height}`
    );

    const variants: ImageVariants = {};
    const dimensions: ImageDimensions = {
      original: originalDimensions,
    };

    // Extract base path and extension
    const lastSlashIndex = originalKey.lastIndexOf('/');
    const basePath = originalKey.substring(0, lastSlashIndex);
    const fileName = originalKey.substring(lastSlashIndex + 1);
    const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

    // Generate thumbnail variant (256px width)
    const thumbnailBuffer = await sharp(originalBuffer)
      .resize(IMAGE_VARIANT_SIZES.thumbnail, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY.thumbnail })
      .toBuffer();

    const thumbnailDimensions = await getImageDimensions(thumbnailBuffer);
    const thumbnailKey = `${basePath}/${fileNameWithoutExt}-thumb.webp`;

    // Use uploadWithExactKey for R2 to avoid UUID prefix
    if ('uploadWithExactKey' in storageService) {
      await (storageService as any).uploadWithExactKey(
        thumbnailKey,
        thumbnailBuffer,
        'image/webp'
      );
    } else {
      await storageService.uploadFile(
        thumbnailBuffer,
        thumbnailKey,
        'image/webp'
      );
    }

    variants.thumbnail = storageService.getPublicUrl(thumbnailKey);
    dimensions.thumbnail = thumbnailDimensions;

    logger.debug(
      `✅ Thumbnail: ${thumbnailDimensions.width}x${thumbnailDimensions.height}, ` +
        `size: ${(thumbnailBuffer.length / 1024).toFixed(2)}KB`
    );

    // Generate small variant (512px width)
    const smallBuffer = await sharp(originalBuffer)
      .resize(IMAGE_VARIANT_SIZES.small, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY.small })
      .toBuffer();

    const smallDimensions = await getImageDimensions(smallBuffer);
    const smallKey = `${basePath}/${fileNameWithoutExt}-small.webp`;

    if ('uploadWithExactKey' in storageService) {
      await (storageService as any).uploadWithExactKey(
        smallKey,
        smallBuffer,
        'image/webp'
      );
    } else {
      await storageService.uploadFile(smallBuffer, smallKey, 'image/webp');
    }

    variants.small = storageService.getPublicUrl(smallKey);
    dimensions.small = smallDimensions;

    logger.debug(
      `✅ Small: ${smallDimensions.width}x${smallDimensions.height}, ` +
        `size: ${(smallBuffer.length / 1024).toFixed(2)}KB`
    );

    // Generate medium variant (768px width)
    const mediumBuffer = await sharp(originalBuffer)
      .resize(IMAGE_VARIANT_SIZES.medium, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY.medium })
      .toBuffer();

    const mediumDimensions = await getImageDimensions(mediumBuffer);
    const mediumKey = `${basePath}/${fileNameWithoutExt}-medium.webp`;

    if ('uploadWithExactKey' in storageService) {
      await (storageService as any).uploadWithExactKey(
        mediumKey,
        mediumBuffer,
        'image/webp'
      );
    } else {
      await storageService.uploadFile(mediumBuffer, mediumKey, 'image/webp');
    }

    variants.medium = storageService.getPublicUrl(mediumKey);
    dimensions.medium = mediumDimensions;

    logger.debug(
      `✅ Medium: ${mediumDimensions.width}x${mediumDimensions.height}, ` +
        `size: ${(mediumBuffer.length / 1024).toFixed(2)}KB`
    );

    // Generate large variant (1536px width)
    const largeBuffer = await sharp(originalBuffer)
      .resize(IMAGE_VARIANT_SIZES.large, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY.large })
      .toBuffer();

    const largeDimensions = await getImageDimensions(largeBuffer);
    const largeKey = `${basePath}/${fileNameWithoutExt}-large.webp`;

    if ('uploadWithExactKey' in storageService) {
      await (storageService as any).uploadWithExactKey(
        largeKey,
        largeBuffer,
        'image/webp'
      );
    } else {
      await storageService.uploadFile(largeBuffer, largeKey, 'image/webp');
    }

    variants.large = storageService.getPublicUrl(largeKey);
    dimensions.large = largeDimensions;

    logger.debug(
      `✅ Large: ${largeDimensions.width}x${largeDimensions.height}, ` +
        `size: ${(largeBuffer.length / 1024).toFixed(2)}KB`
    );

    const totalTime = Date.now() - startTime;
    logger.info(
      `🎉 Successfully generated 4 variants for ${originalKey} in ${totalTime}ms`
    );

    return { variants, dimensions };
  } catch (error) {
    logger.error(`❌ Error generating variants for ${originalKey}:`, error);
    throw error;
  }
}

/**
 * Generate only missing image variants
 * Useful for adding new variant sizes without regenerating existing ones
 * @param originalBuffer Original image buffer
 * @param originalKey S3 key of the original image
 * @param existingVariants Existing variants from database
 * @param existingDimensions Existing dimensions from database
 * @returns Object containing all variants (existing + newly generated) and dimensions
 */
export async function generateMissingVariants(
  originalBuffer: Buffer,
  originalKey: string,
  existingVariants?: ImageVariants,
  existingDimensions?: ImageDimensions
): Promise<{ variants: ImageVariants; dimensions: ImageDimensions }> {
  const startTime = Date.now();
  logger.info(`🔍 Checking missing variants for: ${originalKey}`);

  // Start with existing data
  const variants: ImageVariants = { ...existingVariants };
  const dimensions: ImageDimensions = { ...existingDimensions };

  // Extract file info
  const lastSlashIndex = originalKey.lastIndexOf('/');
  const basePath = originalKey.substring(0, lastSlashIndex);
  const fileName = originalKey.substring(lastSlashIndex + 1);
  const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

  let generatedCount = 0;
  const variantsToCheck: Array<{
    name: keyof typeof IMAGE_VARIANT_SIZES;
    size: number;
    quality: number;
    suffix: string;
  }> = [
    {
      name: 'thumbnail',
      size: IMAGE_VARIANT_SIZES.thumbnail,
      quality: WEBP_QUALITY.thumbnail,
      suffix: 'thumb',
    },
    {
      name: 'small',
      size: IMAGE_VARIANT_SIZES.small,
      quality: WEBP_QUALITY.small,
      suffix: 'small',
    },
    {
      name: 'medium',
      size: IMAGE_VARIANT_SIZES.medium,
      quality: WEBP_QUALITY.medium,
      suffix: 'medium',
    },
    {
      name: 'large',
      size: IMAGE_VARIANT_SIZES.large,
      quality: WEBP_QUALITY.large,
      suffix: 'large',
    },
  ];

  // Check and generate each variant if missing
  for (const variant of variantsToCheck) {
    if (!variants[variant.name]) {
      logger.info(`  → Generating missing ${variant.size}px variant`);

      const variantBuffer = await sharp(originalBuffer)
        .resize(variant.size, null, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: variant.quality })
        .toBuffer();

      const variantDimensions = await getImageDimensions(variantBuffer);
      const variantKey = `${basePath}/${fileNameWithoutExt}-${variant.suffix}.webp`;

      if ('uploadWithExactKey' in storageService) {
        await (storageService as any).uploadWithExactKey(
          variantKey,
          variantBuffer,
          'image/webp'
        );
      } else {
        await storageService.uploadFile(
          variantBuffer,
          variantKey,
          'image/webp'
        );
      }

      variants[variant.name] = storageService.getPublicUrl(variantKey);
      dimensions[variant.name] = variantDimensions;
      generatedCount++;

      logger.debug(
        `  ✅ ${variant.name}: ${variantDimensions.width}x${variantDimensions.height}, ` +
          `size: ${(variantBuffer.length / 1024).toFixed(2)}KB`
      );
    } else {
      logger.debug(`  ⏭️  ${variant.name} variant already exists, skipping`);
    }
  }

  // Update original dimensions if missing
  if (!dimensions.original) {
    dimensions.original = await getImageDimensions(originalBuffer);
  }

  const totalTime = Date.now() - startTime;
  logger.info(
    `✅ Generated ${generatedCount} missing variant(s) for ${originalKey} in ${totalTime}ms`
  );

  return { variants, dimensions };
}

/**
 * Main orchestrator for processing an uploaded image
 * Downloads from storage, generates variants, and returns metadata
 * @param s3Key S3/R2 key of the uploaded image
 * @returns Variants and dimensions for database storage
 */
export async function processUploadedImage(
  s3Key: string
): Promise<{ variants: ImageVariants; dimensions: ImageDimensions }> {
  logger.info(`📥 Processing uploaded image: ${s3Key}`);

  try {
    // Download original image from storage
    const originalBuffer = await storageService.downloadFile(s3Key);
    logger.debug(
      `Downloaded ${(originalBuffer.length / 1024).toFixed(2)}KB from storage`
    );

    // Generate all variants
    const result = await generateImageVariants(originalBuffer, s3Key);

    return result;
  } catch (error) {
    logger.error(`❌ Failed to process uploaded image ${s3Key}:`, error);
    throw error;
  }
}
