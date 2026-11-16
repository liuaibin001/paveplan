import { describe, expect, it } from "vitest";
import {
  buildProjectSummary,
  CALCULATOR_LIMITS,
  calculateProject,
  convertOutputUnit,
  convertProjectUnits,
  createArea,
  defaultProject,
  formatNumber,
  type ProjectInput,
} from "./calculator";

const project = (): ProjectInput => structuredClone(defaultProject);

describe("calculateProject", () => {
  it("calculates the disclosed imperial reference without intermediate rounding", () => {
    const input = project();
    const result = calculateProject(input);
    expect(result.areaFt2).toBe(2000);
    expect(result.areaM2).toBeCloseTo(185.80608, 8);
    expect(result.volumeFt3).toBe(500);
    expect(result.volumeYd3).toBeCloseTo(18.51851851851852, 10);
    expect(result.volumeM3).toBeCloseTo(14.158423296, 10);
    expect(result.netShortTons).toBe(36.25);
    expect(result.netMetricTonnes).toBeCloseTo(32.885446825, 10);
    expect(result.totalWeight).toBe(36.25);
    expect(result.allowanceWeight).toBe(0);
    expect(result.materialCost).toBeNull();
    expect(input).toEqual(defaultProject);
  });

  it("preserves decimal thickness instead of truncating 3.5 inches", () => {
    const input = project();
    input.areas[0].thickness = 3.5;
    expect(calculateProject(input).netShortTons).toBeCloseTo(
      42.291666666666664,
      10,
    );
  });

  it.each([
    [5, 1.8125, 38.0625],
    [10, 3.625, 39.875],
  ])("adds %s percent exactly once", (allowance, extra, total) => {
    const input = project();
    input.allowance = allowance;
    input.price = 100;
    const result = calculateProject(input);
    expect(result.netWeight).toBe(36.25);
    expect(result.allowanceWeight).toBe(extra);
    expect(result.totalWeight).toBe(total);
    expect(result.materialCost).toBe(total * 100);
    expect(result.areas[0].totalWeight).toBe(total);
  });

  it("calculates metric geometry and distinguishes metric tonnes from US tons", () => {
    const input: ProjectInput = {
      units: "metric",
      outputUnit: "metric-tonne",
      density: 2400,
      allowance: 0,
      price: 120,
      areas: [
        {
          id: "metric",
          name: "Metric area",
          mode: "dimensions",
          length: 10,
          width: 10,
          area: 0,
          thickness: 50,
        },
      ],
    };
    const result = calculateProject(input);
    expect(result.volumeM3).toBe(5);
    expect(result.netMetricTonnes).toBe(12);
    expect(result.netShortTons).toBeCloseTo(13.227735731092654, 10);
    expect(result.materialCost).toBe(1440);
  });

  it("makes direct-area mode equivalent to length and width", () => {
    const input = project();
    input.areas[0].mode = "area";
    input.areas[0].length = 0;
    input.areas[0].width = 0;
    expect(calculateProject(input).netShortTons).toBe(36.25);
  });

  it("sums separate areas with independent thicknesses", () => {
    const input = project();
    input.allowance = 5;
    input.price = 100;
    input.areas.push({
      id: "second",
      name: "Second area",
      mode: "area",
      length: 0,
      width: 0,
      area: 1000,
      thickness: 2,
    });
    const result = calculateProject(input);
    expect(result.areaFt2).toBe(3000);
    expect(result.netShortTons).toBeCloseTo(48.333333333333336, 10);
    expect(result.totalShortTons).toBeCloseTo(50.75, 10);
    expect(result.materialCost).toBeCloseTo(5075, 8);
    expect(result.areas.map((area) => area.name)).toEqual([
      "Area 1",
      "Second area",
    ]);
    expect(
      result.areas.reduce((total, area) => total + area.totalWeight, 0),
    ).toBeCloseTo(result.totalWeight, 10);
  });

  it("distinguishes a supplied zero price from no supplied price", () => {
    const input = project();
    input.price = 0;
    expect(calculateProject(input).materialCost).toBe(0);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1, 0])(
    "rejects invalid active dimensions: %s",
    (value) => {
      const input = project();
      input.areas[0].length = value;
      expect(() => calculateProject(input)).toThrow(/length/);
    },
  );

  it("rejects invalid density, allowance, price, and known-area values", () => {
    const input = project();
    input.density = 0;
    expect(() => calculateProject(input)).toThrow(/Density/);
    input.density = -145;
    expect(() => calculateProject(input)).toThrow(/Density/);
    input.density = 145;
    input.allowance = -5;
    expect(() => calculateProject(input)).toThrow(/allowance/);
    input.allowance = 101;
    expect(() => calculateProject(input)).toThrow(/allowance/);
    input.allowance = 0;
    input.price = Number.NaN;
    expect(() => calculateProject(input)).toThrow(/price/);
    input.price = -1;
    expect(() => calculateProject(input)).toThrow(/price/);
    input.price = null;
    input.areas[0].mode = "area";
    input.areas[0].area = 0;
    expect(() => calculateProject(input)).toThrow(/known area/);
  });

  it("enforces physical dimension limits and a maximum of 20 areas", () => {
    const input = project();
    input.areas[0].length = CALCULATOR_LIMITS.maxLengthFt + 1;
    expect(() => calculateProject(input)).toThrow(/length/);
    input.areas[0].length = 100;
    input.areas[0].thickness = 121;
    expect(() => calculateProject(input)).toThrow(/thickness/);
    input.areas = Array.from({ length: 21 }, (_, index) => ({
      ...defaultProject.areas[0],
      id: `area-${index}`,
    }));
    expect(() => calculateProject(input)).toThrow(/at most 20/);
    input.areas = [];
    expect(() => calculateProject(input)).toThrow(/at least one/);
  });

  it("rejects duplicate area identifiers and invalid runtime unit choices", () => {
    const input = project();
    input.areas.push({ ...input.areas[0] });
    expect(() => calculateProject(input)).toThrow(/unique identifier/);
    input.areas.pop();
    input.outputUnit = "long-ton" as ProjectInput["outputUnit"];
    expect(() => calculateProject(input)).toThrow(/US short tons/);
    input.outputUnit = "us-ton";
    input.units = "unknown" as ProjectInput["units"];
    expect(() => calculateProject(input)).toThrow(/imperial or metric/);
  });
});

