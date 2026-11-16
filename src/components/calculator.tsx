import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Plus,
  Trash2,
  RotateCcw,
  Copy,
  Download,
  Printer,
  Link2,
  Check,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RoadDiagram } from "./road-diagram";
import {
  buildProjectSummary,
  calculateProject,
  convertOutputUnit,
  convertProjectUnits,
  createArea,
  defaultProject,
  formatNumber,
  type AreaInput,
  type ProjectInput,
  type ProjectResult,
} from "@/lib/calculator";
import { METHOD_VERSION } from "@/lib/site";

const DRAFT_KEY = "paveplan:draft:v1";
type Snapshot = { input: ProjectInput; result: ProjectResult };
const cloneDefault = () => structuredClone(defaultProject);
const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

export function Calculator({
  initialProject,
  readOnly = false,
}: {
  initialProject?: ProjectInput;
  readOnly?: boolean;
}) {
  const [input, setInput] = useState<ProjectInput>(
    initialProject ?? cloneDefault,
  );
  const [snapshot, setSnapshot] = useState<Snapshot | null>(() =>
    initialProject
      ? { input: initialProject, result: calculateProject(initialProject) }
      : null,
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [active, setActive] = useState("");
  const [ready, setReady] = useState(false);
  const [share, setShare] = useState<{
    url: string;
    id: string;
    expiresAt: number | string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);
  const stale =
    !!snapshot && JSON.stringify(snapshot.input) !== JSON.stringify(input);
  const imperial = input.units === "imperial";
  const lengthUnit = imperial ? "ft" : "m";
  const weightUnit =
    input.outputUnit === "us-ton" ? "US short tons" : "metric tonnes";

  useEffect(() => {
    if (!initialProject && !readOnly) {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          calculateProject(parsed);
          setInput(parsed);
          setNotice("Your last valid draft was restored from this browser.");
        }
      } catch {
        /* Ignore an invalid or unavailable browser draft. */
      }
    }
    setReady(true);
  }, [initialProject, readOnly]);
  useEffect(() => {
    if (!ready || readOnly) return;
    try {
      calculateProject(input);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(input));
    } catch {
      /* Save complete, valid projects only. */
    }
  }, [input, ready, readOnly]);

  function update(next: ProjectInput) {
    setInput(next);
    setError("");
    setShare(null);
    setNotice("");
  }
  function updateArea(id: string, patch: Partial<AreaInput>) {
    update({
      ...input,
      areas: input.areas.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  }
  function calculate(event?: FormEvent) {
    event?.preventDefault();
    try {
      const result = calculateProject(input);
      setSnapshot({ input: structuredClone(input), result });
      setError("");
      setNotice("Estimate updated. Review the assumptions before ordering.");
      requestAnimationFrame(() => {
        resultsRef.current?.focus({ preventScroll: true });
        if (window.matchMedia("(max-width: 760px)").matches)
          resultsRef.current?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "instant"
              : "smooth",
            block: "start",
          });
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check your measurements.");
      setSnapshot(null);
    }
  }
  function changeUnits(value: string) {
    try {
      update(convertProjectUnits(input, value as ProjectInput["units"]));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function reset() {
    update(cloneDefault());
    setSnapshot(null);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }
  function summary() {
    return snapshot
      ? `${buildProjectSummary(snapshot.input, snapshot.result)}\nMethod version: ${METHOD_VERSION}\nhttps://paveplan.otoo.workers.dev/methodology`
      : "";
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(summary());
      setNotice("Estimate copied with measurements and assumptions.");
    } catch {
      setNotice("Copy is unavailable in this browser. Use Download instead.");
    }
  }
  function download() {
    const blob = new Blob([summary()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "paveplan-estimate.txt";
    a.click();
    URL.revokeObjectURL(url);
  }
  async function createShare() {
    if (!snapshot || stale) return;
    setBusy(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot.input),
      });
      const body = (await response.json()) as {
        id?: string;
        deleteToken?: string;
        expiresAt?: number;
        error?: string;
      };
      if (!response.ok || !body.id || !body.deleteToken)
        throw new Error(
          body.error ?? "Could not create a share link. Please try again.",
        );
      try {
        localStorage.setItem(`paveplan:delete:${body.id}`, body.deleteToken);
      } catch {}
      setShare({
        url: `${window.location.origin}/project/${body.id}`,
        id: body.id,
        expiresAt: body.expiresAt ?? "",
      });
      setNotice(
        "Public link created. Anyone with this link can read your estimate for 30 days.",
      );
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function numeric(value: number) {
    return value === 0 ? "" : Number(value.toPrecision(7));
  }
  const field = (
    label: string,
    value: number,
    unit: string,
    onChange: (value: number) => void,
    options?: { zero?: boolean; focus?: string; id?: string },
  ) => (
    <label className="field-label">
      {label}
      <span className="number-field">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          required
          value={options?.zero ? value : numeric(value)}
          onFocus={() => setActive(options?.focus ?? "")}
          onBlur={() => setActive("")}
          onChange={(e) =>
            onChange(e.target.value === "" ? 0 : e.target.valueAsNumber)
          }
          aria-label={`${label} (${unit})`}
          id={options?.id}
        />
        <span>{unit}</span>
      </span>
    </label>
  );

  return (
    <div className={`workbench${readOnly ? " shared-workbench" : ""}`}>
      {!readOnly && (
        <form className="calculator-inputs" onSubmit={calculate} noValidate>
          <div className="panel-heading">
            <span className="eyebrow">01 / YOUR MEASUREMENTS</span>
            <Button variant="ghost" size="sm" type="button" onClick={reset}>
              <RotateCcw size={13} />
              Reset
            </Button>
          </div>
          <div className="unit-row">
            <span className="field-caption">Input units</span>
            <Tabs
              value={input.units}
              onValueChange={(value) => changeUnits(String(value))}
            >
              <TabsList aria-label="Input units">
                <TabsTrigger value="imperial">Feet &amp; inches</TabsTrigger>
                <TabsTrigger value="metric">Metric</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {input.areas.map((area, index) => (
            <fieldset key={area.id} className="area-fieldset">
              <legend className="sr-only">Area {index + 1} measurements</legend>
              <div className="area-title">
                <span className="area-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <input
                  className="area-name"
                  aria-label={`Area ${index + 1} name`}
                  value={area.name}
                  maxLength={80}
                  onChange={(e) =>
                    updateArea(area.id, { name: e.target.value })
                  }
                />
                {input.areas.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove area ${index + 1}`}
                    onClick={() =>
                      update({
                        ...input,
                        areas: input.areas.filter((a) => a.id !== area.id),
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
              <Tabs
                value={area.mode}
                onValueChange={(value) =>
                  updateArea(area.id, { mode: value as AreaInput["mode"] })
                }
              >
                <TabsList aria-label={`Area ${index + 1} measurement mode`}>
                  <TabsTrigger value="dimensions">Length × width</TabsTrigger>
                  <TabsTrigger value="area">Known area</TabsTrigger>
                </TabsList>
                <TabsContent value="dimensions">
                  <div className="field-grid">
                    {field(
                      "Length",
                      area.length,
                      lengthUnit,
                      (v) => updateArea(area.id, { length: v }),
                      { focus: "length" },
                    )}
                    {field(
                      "Width",
                      area.width,
                      lengthUnit,
                      (v) => updateArea(area.id, { width: v }),
                      { focus: "width" },
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="area">
                  {field(
                    "Total area",
                    area.area,
                    imperial ? "ft²" : "m²",
                    (v) => updateArea(area.id, { area: v }),
                  )}
                </TabsContent>
              </Tabs>
              {field(
                "Compacted thickness",
                area.thickness,
                imperial ? "in" : "mm",
                (v) => updateArea(area.id, { thickness: v }),
                { focus: "thickness" },
              )}
            </fieldset>
          ))}
          <Button
            className="add-area"
            type="button"
            variant="outline"
            disabled={input.areas.length >= 20}
            onClick={() => {
              const area = createArea(input.areas.length + 1);
              if (!imperial) area.thickness = 75;
              update({ ...input, areas: [...input.areas, area] });
            }}
          >
            <Plus size={16} />
            Add another area{" "}
            <span className="muted">{input.areas.length}/20</span>
          </Button>
          <div className="assumptions-block">
            <div className="panel-heading">
              <span className="eyebrow">02 / MATERIAL ASSUMPTIONS</span>
              <a
                href="/guides/asphalt-density"
                aria-label="Read about asphalt density"
              >
                <Info size={16} />
              </a>
            </div>
            <div className="field-grid">
              {field(
                "Mix density",
                input.density,
                imperial ? "lb/ft³" : "kg/m³",
                (v) => update({ ...input, density: v }),
              )}
              {field(
                "Extra allowance",
                input.allowance,
                "%",
                (v) => update({ ...input, allowance: v }),
                { zero: true },
              )}
            </div>
            <p className="field-help">
              145 lb/ft³ is a starting estimate. Use your supplier's mix
              density. Allowance is optional and added once.
            </p>
            <label className="field-label">
              Result weight unit
              <select
                value={input.outputUnit}
                onChange={(e) => {
                  try {
                    update(
                      convertOutputUnit(
                        input,
                        e.target.value as ProjectInput["outputUnit"],
                      ),
                    );
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <option value="us-ton">US short tons (2,000 lb)</option>
                <option value="metric-tonne">Metric tonnes (1,000 kg)</option>
              </select>
            </label>
            <label className="field-label price-field">
              Material price <span className="optional-label">optional</span>
              <span className="number-field">
                <span className="currency-prefix">$</span>
                <input
                  aria-label="Material price per selected ton unit"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={
                    input.price === null ? "" : Number(input.price.toFixed(4))
                  }
                  placeholder="Your supplier's quote"
                  onChange={(e) =>
                    update({
                      ...input,
                      price:
                        e.target.value === "" ? null : e.target.valueAsNumber,
                    })
                  }
                />
                <span>
                  /{input.outputUnit === "us-ton" ? "US ton" : "tonne"}
                </span>
              </span>
            </label>
          </div>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <Button type="submit" className="calculate-button">
            Calculate material <ArrowRight size={18} />
          </Button>
          <p className="input-footnote">
            No account. Your valid draft stays in this browser.
          </p>
        </form>
      )}
      <section
        className="estimate-panel"
        tabIndex={-1}
        aria-label="Material estimate"
        ref={resultsRef}
      >
        <div className="estimate-panel-top">
          <span className="eyebrow">
            {readOnly ? "SHARED PROJECT" : "03 / YOUR ESTIMATE"}
          </span>
          <span
            className={`result-status${snapshot && !stale ? " status-ready" : ""}`}
          >
            {stale
              ? "RECALCULATE"
              : snapshot
                ? "CALCULATED"
                : "READY WHEN YOU ARE"}
          </span>
        </div>
        <RoadDiagram active={active} compact />
        {snapshot ? (
          <>
            {stale && (
              <p className="stale-notice" role="status">
                Measurements changed. Calculate again to update these results.
              </p>
            )}
            <div className={`estimate-values${stale ? " is-stale" : ""}`}>
              <p className="result-label">PLANNED MATERIAL TOTAL</p>
              <div className="result-number">
                {formatNumber(snapshot.result.totalWeight)}
                <span>
                  {snapshot.input.outputUnit === "us-ton"
                    ? "US short tons"
                    : "metric tonnes"}
                </span>
              </div>
              <p className="ton-definition">
                {snapshot.input.outputUnit === "us-ton"
                  ? "1 US short ton = 2,000 lb"
                  : "1 metric tonne = 1,000 kg"}
              </p>
              <dl className="result-breakdown">
                <div>
                  <dt>Net material</dt>
                  <dd>
                    {formatNumber(snapshot.result.netWeight)}{" "}
                    <span>
                      {snapshot.input.outputUnit === "us-ton"
                        ? "tons"
                        : "tonnes"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>
                    Extra allowance ({formatNumber(snapshot.input.allowance)}%)
                  </dt>
                  <dd>
                    + {formatNumber(snapshot.result.allowanceWeight)}{" "}
                    <span>
                      {snapshot.input.outputUnit === "us-ton"
                        ? "tons"
                        : "tonnes"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Total surface area</dt>
                  <dd>
                    {formatNumber(
                      snapshot.input.units === "imperial"
                        ? snapshot.result.areaFt2
                        : snapshot.result.areaM2,
                    )}{" "}
                    <span>
                      {snapshot.input.units === "imperial" ? "ft²" : "m²"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Compacted volume</dt>
                  <dd>
                    {formatNumber(
                      snapshot.input.units === "imperial"
                        ? snapshot.result.volumeYd3
                        : snapshot.result.volumeM3,
                    )}{" "}
                    <span>
                      {snapshot.input.units === "imperial" ? "yd³" : "m³"}
                    </span>
                  </dd>
                </div>
                {snapshot.result.materialCost !== null && (
                  <div className="cost-row">
                    <dt>Estimated material cost</dt>
                    <dd>{money(snapshot.result.materialCost)}</dd>
                  </div>
                )}
              </dl>
              {snapshot.result.areas.length > 1 && (
                <div className="per-area-results">
                  <p className="result-label">
                    AREA BREAKDOWN /{" "}
                    {snapshot.input.outputUnit === "us-ton"
                      ? "US TONS"
                      : "TONNES"}
                  </p>
                  {snapshot.result.areas.map((a) => (
                    <div key={a.id}>
                      <span>{a.name}</span>
                      <strong>{formatNumber(a.totalWeight)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="estimate-actions">
              <Button disabled={stale} variant="outline" onClick={copy}>
                <Copy size={15} />
                Copy
              </Button>
              <Button disabled={stale} variant="outline" onClick={download}>
                <Download size={15} />
                Download
              </Button>
              <Button
                disabled={stale}
                variant="outline"
                onClick={() => window.print()}
              >
                <Printer size={15} />
                Print
              </Button>
              {!readOnly && (
                <Button
                  disabled={stale || busy}
                  variant="outline"
                  onClick={createShare}
                >
                  <Link2 size={15} />
                  {busy ? "Creating…" : "Share"}
                </Button>
              )}
            </div>
            {share && (
              <div className="share-box">
                <label htmlFor="share-url">
                  Public estimate link · expires in 30 days
                </label>
                <input
                  id="share-url"
                  value={share.url}
                  readOnly
                  onFocus={(e) => e.target.select()}
                />
                <a href={share.url}>
                  Open shared estimate <ArrowRight size={13} />
                </a>
                <p>
                  Open this link in this browser to delete it. Keep private
                  details out of area names.
                </p>
              </div>
            )}
            <details className="estimate-details">
              <summary>Measurements &amp; assumptions</summary>
              <pre>{summary()}</pre>
            </details>
            <pre className="print-summary">{summary()}</pre>
          </>
        ) : (
          <div className="empty-result">
            <p className="result-label">
              A SOLID PLAN STARTS WITH THE NUMBERS.
            </p>
            <h2>
              Your project.
              <br />
              Measured clearly.
            </h2>
            <p>
              Enter your dimensions, choose a density, and calculate your
              asphalt material in tons.
            </p>
            <div className="empty-example">
              <span>LOADED EXAMPLE</span>
              <strong>100 ft × 20 ft × 3 in</strong>
              <span>145 lb/ft³ · zero extra allowance</span>
            </div>
          </div>
        )}
        <div className="estimate-disclaimer">
          <Check size={15} />
          <p>
            Material quantity only. Confirm density and ordering requirements
            with your supplier. This is an estimate, not pavement design.
          </p>
        </div>
        {notice && (
          <p role="status" className="workbench-notice">
            {notice}
          </p>
        )}
      </section>
    </div>
  );
}
