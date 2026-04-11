import { motion } from "framer-motion";
import ReactECharts from "echarts-for-react";
import { AlertTriangle, BookOpen, CheckCircle2, LoaderCircle, ShieldAlert } from "lucide-react";
import {
  buildClinicalNarrative,
  buildResultSummary,
  buildRuleNarrative,
  formatPercentage,
  formatValue,
  getFieldLabel,
  getRiskUi,
  type ExplicacionResponse,
} from "../../lib/riesgoMaterno";
import { GlassPanel } from "../ui/GlassPanel";
import { SectionHeader } from "../ui/SectionHeader";

interface RecommendationSectionProps {
  result: ExplicacionResponse | null;
  isLoading: boolean;
  error: string | null;
}

const iconMap = {
  low: CheckCircle2,
  mid: AlertTriangle,
  high: ShieldAlert,
};

const toneClassMap = {
  low: "text-emerald-700 border-emerald-200 bg-emerald-50",
  mid: "text-amber-700 border-amber-200 bg-amber-50",
  high: "text-rose-700 border-rose-200 bg-rose-50",
};

export function RecommendationSection({ result, isLoading, error }: RecommendationSectionProps) {
  return (
    <section className="section-anchor pt-10" id="recommendation">
      <SectionHeader
        eyebrow="Salida del sistema"
        title="Resultado del analisis"
        description="Puntaje, clasificacion y razonamiento del caso analizado."
      />

      {isLoading ? (
        <GlassPanel className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-cyan-600" />
          <div>
            <div className="text-lg font-semibold text-slate-900">Analizando el caso...</div>
            <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">
              El sistema esta evaluando los indicadores clinicos del paciente.
            </p>
          </div>
        </GlassPanel>
      ) : null}

      {!isLoading && error ? (
        <GlassPanel className="flex items-start gap-3 p-6 text-rose-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold">No se pudo ejecutar el analisis.</div>
            <p className="mt-2 text-sm leading-7">{error}</p>
          </div>
        </GlassPanel>
      ) : null}

      {!isLoading && !error && result ? (
        <ResultContent result={result} />
      ) : null}
    </section>
  );
}

function ResultContent({ result }: { result: ExplicacionResponse }) {
  const risk = getRiskUi(result.riesgo);
  const Icon = iconMap[risk.tone];
  const summary = buildResultSummary(result);
  const narrative = buildClinicalNarrative(result);
  const sortedRules = [...result.reglas_activadas].sort((a, b) => b.fuerza - a.fuerza);

  const gaugeOption = {
    backgroundColor: "transparent",
    series: [
      {
        type: "gauge",
        min: 0,
        max: 100,
        progress: {
          show: true,
          roundCap: true,
          width: 18,
          itemStyle: { color: risk.accent },
        },
        axisLine: {
          lineStyle: {
            width: 18,
            color: [[1, "rgba(148, 163, 184, 0.15)"]],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, "0%"],
          formatter: "{value}",
          color: "#0f172a",
          fontSize: 40,
          fontWeight: 700,
        },
        title: {
          offsetCenter: [0, "46%"],
          color: "rgba(71, 85, 105, 0.8)",
          fontSize: 13,
        },
        data: [{ value: Number(result.puntaje.toFixed(1)), name: "Puntaje" }],
      },
    ],
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Gauge + resumen */}
      <GlassPanel className="overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-sky-100 bg-white/82 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80">
                  Resultado obtenido
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div
                    className="rounded-2xl p-3"
                    style={{ backgroundColor: `${risk.accent}22`, color: risk.accent }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div
                      className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                      style={{
                        borderColor: `${risk.accent}55`,
                        color: risk.accent,
                        backgroundColor: `${risk.accent}18`,
                      }}
                    >
                      {risk.label}
                    </div>
                    <h3 className="mt-3 text-3xl font-semibold text-slate-900">{risk.label}</h3>
                  </div>
                </div>
              </div>
              <div className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                Analisis completado
              </div>
            </div>
            <div className="mt-6 h-72">
              <ReactECharts option={gaugeOption} style={{ height: "100%", width: "100%" }} />
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-[2rem] border border-sky-100 bg-gradient-to-br from-white to-cyan-50 p-6">
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80">
                Resumen del resultado
              </div>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">{summary.headline}</h3>
              <p className="mt-4 text-base leading-7 text-slate-600">{summary.description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-sky-100 bg-white/82 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Origen del modelo
                </div>
                <div className="mt-3 text-lg font-semibold text-slate-900">
                  {result.origen_modelo}
                </div>
              </div>
              <div className="rounded-3xl border border-sky-100 bg-white/82 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Reglas activadas
                </div>
                <div className="mt-3 text-3xl font-semibold text-slate-900">
                  {result.reglas_activadas.length}
                </div>
              </div>
            </div>

            {result.ajustes_entrada.length > 0 ? (
              <div className="rounded-[2rem] border border-sky-100 bg-white/82 p-6">
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80">
                  Valores ajustados automaticamente
                </div>
                <div className="mt-4 grid gap-3">
                  {result.ajustes_entrada.map((adjustment) => (
                    <div
                      key={adjustment.variable}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-slate-700">
                        {getFieldLabel(adjustment.variable)}
                      </span>
                      <span className="text-slate-500">
                        {formatValue(adjustment.variable, adjustment.valor_original)}
                        <span className="mx-2 text-cyan-500">→</span>
                        <span className="font-semibold text-cyan-700">
                          {formatValue(adjustment.variable, adjustment.valor_ajustado)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </GlassPanel>

      {/* Narrativa clínica */}
      <GlassPanel className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-2xl border border-cyan-300/30 bg-cyan-50 p-3 text-cyan-700">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80">
              Por que el sistema tomo esta decision
            </div>
            <p className="mt-3 text-base font-semibold leading-relaxed text-slate-900">
              {narrative.intro}
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">{narrative.details}</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">{narrative.conclusion}</p>
          </div>
        </div>
      </GlassPanel>

      {/* Reglas activadas */}
      <div>
        <div className="mb-4 px-1">
          <div className="text-base font-semibold text-slate-900">
            Reglas que influyeron en la decision
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Ordenadas por peso de influencia — de mayor a menor impacto en el resultado final.
          </p>
        </div>

        <div className="space-y-4">
          {sortedRules.map((rule, index) => {
            const ruleRisk = getRiskUi(rule.consecuente);
            const ruleNarrative = buildRuleNarrative(rule);

            return (
              <motion.div
                key={rule.numero}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
              >
                <GlassPanel className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-cyan-300/30 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                        Regla {rule.numero}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${toneClassMap[ruleRisk.tone]}`}
                      >
                        Indica {ruleRisk.label.toLowerCase()}
                      </span>
                    </div>
                    <div className="shrink-0 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-2 text-right">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Peso</div>
                      <div className="text-lg font-semibold text-slate-900">
                        {formatPercentage(rule.fuerza)}
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-slate-700">
                    <span className="font-medium text-slate-500">Se activo porque: </span>
                    {ruleNarrative}
                  </p>

                  <div className="mt-4 overflow-hidden rounded-full bg-sky-100">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: ruleRisk.accent,
                        width: `${Math.max(4, Math.round(rule.fuerza * 100))}%`,
                      }}
                    />
                  </div>
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
