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
              <p className="tool-kicker">A clearer plan, from the ground up</p>
              <h1 id="home-heading">Asphalt calculator</h1>
              <p className="tool-intro">
                Turn your measurements into asphalt tons and material cost.
                Start with the example, or enter your own project.
              </p>
            </div>
            <div className="hero-heading-note">
              <a className="method-link" href="/methodology">
                See how it is calculated <ArrowUpRight size={15} />
              </a>
            </div>
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
              <h2 id="guides-heading">Planning guides</h2>
            </div>
            <span className="section-caption">
              Reference notes for your next estimate.
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
