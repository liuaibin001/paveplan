import { createFileRoute } from "@tanstack/react-router";
import { RoadDiagram } from "@/components/road-diagram";
import { guidePages } from "@/content/pages";
import { pageHead } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Paving Material Calculators & Planning Guides",
      "Turn measured areas into a checkable asphalt material estimate. Explore the calculator, coverage examples, density assumptions and measurement guides.",
      "/",
    ),
  component: HomePage,
});

function Arrow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M4 12h15M13 5l7 7-7 7" />
    </svg>
  );
}

function HomePage() {
  return (
    <main id="main-content" className="home-page">
      <section
        className="home-hero content-width"
        aria-labelledby="home-heading"
      >
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-marker" aria-hidden="true" />A material
            estimate you can check
          </p>
          <h1 id="home-heading">
            <span>Plan the paving.</span>
            <span className="hero-heading-accent">Know the tons.</span>
          </h1>
          <p className="hero-intro">
            Turn your measurements into an asphalt material plan. Keep the
            areas, thickness, density and extra allowance together, from the
            first calculation to the supplier conversation.
          </p>
          <div className="hero-actions">
            <a className="button-link" href="/asphalt-calculator">
              Open asphalt calculator <Arrow />
            </a>
            <a className="text-link" href="/methodology">
              See how it works
            </a>
          </div>
          <ul className="hero-facts" aria-label="Calculator features">
            <li>US + metric units</li>
            <li>Separate project areas</li>
            <li>No account needed</li>
          </ul>
        </div>

        <div className="hero-diagram">
          <div className="hero-drawing-label" aria-hidden="true">
            <span>PLAN VIEW / SECTION A</span>
            <span>NOT TO SCALE</span>
          </div>
          <RoadDiagram />
          <div
            className="hero-example info-note"
            aria-label="Illustrative quantity example"
          >
            <div className="example-heading">
              <p className="eyebrow">Worked example / 001</p>
              <span className="example-badge">EXAMPLE ONLY</span>
            </div>
            <p className="example-result">
              36.25 <span>US short tons</span>
            </p>
            <dl className="example-inputs">
              <div>
                <dt>Area</dt>
                <dd>2,000 ft2</dd>
              </div>
              <div>
                <dt>Compacted depth</dt>
                <dd>3 in</dd>
              </div>
              <div>
                <dt>Assumed density</dt>
                <dd>145 lb/ft3</dd>
              </div>
            </dl>
            <p className="example-footnote">
              100 ft x 20 ft. Zero extra allowance. A modeled quantity, not a
              recommendation for your project.
            </p>
          </div>
        </div>
      </section>

      <section
        className="home-section content-width"
        aria-labelledby="planning-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">From measurements to material</p>
            <h2 id="planning-heading">A clearer plan, in three steps.</h2>
          </div>
          <p>The number is useful when you can explain what went into it.</p>
        </div>
        <ol className="planning-steps">
          <li>
            <span className="step-number" aria-hidden="true">
              01
            </span>
            <h3>Measure the area.</h3>
            <p>
              Enter dimensions or total area. Keep separate sections and their
              compacted thicknesses distinct.
            </p>
          </li>
          <li>
            <span className="step-number" aria-hidden="true">
              02
            </span>
            <h3>Check the assumptions.</h3>
            <p>
              Use a density appropriate to the material. See net quantity and
              any extra allowance as separate numbers.
            </p>
          </li>
          <li>
            <span className="step-number" aria-hidden="true">
              03
            </span>
            <h3>Bring a useful summary.</h3>
            <p>
              Carry the units and assumptions into your supplier conversation.
              Confirm the final material and order requirements there.
            </p>
          </li>
        </ol>
      </section>

      <section
        className="home-section content-width"
        aria-labelledby="guides-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">The field guides</p>
            <h2 id="guides-heading">Better inputs. A better estimate.</h2>
          </div>
          <p>Practical explanations for the questions behind the calculator.</p>
        </div>
        <div className="guide-grid">
          {guidePages.map((page, index) => (
            <a className="guide-card" href={`/${page.slug}`} key={page.slug}>
              <span className="guide-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="guide-card-copy">
                <p className="eyebrow">{page.eyebrow}</p>
                <h3>{page.heading}</h3>
                <p>{page.description}</p>
                <span className="guide-link">
                  Read the guide <Arrow />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="home-section content-width">
        <div className="home-method-note">
          <div>
            <p className="eyebrow">Open assumptions, not a black box</p>
            <h2>The method belongs with the number.</h2>
            <p>
              The starting density is an editable planning assumption. The
              formulas, unit definitions and reference cases are here to check.
              A quantity estimate does not replace project design or a
              supplier's confirmation.
            </p>
          </div>
          <a className="text-link" href="/methodology">
            Read the methodology <Arrow />
          </a>
        </div>
      </section>
    </main>
  );
}
