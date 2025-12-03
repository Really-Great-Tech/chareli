export async function onRequest(context) {
  const url = new URL(context.request.url);

  // 1. Define your "Front Door" (Official Domain)
  const OFFICIAL_DOMAIN = context.env.VITE_OFFICIAL_DOMAIN;

  // 2. Define your "Back Door" (Default Pages Domain)
  // Replace this with your actual project name
  const PAGES_DEV_DOMAIN = context.env.VITE_PAGES_DEV_DOMAIN;

  // 3. Check if they are knocking on the back door
  if (url.hostname === PAGES_DEV_DOMAIN) {
    // 4. Redirect them to the front door (301 Permanent)
    // We preserve the pathname so deep links still work
    // e.g. pages.dev/login -> app.example.com/login
    return Response.redirect(
      `https://${OFFICIAL_DOMAIN}${url.pathname}${url.search}`,
      301
    );
  }

  // 5. If they are already at the front door, let them in!
  return context.next();
}
