import { createFileRoute, notFound } from "@tanstack/react-router";
import { ContentPageView } from "@/components/content-page";
import { pages } from "@/content/pages";
import { breadcrumbData, pageHead, structuredData } from "@/lib/site";

export const Route = createFileRoute("/$")({
  loader: ({ params }) => {
    const slug = params._splat?.replace(/^\/+|\/+$/g, "") ?? "";
    const page = Object.hasOwn(pages, slug) ? pages[slug] : undefined;

    if (!page) {
      throw notFound();
    }

    return page;
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead(
          loaderData.title,
          loaderData.description,
          `/${loaderData.slug}`,
        )
      : pageHead(
          "Page not found",
          "The requested page could not be found.",
          "/",
          true,
        ),
  component: ContentRoute,
});

function ContentRoute() {
  const page = Route.useLoaderData();
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: page.title, path: `/${page.slug}` },
  ];

  return (
    <main id="main-content" className="article-page content-width">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <a href="/">Home</a>
          </li>
          <li aria-current="page">{page.title}</li>
        </ol>
      </nav>
      <ContentPageView page={page} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: structuredData(breadcrumbData(breadcrumbs)),
        }}
      />
    </main>
  );
}
