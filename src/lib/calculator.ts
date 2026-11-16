export type UnitSystem = "imperial" | "metric";
export type OutputUnit = "us-ton" | "metric-tonne";

export type AreaInput = {
  id: string;
  name: string;
  mode: "dimensions" | "area";
  length: number;
  width: number;
  area: number;
  thickness: number;
};

export type ProjectInput = {
  units: UnitSystem;
  outputUnit: OutputUnit;
  areas: AreaInput[];
  density: number;
  allowance: number;
  price: number | null;
};

export type QuantityResult = {
  areaFt2: number;
  areaM2: number;
  volumeFt3: number;
  volumeYd3: number;
  volumeM3: number;
  netShortTons: number;
  allowanceShortTons: number;
  totalShortTons: number;
  netMetricTonnes: number;
  allowanceMetricTonnes: number;
  totalMetricTonnes: number;
  netWeight: number;
  allowanceWeight: number;
  totalWeight: number;
  materialCost: number | null;
};

export type AreaResult = QuantityResult & { id: string; name: string };
export type ProjectResult = QuantityResult & { areas: AreaResult[] };

const FOOT_M = 0.3048;
const FOOT2_M2 = FOOT_M ** 2;
const FOOT3_M3 = FOOT_M ** 3;
const POUND_KG = 0.45359237;
const SHORT_TON_KG = 2000 * POUND_KG;
const METRIC_TONNE_KG = 1000;
const LB_FT3_TO_KG_M3 = POUND_KG / FOOT3_M3;

// Limits are physical quantities, so changing units does not change validation.
export const CALCULATOR_LIMITS = {
  maxAreas: 20,
  maxLengthFt: 100_000,
  maxAreaFt2: 1_000_000_000,
  maxThicknessIn: 120,
  maxDensityLbFt3: 300,
  maxAllowancePercent: 100,
  maxPricePerShortTon: 1_000_000,
} as const;

let areaSequence = 0;

export function createArea(index = 1): AreaInput {
  const id =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `area-${Date.now().toString(36)}-${++areaSequence}`;
  return {
    id,
    name: `Area ${index}`,
    mode: "dimensions",
    length: 0,
    width: 0,
    area: 0,
    thickness: 3,
  };
}

export const defaultProject: ProjectInput = {
  units: "imperial",
  outputUnit: "us-ton",
  areas: [
    {
      id: "area-1",
      name: "Area 1",
      mode: "dimensions",
      length: 100,
      width: 20,
      area: 2000,
      thickness: 3,
    },
  ],
  density: 145,
  allowance: 0,
  price: null,
};

function unitKilograms(unit: OutputUnit): number {
  return unit === "us-ton" ? SHORT_TON_KG : METRIC_TONNE_KG;
}

function validateUnitSystem(units: UnitSystem): void {
  if (units !== "imperial" && units !== "metric") {
    throw new Error("Choose imperial or metric input units.");
  }
}

function validateOutputUnit(unit: OutputUnit): void {
  if (unit !== "us-ton" && unit !== "metric-tonne") {
    throw new Error("Choose US short tons or metric tonnes for the result.");
  }
}

function validateNumber(
  value: number,
  label: string,
  maximum: number,
  allowZero: boolean,
): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
  if (value < 0 || (!allowZero && value === 0)) {
    throw new Error(
      `${label} must be ${allowZero ? "zero or greater" : "greater than zero"}.`,
    );
  }
  if (value > maximum * (1 + 1e-12)) {
    throw new Error(`${label} must not exceed ${formatNumber(maximum, 4)}.`);
  }
}

