/**
 * Cloudflare Image Transformations Utility
 *
 * Transforms images using Cloudflare's Image Resizing service via URL.
 * Documentation: https://developers.cloudflare.com/images/transform-images/
 *
 * Format: https://<YOUR_ZONE>/cdn-cgi/image/<transform-params>/<original-image-url>
 */

export interface CloudflareImageTransformOptions {
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Fit mode: scale-down, contain, cover, crop, pad */
  fit?: "scale-down" | "contain" | "cover" | "crop" | "pad";
  /** Quality (1-100) */
  quality?: number;
  /** Output format: jpeg, png, webp, avif, gif */
  format?: "jpeg" | "png" | "webp" | "avif" | "gif";
  /** Enable sharpening (0-10) */
  sharpen?: number;
  /** Enable blur (0-250) */
  blur?: number;
  /** Enable grayscale */
  grayscale?: boolean;
  /** Enable metadata preservation */
  metadata?: "keep" | "copyright" | "none";
  /** On error behavior: redirect (default) or blank */
  onerror?: "redirect" | "blank";
}

/**
 * Transforms an image URL using Cloudflare's Image Resizing service
 *
 * @param imageUrl - The original image URL (can be S3, R2, or any public image URL)
 * @param options - Transformation options
 * @param cloudflareZone - Your Cloudflare zone domain (e.g., 'arcadesbox.com')
 * @returns Transformed image URL
 *
 * @example
 * ```ts
 * const optimizedUrl = transformImageUrl(
 *   'https://example.com/image.jpg',
 *   { width: 800, quality: 85, format: 'webp' },
 *   'arcadesbox.com'
 * );
 * ```
 */
export function transformImageUrl(
  imageUrl: string,
  options: CloudflareImageTransformOptions = {},
  cloudflareZone?: string
): string {
  // If no Cloudflare zone is provided, return original URL
  if (!cloudflareZone) {
    console.log("imageUrl", imageUrl);
    return imageUrl;
  }

  // Build transformation parameters
  const params: string[] = [];

  if (options.width) {
    params.push(`width=${options.width}`);
  }
  if (options.height) {
    params.push(`height=${options.height}`);
  }
  if (options.fit) {
    params.push(`fit=${options.fit}`);
  }
  if (options.quality !== undefined) {
    params.push(`quality=${Math.max(1, Math.min(100, options.quality))}`);
  }
  if (options.format) {
    params.push(`format=${options.format}`);
  }
  if (options.sharpen !== undefined) {
    params.push(`sharpen=${Math.max(0, Math.min(10, options.sharpen))}`);
  }
  if (options.blur !== undefined) {
    params.push(`blur=${Math.max(0, Math.min(250, options.blur))}`);
  }
  if (options.grayscale) {
    params.push("grayscale=1");
  }
  if (options.metadata) {
    params.push(`metadata=${options.metadata}`);
  }
  if (options.onerror) {
    params.push(`onerror=${options.onerror}`);
  }

  // If no transformations specified, return original URL
  if (params.length === 0) {
    return imageUrl;
  }

  const transformParams = params.join(",");
  console.log(imageUrl);

  const normalizedZone = cloudflareZone.replace(/\/+$/, "");

  const zoneHost = (() => {
    try {
      const candidate = normalizedZone.match(/^https?:\/\//i)
        ? normalizedZone
        : `https://${normalizedZone}`;
      return new URL(candidate).host;
    } catch {
      return null;
    }
  })();

  const absoluteImageUrl = (() => {
    try {
      if (/^https?:\/\//i.test(imageUrl)) {
        return new URL(imageUrl);
      }
      if (imageUrl.startsWith("//")) {
        return new URL(`https:${imageUrl}`);
      }
      return null;
    } catch {
      return null;
    }
  })();

  let sanitizedImageUrl = imageUrl;

  if (zoneHost && absoluteImageUrl && absoluteImageUrl.host === zoneHost) {
    const pathWithParams = `${absoluteImageUrl.pathname}${absoluteImageUrl.search}${absoluteImageUrl.hash}`;
    sanitizedImageUrl = pathWithParams.replace(/^\/+/, "");
  } else if (!absoluteImageUrl) {
    sanitizedImageUrl = imageUrl.replace(/^\/+/, "");
  }

  console.log(sanitizedImageUrl);

  return `${normalizedZone}/cdn-cgi/image/${transformParams}/${sanitizedImageUrl}`;
}

/**
 * Preset configurations for common use cases
 */
export const ImagePresets = {
  /** Thumbnail: Small, optimized for lists */
  thumbnail: (width: number = 300): CloudflareImageTransformOptions => ({
    width,
    quality: 80,
    format: "webp",
    fit: "cover",
  }),

  /** Card image: Medium size for cards */
  card: (width: number = 600): CloudflareImageTransformOptions => ({
    width,
    quality: 85,
    format: "webp",
    fit: "cover",
  }),

  /** Hero image: Large, high quality */
  hero: (width: number = 1920): CloudflareImageTransformOptions => ({
    width,
    quality: 90,
    format: "webp",
    fit: "cover",
  }),

  /** Avatar: Square, optimized */
  avatar: (size: number = 150): CloudflareImageTransformOptions => ({
    width: size,
    height: size,
    quality: 85,
    format: "webp",
    fit: "cover",
  }),
};
