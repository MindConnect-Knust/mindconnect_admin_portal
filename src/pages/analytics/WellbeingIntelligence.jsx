import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Info, RefreshCw, ShieldCheck, TableProperties } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { analyticsApi, canAnalytics } from "../../services/analyticsApi";

/**
 * Campus Wellbeing Intelligence.
 *
 * Aggregate evidence about service demand and student wellbeing, for KCC and
 * university leadership. Not a list of students, not a crisis map, not a way to
 * find anybody.
 *
 * Every figure has already been through server-side suppression. Where a cohort
 * was too small the value is simply not in the response, and this page renders
 * that as withheld — as a gap in a chart and an explicit line in the table —
 * never as zero. Zero is a real answer; "we will not tell you" is a different
 * one, and conflating them would mislead the reader in exactly the cases that
 * are most sensitive.
 *
 * Visual rules: one hue per chart, no dual axes, no red for ordinary
 * fluctuation, a table view for every chart, and the metric definition and data
 * freshness beside every number.
 */

const SERIES = "#047857"; // emerald-700 — validated for contrast against the chart surface
const GRID = "#e2e8f0";
const INK_MUTED = "#64748b";

const PERIODS = [
  ["7d", "7 days"],
  ["30d", "30 days"],
  ["semester", "Semester"],
  ["year", "Year"],
];

const DOMAIN_LABEL = {
  HELP_SEEKING: "Help-seeking",
  PRESENTING_NEEDS: "Presenting needs",
  ACCESS: "Access",
  SERVICE_DELIVERY: "Service delivery",
  CARE_NAVIGATION: "Care navigation",
  FOLLOW_UP: "Follow-up",
  CRISIS_OPERATIONS: "Crisis operations",
  DIGITAL_SUPPORT: "Digital support",
};

const WITHHELD = "Insufficient data to protect privacy.";

const readable = (value) =>
  String(value || "").toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

/** Formats a value for its unit. Null is withheld or unavailable, never zero. */
function formatValue(value, unit) {
  if (value === null || value === undefined) return "—";
  if (unit === "RATE") return `${Math.round(value * 1000) / 10}%`;
  if (unit === "DURATION_HOURS") return `${Math.round(value * 10) / 10} h`;
  if (unit === "DURATION_MINUTES") return `${Math.round(value)} min`;
  return Number(value).toLocaleString();
}

const shortDay = (value) =>
  new Date(value).toLocaleDateString([], { day: "numeric", month: "short", timeZone: "Africa/Accra" });
const stamp = (value) =>
  value ? new Date(value).toLocaleString([], { timeZone: "Africa/Accra", dateStyle: "medium", timeStyle: "short" }) : "—";

function StatTile({ card }) {
  // Direction is shown in words and a neutral glyph. A rise in help-seeking is
  // not bad news, and a red arrow would say it was.
  const trend = card.trend;
  const trendText = !trend
    ? null
    : trend.direction === "FLAT"
      ? "Steady"
      : `${trend.direction === "UP" ? "↑" : "↓"} ${Math.abs(Math.round(trend.change * 100))}% vs earlier in period`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
      {card.suppressed ? (
        <p className="mt-2 text-sm text-slate-600">{WITHHELD}</p>
      ) : (
        <p className="mt-2 text-2xl font-semibold text-slate-900">{formatValue(card.value, card.unit)}</p>
      )}
      {trendText && !card.suppressed && <p className="mt-1 text-xs text-slate-600">{trendText}</p>}
      <p className="mt-2 text-[11px] text-slate-400">Data through {stamp(card.provenance?.dataThrough)}</p>
    </div>
  );
}

function ChartTooltip({ active, payload, unit }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-slate-800">{point.label}</p>
      <p className="text-slate-600">{point.suppressed ? WITHHELD : formatValue(point.value, unit)}</p>
    </div>
  );
}

