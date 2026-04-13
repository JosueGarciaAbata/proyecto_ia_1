import { AnimatePresence, motion } from "framer-motion";
import ReactECharts from "echarts-for-react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  LoaderCircle,
  ShieldAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  buildClinicalNarrative,
  buildResultSummary,
  buildRuleNarrative,
  formatPercentage,
  formatScore,
  formatValue,
  getFieldLabel,
  getRiskUi,
  type ExplicacionResponse,
  type ReglaActivada,
} from "../../lib/riesgoMaterno";
import { cn } from "../../lib/utils";
import { GlassPanel } from "../ui/GlassPanel";
import { SectionHeader } from "../ui/SectionHeader";

interface RecommendationSectionProps {
  result: ExplicacionResponse | null;
  isLoading: boolean;
  error: string | null;
  compact?: boolean;
}

const iconMap = {
  low: CheckCircle2,
  mid: AlertTriangle,
  high: ShieldAlert,
};

const toneClassMap = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  mid: "border-amber-200 bg-amber-50 text-amber-700",
  high: "border-rose-200 bg-rose-50 text-rose-700",
};

export function RecommendationSection({
  compact = false,
  result,
  isLoading,
  error,
}: RecommendationSectionProps) {
  return (
    <section className={cn("section-anchor", compact ? "" : "pt-10")} id="recommendation">
      {!compact ? (
        <SectionHeader
          eyebrow="Salida del sistema"
          title="Resultado del analisis"
          description="Puntaje, clasificacion y razonamiento del caso analizado."
        />
      ) : null}

      <GlassPanel className="overflow-hidden">
        <div className="border-b border-sky-100/80 px-5 py-5 sm:px-6 sm:py-6">
          <div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700/80">
                Resultado de inferencia
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Panel de lectura clinica
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                El resultado principal permanece visible y los detalles extensos quedan bajo demanda.
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <LoadingContent />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <ErrorContent error={error} />
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <ResultContent result={result} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <EmptyContent />
            </motion.div>
          )}
        </AnimatePresence>
      </GlassPanel>
    </section>
  );
}

