/**
 * Image Configuration
 *
 * Configuration for image optimization and transformation services
 */

/**
 * Cloudflare zone domain for image transformations
 * Set this in your .env file as VITE_CLOUDFLARE_ZONE
 * Example: VITE_CLOUDFLARE_ZONE=arcadesbox.com
 */
export const CLOUDFLARE_ZONE = import.meta.env.VITE_CLOUDFLARE_ZONE as
  | string
  | undefined;

/**
 * Whether Cloudflare image transformations are enabled
 */
export const CLOUDFLARE_IMAGES_ENABLED = Boolean(CLOUDFLARE_ZONE);

/**
 * Default image transformation options
 */
export const DEFAULT_IMAGE_OPTIONS = {
  quality: 85,
  format: "webp" as const,
  fit: "cover" as const,
};

