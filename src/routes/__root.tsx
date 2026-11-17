import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { SITE_NAME, SITE_URL, structuredData } from "@/lib/site";
import styles from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#f5f5f5" },
    ],
    links: [
      { rel: "stylesheet", href: styles },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  component: Root,
  notFoundComponent: () => (
    <main id="main-content" className="error-page content-width">
      <p className="eyebrow">OUTSIDE THE PLAN / 404</p>
      <h1>This page is off the map.</h1>
      <p>
        The page could not be found. Head back to the workbench and start with
        your measurements.
      </p>
      <a className="button-link" href="/#calculator">
        Open asphalt calculator
      </a>
    </main>
  ),
  errorComponent: () => (
    <main id="main-content" className="error-page content-width">
      <p className="eyebrow">A SMALL DETOUR</p>
      <h1>Something interrupted this page.</h1>
      <p>
        Please refresh and try again. Your browser draft is kept on this device.
      </p>
      <a className="button-link" href="/#calculator">
        Return to the calculator
      </a>
    </main>
  ),
});

function Root() {
  return (
    <html lang="en-US">
      <head>
        <HeadContent />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <SiteShell>
          <Outlet />
        </SiteShell>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: structuredData({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              name: SITE_NAME,
              url: SITE_URL,
              inLanguage: "en-US",
            }),
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