function EmptyContent() {
  return (
    <div className="p-5 sm:p-6">
      <div className="rounded-[1.8rem] border border-dashed border-sky-200 bg-gradient-to-br from-sky-50/70 to-white px-5 py-6 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-cyan-300/30 bg-cyan-50 p-3 text-cyan-700">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Aun no hay una inferencia ejecutada
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Complete las variables del formulario y pulse <span className="font-semibold text-slate-900">Ejecutar inferencia</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingContent() {
  return (
    <div className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-cyan-700">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Analizando el caso actual
      </div>

      <div className="space-y-4 animate-pulse">
        <div className="grid gap-4 lg:grid-cols-[160px_minmax(0,1fr)]">
          <div className="rounded-[1.8rem] border border-sky-100 bg-sky-50/70 p-4">
            <div className="h-36 rounded-[1.2rem] bg-white/80" />
          </div>
          <div className="rounded-[1.8rem] border border-sky-100 bg-white/82 p-5">
            <div className="h-5 w-32 rounded-full bg-slate-200" />
            <div className="mt-4 h-10 w-44 rounded-xl bg-slate-200" />
            <div className="mt-4 h-4 w-full rounded-full bg-slate-100" />
            <div className="mt-2 h-4 w-3/4 rounded-full bg-slate-100" />
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <div className="h-16 rounded-2xl bg-slate-100" />
              <div className="h-16 rounded-2xl bg-slate-100" />
              <div className="h-16 rounded-2xl bg-slate-100" />
            </div>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-sky-100 bg-white/82 p-5">
          <div className="h-4 w-28 rounded-full bg-slate-200" />
          <div className="mt-4 grid gap-2">
            <div className="h-12 rounded-2xl bg-slate-100" />
            <div className="h-12 rounded-2xl bg-slate-100" />
            <div className="h-12 rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorContent({ error }: { error: string }) {
  return (
    <div className="p-5 sm:p-6">
      <div className="rounded-[1.8rem] border border-rose-200 bg-rose-50 p-5 text-rose-700">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="text-base font-semibold text-rose-900">
              No se pudo completar la inferencia
            </div>
            <p className="mt-2 text-sm leading-6 text-rose-700">{error}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultContent({ result }: { result: ExplicacionResponse }) {
  const risk = getRiskUi(result.riesgo);
  const Icon = iconMap[risk.tone];
  const summary = buildResultSummary(result);
  const narrative = buildClinicalNarrative(result);
  const sortedRules = [...result.reglas_activadas].sort((a, b) => b.fuerza - a.fuerza);
  const factors = buildKeyFactors(result);

  const gaugeOption = {
    backgroundColor: "transparent",
    animation: false,
    animationDuration: 0,
    animationDurationUpdate: 0,
    series: [
      {
        type: "gauge",
        min: 0,
        max: 100,
        progress: {
          show: true,
          roundCap: true,
          width: 14,
          itemStyle: { color: risk.accent },
        },
        axisLine: {
          lineStyle: {
            width: 14,
            color: [[1, "rgba(148, 163, 184, 0.18)"]],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        detail: {
          valueAnimation: false,
          offsetCenter: [0, "4%"],
          formatter: "{value}",
          color: "#0f172a",
          fontSize: 28,
          fontWeight: 700,
        },
        title: {
          offsetCenter: [0, "52%"],
          color: "rgba(71, 85, 105, 0.82)",
          fontSize: 11,
        },
        data: [{ value: Number(result.puntaje.toFixed(1)), name: "Puntaje" }],
      },
    ],
  };

  return (
    <div className="space-y-4 p-5 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[170px_minmax(0,1fr)]">
        <div className="rounded-[1.8rem] border border-sky-100 bg-slate-50/85 p-4">
          <div className="h-40">
            <ReactECharts
              lazyUpdate={false}
              notMerge={true}
              option={gaugeOption}
              style={{ height: "100%", width: "100%" }}
            />
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-sky-100 bg-white/84 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700/80">
                Resultado principal
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className="rounded-2xl p-3"
                  style={{ backgroundColor: `${risk.accent}20`, color: risk.accent }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div
                    className={cn(
                      "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                      toneClassMap[risk.tone],
                    )}
                  >
                    {risk.label}
                  </div>
                  <div className="mt-3 text-4xl font-semibold leading-none text-slate-950">
                    {formatScore(result.puntaje)}
                    <span className="ml-1 text-lg font-medium text-slate-400">/100</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Analisis completado
            </div>
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-sky-100 bg-gradient-to-br from-white to-cyan-50 p-4">
            <p className="text-base font-semibold leading-6 text-slate-900">{summary.headline}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{summary.description}</p>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <MetricPill label="Estado" value="Completo" />
            <MetricPill label="Reglas" value={String(result.reglas_activadas.length)} />
            <MetricPill
              label="Ajustes"
              value={
                result.ajustes_entrada.length === 0
                  ? "Sin cambios"
                  : String(result.ajustes_entrada.length)
              }
            />
          </div>
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-sky-100 bg-white/84 p-5">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700/80">
          Factores clave
        </div>
        <div className="mt-3 grid gap-2">
          {factors.length > 0 ? (
            factors.map((factor) => (
              <div
                key={factor.label}
                className="flex items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">{factor.label}</div>
                  <div className="mt-0.5 text-xs leading-5 text-slate-500">{factor.detail}</div>
                </div>
                <span className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {formatPercentage(factor.membership)}
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-sm text-slate-600">
              No se detectaron factores dominantes fuera de los rangos esperados.
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <CollapsibleCard
          summary="Explicacion clinica"
          caption="Resumen del razonamiento del sistema"
        >
          <div className="space-y-2 text-sm leading-6 text-slate-600">
            <p className="font-semibold text-slate-900">{narrative.intro}</p>
            <p>{narrative.details}</p>
            <p>{narrative.conclusion}</p>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          summary={`Reglas activadas (${sortedRules.length})`}
          caption="Ordenadas de mayor a menor impacto"
        >
          <div className="space-y-3">
            {sortedRules.map((rule) => (
              <RuleCard key={rule.numero} rule={rule} />
            ))}
          </div>
        </CollapsibleCard>

        {result.ajustes_entrada.length > 0 ? (
          <CollapsibleCard
            summary={`Ajustes automaticos (${result.ajustes_entrada.length})`}
            caption="Normalizaciones aplicadas a la entrada"
          >
            <div className="space-y-2">
              {result.ajustes_entrada.map((adjustment) => (
                <div
                  key={adjustment.variable}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm"
                >
                  <span className="font-medium text-slate-700">
                    {getFieldLabel(adjustment.variable)}
                  </span>
                  <span className="text-slate-500">
                    {formatValue(adjustment.variable, adjustment.valor_original)} {"->"}{" "}
                    <span className="font-semibold text-cyan-700">
                      {formatValue(adjustment.variable, adjustment.valor_ajustado)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleCard>
        ) : null}
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-slate-50/75 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function CollapsibleCard({
  summary,
  caption,
  children,
}: {
  summary: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-[1.6rem] border border-sky-100 bg-white/84 px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{summary}</div>
          <div className="mt-1 text-xs text-slate-500">{caption}</div>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
      </summary>
      <div className="mt-4 border-t border-sky-100 pt-4">{children}</div>
    </details>
  );
}

function RuleCard({ rule }: { rule: ReglaActivada }) {
  const ruleRisk = getRiskUi(rule.consecuente);
  const ruleNarrative = buildRuleNarrative(rule);

  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50/55 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-cyan-300/30 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
            Regla {rule.numero}
          </span>
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
              toneClassMap[ruleRisk.tone],
            )}
          >
            {ruleRisk.label}
          </span>
        </div>
        <span className="rounded-full border border-sky-100 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
          Peso {formatPercentage(rule.fuerza)}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{ruleNarrative}</p>
      <div className="mt-3 overflow-hidden rounded-full bg-white">
        <div
          className="h-1.5 rounded-full"
          style={{
            backgroundColor: ruleRisk.accent,
            width: `${Math.max(6, Math.round(rule.fuerza * 100))}%`,
          }}
        />
      </div>
    </div>
  );
}

function buildKeyFactors(result: ExplicacionResponse) {
  return Object.entries(result.pertenencias)
    .map(([variable, categories]) => {
      const top = Object.entries(categories).sort(([, a], [, b]) => b - a)[0];
      if (!top) return null;

      const [category, membership] = top;
      if (membership < 0.35 || category === "normal") return null;

      return {
        label: `${getFieldLabel(variable)}: ${humanizeCategory(category)}`,
        detail: "Mayor pertenencia difusa detectada para esta variable.",
        membership,
      };
    })
    .filter((item): item is { label: string; detail: string; membership: number } => Boolean(item))
    .sort((a, b) => b.membership - a.membership)
    .slice(0, 4);
}

function humanizeCategory(value: string) {
  return value.replaceAll("_", " ");
}
