import { REPOSITORY_URL } from "../lib/site";

export interface ContentPage {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  intro: string;
  sections: Array<{
    id: string;
    heading: string;
    paragraphs?: string[];
    bullets?: string[];
    table?: { headers: string[]; rows: string[][] };
    formula?: string;
    links?: Array<{ label: string; href: string }>;
  }>;
  related?: Array<{ href: string; label: string }>;
}

const issuesUrl = `${REPOSITORY_URL}/issues`;
const nistUrl = "https://www.nist.gov/pml/special-publication-811";
const mapaUrl = "https://www.asphaltisbest.com/asphalt-calculator";
const hkUrl = "https://www.hkgroup.com/calculators/hot-mix-asphalt/";

export const pages: Record<string, ContentPage> = {
  "guides/asphalt-coverage": {
    slug: "guides/asphalt-coverage",
    title: "Asphalt Coverage per Ton: Thickness, Formula & Table",
    description:
      "Work out asphalt coverage from tonnage, compacted thickness and density. Use a clearly labeled US short ton reference table and forward and reverse examples.",
    eyebrow: "Field Guide / 01",
    heading: "How much area does a ton of asphalt cover?",
    intro:
      "Coverage depends on thickness, density and the definition of a ton. At an assumed compacted density of 145 lb/ft3 and a compacted thickness of 3 inches, one US short ton covers about 55.17 square feet. This is an illustrative calculation, not a universal coverage rate.",
    sections: [
      {
        id: "conditions",
        heading: "Keep the conditions with the answer",
        paragraphs: [
          "An area-only answer is incomplete. The same mass spreads farther in a thinner layer. A denser mix requires more mass for the same finished volume. A US short ton is 2,000 pounds; a metric tonne is 1,000 kilograms. They are different quantities.",
          "The examples on this page model hot-mix asphalt using compacted thickness and an assumed density of 145 lb/ft3. They include no extra allowance. Use the density and thickness specified for your actual mix and project when available.",
        ],
        links: [
          { label: "Check the unit definitions in NIST SP 811", href: nistUrl },
        ],
      },
      {
        id: "formula",
        heading: "The coverage formula",
        paragraphs: [
          "Convert inches to feet before multiplying thickness by density. Divide the available mass by the mass needed for one square foot. The result is area, not length or volume.",
        ],
        formula:
          "Area (ft2) = US short tons x 2,000 / [density (lb/ft3) x thickness (in) / 12]",
        bullets: [
          "Tonnage must use US short tons for the 2,000-pound factor.",
          "Density and thickness must describe compatible material conditions.",
          "Available material and an optional purchasing allowance are separate assumptions.",
        ],
      },
      {
        id: "coverage-table",
        heading: "Reference table: one US short ton",
        paragraphs: [
          "Every row below uses hot-mix asphalt at an assumed 145 lb/ft3, compacted thickness and zero extra allowance. Values are mathematical estimates rounded to two decimal places. The table is not a specification, field test or thickness recommendation.",
        ],
        table: {
          headers: [
            "Compacted thickness",
            "Area per US short ton",
            "Assumed density",
          ],
          rows: [
            ["1 inch", "165.52 ft2", "145 lb/ft3"],
            ["2 inches", "82.76 ft2", "145 lb/ft3"],
            ["3 inches", "55.17 ft2", "145 lb/ft3"],
            ["4 inches", "41.38 ft2", "145 lb/ft3"],
            ["6 inches", "27.59 ft2", "145 lb/ft3"],
          ],
        },
      },
      {
        id: "reverse-example",
        heading: "Example: turn a ton into an area",
        paragraphs: [
          "For one US short ton at 3 inches and 145 lb/ft3, the denominator is 145 x (3 / 12) = 36.25 pounds per square foot. Dividing 2,000 by 36.25 gives 55.1724 square feet, displayed as 55.17 ft2.",
          "For five US short tons under the same assumptions, coverage is about 275.86 ft2. Multiplying rounded table values can introduce small differences, so keep full precision until the final display.",
        ],
        formula: "2,000 / [145 x (3 / 12)] = 55.1724 ft2",
      },
      {
        id: "forward-example",
        heading: "Check the answer in the other direction",
        paragraphs: [
          "A 1,000 ft2 area at 3 inches has a modeled volume of 250 ft3. At 145 lb/ft3, that is 36,250 pounds, or 18.125 US short tons before extra allowance. Putting 18.125 tons back into the coverage formula returns 1,000 ft2.",
          "This forward-and-reverse check helps catch the two most common unit mistakes: using inches as feet and treating a metric tonne as a US short ton.",
        ],
        formula: "1,000 x (3 / 12) x 145 / 2,000 = 18.125 US short tons",
      },
      {
        id: "density-and-allowance",
        heading: "Density and allowance change different parts of the estimate",
        paragraphs: [
          "At the same 3-inch thickness, a different density produces a different coverage rate. Do not copy a coverage figure from a different product, a loose recycled material or an unlabeled online table.",
          "An extra allowance adds material to a purchasing estimate. It does not automatically increase the planned area. Keep the net material needed for the measured area separate from any extra material reserved for the project.",
          "If your question is how far an existing pile will go, confirm the material condition and usable mass first. A volume estimate of loose material is not automatically a measurement of compacted hot-mix asphalt.",
        ],
        links: [
          {
            label: "Understand density and material conditions",
            href: "/guides/asphalt-density",
          },
          { label: "Read the calculation assumptions", href: "/methodology" },
        ],
      },
      {
        id: "calculate",
        heading: "Use your own measurements",
        paragraphs: [
          "Use the calculator for a specific length, width or total area. Keep the compacted thickness and density visible when you copy the result. For several non-overlapping areas, calculate each section with its own thickness and then add the material quantities.",
        ],
        links: [{ label: "Open the asphalt calculator", href: "/#calculator" }],
      },
    ],
    related: [
      {
        href: "/guides/asphalt-density",
        label: "Choose and check a density value",
      },
      {
        href: "/guides/measure-driveway",
        label: "Measure a driveway in separate sections",
      },
      { href: "/methodology", label: "Read the formulas and reference cases" },
    ],
  },
  "guides/asphalt-density": {
    slug: "guides/asphalt-density",
    title: "Asphalt Density: Units, Assumptions & Calculation",
    description:
      "Understand the density assumption behind an asphalt estimate, convert weight and volume units, and see how a supplier's value changes calculated tonnage.",
    eyebrow: "Field Guide / 02",
    heading: "Asphalt density and weight assumptions",
    intro:
      "Density connects volume to weight. PavePlan starts with an editable planning assumption of 145 lb/ft3. That value is not a universal standard or a substitute for the density specified for your actual material and its condition.",
    sections: [
      {
        id: "density-meaning",
        heading: "What a density value describes",
        paragraphs: [
          "Density is mass per unit volume. For this estimate, the volume comes from the measured area multiplied by the specified thickness. Density converts that volume to pounds, kilograms or tons.",
          "The material and its state matter. A compacted asphalt mix, a loose stockpile and recycled asphalt are not interchangeable descriptions. A value is useful only when you know what material and condition it describes.",
        ],
        formula: "Mass = volume x density",
      },
      {
        id: "planning-assumption",
        heading: "Why the starting value is labeled an assumption",
        paragraphs: [
          "Existing industry calculators use different stated assumptions. H&K's hot-mix calculator provides a density input, while the Minnesota Asphalt Pavement Association calculator states a compacted unit weight of 110 pounds per square yard per inch. That MAPA value is equivalent to approximately 146.667 lb/ft3.",
          "These sources demonstrate their own calculation choices. They do not establish one density for every mix, supplier or project. PavePlan's editable 145 lb/ft3 preset is a planning starting point; use a matching supplier or project value when you have one.",
          "NIST is cited here for unit definitions and conversion conventions, not as a source for an asphalt density recommendation.",
        ],
        links: [
          { label: "H&K hot-mix calculator and density field", href: hkUrl },
          {
            label: "MAPA's stated compacted unit-weight assumption",
            href: mapaUrl,
          },
          { label: "NIST SP 811: units and conversions", href: nistUrl },
        ],
      },
      {
        id: "sensitivity",
        heading: "The same volume can produce different weights",
        paragraphs: [
          "Fix the geometry at 100 ft x 20 ft x 3 inches. The volume is 500 ft3. The following values are sensitivity examples, not a recommended density range or a survey of materials.",
        ],
        table: {
          headers: ["Assumed density", "Modeled mass", "US short tons"],
          rows: [
            ["142 lb/ft3", "71,000 lb", "35.50"],
            ["145 lb/ft3", "72,500 lb", "36.25"],
            ["150 lb/ft3", "75,000 lb", "37.50"],
          ],
        },
      },
      {
        id: "unit-conversions",
        heading: "Convert the value before comparing it",
        paragraphs: [
          "One cubic yard contains 27 cubic feet. Multiply lb/ft3 by 27 to express the same density in lb/yd3. Divide lb/yd3 by 27 to return to lb/ft3.",
          "To convert lb/ft3 to kg/m3, multiply by approximately 16.018463. For example, the 145 lb/ft3 assumption is about 2,322.68 kg/m3. A rounded metric value may not convert back to exactly the same displayed number.",
          "US short tons, metric tonnes and long tons must also remain distinct when a price or weight is given per ton.",
        ],
        table: {
          headers: ["Unit", "Definition or equivalent"],
          rows: [
            ["1 US short ton", "2,000 lb = 907.18474 kg"],
            ["1 metric tonne", "1,000 kg"],
            ["1 long ton", "2,240 lb = 1,016.0469088 kg"],
            ["1 cubic yard", "27 cubic feet"],
          ],
        },
        links: [{ label: "Check NIST's unit guidance", href: nistUrl }],
      },
      {
        id: "supplier-value",
        heading: "Ask what the supplier's number means",
        bullets: [
          "Which material or mix does the density describe?",
          "Does it describe compacted material or loose material?",
          "Is the value in lb/ft3, lb/yd3, kg/m3 or a different unit?",
          "Is the stated ton a US short ton or a metric tonne?",
          "Does the project specification provide a value or method that should take precedence?",
        ],
        paragraphs: [
          "Record the source and date with the estimate. If the material or state is uncertain, retain that uncertainty rather than adding more decimal places to the result.",
        ],
      },
      {
        id: "different-calculators",
        heading: "Why two calculators may disagree",
        paragraphs: [
          "Compare density, thickness units, ton definition, extra allowance, material type and rounding before deciding that either result is wrong. The same volume at 145 and 150 lb/ft3 intentionally produces different weights.",
          "A numerical difference can also come from an implementation error. Keep a reference example and verify decimal inputs. A 3.5-inch thickness should not silently be treated as 3 inches.",
        ],
        links: [
          {
            label: "See PavePlan's reference calculations",
            href: "/methodology",
          },
        ],
      },
    ],
    related: [
      {
        href: "/#calculator",
        label: "Use your material's density in the calculator",
      },
      {
        href: "/guides/asphalt-coverage",
        label: "See how density affects coverage",
      },
      {
        href: "/guides/measure-driveway",
        label: "Check the thickness and area inputs",
      },
    ],
  },
  "guides/measure-driveway": {
    slug: "guides/measure-driveway",
    title: "How to Measure a Driveway for Asphalt",
    description:
      "Measure length, width and compacted thickness, split an irregular driveway into non-overlapping sections, and check a worked asphalt quantity example.",
    eyebrow: "Field Guide / 03",
    heading: "How to measure a driveway for asphalt",
    intro:
      "Start with a plan of the area that will actually receive material. Measure its sections, record the required compacted thickness, and keep overlapping areas out of the total. Good inputs matter more than extra decimal places in the answer.",
    sections: [
      {
        id: "record-measurements",
        heading: "Record three things for each section",
        bullets: [
          "Length and width, or a separately calculated total area, with units.",
          "The compacted thickness specified for that section, with units.",
          "A section label that makes the measurements easy to check without including a personal address.",
        ],
        paragraphs: [
          "Measure the surface being estimated, excluding areas that will not be paved. Record dimensions in the same unit system or label every measurement carefully. A drawing is useful even when it is only a rough plan with numbered sections.",
          "The quantity calculation models a layer of stated thickness. It does not determine drainage, grade, subgrade preparation or an appropriate pavement design.",
        ],
      },
      {
        id: "rectangular-area",
        heading: "Begin with rectangles",
        paragraphs: [
          "A rectangular section has area equal to length multiplied by width. A 60 ft by 12 ft strip is 720 ft2. Use measured dimensions rather than an assumed driveway width.",
          "For an L-shaped area, divide the plan into rectangles that touch without overlapping. If one rectangle includes a corner already counted in another, subtract the overlap or redraw the sections.",
        ],
        formula: "Rectangle area = length x width",
      },
      {
        id: "other-shapes",
        heading: "Handle curves and cut-outs explicitly",
        table: {
          headers: ["Shape", "Area relationship", "What to check"],
          rows: [
            [
              "Triangle",
              "Base x perpendicular height / 2",
              "Height must be perpendicular to the base.",
            ],
            ["Circle", "Pi x radius x radius", "Radius is half the diameter."],
            [
              "Cut-out",
              "Subtract its area from the containing section",
              "Do not subtract it a second time elsewhere.",
            ],
            [
              "Irregular boundary",
              "Break into measurable shapes or use a surveyed area",
              "Treat a rough approximation as an approximation.",
            ],
          ],
        },
        paragraphs: [
          "When a shape cannot be entered directly, calculate its area separately and use the calculator's total-area input. Do not replace a curved or tapered area with one large rectangle without acknowledging the approximation.",
          "A map image or aerial view can help make a plan, but it does not establish dimensions or an accuracy guarantee. Use a suitable measurement or survey for the project.",
        ],
      },
      {
        id: "compacted-thickness",
        heading: "Use the required compacted thickness",
        paragraphs: [
          "The examples and default hot-mix model use compacted thickness. Confirm that the thickness and density describe compatible conditions. A loose placement depth is not automatically the finished compacted depth.",
          "Thickness selection depends on the intended loads, base, soil, drainage and applicable local requirements. This tool calculates quantity from a thickness you provide; it does not choose a structural design for a residential or commercial project.",
          "Keep a purchasing allowance separate. Using compacted thickness and a matching density does not justify automatically adding a second compaction factor.",
        ],
        links: [
          {
            label: "Check the density and material condition",
            href: "/guides/asphalt-density",
          },
          {
            label: "Read the compaction and allowance assumptions",
            href: "/methodology#material-state",
          },
        ],
      },
      {
        id: "worked-project",
        heading: "Worked example: two sections, two thicknesses",
        paragraphs: [
          "Consider two non-overlapping rectangles. Section A is 60 ft x 12 ft at 3 inches. Section B is 20 ft x 10 ft at 4 inches. Both use an illustrative density of 145 lb/ft3 and no extra allowance.",
        ],
        table: {
          headers: [
            "Section",
            "Area",
            "Thickness",
            "Volume",
            "Net US short tons",
          ],
          rows: [
            ["A: 60 ft x 12 ft", "720 ft2", "3 in", "180.00 ft3", "13.05"],
            ["B: 20 ft x 10 ft", "200 ft2", "4 in", "66.67 ft3", "4.83"],
            [
              "Project total",
              "920 ft2",
              "Separate per section",
              "246.67 ft3",
              "17.88",
            ],
          ],
        },
      },
      {
        id: "check-total",
        heading: "Add quantities after calculating each section",
        paragraphs: [
          "Section A requires 13.05 US short tons. Section B requires 4.833333... US short tons. Add the unrounded quantities to get 17.883333... US short tons, displayed as 17.88. The table's volume and weight figures are rounded for reading.",
          "Do not apply one thickness to the combined 920 ft2 unless both sections actually have that thickness. An optional allowance is applied to the resulting quantity, and its percentage should remain visible.",
        ],
        links: [
          {
            label: "Calculate your separate areas",
            href: "/#calculator",
          },
        ],
      },
      {
        id: "measurement-checklist",
        heading: "Check before sharing the estimate",
        bullets: [
          "All lengths, widths and areas have explicit units.",
          "The sections do not overlap, and exclusions are accounted for once.",
          "Each section retains its own compacted thickness.",
          "Density describes the material condition being estimated.",
          "Net quantity and extra allowance remain separate.",
          "The supplier can see which ton definition the result uses.",
        ],
      },
    ],
    related: [
      {
        href: "/#calculator",
        label: "Turn measurements into a material estimate",
      },
      {
        href: "/guides/asphalt-material-vs-installed-cost",
        label: "Check what a paving estimate includes",
      },
      {
        href: "/guides/asphalt-coverage",
        label: "Check coverage at a stated thickness",
      },
    ],
  },
  "guides/asphalt-material-vs-installed-cost": {
    slug: "guides/asphalt-material-vs-installed-cost",
    title: "Asphalt Material Cost vs. Installed Cost",
    description:
      "Separate an asphalt material budget from a full paving quote. Check density, ton units, extra allowance, delivery, base work, removal, labor and equipment.",
    eyebrow: "Field Guide / 04",
    heading: "What does an asphalt cost estimate include?",
    intro:
      "Tonnage multiplied by a supplied price gives a material budget. A complete paving quote may also cover preparation, removal, base work, labor, equipment, delivery and other items. Check the scope before comparing two totals.",
    sections: [
      {
        id: "material-budget",
        heading: "Start with a material budget you can reproduce",
        paragraphs: [
          "Use the density and thickness appropriate for the material, calculate the tonnage, and multiply by the supplier's price in the same ton unit. State whether that price is being applied to the net quantity or the quantity including extra allowance.",
          "PavePlan does not supply a nationwide current asphalt price. A price entered in the calculator is an input to a planning model, not an offer from a supplier or a binding installed quote.",
        ],
        formula:
          "Material budget = selected material quantity x price per matching weight unit",
      },
      {
        id: "budget-example",
        heading: "Example: a quoted unit price is still only one input",
        paragraphs: [
          "A 100 ft x 20 ft area at 3 inches and an assumed density of 145 lb/ft3 needs 36.25 US short tons before allowance. At an illustrative input price of $100 per US short ton, the net material budget is $3,625. The $100 figure is an example, not a claim about today's market.",
          "A user-selected 5% allowance brings the planning quantity to 38.0625 US short tons. Applying the same example price to that quantity gives $3,806.25. That additional $181.25 comes from the allowance, not from a different supplier price.",
        ],
        table: {
          headers: [
            "Budget basis",
            "US short tons",
            "Illustrative price",
            "Material budget",
          ],
          rows: [
            ["Net material", "36.25", "$100 / US short ton", "$3,625.00"],
            [
              "With a chosen 5% allowance",
              "38.0625",
              "$100 / US short ton",
              "$3,806.25",
            ],
          ],
        },
      },
      {
        id: "installed-scope",
        heading: "Check the installed quote's scope",
        paragraphs: [
          "The items below are questions to confirm, not costs automatically included in a PavePlan result. A supplier or contractor may combine or separate them differently.",
        ],
        table: {
          headers: ["Item", "Question to confirm"],
          rows: [
            [
              "Asphalt material",
              "Which mix, density basis, ton unit and quantity are priced?",
            ],
            [
              "Delivery and minimum order",
              "Are hauling, minimum load or delivery charges included?",
            ],
            [
              "Removal and disposal",
              "Is existing pavement being removed, and where is disposal priced?",
            ],
            [
              "Base and preparation",
              "What excavation, grading, base material and preparation are included?",
            ],
            [
              "Labor and equipment",
              "Which placement, compaction and finishing work is included?",
            ],
            [
              "Tax and other charges",
              "Which charges are included, excluded or conditional?",
            ],
            [
              "Validity and scheduling",
              "What date, location, assumptions and validity period apply?",
            ],
          ],
        },
      },
      {
        id: "compare-quotes",
        heading: "Compare the same task and units",
        paragraphs: [
          "A material-only total and a full installation total are not directly comparable. Neither are prices per metric tonne and per US short ton unless converted consistently. Check the included work before interpreting a lower headline figure.",
          "If one estimate uses a different thickness or includes base work, keep that difference visible. Do not divide an installed total by the material tons and label the result a supplier's material price.",
          "Inch Calculator provides an example of a tool that places material estimates and project costs together. It is useful product context, not evidence of a current price for your location or project.",
        ],
        links: [
          {
            label: "Inch Calculator's asphalt estimate page",
            href: "https://www.inchcalculator.com/asphalt-calculator/",
          },
          {
            label: "Check the density and ton definitions",
            href: "/guides/asphalt-density",
          },
        ],
      },
      {
        id: "supplier-checklist",
        heading: "Bring a short, checkable summary",
        bullets: [
          "Material or mix, and whether the estimate uses compacted or loose conditions.",
          "Area labels, dimensions and compacted thickness for each section.",
          "Density, its source, and the units used for weight and price.",
          "Net quantity, extra allowance percentage, and planning total.",
          "Supplier unit price, quotation date, delivery terms and minimum order.",
          "An explicit list of included, excluded and unconfirmed work.",
        ],
        paragraphs: [
          "Use a project summary to ask questions and confirm an order. The calculated number itself does not establish supplier availability, a delivery slot or the quantity a contractor will accept for a project.",
        ],
        links: [
          {
            label: "Build a material summary in the calculator",
            href: "/#calculator",
          },
        ],
      },
    ],
    related: [
      {
        href: "/#calculator",
        label: "Calculate with your supplied material price",
      },
      {
        href: "/guides/measure-driveway",
        label: "Check the measurements behind the quote",
      },
      {
        href: "/methodology",
        label: "Review the quantity and allowance formulas",
      },
    ],
  },
  methodology: {
    slug: "methodology",
    title: "Asphalt Calculator Methodology & Assumptions",
    description:
      "Review PavePlan's asphalt quantity model, unit definitions, editable density assumption, extra allowance, cost scope, rounding and reproducible reference calculations.",
    eyebrow: "The Method",
    heading: "Calculation methodology and assumptions",
    intro:
      "PavePlan estimates material quantity from geometry and density. The arithmetic is explicit; the suitability of the thickness, density and material still depends on the project. This page separates the model from engineering design and supplier confirmation.",
    sections: [
      {
        id: "quantity-model",
        heading: "The basic quantity model",
        paragraphs: [
          "For a rectangular area, multiply length by width. Convert compacted thickness from inches to feet, then multiply area by thickness to obtain volume. Multiply by a compatible density to obtain mass.",
          "For a total-area input, begin with the entered area rather than multiplying length and width again. For several sections, calculate the quantity of each section with its own dimensions and thickness, then sum the quantities.",
        ],
        formula:
          "Area (ft2) = length (ft) x width (ft)\nVolume (ft3) = area (ft2) x thickness (in) / 12\nVolume (yd3) = volume (ft3) / 27\nNet US short tons = volume (ft3) x density (lb/ft3) / 2,000",
      },
      {
        id: "density-assumption",
        heading: "The editable 145 lb/ft3 starting assumption",
        paragraphs: [
          "The starting hot-mix density is 145 lb/ft3. It is an editable planning assumption, not a universal asphalt standard. Replace it with a value appropriate to the mix and material condition when supplied by the project or supplier.",
          "H&K's public hot-mix calculator offers a 145 lb/ft3 starting density. MAPA explicitly uses 110 lb per square yard per inch for compacted pavement, an equivalent of approximately 146.667 lb/ft3. These links document those calculators' assumptions, not the correct density for your project.",
          "The linked density-source pages were checked on November 16, 2026. Their published assumptions can change; retain the actual supplier or project value used for an estimate.",
        ],
        links: [
          { label: "H&K's hot-mix density input", href: hkUrl },
          { label: "MAPA's stated unit weight", href: mapaUrl },
          {
            label: "Understand density before replacing the value",
            href: "/guides/asphalt-density",
          },
        ],
      },
      {
        id: "material-state",
        heading: "Material state, compaction and extra allowance",
        paragraphs: [
          "The hot-mix model uses compacted thickness. Thickness and density must describe compatible material conditions. Recycled asphalt or millings with a loose stockpile density are not automatically interchangeable with compacted hot mix.",
          "Extra allowance is a separate, user-selected percentage added to the net quantity. A 5% example is not a recommendation that all projects need 5%. Starting with zero allowance makes that choice explicit.",
          "A statement that volume decreases by 15% is mathematically different from adding 15% to the finished volume. Reversing a true 15% decrease would use 1 / 0.85. This does not establish a recommended compaction factor for any material.",
        ],
        formula:
          "Extra material = net quantity x allowance (%) / 100\nPlanning total = net quantity + extra material",
      },
      {
        id: "units",
        heading: "Units remain part of every result",
        table: {
          headers: ["Unit or conversion", "Relationship"],
          rows: [
            ["US short ton", "2,000 lb = 907.18474 kg"],
            ["Metric tonne", "1,000 kg"],
            ["Long ton", "2,240 lb"],
            ["Foot", "0.3048 m exactly"],
            ["Inch", "0.0254 m exactly"],
            ["Cubic yard", "27 ft3"],
            ["Pound", "0.45359237 kg exactly"],
          ],
        },
        paragraphs: [
          "Unit conversion changes how a physical quantity is expressed. It should not change the underlying modeled area, volume or mass. A price per ton must also match the selected weight unit.",
          "NIST SP 811 is a reference for units and conversion conventions. It is not cited as an asphalt density, thickness or installation recommendation.",
        ],
        links: [{ label: "NIST Special Publication 811", href: nistUrl }],
      },
      {
        id: "cost-scope",
        heading: "Material cost is a separate calculation",
        paragraphs: [
          "A material cost requires an entered unit price. The quantity used for that calculation must be stated: net material or a planning quantity including extra allowance. PavePlan does not supply a current nationwide material or installed price.",
          "Labor, equipment, removal, base work, delivery and tax are not established by multiplying tonnage by a material unit price. Confirm which items a real quote includes.",
        ],
        formula:
          "Material cost = stated pricing quantity x matching unit price",
        links: [
          {
            label: "Material cost versus installed cost",
            href: "/guides/asphalt-material-vs-installed-cost",
          },
        ],
      },
      {
        id: "reference-cases",
        heading: "Reproducible reference cases",
        paragraphs: [
          "These reference outputs let you check the model. They are mathematical calculations, not field measurements or guarantees of the quantity to order. All rows use the stated density and no allowance unless a percentage appears in the row.",
        ],
        table: {
          headers: ["Inputs", "Reference result", "What it checks"],
          rows: [
            [
              "100 ft x 20 ft x 3 in; 145 lb/ft3",
              "500 ft3; 36.25 US short tons",
              "Base quantity model",
            ],
            [
              "100 ft x 20 ft x 3.5 in; 145 lb/ft3",
              "42.2916667 US short tons",
              "Decimal thickness is preserved",
            ],
            [
              "36.25 US short tons; 5% extra",
              "38.0625 US short tons total",
              "Allowance remains separate",
            ],
            [
              "36.25 US short tons; 10% extra",
              "39.875 US short tons total",
              "Percentage arithmetic",
            ],
            [
              "1 US short ton; 3 in; 145 lb/ft3",
              "55.1724138 ft2",
              "Reverse coverage calculation",
            ],
            [
              "36.25 US short tons; example $100 / US short ton",
              "$3,625 before extra allowance",
              "Material-price scope",
            ],
          ],
        },
      },
      {
        id: "rounding",
        heading: "Precision and limits",
        paragraphs: [
          "Keep calculation precision through area, volume, mass and allowance steps, then round for display. Adding individually rounded section values can differ slightly from rounding the final unrounded total.",
          "More decimal places do not make approximate measurements or an assumed density more certain. A calculated planning total is not a supplier's minimum order, a vehicle payload, a delivery commitment or a pavement design.",
          "Invalid or missing inputs should be corrected before a result is treated as a current estimate. If a number appears inconsistent with these examples, report the input values and units without including personal project details.",
        ],
        links: [{ label: "Report a calculation issue", href: "/contact" }],
      },
      {
        id: "maintenance",
        heading: "Maintenance and corrections",
        paragraphs: [
          "PavePlan is an independent calculator project maintained by the repository owner. No engineering review, association endorsement or professional certification is implied by the arithmetic or the source links.",
          "A formula or default-value change should be recorded with its reason and supporting source. A software deployment or a copy edit alone should not be presented as a new technical review. The public repository and issue tracker are the places to inspect changes and report discrepancies.",
        ],
        links: [
          {
            label: "Sources, reviews and corrections policy",
            href: "/editorial-policy",
          },
          { label: "Open the project issue tracker", href: issuesUrl },
        ],
      },
    ],
    related: [
      { href: "/#calculator", label: "Use the asphalt calculator" },
      {
        href: "/guides/asphalt-density",
        label: "Check the material density assumption",
      },
      { href: "/contact", label: "Help correct a calculation or source" },
    ],
  },
  about: {
    slug: "about",
    title: "About the Calculator Project",
    description:
      "PavePlan is an independent calculator project maintained by the repository owner. Learn what the tool estimates, how assumptions are shown and how to report an issue.",
    eyebrow: "About the Project",
    heading: "A material estimate you can check",
    intro:
      "PavePlan helps turn dimensions into an understandable material estimate. The aim is to keep the quantity, units, density and extra allowance together, so the number remains useful when you check it or discuss it with a supplier.",
    sections: [
      {
        id: "maintainer",
        heading: "Who maintains PavePlan",
        paragraphs: [
          "Independent calculator project maintained by the repository owner. PavePlan is not presented as an engineering firm, asphalt supplier or industry association. No US business address, professional license or association affiliation is claimed.",
          "The project separates software calculations from decisions that depend on a specific material, site or engineering requirement. Source links explain particular assumptions; they do not imply that the linked organizations endorse PavePlan.",
        ],
      },
      {
        id: "purpose",
        heading: "What the tool is for",
        paragraphs: [
          "Use the calculator to estimate hot-mix asphalt quantity from measurements and a density assumption. Use the guides to check coverage, area measurements, density units and the scope of a material budget.",
          "Use the result as a planning aid and a starting point for questions. Confirm material suitability, pavement design, final quantity, order terms and delivery with the people responsible for your project.",
        ],
      },
      {
        id: "transparency",
        heading: "What you should be able to inspect",
        bullets: [
          "The formula and unit definitions used by the quantity model.",
          "The editable starting density, clearly labeled as an assumption.",
          "The difference between net quantity and an optional extra allowance.",
          "Reference calculations that can be reproduced independently.",
          "The limits of a material price compared with a complete installation quote.",
        ],
        links: [{ label: "Read the methodology", href: "/methodology" }],
      },
      {
        id: "feedback",
        heading: "Help make a result or explanation clearer",
        paragraphs: [
          "A useful issue report includes the measurements, units, density, allowance and expected result. Report unclear wording or a broken source link as well as arithmetic problems. Remove names, addresses, contact details and private project information before posting to a public issue tracker.",
        ],
        links: [
          { label: "Contact the project or report an issue", href: "/contact" },
        ],
      },
    ],
    related: [
      { href: "/methodology", label: "Calculation methodology" },
      { href: "/editorial-policy", label: "Sources and corrections" },
      { href: "/privacy", label: "Privacy and optional project sharing" },
    ],
  },
  "editorial-policy": {
    slug: "editorial-policy",
    title: "Sources, Reviews & Corrections",
    description:
      "Read PavePlan's policy for sources, illustrative calculations, technical review, corrections and disclosure. Examples and assumptions are distinguished from engineering facts.",
    eyebrow: "Project Policy",
    heading: "Sources, reviews and corrections",
    intro:
      "A useful estimate needs more than a precise-looking number. We distinguish unit definitions, formula-derived examples, editable assumptions and project-specific decisions, and provide a route to question each of them.",
    sections: [
      {
        id: "types-of-statements",
        heading: "Keep facts, assumptions and examples distinct",
        bullets: [
          "Unit definitions describe a named unit, such as the 2,000-pound US short ton.",
          "Model outputs follow from stated measurements, density and allowance assumptions.",
          "A preset is a starting value the user can inspect and replace, not a universal material specification.",
          "A sample price is an illustrative input unless a date, market and reliable source establish a specific quote.",
          "Thickness selection and material suitability depend on the actual project and are not decided by this quantity calculator.",
        ],
      },
      {
        id: "sources",
        heading: "Use sources for the claim they actually support",
        paragraphs: [
          "Prefer original technical or unit documentation for external facts. Identify the organization, relevant material or condition, and the particular conclusion being supported. A citation should help a reader check the statement beside it.",
          "Other calculators can document their own published assumptions and product behavior. They are not automatically engineering standards. NIST SP 811 supports the unit guidance used here; it is not evidence that 145 lb/ft3 is the right asphalt density for a project.",
          "Do not infer actual traffic, ranking causes, installation performance or commercial outcomes from a competitor's design or search position.",
        ],
        links: [
          { label: "Review the method's source links", href: "/methodology" },
        ],
      },
      {
        id: "review-scope",
        heading: "Describe the review that actually happened",
        paragraphs: [
          "Formula reference cases are arithmetic checks, not site tests or professional design approval. Do not interpret the presence of a source link or an exact numerical example as independent engineering review.",
          "PavePlan currently makes no claim of a named engineer's review, professional certification or association endorsement. A Reviewed by label should be added only after a real reviewer has completed a defined review and agreed to be identified.",
          "Content dates should describe real work. A copy edit or software deployment should not refresh a technical-review date without the corresponding review.",
        ],
      },
      {
        id: "corrections",
        heading: "Report and record corrections",
        paragraphs: [
          "Report a disputed output with enough information to reproduce it: input mode, measurements and units, thickness, density, allowance, price if relevant, expected result and observed result. For a source concern, include the page and the specific statement.",
          "Corrections that change a formula, default or important limitation should explain the previous and new behavior in the public project history. An issue report is a request for investigation, not automatic confirmation that the reported behavior is a defect.",
          "The issue tracker is public. Do not post private addresses, personal contact details, deletion tokens or confidential project information.",
        ],
        links: [{ label: "Report an issue", href: "/contact" }],
      },
      {
        id: "commercial-disclosure",
        heading: "Keep commercial relationships visible",
        paragraphs: [
          "The current site has no third-party advertising or analytics scripts and does not present a supplier quote service. Source links are explanatory references, not a statement of partnership.",
          "If sponsorships, paid recommendations, affiliate relationships or supplier referrals are introduced, relevant relationships and data-sharing behavior should be disclosed where users make the related decision, and the privacy information should be updated.",
        ],
      },
    ],
    related: [
      { href: "/methodology", label: "Inspect formulas and reference cases" },
      { href: "/about", label: "Who maintains PavePlan" },
      { href: "/contact", label: "Report a source or calculation issue" },
    ],
  },
  contact: {
    slug: "contact",
    title: "Contact & Report a Calculation Issue",
    description:
      "Report a PavePlan calculation, source or usability issue through the public project tracker. Include reproducible inputs and remove private project information.",
    eyebrow: "Contact / Corrections",
    heading: "Contact and report an issue",
    intro:
      "Use the public project issue tracker to report a calculation problem, a broken source or an unclear explanation. A small, reproducible example is the most useful starting point.",
    sections: [
      {
        id: "issue-tracker",
        heading: "Open a project issue",
        paragraphs: [
          "GitHub hosts the issue tracker. Posting may require a GitHub account, and GitHub's own terms and privacy policy apply there. PavePlan does not offer an on-site support account or private contact form.",
          "If a calculation looks wrong, compare it with the methodology's reference cases first. Include both what you expected and what the calculator displayed. No response time or professional engineering advice is promised.",
        ],
        links: [
          { label: "Open the PavePlan issue tracker", href: issuesUrl },
          {
            label: "Check the reference calculations",
            href: "/methodology#reference-cases",
          },
        ],
      },
      {
        id: "report-details",
        heading: "Include the information needed to reproduce it",
        bullets: [
          "The page and input mode you were using.",
          "The dimensions or area, thickness, and every unit label.",
          "The density, extra allowance, and unit price if relevant.",
          "The expected output, observed output, and steps that produced it.",
          "For a display issue, the browser, approximate viewport size and a screenshot with private information removed.",
          "For a source issue, the specific statement and a better supporting source if available.",
        ],
      },
      {
        id: "public-information",
        heading: "Keep private project information out of a public report",
        paragraphs: [
          "Do not include a street address, client name, personal contact details, confidential quotation, private project link or deletion token. Replace area names with neutral labels such as Section A. Use a small invented set of dimensions if it reproduces the same issue, and label it as an example.",
          "An optional public project link can expose its stored parameters and area names to anyone who has the link. Posting it in an issue makes that information easier to discover.",
        ],
        links: [
          { label: "Read the privacy and sharing details", href: "/privacy" },
        ],
      },
      {
        id: "project-decisions",
        heading:
          "For an order or pavement design, contact the responsible professional",
        paragraphs: [
          "PavePlan does not sell asphalt, confirm supplier availability or arrange deliveries. The issue tracker cannot validate a site's pavement design, material specification or final purchase quantity. Take those questions to the supplier, contractor or professional responsible for the project.",
        ],
      },
    ],
    related: [
      { href: "/methodology", label: "Check the quantity model" },
      { href: "/editorial-policy", label: "How corrections are handled" },
      { href: "/about", label: "About the project" },
    ],
  },
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    description:
      "Learn how PavePlan handles browser-only drafts and optional public project links, including stored parameters, area names, 30-day link expiry and deletion tokens.",
    eyebrow: "Project Policy",
    heading: "Privacy policy",
    intro:
      "PavePlan has no user accounts and uses no third-party analytics or advertising scripts. A local draft stays in your browser. Optional public sharing sends the chosen project parameters and area names to the sharing service.",
    sections: [
      {
        id: "local-drafts",
        heading: "Calculations and local drafts",
        paragraphs: [
          "The calculator can use browser storage to retain a local draft on your device. A local draft is not an account or a server backup, and it is not automatically published as a shared project.",
          "Other people using the same browser profile may be able to view its saved state. Clearing site data or using browser storage controls can remove local information. Removing a local draft does not by itself remove a project that you previously chose to share publicly.",
        ],
      },
      {
        id: "public-sharing",
        heading: "Optional public project links",
        paragraphs: [
          "When public sharing is available and you choose it, the service stores calculator parameters and area names in its D1 database so that the link can reproduce the estimate. A share link is public to anyone who has it. It is not a private workspace or an access-controlled client document.",
          "Do not put names, addresses, contact details or confidential information in area labels or other shared values. Use neutral labels such as Driveway A or Section 2. No personal information is needed to calculate material quantity.",
          "Public project links expire 30 days after creation. Link expiry does not remove copies or screenshots that someone else already made, and it should not be interpreted as a promise of immediate erasure from all infrastructure backups.",
        ],
      },
      {
        id: "delete-shared-project",
        heading: "Deletion controls and the browser-held token",
        paragraphs: [
          "If a deletion token is issued for a shared project, it is held locally in the creating browser and authorizes a deletion request to the sharing backend. It is not part of the public project link. Do not post or send the token to others.",
          "Keep access to the creating browser if you want to use its deletion control. Clearing site data, changing devices or using a different browser can remove access to the local token. Without an account, there is no account-based token recovery.",
          "Deleting a shared project is separate from clearing a local draft. If you report a problem with deletion, do not include the token or private details in a public issue.",
        ],
      },
      {
        id: "hosting-and-links",
        heading: "Hosting, operational requests and external links",
        paragraphs: [
          "Hosting and network providers may process standard request metadata to deliver and operate the site. The absence of advertising and analytics scripts does not mean that no operational request data is processed by infrastructure providers.",
          "External references and the GitHub issue tracker are separate services with their own policies. A public issue you choose to post there is not a private message to PavePlan. Avoid including personal project information.",
        ],
      },
      {
        id: "changes-and-contact",
        heading: "Changes and questions",
        paragraphs: [
          "If data collection, project sharing, analytics or advertising behavior changes, this page should be updated to describe the actual behavior. A new feature should not silently turn a local draft into a public project.",
          "Use the contact page for the current project issue channel. Provide only the information needed to describe a concern; do not disclose deletion tokens or personal data in a public report.",
        ],
        links: [{ label: "Contact the project", href: "/contact" }],
      },
    ],
    related: [
      { href: "/terms", label: "Terms of use" },
      { href: "/contact", label: "Report a privacy or sharing concern" },
    ],
  },
  terms: {
    slug: "terms",
    title: "Terms of Use",
    description:
      "PavePlan's terms explain the planning purpose of its calculations, project-specific assumptions, public sharing, third-party references and issue reporting.",
    eyebrow: "Project Policy",
    heading: "Terms of use",
    intro:
      "PavePlan provides a quantity-planning tool and explanatory material. Results depend on the inputs and assumptions you choose. They are not a binding quotation, a material order, a pavement design or a professional engineering approval.",
    sections: [
      {
        id: "planning-purpose",
        heading: "Use results as estimates",
        paragraphs: [
          "Check the dimensions, units, material state, density, extra allowance and price basis before relying on a result. The editable density preset and the reference examples do not establish the correct material or thickness for a particular site.",
          "Confirm design requirements, material suitability, supplier quantities, minimum orders, price terms and delivery arrangements with the parties responsible for the project. PavePlan does not act as a supplier or contractor.",
        ],
      },
      {
        id: "scope-and-availability",
        heading: "Accuracy and availability",
        paragraphs: [
          "The methodology explains the model and provides reference calculations. Errors, omissions or service interruptions may still occur. A displayed number should be checked against its stated assumptions and an appropriate independent calculation when necessary.",
          "Features and explanatory content may change as issues are corrected or the project develops. No fixed response time, uninterrupted availability, commercial result or search-ranking outcome is promised.",
        ],
        links: [
          {
            label: "Inspect the calculation methodology",
            href: "/methodology",
          },
        ],
      },
      {
        id: "responsible-sharing",
        heading: "Public sharing is a choice",
        paragraphs: [
          "A local draft and an optional public share are different. If you create a public project link, share only parameters and area names that you are entitled to make public. Do not include personal addresses, contact details, confidential client information or other private material.",
          "Anyone with a public link may be able to read the shared values. Link expiry and deletion controls do not retract copies already made by others. The privacy page describes browser storage, the 30-day expiry and browser-held deletion tokens.",
        ],
        links: [{ label: "Read the privacy policy", href: "/privacy" }],
      },
      {
        id: "external-services",
        heading: "External sources and services",
        paragraphs: [
          "References are supplied to help explain specific assumptions, units or product context. Linking does not imply affiliation, endorsement or responsibility for an external service's content or availability.",
          "GitHub and other external destinations have their own terms. Do not use a public issue tracker to disclose confidential information or request urgent project-specific advice.",
        ],
      },
      {
        id: "corrections",
        heading: "Report a discrepancy",
        paragraphs: [
          "If the model or wording appears wrong, report enough detail to reproduce the issue without personal project information. The project is independently maintained by the repository owner; no engineer, industry association or supplier is represented as an approving body.",
        ],
        links: [
          { label: "Report an issue", href: "/contact" },
          { label: "Review the correction policy", href: "/editorial-policy" },
        ],
      },
    ],
    related: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/about", label: "About the project" },
    ],
  },
};

export const guidePages = Object.values(pages).filter((page) =>
  page.slug.startsWith("guides/"),
);
