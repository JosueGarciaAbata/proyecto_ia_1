import ReactECharts from "echarts-for-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BookOpen, LoaderCircle } from "lucide-react";
import {
  buildClinicalNarrative,
  buildRuleNarrative,
  formatPercentage,
  getFieldLabel,
  getRiskUi,
  obtenerDefinicionesDifusas,
  type ExplicacionResponse,
  type FuzzyDefinicionesResponse,
} from "../../lib/riesgoMaterno";
import { generateMembershipSeries } from "../../lib/membership";
import { ChartPanel } from "../ui/ChartPanel";
import { GlassPanel } from "../ui/GlassPanel";
import { SectionHeader } from "../ui/SectionHeader";

interface DifusoSectionProps {
  explanationResult: ExplicacionResponse | null;
}

const CATEGORY_COLORS = ["#22d3ee", "#60a5fa", "#c084fc", "#f472b6", "#fb923c"];

const toneClassMap = {
  low: "text-emerald-700 border-emerald-200 bg-emerald-50",
  mid: "text-amber-700 border-amber-200 bg-amber-50",
  high: "text-rose-700 border-rose-200 bg-rose-50",
};

const activationOrder = [
  { key: "alto", label: "Riesgo alto" },
  { key: "medio", label: "Riesgo medio" },
  { key: "bajo", label: "Riesgo bajo" },
] as const;

