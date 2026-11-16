import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Check, Layers3, Ruler } from "lucide-react";
import { Calculator } from "@/components/calculator";
import { CalculatorExplainer } from "@/components/calculator-explainer";
import { guidePages } from "@/content/pages";
import { calculatorPageHead } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: calculatorPageHead,
  component: HomePage,
});

function HomePage() {
  return (
    <main id="main-content" className="home-page">
      <section
        className="tool-hero"
        aria-labelledby="home-heading"
        id="calculator"
      >
        <div className="content-width">
          <div className="tool-hero-heading">
            <div>
              <p className="tool-kicker">
                <span />
                THE MATERIAL WORKBENCH
              </p>
              <h1 id="home-heading">Asphalt calculator</h1>
              <p className="tool-intro">
                Your measurements. A clear material estimate.
              </p>
            </div>
            <a className="method-link" href="/methodology">
              How we calculate <ArrowUpRight size={15} />
            </a>
          </div>
          <Calculator variant="hero" />
          <ul className="tool-benefits" aria-label="Calculator features">
            <li>
              <Ruler size={14} />
              US &amp; metric measurements
            </li>
            <li>
              <Layers3 size={14} />
              Multiple project areas
            </li>
            <li>
              <Check size={14} />
              Free. No account needed.
            </li>
          </ul>
        </div>
      </section>
      <div className="content-width home-reference">
        <nav
          className="section-jump-links"
          aria-label="Calculator reference sections"
        >
          <a href="#how-it-works">How it works</a>
          <a href="#coverage">Coverage per ton</a>
          <a href="#faq">FAQs</a>
          <a href="#guides-heading">Guides</a>
        </nav>
        <CalculatorExplainer />
        <section className="field-guides" aria-labelledby="guides-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">FIELD NOTES</p>
              <h2 id="guides-heading">
                Good estimates start with good inputs.
              </h2>
            </div>
            <span className="section-caption">
              A little context before you order.
            </span>
          </div>
          <div className="guide-grid">
            {guidePages.map((page, index) => (
              <a className="guide-card" href={`/${page.slug}`} key={page.slug}>
                <span className="guide-number">
                  0{index + 1}
                  <ArrowUpRight size={16} />
                </span>
                <p className="eyebrow">{page.eyebrow}</p>
                <h3>{page.heading}</h3>
                <p>{page.description}</p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