export default function WellbeingIntelligence() {
  const { admin } = useAuth();
  const { notify } = useToast();

  const [period, setPeriod] = useState("30d");
  const [dictionary, setDictionary] = useState(null);
  const [cards, setCards] = useState([]);
  const [domain, setDomain] = useState(null);
  const [metricKey, setMetricKey] = useState(null);
  const [dimension, setDimension] = useState("");
  const [metric, setMetric] = useState(null);
  const [quality, setQuality] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metricLoading, setMetricLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const mayExport = canAnalytics(admin, "ANALYTICS_EXPORT");
  const mayViewQuality = canAnalytics(admin, "ANALYTICS_DATA_QUALITY");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [dict, overview, dataQuality] = await Promise.all([
        analyticsApi.metrics(),
        analyticsApi.overview(period),
        mayViewQuality ? analyticsApi.dataQuality().catch(() => null) : Promise.resolve(null),
      ]);
      setDictionary(dict);
      setCards(overview.cards || []);
      setQuality(dataQuality);
      setDomain((current) => current || dict.metrics[0]?.domain || null);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [mayViewQuality, notify, period]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const domains = useMemo(() => {
    const seen = new Set();
    return (dictionary?.metrics || [])
      .map((entry) => entry.domain)
      .filter((value) => (seen.has(value) ? false : seen.add(value)));
  }, [dictionary]);

  const domainMetrics = useMemo(
    () => (dictionary?.metrics || []).filter((entry) => entry.domain === domain),
    [dictionary, domain]
  );

  useEffect(() => {
    if (domainMetrics.length && !domainMetrics.some((entry) => entry.key === metricKey)) {
      setMetricKey(domainMetrics[0].key);
      setDimension(domainMetrics[0].breakdownOnly ? domainMetrics[0].dimensions[0] || "" : "");
    }
  }, [domainMetrics, metricKey]);

  const definition = useMemo(
    () => (dictionary?.metrics || []).find((entry) => entry.key === metricKey) || null,
    [dictionary, metricKey]
  );

  useEffect(() => {
    if (!metricKey) return;
    let cancelled = false;
    setMetricLoading(true);
    analyticsApi
      .metric(metricKey, { period, dimensions: dimension || undefined })
      .then((data) => {
        if (!cancelled) setMetric(data);
      })
      .catch((error) => {
        if (!cancelled) {
          setMetric(null);
          notify(error.message, "error");
        }
      })
      .finally(() => {
        if (!cancelled) setMetricLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dimension, metricKey, notify, period]);

  const seriesData = useMemo(
    () =>
      (metric?.series?.points || []).map((point) => ({
        label: shortDay(point.bucket),
        // Null, not zero, so a withheld day is a gap rather than a false dip.
        value: point.suppressed ? null : point.value,
        suppressed: point.suppressed,
      })),
    [metric]
  );

  const breakdownData = useMemo(
    () =>
      (metric?.breakdown?.entries || [])
        .map((entry) => ({
          label: readable(entry.key),
          value: entry.suppressed ? null : entry.value,
          suppressed: entry.suppressed,
        }))
        .sort((a, b) => (b.value ?? -1) - (a.value ?? -1)),
    [metric]
  );

  const exportCsv = async () => {
    setExporting(true);
    try {
      const keys = (dictionary?.metrics || []).map((entry) => entry.key);
      const { blob, filename } = await analyticsApi.exportCsv(keys, period);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notify("Export downloaded. Withheld cells are blank, as on screen.", "success");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setExporting(false);
    }
  };

  const unit = definition?.unit;
  const isRateLike = unit === "RATE" || unit === "DURATION_HOURS" || unit === "DURATION_MINUTES";
  const withheldCount = seriesData.filter((point) => point.suppressed).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Wellbeing intelligence</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Aggregate service and wellbeing trends. No individual student can be viewed here, and any group smaller than{" "}
            {dictionary?.minCohortSize ?? 10} people is withheld.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 bg-white p-0.5" role="group" aria-label="Time period">
            {PERIODS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={period === value}
                onClick={() => setPeriod(value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  period === value ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" onClick={loadOverview} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <RefreshCw size={14} aria-hidden="true" /> Refresh
          </button>
          {mayExport && (
            <button type="button" disabled={exporting} onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <Download size={14} aria-hidden="true" /> {exporting ? "Exporting…" : "Export CSV"}
            </button>
          )}
        </div>
      </div>

      {quality?.stale && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">
          These figures may be out of date — the last refresh was {quality.ageHours === null ? "never" : `${quality.ageHours} hours ago`}.
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
          ))}
        </div>
      ) : cards.length ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {cards.map((card) => (
            <StatTile key={card.metricKey} card={card} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No headline figures are available for your access level.</p>
      )}

      <section aria-labelledby="explore-heading" className="space-y-3">
        <h2 id="explore-heading" className="text-sm font-semibold text-slate-900">Explore a metric</h2>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Metric areas">
          {domains.map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={domain === value}
              onClick={() => setDomain(value)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                domain === value ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {DOMAIN_LABEL[value] || readable(value)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-medium text-slate-600">
            Metric
            <select
              value={metricKey || ""}
              onChange={(event) => {
                const next = (dictionary?.metrics || []).find((entry) => entry.key === event.target.value);
                setMetricKey(event.target.value);
                // A share across categories only makes sense as its breakdown.
                setDimension(next?.breakdownOnly ? next.dimensions[0] || "" : "");
              }}
              className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            >
              {domainMetrics.map((entry) => (
                <option key={entry.key} value={entry.key}>{entry.label}</option>
              ))}
            </select>
          </label>
          {definition?.dimensions?.length > 0 && (
            <label className="text-xs font-medium text-slate-600">
              Break down by
              <select
                value={dimension}
                onChange={(event) => setDimension(event.target.value)}
                className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              >
                {!definition.breakdownOnly && <option value="">No breakdown</option>}
                {definition.dimensions.map((value) => (
                  <option key={value} value={value}>{readable(value)}</option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            aria-pressed={showTable}
            onClick={() => setShowTable((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <TableProperties size={14} aria-hidden="true" /> {showTable ? "Show chart" : "Show table"}
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{definition?.label || "—"}</h3>
                {metric?.series?.total !== null && metric?.series?.total !== undefined && unit === "COUNT" && (
                  <p className="text-xs text-slate-600">Period total {formatValue(metric.series.total, unit)}</p>
                )}
              </div>

              {metricLoading ? (
                <div className="h-56 animate-pulse rounded-xl bg-slate-50" aria-busy="true" />
              ) : definition?.breakdownOnly ? (
                <p className="py-6 text-center text-sm text-slate-500">This metric is a share across categories and is shown as a breakdown below.</p>
              ) : !seriesData.length ? (
                <p className="py-10 text-center text-sm text-slate-500">No data for this period yet.</p>
              ) : showTable ? (
                <div className="max-h-72 overflow-auto">
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">{definition?.label} by day</caption>
                    <thead className="sticky top-0 border-b border-slate-200 bg-white text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th scope="col" className="py-2 pr-3">Day</th>
                        <th scope="col" className="py-2">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seriesData.map((point) => (
                        <tr key={point.label} className="border-b border-slate-100 last:border-0">
                          <td className="py-1.5 pr-3 text-slate-700">{point.label}</td>
                          <td className="py-1.5 text-slate-800">{point.suppressed ? <span className="text-slate-500">Withheld</span> : formatValue(point.value, unit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-56" role="img" aria-label={`${definition?.label} over the selected period. ${withheldCount} days withheld for privacy. Use Show table for exact values.`}>
                  <ResponsiveContainer width="100%" height="100%">
                    {isRateLike ? (
                      <LineChart data={seriesData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid stroke={GRID} vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: INK_MUTED }} tickLine={false} axisLine={false} minTickGap={24} />
                        <YAxis tick={{ fontSize: 11, fill: INK_MUTED }} tickLine={false} axisLine={false} width={44} tickFormatter={(value) => formatValue(value, unit)} />
                        <Tooltip content={<ChartTooltip unit={unit} />} />
                        {/* connectNulls off: a withheld day is a visible gap, not an interpolated guess. */}
                        <Line type="monotone" dataKey="value" stroke={SERIES} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false} />
                      </LineChart>
                    ) : (
                      <BarChart data={seriesData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid stroke={GRID} vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: INK_MUTED }} tickLine={false} axisLine={false} minTickGap={24} />
                        <YAxis tick={{ fontSize: 11, fill: INK_MUTED }} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: "#f1f5f9" }} />
                        <Bar dataKey="value" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
              {withheldCount > 0 && !metricLoading && (
                <p className="mt-2 text-xs text-slate-500">
                  {withheldCount} of {seriesData.length} days are withheld because too few people were involved. Gaps are not zeros.
                </p>
              )}
            </div>

            {dimension && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-900">By {readable(dimension).toLowerCase()}</h3>
                {!breakdownData.length ? (
                  <p className="text-sm text-slate-500">No breakdown is available for this period.</p>
                ) : (
                  <ul className="space-y-2">
                    {breakdownData.map((entry) => {
                      const max = Math.max(...breakdownData.map((row) => row.value || 0), 1);
                      return (
                        <li key={entry.label} className="grid grid-cols-[140px_1fr_80px] items-center gap-3 text-sm">
                          <span className="truncate text-slate-700" title={entry.label}>{entry.label}</span>
                          {entry.suppressed ? (
                            <span className="text-xs text-slate-500">Withheld to protect privacy</span>
                          ) : (
                            <span className="h-3 rounded-r bg-emerald-700" style={{ width: `${Math.max(((entry.value || 0) / max) * 100, 2)}%` }} aria-hidden="true" />
                          )}
                          <span className="text-right text-slate-800">{entry.suppressed ? "—" : formatValue(entry.value, "COUNT")}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {metric?.breakdown?.totalSuppressed && (
                  <p className="mt-2 text-xs text-slate-500">The total is also withheld, so hidden groups cannot be worked out by subtraction.</p>
                )}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2 text-slate-900">
                <Info size={15} aria-hidden="true" />
                <h3 className="text-sm font-semibold">How this is measured</h3>
              </div>
              {definition ? (
                <dl className="space-y-2 text-xs">
                  <div><dt className="font-medium text-slate-500">What it is</dt><dd className="text-slate-800">{definition.description}</dd></div>
                  <div><dt className="font-medium text-slate-500">Counted</dt><dd className="text-slate-800">{definition.numerator}</dd></div>
                  {definition.denominator && <div><dt className="font-medium text-slate-500">Out of</dt><dd className="text-slate-800">{definition.denominator}</dd></div>}
                  <div><dt className="font-medium text-slate-500">Excludes</dt><dd className="text-slate-800">{definition.exclusions}</dd></div>
                  <div><dt className="font-medium text-slate-500">Dated by</dt><dd className="text-slate-800">{definition.dateBasis}</dd></div>
                  <div><dt className="font-medium text-slate-500">Owner</dt><dd className="text-slate-800">{definition.owner}</dd></div>
                </dl>
              ) : (
                <p className="text-xs text-slate-500">Choose a metric.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs">
              <div className="mb-2 flex items-center gap-2 text-slate-900">
                <ShieldCheck size={15} aria-hidden="true" />
                <h3 className="text-sm font-semibold">Data provenance</h3>
              </div>
              <dl className="space-y-1.5">
                <div className="flex justify-between gap-2"><dt className="text-slate-500">Last updated</dt><dd className="text-right text-slate-800">{stamp(metric?.provenance?.lastUpdated)}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-500">Data through</dt><dd className="text-right text-slate-800">{stamp(metric?.provenance?.dataThrough)}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-500">Definition</dt><dd className="text-right font-mono text-slate-800">{metric?.provenance?.definitionVersion || dictionary?.definitionVersion}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-500">Smallest group shown</dt><dd className="text-right text-slate-800">{metric?.provenance?.minCohortSize ?? dictionary?.minCohortSize} people</dd></div>
              </dl>
              {metric?.provenance?.definitionChangedInPeriod && (
                <p className="mt-2 rounded-lg bg-amber-50 p-2 text-amber-900">
                  The definition of this metric changed during the period, so earlier and later values may not be comparable.
                </p>
              )}
              <p className="mt-2 text-slate-500">Engagement figures describe use of the service. They are not evidence that anyone's wellbeing improved.</p>
            </div>

            {quality && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs">
                <h3 className="mb-2 text-sm font-semibold text-slate-900">Data quality</h3>
                <dl className="space-y-1.5">
                  <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd className="text-slate-800">{quality.stale ? "Stale" : "Current"}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Snapshots</dt><dd className="text-slate-800">{quality.totalSnapshots.toLocaleString()}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Withheld share</dt><dd className="text-slate-800">{Math.round(quality.suppressedShare * 100)}%</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Definition versions</dt><dd className="text-slate-800">{quality.definitionVersions.join(", ") || "—"}</dd></div>
                </dl>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