export function DifusoSection({ explanationResult }: DifusoSectionProps) {
  const [definitions, setDefinitions] = useState<FuzzyDefinicionesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const variableNames = definitions ? Object.keys(definitions.variables) : [];
  const [selectedVariable, setSelectedVariable] = useState<string>("");

  useEffect(() => {
    obtenerDefinicionesDifusas()
      .then((data) => {
        setDefinitions(data);
        const first = Object.keys(data.variables)[0];
        if (first) setSelectedVariable(first);
      })
      .catch((e: Error) => setFetchError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section-anchor pt-10" id="difuso">
      <SectionHeader
        eyebrow="Sistema difuso"
        title="Funciones de pertenencia y reglas"
        description="Curvas trapezoidales (base vs optimizado), fuzzificacion del caso actual y reglas activadas."
      />

      {loading ? (
        <GlassPanel className="flex min-h-48 items-center justify-center gap-3 p-8 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin text-cyan-600" />
          <span className="text-sm">Cargando definiciones del sistema difuso...</span>
        </GlassPanel>
      ) : fetchError ? (
        <GlassPanel className="p-6 text-sm text-rose-700">
          Error al cargar definiciones: {fetchError}
        </GlassPanel>
      ) : definitions ? (
        <>
          <MembershipCurvesPanel
            definitions={definitions}
            variableNames={variableNames}
            selectedVariable={selectedVariable}
            onSelectVariable={setSelectedVariable}
            explanationResult={explanationResult}
          />

          {explanationResult ? (
            <>
              <FuzzificationPanel result={explanationResult} />
              <AggregacionPanel result={explanationResult} />
              <RulesPanel result={explanationResult} />
            </>
          ) : (
            <GlassPanel className="mt-6 p-6 text-sm text-slate-500">
              Ejecute una prediccion en la pantalla de Prediccion para ver la fuzzificacion,
              reglas activadas y agregacion del caso actual.
            </GlassPanel>
          )}
        </>
      ) : null}
    </section>
  );
}

// ── Curvas de pertenencia ─────────────────────────────────────────────────────

function MembershipCurvesPanel({
  definitions,
  variableNames,
  selectedVariable,
  onSelectVariable,
  explanationResult,
}: {
  definitions: FuzzyDefinicionesResponse;
  variableNames: string[];
  selectedVariable: string;
  onSelectVariable: (v: string) => void;
  explanationResult: ExplicacionResponse | null;
}) {
  const varDef = definitions.variables[selectedVariable];
  if (!varDef) return null;

  const [domainMin, domainMax] = varDef.limites;
  const domain: [number, number] = [domainMin, domainMax];
  const categoryNames = Object.keys(varDef.categorias);
  const currentPoint = explanationResult?.entrada_validada?.[selectedVariable] ?? null;

  const series = categoryNames.flatMap((cat, idx) => {
    const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
    const { puntos_base, puntos_optimizados } = varDef.categorias[cat];

    const basePoints = puntos_base as [number, number, number, number];
    const optPoints = puntos_optimizados as [number, number, number, number];

    const baseSeries = generateMembershipSeries(domain, basePoints);
    const optSeries = generateMembershipSeries(domain, optPoints);

    const mu = explanationResult?.pertenencias?.[selectedVariable]?.[cat] ?? null;

    return [
      {
        name: `${cat} (base)`,
        type: "line",
        smooth: false,
        symbol: "none",
        lineStyle: { width: 1.5, type: "dashed", color, opacity: 0.5 },
        data: baseSeries.map((p) => [p.x, p.membership]),
      },
      {
        name: `${cat} (opt)  μ=${mu !== null ? mu.toFixed(2) : "—"}`,
        type: "line",
        smooth: false,
        symbol: "none",
        lineStyle: { width: 2.5, color },
        areaStyle: { opacity: 0.06, color },
        data: optSeries.map((p) => [p.x, p.membership]),
      },
    ];
  });

  // Vertical marker for current patient value
  const markerSeries =
    currentPoint !== null
      ? [
          {
            name: `Valor actual (${currentPoint})`,
            type: "line",
            symbol: "none",
            lineStyle: { width: 2, color: "#f59e0b", type: "dotted" },
            markLine: {
              symbol: "none",
              lineStyle: { color: "#f59e0b", type: "solid", width: 2 },
              label: { formatter: `x=${currentPoint}`, color: "#f59e0b", fontSize: 11 },
              data: [{ xAxis: currentPoint }],
            },
            data: [],
          },
        ]
      : [];

  const chartOption = {
    backgroundColor: "transparent",
    animation: false,
    animationDuration: 0,
    animationDurationUpdate: 0,
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255,255,255,0.96)",
      borderColor: "rgba(125,211,252,0.65)",
      textStyle: { color: "#0f172a" },
    },
    legend: { show: false },
    grid: { left: 12, right: 12, top: 16, bottom: 12, containLabel: true },
    xAxis: {
      type: "value",
      min: domainMin,
      max: domainMax,
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.35)" } },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.16)" } },
      axisLabel: { color: "rgba(30,41,59,0.82)" },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 1,
      name: "μ",
      nameTextStyle: { color: "rgba(71,85,105,0.8)" },
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.35)" } },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.16)" } },
      axisLabel: { color: "rgba(30,41,59,0.82)" },
    },
    series: [...series, ...markerSeries],
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.3fr_0.7fr]">
      <GlassPanel className="p-5 sm:p-6">
        <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80">Variables</div>
        <div className="mt-4 flex flex-col gap-2">
          {variableNames.map((v) => (
            <button
              key={v}
              className={`rounded-2xl border px-4 py-2.5 text-left text-sm font-medium transition ${
                selectedVariable === v
                  ? "border-cyan-400/50 bg-cyan-50 text-cyan-900"
                  : "border-sky-100 bg-white text-slate-700 hover:border-cyan-300/40 hover:bg-cyan-50"
              }`}
              onClick={() => onSelectVariable(v)}
              type="button"
            >
              {getFieldLabel(v)}
            </button>
          ))}
        </div>

        {varDef && (
          <div className="mt-5 space-y-2">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Categorias (opt)</div>
            {categoryNames.map((cat, idx) => {
              const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
              const pts = varDef.categorias[cat].puntos_optimizados;
              const mu = explanationResult?.pertenencias?.[selectedVariable]?.[cat];
              return (
                <div
                  key={cat}
                  className="rounded-2xl border border-sky-100 bg-white/82 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-semibold text-slate-800">{cat}</span>
                    {mu !== undefined && mu > 0 && (
                      <span className="ml-auto rounded-full bg-cyan-50 px-2 py-0.5 text-cyan-700 font-mono">
                        μ={mu.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-slate-400">
                    [{pts.map((n) => n.toFixed(1)).join(", ")}]
                  </div>
                </div>
              );
            })}
            {currentPoint !== null && (
              <div className="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-mono text-cyan-800">
                Valor actual: {currentPoint}
              </div>
            )}
          </div>
        )}
      </GlassPanel>

      <ChartPanel
        title={`${getFieldLabel(selectedVariable)} — curvas de pertenencia`}
        subtitle="Linea discontinua = base / Linea solida = optimizado"
      >
        <div className="h-[420px]">
          <ReactECharts
            key={selectedVariable}
            notMerge={true}
            lazyUpdate={false}
            option={chartOption}
            style={{ height: "100%", width: "100%" }}
          />
        </div>
      </ChartPanel>
    </div>
  );
}

// ── Fuzzificacion ─────────────────────────────────────────────────────────────

function FuzzificationPanel({ result }: { result: ExplicacionResponse }) {
  const variables = Object.entries(result.pertenencias);

  return (
    <GlassPanel className="mt-6 p-6 sm:p-7">
      <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80 mb-4">
        Fuzzificacion — grados de pertenencia del caso actual
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sky-100">
              <th className="py-2 pr-4 text-left font-semibold text-slate-700">Variable</th>
              <th className="py-2 pr-4 text-left font-semibold text-slate-700">Valor</th>
              {variables[0]?.[1] &&
                Object.keys(variables[0][1]).map((cat) => (
                  <th key={cat} className="py-2 px-3 text-center font-semibold text-slate-700">
                    {cat}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {variables.map(([variable, cats]) => {
              const valor = result.entrada_validada[variable];
              return (
                <tr key={variable} className="border-b border-sky-50 hover:bg-sky-50/40">
                  <td className="py-2.5 pr-4 font-medium text-slate-800">
                    {getFieldLabel(variable)}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-slate-500">
                    {valor !== undefined ? valor : "—"}
                  </td>
                  {Object.entries(cats).map(([cat, mu]) => (
                    <td key={cat} className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 font-mono text-xs font-semibold ${
                          mu > 0.5
                            ? "bg-cyan-100 text-cyan-800"
                            : mu > 0.1
                              ? "bg-sky-50 text-sky-700"
                              : "text-slate-400"
                        }`}
                      >
                        {mu.toFixed(3)}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}

// ── Agregacion ────────────────────────────────────────────────────────────────

function AggregacionPanel({ result }: { result: ExplicacionResponse }) {
  const narrative = buildClinicalNarrative(result);

  return (
    <GlassPanel className="mt-6 p-6 sm:p-7">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80 mb-4">
            Agregacion — fuerza por nivel de riesgo
          </div>
          <div className="space-y-4">
            {activationOrder.map(({ key, label }) => {
              const risk = getRiskUi(key);
              const activation = result.activaciones[key] ?? 0;
              return (
                <div key={key}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.16em] ${toneClassMap[risk.tone]}`}
                    >
                      {label}
                    </span>
                    <span className="font-mono font-semibold text-slate-700">
                      {formatPercentage(activation)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-sky-100">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: risk.accent }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(2, activation * 100)}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80">
            Defuzzificacion (centroide)
          </div>
          <div className="flex items-end gap-3">
            <div
              className="text-5xl font-semibold"
              style={{ color: getRiskUi(result.riesgo).accent }}
            >
              {result.puntaje.toFixed(1)}
            </div>
            <div className="mb-1 text-sm text-slate-500">/ 100</div>
          </div>
          <div
            className="inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
            style={{
              borderColor: `${getRiskUi(result.riesgo).accent}55`,
              color: getRiskUi(result.riesgo).accent,
              backgroundColor: `${getRiskUi(result.riesgo).accent}18`,
            }}
          >
            {getRiskUi(result.riesgo).label}
          </div>

          <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
              <p className="leading-6">{narrative.intro} {narrative.details}</p>
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

// ── Reglas activadas ──────────────────────────────────────────────────────────

function RulesPanel({ result }: { result: ExplicacionResponse }) {
  const sortedRules = [...result.reglas_activadas].sort((a, b) => b.fuerza - a.fuerza);

  return (
    <div className="mt-6">
      <div className="mb-4 px-1">
        <div className="text-base font-semibold text-slate-900">
          Rule viewer — reglas activadas ({sortedRules.length})
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Ordenadas por fuerza de activacion, de mayor a menor.
        </p>
      </div>

      <div className="space-y-3">
        {sortedRules.map((rule, index) => {
          const ruleRisk = getRiskUi(rule.consecuente);
          const narrative = buildRuleNarrative(rule);

          return (
            <motion.div
              key={rule.numero}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: index * 0.03 }}
            >
              <GlassPanel className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-300/30 bg-cyan-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
                      R{rule.numero}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.16em] ${toneClassMap[ruleRisk.tone]}`}
                    >
                      → {ruleRisk.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-24 overflow-hidden rounded-full bg-sky-100 h-2">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: ruleRisk.accent,
                          width: `${Math.max(4, Math.round(rule.fuerza * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-sm font-semibold text-slate-700">
                      {formatPercentage(rule.fuerza)}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">{narrative}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {rule.antecedentes.map((ant) => (
                    <span
                      key={`${ant.variable}-${ant.categoria}`}
                      className="rounded-full border border-sky-100 bg-white px-2.5 py-0.5 text-xs text-slate-600"
                    >
                      {getFieldLabel(ant.variable)}{" "}
                      <span className="font-semibold text-cyan-700">{ant.categoria}</span>{" "}
                      <span className="font-mono text-slate-400">μ={ant.pertenencia.toFixed(2)}</span>
                    </span>
                  ))}
                </div>
              </GlassPanel>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
