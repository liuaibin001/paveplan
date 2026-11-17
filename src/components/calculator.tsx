import { useEffect, useId, useRef, useState, type FormEvent } from "react";
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
  ChevronDown,
  Pencil,
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
  variant = "default",
}: {
  initialProject?: ProjectInput;
  readOnly?: boolean;
  variant?: "default" | "hero";
}) {
  const hero = variant === "hero";
  const instanceId = useId();
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
    deleteToken: string;
    stored: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [assumptionsOpen, setAssumptionsOpen] = useState(!hero);
  const resultsRef = useRef<HTMLElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
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
    setShare((previous) => (previous && !previous.stored ? previous : null));
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
      setNotice(
        `Estimate updated: ${formatNumber(result.totalWeight)} ${weightUnit}.`,
      );
      requestAnimationFrame(() => {
        if (window.matchMedia("(max-width: 760px)").matches) {
          resultsRef.current?.focus({ preventScroll: true });
          resultsRef.current?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "instant"
              : "smooth",
            block: "start",
          });
        }
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Check your measurements.";
      setError(message);
      if (/density|allowance|price/i.test(message)) setAssumptionsOpen(true);
      setSnapshot(null);
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }
  function changeUnits(value: string) {
    try {
      update(convertProjectUnits(input, value as ProjectInput["units"]));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function changeOutputUnit(value: string) {
    try {
      update(convertOutputUnit(input, value as ProjectInput["outputUnit"]));
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
      try {
        const probeKey = `paveplan:delete:${crypto.randomUUID()}`;
        localStorage.setItem(probeKey, "0".repeat(64));
        localStorage.removeItem(probeKey);
      } catch {
        throw new Error(
          "Enable browser storage before sharing so your deletion key can be saved. Copy or download the estimate instead.",
        );
      }
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot.input),
      });
      const body = (await response.json()) as {
        id?: string;
        deleteToken?: string;
        expiresAt?: string;
        error?: string;
      };
      if (!response.ok || !body.id || !body.deleteToken)
        throw new Error(
          body.error ?? "Could not create a share link. Please try again.",
        );
      let stored = false;
      try {
        localStorage.setItem(`paveplan:delete:${body.id}`, body.deleteToken);
        stored =
          localStorage.getItem(`paveplan:delete:${body.id}`) ===
          body.deleteToken;
      } catch {}
      setShare({
        url: `${window.location.origin}/project/${body.id}`,
        id: body.id,
        expiresAt: body.expiresAt ?? "",
        deleteToken: body.deleteToken,
        stored,
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
  async function deleteCurrentShare() {
    if (!share) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/projects/${share.id}`, {
        method: "DELETE",
        headers: { "X-Delete-Token": share.deleteToken },
      });
      if (!response.ok && response.status !== 404)
        throw new Error(
          "Could not delete this link. Keep this page open and try again.",
        );
      try {
        localStorage.removeItem(`paveplan:delete:${share.id}`);
      } catch {}
      setShare(null);
      setNotice("The public share link has been deleted.");
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
    options?: {
      zero?: boolean;
      focus?: string;
      id?: string;
      displayLabel?: string;
    },
  ) => (
    <label className="field-label">
      {options?.displayLabel ?? label}
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
  const thicknessField = (area: AreaInput) =>
    field(
      "Compacted thickness",
      area.thickness,
      imperial ? "in" : "mm",
      (v) => updateArea(area.id, { thickness: v }),
      { focus: "thickness", displayLabel: hero ? "Thickness" : undefined },
    );

  return (
    <div
      className={`workbench${hero ? " hero-workbench" : ""}${readOnly ? " shared-workbench" : ""}`}
    >
      {!readOnly && (
        <form
          className="calculator-inputs"
          aria-labelledby={`${instanceId}-measurements`}
          onSubmit={calculate}
          noValidate
        >
          <div className="input-toolbar">
            <div>
              <h2 className="panel-title" id={`${instanceId}-measurements`}>
                Project measurements
              </h2>
              <p className="panel-description">
                Enter the finished, compacted dimensions.
              </p>
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
          </div>
          {input.areas.map((area, index) => (
            <fieldset key={area.id} className="area-fieldset">
              <legend className="sr-only">Area {index + 1} measurements</legend>
              <Tabs
                value={area.mode}
                onValueChange={(value) =>
                  updateArea(area.id, { mode: value as AreaInput["mode"] })
                }
              >
                <div className="area-toolbar">
                  <div className="area-title">
                    <span className="area-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <input
                      className="area-name"
                      aria-label={`Area ${index + 1} name`}
                      value={area.name}
                      maxLength={80}
                      title="Edit area name"
                      id={`${instanceId}-${area.id}-name`}
                      onChange={(e) =>
                        updateArea(area.id, { name: e.target.value })
                      }
                    />
                    <Pencil
                      className="area-edit-icon"
                      size={13}
                      aria-hidden="true"
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
                  <TabsList aria-label={`Area ${index + 1} measurement mode`}>
                    <TabsTrigger value="dimensions">Length × width</TabsTrigger>
                    <TabsTrigger value="area">Known area</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="dimensions">
                  <div
                    className={`field-grid${hero ? " measurement-grid" : ""}`}
                  >
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
                    {hero && thicknessField(area)}
                  </div>
                </TabsContent>
                <TabsContent value="area">
                  <div
                    className={hero ? "field-grid known-area-grid" : undefined}
                  >
                    {field(
                      "Total area",
                      area.area,
                      imperial ? "ft²" : "m²",
                      (v) => updateArea(area.id, { area: v }),
                    )}
                    {hero && thicknessField(area)}
                  </div>
                </TabsContent>
              </Tabs>
              {!hero && thicknessField(area)}
            </fieldset>
          ))}
          <div className="area-actions">
            <p className="measurement-help">
              Use the finished thickness after compaction.
            </p>
            <Button
              className="add-area"
              type="button"
              variant="outline"
              disabled={input.areas.length >= 20}
              onClick={() => {
                const area = createArea(input.areas.length + 1);
                if (!imperial) area.thickness = 75;
                update({ ...input, areas: [...input.areas, area] });
                requestAnimationFrame(() =>
                  document
                    .getElementById(`${instanceId}-${area.id}-name`)
                    ?.focus(),
                );
              }}
            >
              <Plus size={16} />
              Add another area{" "}
              <span className="muted">{input.areas.length}/20</span>
            </Button>
          </div>
          <details
            className="assumptions-disclosure"
            open={assumptionsOpen}
            onToggle={(event) => setAssumptionsOpen(event.currentTarget.open)}
          >
            <summary>
              <span className="assumptions-heading">
                <span className="assumptions-label">
                  Density, allowance &amp; price
                </span>
                {hero && (
                  <span className="assumptions-summary">
                    {formatNumber(input.density)}{" "}
                    {imperial ? "lb/ft³" : "kg/m³"}
                    {" · "}
                    {formatNumber(input.allowance)}% extra
                    {input.price !== null &&
                      ` · ${money(input.price)}/${input.outputUnit === "us-ton" ? "US ton" : "tonne"}`}
                  </span>
                )}
              </span>
              <ChevronDown size={15} aria-hidden="true" />
            </summary>
            <div className="assumptions-block">
              <div className="panel-heading">
                <h3 className="group-title">Material assumptions</h3>
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
                Use your supplier's mix density. The default is a planning
                estimate. Allowance is optional and added once.
              </p>
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
          </details>
          {error && (
            <p role="alert" className="form-error" tabIndex={-1} ref={errorRef}>
              {error}
            </p>
          )}
          <div className="calculator-submit-row">
            <Button
              className="reset-button"
              aria-label="Reset"
              variant="ghost"
              size="sm"
              type="button"
              onClick={reset}
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </Button>
            <Button type="submit" className="calculate-button">
              {stale ? "Update estimate" : "Calculate material"}{" "}
              <ArrowRight size={18} />
            </Button>
          </div>
          <p className="input-footnote">
            No account. Your valid draft stays in this browser.
          </p>
        </form>
      )}
      <section
        className="estimate-panel"
        tabIndex={-1}
        aria-labelledby={`${instanceId}-estimate`}
        ref={resultsRef}
      >
        <div className="estimate-panel-top">
          <h2 className="panel-title" id={`${instanceId}-estimate`}>
            {readOnly ? "Shared material estimate" : "Material estimate"}
          </h2>
          <span
            className={`result-status${snapshot && !stale ? " status-ready" : ""}`}
          >
            {stale
              ? "Needs update"
              : snapshot
                ? "Calculated"
                : "Ready to calculate"}
          </span>
        </div>
        {!readOnly && (
          <label className="result-unit-control">
            Result unit
            <select
              aria-label="Result unit"
              value={input.outputUnit}
              onChange={(event) => changeOutputUnit(event.target.value)}
            >
              <option value="us-ton">US short tons</option>
              <option value="metric-tonne">Metric tonnes</option>
            </select>
          </label>
        )}
        {!hero && <RoadDiagram active={active} compact />}
        {snapshot ? (
          <>
            {stale && (
              <p className="stale-notice" role="status">
                Measurements changed. Calculate again to update these results.
              </p>
            )}
            <div className={`estimate-values${stale ? " is-stale" : ""}`}>
              <div className="estimate-total">
                <p className="result-label">Planned material total</p>
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
              </div>
              <EstimateMetrics
                project={snapshot.input}
                result={snapshot.result}
              />
              {snapshot.result.areas.length > 1 && (
                <div className="per-area-results">
                  <h3 className="group-title">
                    By area /{" "}
                    {snapshot.input.outputUnit === "us-ton"
                      ? "US TONS"
                      : "TONNES"}
                  </h3>
                  {snapshot.result.areas.map((a) => (
                    <div key={a.id}>
                      <span>{a.name}</span>
                      <strong>{formatNumber(a.totalWeight)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty-result">
            {hero && <RoadDiagram active={active} compact />}
            <h3>Your next project, measured.</h3>
            <p className="empty-result-hint">
              Enter your dimensions and calculate to see the total asphalt,
              quantity breakdown and optional material cost.
            </p>
            {!hero && (
              <div className="empty-example">
                <span>LOADED EXAMPLE</span>
                <strong>100 ft × 20 ft × 3 in</strong>
                <span>145 lb/ft³ · zero extra allowance</span>
              </div>
            )}
          </div>
        )}
        {snapshot && (
          <div className="estimate-actions">
            <Button
              disabled={!snapshot || stale}
              variant="outline"
              onClick={copy}
            >
              <Copy size={15} /> Copy
            </Button>
            <Button
              disabled={!snapshot || stale}
              variant="outline"
              onClick={download}
            >
              <Download size={15} /> Download
            </Button>
            <Button
              disabled={!snapshot || stale}
              variant="outline"
              onClick={() => window.print()}
            >
              <Printer size={15} /> Print
            </Button>
            {!readOnly && (
              <Button
                disabled={
                  !snapshot || stale || busy || (!!share && !share.stored)
                }
                variant="outline"
                onClick={createShare}
              >
                <Link2 size={15} /> {busy ? "Creating…" : "Share"}
              </Button>
            )}
          </div>
        )}
        {snapshot && (
          <>
            <details className="estimate-details">
              <summary>Measurements &amp; assumptions</summary>
              <pre>{summary()}</pre>
            </details>
            <pre className="print-summary">{summary()}</pre>
          </>
        )}
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
            {share.stored && (
              <a href={share.url}>
                Open shared estimate <ArrowRight size={13} />
              </a>
            )}
            <p>
              {share.stored
                ? "Open this link in this browser to delete it. Keep private details out of area names."
                : "Your deletion key could not be saved. Keep this page open and use Delete link before leaving. This link remains public until deleted or expired."}
            </p>
            <Button
              className="share-delete-button"
              variant="outline"
              onClick={deleteCurrentShare}
              disabled={busy}
            >
              Delete link
            </Button>
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
          <p
            role="status"
            className={`workbench-notice${/^(Estimate updated:|Your last valid draft)/.test(notice) ? " notice-quiet" : ""}`}
          >
            {notice}
          </p>
        )}
      </section>
    </div>
  );
}

function EstimateMetrics({
  project,
  result,
}: {
  project: ProjectInput;
  result?: ProjectResult;
}) {
  const imperial = project.units === "imperial";
  const tonUnit = project.outputUnit === "us-ton" ? "tons" : "tonnes";
  const amount = (value: number | undefined) =>
    value === undefined ? "--" : formatNumber(value);
  return (
    <>
      <h3 className="breakdown-heading">Estimate breakdown</h3>
      <dl className="result-breakdown">
        <div>
          <dt>Net material</dt>
          <dd>
            {amount(result?.netWeight)} <span>{tonUnit}</span>
          </dd>
        </div>
        <div>
          <dt>Extra allowance ({formatNumber(project.allowance)}%)</dt>
          <dd>
            {result ? "+ " : ""}
            {amount(result?.allowanceWeight)} <span>{tonUnit}</span>
          </dd>
        </div>
        <div>
          <dt>Total surface area</dt>
          <dd>
            {amount(imperial ? result?.areaFt2 : result?.areaM2)}{" "}
            <span>{imperial ? "ft²" : "m²"}</span>
          </dd>
        </div>
        <div>
          <dt>Compacted volume</dt>
          <dd>
            {amount(imperial ? result?.volumeYd3 : result?.volumeM3)}{" "}
            <span>{imperial ? "yd³" : "m³"}</span>
          </dd>
        </div>
        {project.price !== null && (
          <div className="cost-row">
            <dt>Estimated material cost</dt>
            <dd>
              {result?.materialCost != null ? money(result.materialCost) : "--"}
            </dd>
          </div>
        )}
      </dl>
    </>
  );
}
