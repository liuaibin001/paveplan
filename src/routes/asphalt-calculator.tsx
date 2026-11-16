import { createFileRoute } from "@tanstack/react-router";
import { Check, ShieldCheck, Ruler } from "lucide-react";
import { Calculator } from "@/components/calculator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { breadcrumbData, pageHead, SITE_URL, structuredData } from "@/lib/site";

export const Route = createFileRoute("/asphalt-calculator")({
  head: () =>
    pageHead(
      "Asphalt Calculator — Tons, Coverage & Material Cost",
      "Calculate asphalt US tons or metric tonnes from area, compacted thickness and density. Combine multiple areas, add optional allowance and estimate material cost.",
      "/asphalt-calculator",
    ),
  component: CalculatorPage,
});
function CalculatorPage() {
  return (
    <main id="main-content" className="content-width">
      <nav className="page-breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <span>Asphalt calculator</span>
      </nav>
      <header className="calculator-hero">
        <div>
          <p className="eyebrow">THE MATERIAL WORKBENCH / TOOL 001</p>
          <h1>
            Asphalt calculator<span className="brand-dot">.</span>
          </h1>
          <p>
            From your measurements to a clear material estimate. Calculate
            asphalt tons, compacted volume, and optional material cost.
          </p>
        </div>
        <p className="hero-method-note">
          <strong>MEASURE. CHECK. PLAN.</strong>
          <br />
          US &amp; metric inputs
          <br />
          Every assumption, in view.
        </p>
      </header>
      <Calculator />
      <div className="trust-strip">
        <span>
          <Ruler size={15} />
          Finished / compacted thickness
        </span>
        <span>
          <ShieldCheck size={15} />
          Editable density. Transparent formula.
        </span>
        <span>
          <Check size={15} />
          Free to use. No sign-up.
        </span>
      </div>
      <section className="tool-explainer" aria-labelledby="formula-heading">
        <div>
          <p className="eyebrow">BEHIND THE ESTIMATE</p>
          <h2 id="formula-heading">How many tons of asphalt do I need?</h2>
          <p>
            Multiply your surface area by the compacted thickness to get volume.
            Multiply that volume by the mix density to get mass, then convert to
            the ton unit you need.
          </p>
          <div className="formula-box">
            <code>
              US short tons = area (ft²) × thickness (in) ÷ 12 × density
              (lb/ft³) ÷ 2,000
            </code>
            <code>
              Metric tonnes = area (m²) × thickness (mm) ÷ 1,000 × density
              (kg/m³) ÷ 1,000
            </code>
          </div>
          <p>
            For example, 100 ft × 20 ft at 3 in and an assumed 145 lb/ft³ needs{" "}
            <strong>36.25 US short tons before allowance</strong>. Add 5% extra
            and the planned quantity becomes 38.0625 US tons.
          </p>
          <p>
            The 145 lb/ft³ starting value is an editable planning assumption.
            Ask your supplier for the density of your particular mix.{" "}
            <a href="/methodology">Read the full method and reference cases.</a>
          </p>
        </div>
        <div>
          <p className="eyebrow">QUICK REFERENCE</p>
          <h2>Coverage per US ton.</h2>
          <table className="example-table">
            <caption className="sr-only">
              Coverage of one US short ton of asphalt at an assumed density of
              145 pounds per cubic foot
            </caption>
            <thead>
              <tr>
                <th scope="col">Compacted depth</th>
                <th scope="col">Area per US ton</th>
              </tr>
            </thead>
            <tbody>
              {[
                [1, "165.52"],
                [2, "82.76"],
                [3, "55.17"],
                [4, "41.38"],
                [6, "27.59"],
              ].map(([depth, area]) => (
                <tr key={depth}>
                  <td>
                    {depth} inch{depth === 1 ? "" : "es"}
                  </td>
                  <td>{area} ft²</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="table-note">
            Assumes 145 lb/ft³, 2,000 lb per US short ton and zero extra
            allowance. This is a calculated reference, not a supplier
            specification.{" "}
            <a href="/guides/asphalt-coverage">Explore coverage examples.</a>
          </p>
        </div>
      </section>
      <section className="faq-section" aria-labelledby="faq-heading">
        <p className="eyebrow">BEFORE YOU ORDER</p>
        <h2 id="faq-heading">A few useful answers.</h2>
        <Accordion>
          <AccordionItem value="tons">
            <AccordionTrigger>
              Is a US ton the same as a metric tonne?
            </AccordionTrigger>
            <AccordionContent>
              No. One US short ton is 2,000 lb, or exactly 907.18474 kg. One
              metric tonne is 1,000 kg. Choose the unit your supplier uses;
              switching the output unit also converts any entered price so the
              total material cost stays the same.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="depth">
            <AccordionTrigger>
              Should I enter loose or compacted thickness?
            </AccordionTrigger>
            <AccordionContent>
              Enter the finished, compacted thickness for this model. Use a
              density appropriate to that compacted material. Extra allowance is
              a separate quantity adjustment; it is not an automatic
              loose-to-compacted conversion. Confirm placement and ordering
              requirements with your supplier.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="allowance">
            <AccordionTrigger>
              How much extra asphalt should I allow?
            </AccordionTrigger>
            <AccordionContent>
              There is no universal allowance that suits every project. The
              calculator starts at 0% so the base quantity stays visible. If
              your supplier recommends extra for irregular edges, site
              conditions or handling, enter that percentage and it is added
              once.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="cost">
            <AccordionTrigger>
              Does the cost include paving and installation?
            </AccordionTrigger>
            <AccordionContent>
              No. Cost is the calculated material quantity, including your
              selected allowance, multiplied by your quoted material price per
              chosen ton unit. It excludes labor, base, removal, delivery,
              equipment and taxes.{" "}
              <a href="/guides/asphalt-material-vs-installed-cost">
                See material vs. installed cost.
              </a>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="shape">
            <AccordionTrigger>
              How do I estimate an irregular driveway?
            </AccordionTrigger>
            <AccordionContent>
              Break the footprint into measurable sections and use “Add another
              area.” For triangles and other shapes, calculate the surface area
              first and select “Known area.” Give each section its own compacted
              thickness.{" "}
              <a href="/guides/measure-driveway">See the measurement guide.</a>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: structuredData({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "PavePlan Asphalt Calculator",
            url: `${SITE_URL}/asphalt-calculator`,
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Any",
            browserRequirements:
              "A modern browser with JavaScript for interactive calculations",
            isAccessibleForFree: true,
            description:
              "Estimates asphalt material mass from surface area, compacted thickness and user-selected density, with optional allowance and material price.",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: structuredData(
            breadcrumbData([
              { name: "Home", path: "/" },
              { name: "Asphalt calculator", path: "/asphalt-calculator" },
            ]),
          ),
        }}
      />
    </main>
  );
}
