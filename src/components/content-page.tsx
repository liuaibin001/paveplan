import type { ContentPage } from "../content/pages";

export function ContentPageView({ page }: { page: ContentPage }) {
  return (
    <div className="article-layout">
      <aside className="article-toc">
        <nav aria-label="On this page">
          <p className="article-kicker">On this page</p>
          <ol>
            {page.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.heading}</a>
              </li>
            ))}
          </ol>
        </nav>
        <a className="article-tool-link" href="/#calculator">
          Open the calculator <span aria-hidden="true">&rarr;</span>
        </a>
      </aside>

      <article className="prose-content" aria-labelledby="article-heading">
        <header className="article-hero">
          <p className="article-kicker">{page.eyebrow}</p>
          <h1 id="article-heading">{page.heading}</h1>
          <p className="article-intro">{page.intro}</p>
        </header>

        {page.sections.map((section) => (
          <section
            className="article-section"
            id={section.id}
            key={section.id}
            aria-labelledby={`${section.id}-heading`}
          >
            <h2 id={`${section.id}-heading`}>{section.heading}</h2>

            {section.paragraphs?.map((paragraph, index) => (
              <p key={`${section.id}-paragraph-${index}`}>{paragraph}</p>
            ))}

            {section.formula ? (
              <div className="info-note article-formula">
                <p className="article-kicker">Calculation reference</p>
                <pre>
                  <code>{section.formula}</code>
                </pre>
              </div>
            ) : null}

            {section.bullets ? (
              <ul>
                {section.bullets.map((bullet, index) => (
                  <li key={`${section.id}-bullet-${index}`}>{bullet}</li>
                ))}
              </ul>
            ) : null}

            {section.table ? (
              <div
                className="article-table-wrap"
                role="region"
                aria-label={`${section.heading} reference table`}
                tabIndex={0}
              >
                <table>
                  <caption className="sr-only">{section.heading}</caption>
                  <thead>
                    <tr>
                      {section.table.headers.map((header, index) => (
                        <th scope="col" key={`${section.id}-header-${index}`}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row, rowIndex) => (
                      <tr key={`${section.id}-row-${rowIndex}`}>
                        {row.map((cell, cellIndex) =>
                          cellIndex === 0 ? (
                            <th
                              scope="row"
                              key={`${section.id}-${rowIndex}-${cellIndex}`}
                            >
                              {cell}
                            </th>
                          ) : (
                            <td key={`${section.id}-${rowIndex}-${cellIndex}`}>
                              {cell}
                            </td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {section.links?.length ? (
              <ul className="article-source-links">
                {section.links.map((link) => (
                  <li key={`${section.id}-${link.href}`}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        {page.related?.length ? (
          <nav
            className="article-related info-note"
            aria-label="Related reading"
          >
            <p className="article-kicker">Continue planning</p>
            <h2>Related tools and guides</h2>
            <ul>
              {page.related.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </article>
    </div>
  );
}