function validateProject(input: ProjectInput, allowIncomplete = false): void {
  if (!input || typeof input !== "object") {
    throw new Error("Provide a project to calculate.");
  }
  validateUnitSystem(input.units);
  validateOutputUnit(input.outputUnit);
  if (!Array.isArray(input.areas) || input.areas.length === 0) {
    throw new Error("Add at least one area to calculate.");
  }
  if (input.areas.length > CALCULATOR_LIMITS.maxAreas) {
    throw new Error(
      `A project can contain at most ${CALCULATOR_LIMITS.maxAreas} areas.`,
    );
  }

  const imperial = input.units === "imperial";
  const maxLength = CALCULATOR_LIMITS.maxLengthFt * (imperial ? 1 : FOOT_M);
  const maxArea = CALCULATOR_LIMITS.maxAreaFt2 * (imperial ? 1 : FOOT2_M2);
  const maxThickness = CALCULATOR_LIMITS.maxThicknessIn * (imperial ? 1 : 25.4);
  const maxDensity =
    CALCULATOR_LIMITS.maxDensityLbFt3 * (imperial ? 1 : LB_FT3_TO_KG_M3);
  validateNumber(input.density, "Density", maxDensity, false);
  validateNumber(
    input.allowance,
    "Extra allowance (%)",
    CALCULATOR_LIMITS.maxAllowancePercent,
    true,
  );
  if (input.price !== null) {
    const maxPrice =
      (CALCULATOR_LIMITS.maxPricePerShortTon *
        unitKilograms(input.outputUnit)) /
      SHORT_TON_KG;
    validateNumber(
      input.price,
      "Material price per selected ton unit",
      maxPrice,
      true,
    );
  }

  const ids = new Set<string>();
  input.areas.forEach((area, index) => {
    const label = `Area ${index + 1}`;
    if (!area || typeof area !== "object") {
      throw new Error(`${label} is missing its measurements.`);
    }
    if (
      typeof area.id !== "string" ||
      !area.id.trim() ||
      area.id.length > 128
    ) {
      throw new Error(`${label} needs a valid identifier.`);
    }
    if (ids.has(area.id)) {
      throw new Error("Each project area must have a unique identifier.");
    }
    ids.add(area.id);
    if (typeof area.name !== "string" || area.name.length > 80) {
      throw new Error(`${label} name must contain at most 80 characters.`);
    }
    if (area.mode !== "dimensions" && area.mode !== "area") {
      throw new Error(`${label}: choose dimensions or a known area.`);
    }
    validateNumber(
      area.length,
      `${label} length`,
      maxLength,
      allowIncomplete || area.mode === "area",
    );
    validateNumber(
      area.width,
      `${label} width`,
      maxLength,
      allowIncomplete || area.mode === "area",
    );
    validateNumber(
      area.area,
      `${label} known area`,
      maxArea,
      allowIncomplete || area.mode === "dimensions",
    );
    validateNumber(
      area.thickness,
      `${label} compacted thickness`,
      maxThickness,
      allowIncomplete,
    );
    if (
      area.mode === "dimensions" &&
      area.length * area.width > maxArea * (1 + 1e-12)
    ) {
      throw new Error(
        `${label} calculated area must not exceed ${formatNumber(maxArea, 2)}.`,
      );
    }
  });
}

function quantities(
  geometry: Pick<
    QuantityResult,
    "areaFt2" | "areaM2" | "volumeFt3" | "volumeYd3" | "volumeM3"
  >,
  netShortTons: number,
  netMetricTonnes: number,
  input: ProjectInput,
): QuantityResult {
  const allowanceShortTons = netShortTons * (input.allowance / 100);
  const allowanceMetricTonnes = netMetricTonnes * (input.allowance / 100);
  const totalShortTons = netShortTons + allowanceShortTons;
  const totalMetricTonnes = netMetricTonnes + allowanceMetricTonnes;
  const useShortTons = input.outputUnit === "us-ton";
  const netWeight = useShortTons ? netShortTons : netMetricTonnes;
  const allowanceWeight = useShortTons
    ? allowanceShortTons
    : allowanceMetricTonnes;
  const totalWeight = useShortTons ? totalShortTons : totalMetricTonnes;
  return {
    ...geometry,
    netShortTons,
    allowanceShortTons,
    totalShortTons,
    netMetricTonnes,
    allowanceMetricTonnes,
    totalMetricTonnes,
    netWeight,
    allowanceWeight,
    totalWeight,
    materialCost: input.price === null ? null : totalWeight * input.price,
  };
}

export function calculateProject(input: ProjectInput): ProjectResult {
  validateProject(input);
  const areas = input.areas.map((area, index): AreaResult => {
    const nativeArea =
      area.mode === "area" ? area.area : area.length * area.width;
    let areaFt2: number;
    let areaM2: number;
    let volumeFt3: number;
    let volumeM3: number;
    let netShortTons: number;
    let netMetricTonnes: number;
    if (input.units === "imperial") {
      areaFt2 = nativeArea;
      areaM2 = areaFt2 * FOOT2_M2;
      volumeFt3 = areaFt2 * (area.thickness / 12);
      volumeM3 = volumeFt3 * FOOT3_M3;
      const pounds = volumeFt3 * input.density;
      netShortTons = pounds / 2000;
      netMetricTonnes = (pounds * POUND_KG) / METRIC_TONNE_KG;
    } else {
      areaM2 = nativeArea;
      areaFt2 = areaM2 / FOOT2_M2;
      volumeM3 = areaM2 * (area.thickness / 1000);
      volumeFt3 = volumeM3 / FOOT3_M3;
      const kilograms = volumeM3 * input.density;
      netShortTons = kilograms / SHORT_TON_KG;
      netMetricTonnes = kilograms / METRIC_TONNE_KG;
    }
    return {
      id: area.id,
      name: area.name.trim() || `Area ${index + 1}`,
      ...quantities(
        { areaFt2, areaM2, volumeFt3, volumeM3, volumeYd3: volumeFt3 / 27 },
        netShortTons,
        netMetricTonnes,
        input,
      ),
    };
  });
  const sum = (key: keyof QuantityResult): number =>
    areas.reduce((total, area) => total + (area[key] as number), 0);
  return {
    areas,
    ...quantities(
      {
        areaFt2: sum("areaFt2"),
        areaM2: sum("areaM2"),
        volumeFt3: sum("volumeFt3"),
        volumeYd3: sum("volumeYd3"),
        volumeM3: sum("volumeM3"),
      },
      sum("netShortTons"),
      sum("netMetricTonnes"),
      input,
    ),
  };
}