describe("unit conversions", () => {
  it("converts every measurement and density while preserving physical quantities", () => {
    const input = project();
    input.allowance = 10;
    input.price = 100;
    const metric = convertProjectUnits(input, "metric");
    expect(metric.areas[0].length).toBeCloseTo(30.48, 10);
    expect(metric.areas[0].width).toBeCloseTo(6.096, 10);
    expect(metric.areas[0].thickness).toBeCloseTo(76.2, 10);
    expect(metric.areas[0].area).toBeCloseTo(185.80608, 8);
    expect(metric.density).toBeCloseTo(2322.677189224221, 8);
    expect(metric.price).toBe(100);
    expect(calculateProject(metric).totalShortTons).toBeCloseTo(
      calculateProject(input).totalShortTons,
      10,
    );
    expect(calculateProject(metric).materialCost).toBeCloseTo(
      calculateProject(input).materialCost!,
      8,
    );
    const roundTrip = convertProjectUnits(metric, "imperial");
    expect(roundTrip.areas[0].thickness).toBeCloseTo(3, 10);
    expect(roundTrip.density).toBeCloseTo(145, 10);
    expect(input.units).toBe("imperial");
    expect(input.areas[0].length).toBe(100);
  });

  it("converts known-area mode and preserves a partial new-area form", () => {
    const input = project();
    input.areas[0].mode = "area";
    const metric = convertProjectUnits(input, "metric");
    expect(calculateProject(metric).netShortTons).toBeCloseTo(36.25, 10);
    input.areas.push(createArea(2));
    expect(() => convertProjectUnits(input, "metric")).not.toThrow();
    expect(() => calculateProject(input)).toThrow(/length/);
  });

  it("converts price together with the output ton unit to preserve material cost", () => {
    const input = project();
    input.price = 100;
    input.allowance = 5;
    const metricOutput = convertOutputUnit(input, "metric-tonne");
    const originalResult = calculateProject(input);
    const convertedResult = calculateProject(metricOutput);
    expect(metricOutput.price).toBeCloseTo(110.23113109243879, 10);
    expect(convertedResult.totalWeight).toBeCloseTo(
      originalResult.totalMetricTonnes,
      10,
    );
    expect(convertedResult.materialCost).toBeCloseTo(
      originalResult.materialCost!,
      8,
    );
    expect(convertOutputUnit(metricOutput, "us-ton").price).toBeCloseTo(
      100,
      10,
    );
    expect(input.outputUnit).toBe("us-ton");
    expect(input.price).toBe(100);
    expect(convertOutputUnit(project(), "metric-tonne").price).toBeNull();
  });

  it("keeps the same physical upper limits after a unit conversion", () => {
    const input = project();
    input.price = CALCULATOR_LIMITS.maxPricePerShortTon;
    input.density = CALCULATOR_LIMITS.maxDensityLbFt3;
    input.areas[0].thickness = CALCULATOR_LIMITS.maxThicknessIn;
    const converted = convertOutputUnit(
      convertProjectUnits(input, "metric"),
      "metric-tonne",
    );
    expect(() => calculateProject(converted)).not.toThrow();
    expect(calculateProject(converted).materialCost).toBeCloseTo(
      calculateProject(input).materialCost!,
      3,
    );
  });

  it("returns independent area objects even when the chosen units are unchanged", () => {
    const input = project();
    const sameUnits = convertProjectUnits(input, "imperial");
    sameUnits.areas[0].length = 1;
    const sameOutput = convertOutputUnit(input, "us-ton");
    sameOutput.areas[0].width = 1;
    expect(input.areas[0].length).toBe(100);
    expect(input.areas[0].width).toBe(20);
  });
});

