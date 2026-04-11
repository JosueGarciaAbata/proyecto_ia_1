import { motion } from "framer-motion";
import ReactECharts from "echarts-for-react";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { RecommendationResult } from "../../data/mockData";
import { GlassPanel } from "../ui/GlassPanel";
import { SectionHeader } from "../ui/SectionHeader";

interface RecommendationSectionProps {
  result: RecommendationResult;
  analyzed: boolean;
}

const toneMap = {
  low: {
    accent: "#4ade80",
    badge: "Riesgo bajo",
    icon: CheckCircle2,
  },
  mid: {
    accent: "#f59e0b",
    badge: "Riesgo medio",
    icon: AlertTriangle,
  },
  high: {
    accent: "#fb7185",
    badge: "Riesgo alto",
    icon: ShieldAlert,
  },
};

export function RecommendationSection({
  result,
  analyzed,
}: RecommendationSectionProps) {
  const tone = toneMap[result.riskTone];
  const Icon = tone.icon;

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
          itemStyle: {
            color: tone.accent,
          },
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
        data: [
          {
            value: result.riskScore,
            name: "Puntaje",
          },
        ],
      },
    ],
  };

  return (
    <section className="section-anchor pt-10" id="recommendation">
      <SectionHeader
        eyebrow="Salida del sistema"
        title="Resultado y recomendacion"
        description="Puntaje, clasificacion e interpretacion del caso."
      />

      <motion.div
        animate={{
          opacity: analyzed ? 1 : 0.85,
          y: analyzed ? 0 : 8,
        }}
        transition={{ duration: 0.35 }}
      >
        <GlassPanel className="overflow-hidden p-6 sm:p-8">
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border border-sky-100 bg-white/82 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80">
                    Resultado sugerido
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className="rounded-2xl p-3"
                      style={{ backgroundColor: `${tone.accent}22`, color: tone.accent }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div
                        className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                        style={{
                          borderColor: `${tone.accent}55`,
                          color: tone.accent,
                          backgroundColor: `${tone.accent}18`,
                        }}
                      >
                        {tone.badge}
                      </div>
                      <h3 className="mt-3 text-3xl font-semibold text-slate-900">
                        {result.riskLevel}
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {analyzed ? "Analisis completado" : "Pendiente de ejecucion"}
                </div>
              </div>

              <div className="mt-6 h-72">
                <ReactECharts option={gaugeOption} style={{ height: "100%", width: "100%" }} />
              </div>
            </div>

            <div className="grid gap-5">
              <div className="rounded-[2rem] border border-sky-100 bg-gradient-to-br from-white to-cyan-50 p-6">
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80">
                  Resumen clinico
                </div>
                <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                  {result.recommendation}
                </h3>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  {result.interpretation}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-sky-100 bg-white/82 p-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Confianza
                  </div>
                  <div className="mt-3 text-3xl font-semibold text-slate-900">
                    {Math.round(result.confidence * 100)}%
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Consistencia relativa de la salida del sistema para el caso actual.
                  </p>
                </div>
                <div className="rounded-3xl border border-sky-100 bg-white/82 p-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Inferencia difusa
                  </div>
                  <div className="mt-3 text-3xl font-semibold text-slate-900">
                    {Math.round(result.inferenceStrength * 100)}%
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Intensidad relativa de la agregacion de reglas activadas.
                  </p>
                </div>
                <div className="rounded-3xl border border-sky-100 bg-white/82 p-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Metodo de salida
                  </div>
                  <div className="mt-3 text-3xl font-semibold text-slate-900">Centroide</div>
                  <p className="mt-2 text-sm text-slate-600">
                    Puntaje crisp obtenido a partir de la superficie difusa.
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-sky-100 bg-white/82 p-6">
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80">
                  Indicadores clinicos
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {result.clinicalFlags.map((flag) => (
                    <span
                      key={flag}
                      className="rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-medium text-slate-700"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </GlassPanel>
      </motion.div>
    </section>
  );
}
