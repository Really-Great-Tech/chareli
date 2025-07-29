import sharp from 'sharp';

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
  const {
    resize = false,
    width = 512,
    height = 512,
    quality = 75,
  } = options;

  let transformer = sharp(inputBuffer).webp({ quality });

  if (resize) {
    transformer = transformer.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  return await transformer.toBuffer();
}