describe("display and project summary", () => {
  it("formats only for display and rejects non-finite output", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(38.0625)).toBe("38.06");
    expect(formatNumber(42.2916666667, 4)).toBe("42.2917");
    expect(formatNumber(-0)).toBe("0");
    expect(() => formatNumber(Number.NaN)).toThrow(/finite/);
    expect(() => formatNumber(1, -1)).toThrow(/Decimal places/);
  });

  it("builds a plain-text estimate with conditions, scope, and actual material cost", () => {
    const input = project();
    input.price = 100;
    input.allowance = 5;
    input.areas[0].name = "Driveway\nfront";
    const summary = buildProjectSummary(input, calculateProject(input));
    expect(summary).toContain("Driveway front: 100 x 20 ft, 3 in thick");
    expect(summary).toContain("Density: 145 lb/ft^3");
    expect(summary).toContain("US short tons (2,000 lb)");
    expect(summary).toContain("Planned total: 38.0625");
    expect(summary).toContain(
      "Material cost including extra allowance: $3,806.25",
    );
    expect(summary).toContain(
      "Labor, base, removal, delivery, equipment and taxes are not included",
    );
    expect(summary).not.toContain("<");
  });

  it("does not present a missing price as a zero-dollar estimate", () => {
    const input = project();
    const summary = buildProjectSummary(input, calculateProject(input));
    expect(summary).toContain("Material cost: not calculated");
    expect(summary).not.toContain("$0.00");
  });

  it("creates independent, uniquely identified empty areas", () => {
    const first = createArea(2);
    const second = createArea(2);
    expect(first.name).toBe("Area 2");
    expect(first.id).not.toBe(second.id);
    expect(first.length).toBe(0);
    expect(first.width).toBe(0);
    expect(first.thickness).toBe(3);
  });
});
