import { verify } from '@tsndr/cloudflare-worker-jwt';

// Define the structure of our environment variables for type safety.
// These are configured in the Cloudflare dashboard.
interface Env {
  R2_BUCKET: R2Bucket; // This is the binding to your R2 bucket.
  JWT_SECRET: string; // This is the secret for verifying tokens.
}

export default {
  /**
   * This is the main entry point for every request that hits the worker's route.
   * @param request The incoming HTTP request.
   * @param env The environment variables and bindings.
   * @returns A Response object.
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Extract the object key from the URL path (e.g., "games/123/index.html")
    const objectKey = url.pathname.slice(1);

    // Don't allow requests for the root path.
    if (objectKey === '') {
      return new Response('Not found', { status: 404 });
    }

    // --- Step 1: Check for the Authorization header ---
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // If no token is provided, deny access immediately.
      return new Response(
        'Unauthorized: Missing or invalid authorization header',
        { status: 401 }
      );
    }
    const token = authHeader.substring(7);

    // --- Step 2: Verify the JWT ---
    try {
      const isValid = await verify(token, env.JWT_SECRET);
      if (!isValid) {
        // This case handles a token that is signed with the wrong secret or is malformed.
        throw new Error('Invalid token signature');
      }
    } catch (err) {
      // This catch block handles expired tokens or any other verification error.
      const errorMessage = (err as Error).message;
      return new Response(`Forbidden: ${errorMessage}`, { status: 403 });
    }

    // --- Step 3: If token is valid, fetch the object from the R2 bucket ---
    const object = await env.R2_BUCKET.get(objectKey);

    if (object === null) {
      // The requested file does not exist in the R2 bucket.
      return new Response('Object Not Found', { status: 404 });
    }

    // --- Step 4: Stream the object back to the client ---
    // Prepare headers for the response. This copies important metadata like
    // Content-Type, ETag, etc., from the R2 object.
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    // Return the object's body (the file content) with the correct headers.
    return new Response(object.body, {
      headers,
    });
  },
};
