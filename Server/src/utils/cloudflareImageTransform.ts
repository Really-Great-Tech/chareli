/**
 * Cloudflare Image Transformations Utility (Server-side)
 *
 * Transforms images using Cloudflare's Image Resizing service via URL.
 * Documentation: https://developers.cloudflare.com/images/transform-images/
 */

import config from "../config/config";

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
 * @param cloudflareZone - Your Cloudflare zone domain (optional, uses config if not provided)
 * @returns Transformed image URL
 */
export function transformImageUrl(
  imageUrl: string,
  options: CloudflareImageTransformOptions = {},
  cloudflareZone?: string
): string {
  const zone = cloudflareZone || config.cloudflare?.zone;

  // If no Cloudflare zone is configured, return original URL
  if (!zone) {
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

  // Construct the transformed URL
  // Format: https://<ZONE>/cdn-cgi/image/<params>/<original-url>
  const transformParams = params.join(",");
  const encodedImageUrl = encodeURIComponent(imageUrl);

  return `https://${zone}/cdn-cgi/image/${transformParams}/${encodedImageUrl}`;
}