export function convertProjectUnits(
  input: ProjectInput,
  target: UnitSystem,
): ProjectInput {
  validateUnitSystem(target);
  // A user can switch units while a new area still has empty (zero) dimensions.
  validateProject(input, true);
  if (input.units === target) {
    return { ...input, areas: input.areas.map((area) => ({ ...area })) };
  }
  const toMetric = target === "metric";
  const lengthFactor = toMetric ? FOOT_M : 1 / FOOT_M;
  const areaFactor = toMetric ? FOOT2_M2 : 1 / FOOT2_M2;
  const thicknessFactor = toMetric ? 25.4 : 1 / 25.4;
  const densityFactor = toMetric ? LB_FT3_TO_KG_M3 : 1 / LB_FT3_TO_KG_M3;
  return {
    ...input,
    units: target,
    density: input.density * densityFactor,
    areas: input.areas.map((area) => ({
      ...area,
      length: area.length * lengthFactor,
      width: area.width * lengthFactor,
      area: area.area * areaFactor,
      thickness: area.thickness * thicknessFactor,
    })),
  };
}

export function convertOutputUnit(
  input: ProjectInput,
  target: OutputUnit,
): ProjectInput {
  validateOutputUnit(target);
  validateProject(input, true);
  return {
    ...input,
    outputUnit: target,
    price:
      input.price === null
        ? null
        : (input.price * unitKilograms(target)) /
          unitKilograms(input.outputUnit),
    areas: input.areas.map((area) => ({ ...area })),
  };
}

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) {
    throw new Error("Only finite numbers can be formatted.");
  }
  if (!Number.isInteger(digits) || digits < 0 || digits > 20) {
    throw new Error("Decimal places must be an integer from 0 to 20.");
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value === 0 ? 0 : value);
}

export function buildProjectSummary(
  input: ProjectInput,
  result: ProjectResult,
): string {
  const imperial = input.units === "imperial";
  const weightUnit =
    input.outputUnit === "us-ton"
      ? "US short tons (2,000 lb)"
      : "metric tonnes (1,000 kg)";
  const densityUnit = imperial ? "lb/ft^3" : "kg/m^3";
  const cleanName = (name: string): string => name.replace(/\s+/g, " ").trim();
  const money = (value: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  const lines = [
    "PavePlan asphalt material estimate",
    "Material: hot-mix asphalt",
    "Thickness basis: finished / compacted thickness",
    `Density: ${formatNumber(input.density, 4)} ${densityUnit} (user-selected estimate)`,
    `Extra allowance: ${formatNumber(input.allowance)}%`,
    `Weight unit: ${weightUnit}`,
    "",
    "Areas",
  ];
  result.areas.forEach((area, index) => {
    const measurements = input.areas[index];
    const footprint =
      measurements.mode === "area"
        ? `${formatNumber(measurements.area, 4)} ${imperial ? "ft^2" : "m^2"}`
        : `${formatNumber(measurements.length, 4)} x ${formatNumber(measurements.width, 4)} ${imperial ? "ft" : "m"}`;
    lines.push(
      `${index + 1}. ${cleanName(area.name)}: ${footprint}, ${formatNumber(measurements.thickness, 4)} ${imperial ? "in" : "mm"} thick`,
      `   Net ${formatNumber(area.netWeight, 4)}; extra ${formatNumber(area.allowanceWeight, 4)}; total ${formatNumber(area.totalWeight, 4)} ${weightUnit}`,
    );
  });
  lines.push(
    "",
    `Total area: ${formatNumber(result.areaFt2, 4)} ft^2 / ${formatNumber(result.areaM2, 4)} m^2`,
    `Total volume: ${formatNumber(result.volumeFt3, 4)} ft^3 / ${formatNumber(result.volumeYd3, 4)} yd^3 / ${formatNumber(result.volumeM3, 4)} m^3`,
    `Net material: ${formatNumber(result.netWeight, 4)} ${weightUnit}`,
    `Extra allowance: ${formatNumber(result.allowanceWeight, 4)} ${weightUnit}`,
    `Planned total: ${formatNumber(result.totalWeight, 4)} ${weightUnit}`,
  );
  if (input.price !== null && result.materialCost !== null) {
    lines.push(
      `Material unit price: ${money(input.price)} per ${input.outputUnit === "us-ton" ? "US short ton" : "metric tonne"}`,
      `Material cost including extra allowance: ${money(result.materialCost)}`,
    );
  } else {
    lines.push(
      "Material cost: not calculated (no material unit price supplied)",
    );
  }
  lines.push(
    "",
    "Formula: volume x density = mass; extra allowance is added once to the net mass.",
    "Material estimate only. Labor, base, removal, delivery, equipment and taxes are not included.",
    "Confirm the mix density and order quantity with your supplier. This estimate does not specify pavement design.",
  );
  return lines.join("\n");
}
