import handler from "@tanstack/react-start/server-entry";
import { cleanupExpiredProjects } from "./server/projects";
import { pages } from "./content/pages";
import { SITE_URL, UPDATED_AT } from "./lib/site";

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.replace(/\/+$/, "");
      return Response.redirect(url.toString(), 308);
    }
    if (url.pathname === "/robots.txt")
      return new Response(
        `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } },
      );
    if (url.pathname === "/sitemap.xml") {
      const paths = [
        "/",
        "/asphalt-calculator",
        ...Object.keys(pages).map((slug) => `/${slug}`),
      ];
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${SITE_URL}${path === "/" ? "" : path}</loc><lastmod>${UPDATED_AT}</lastmod></url>`).join("")}</urlset>`,
        { headers: { "Content-Type": "application/xml; charset=utf-8" } },
      );
    }
    const response = await handler.fetch(request);
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("X-Frame-Options", "DENY");
    headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    if (
      url.pathname.startsWith("/project/") ||
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/_serverFn/")
    ) {
      headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
      headers.set("Cache-Control", "no-store");
      headers.set("Referrer-Policy", "no-referrer");
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
  async scheduled() {
    await cleanupExpiredProjects();
  },
};
