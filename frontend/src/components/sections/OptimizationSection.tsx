import ReactECharts from "echarts-for-react";
import { motion } from "framer-motion";
import {
  fitnessHistory,
  metricComparison,
  mockChromosomePreview,
  optimizationSummary,
} from "../../data/mockData";
import { ChartPanel } from "../ui/ChartPanel";
import { GlassPanel } from "../ui/GlassPanel";
import { SectionHeader } from "../ui/SectionHeader";

export function OptimizationSection() {
  const convergenceOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.96)",
      borderColor: "rgba(125, 211, 252, 0.65)",
      textStyle: { color: "#0f172a" },
    },
    legend: {
      textStyle: { color: "rgba(15, 23, 42, 0.82)" },
    },
    grid: { left: 12, right: 18, top: 40, bottom: 12, containLabel: true },
    xAxis: {
      type: "category",
      data: fitnessHistory.map((point) => point.generation),
      axisLabel: { color: "rgba(30, 41, 59, 0.82)" },
      axisLine: { lineStyle: { color: "rgba(148, 163, 184, 0.35)" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "rgba(30, 41, 59, 0.82)" },
      splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.16)" } },
    },
    series: [
      {
        name: "Mejor fitness",
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: { width: 3, color: "#38bdf8" },
        areaStyle: { color: "rgba(56, 189, 248, 0.12)" },
        data: fitnessHistory.map((point) => point.bestFitness),
      },
      {
        name: "Fitness promedio",
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color: "#818cf8", type: "dashed" },
        data: fitnessHistory.map((point) => point.averageFitness),
      },
    ],
  };

  const metricsOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(255, 255, 255, 0.96)",
      borderColor: "rgba(125, 211, 252, 0.65)",
      textStyle: { color: "#0f172a" },
    },
    legend: {
      top: 0,
      textStyle: { color: "rgba(15, 23, 42, 0.82)" },
    },
    grid: { left: 12, right: 12, top: 42, bottom: 12, containLabel: true },
    xAxis: {
      type: "category",
      data: metricComparison.map((metric) => metric.label),
      axisLabel: { color: "rgba(30, 41, 59, 0.82)", rotate: 18 },
      axisLine: { lineStyle: { color: "rgba(148, 163, 184, 0.35)" } },
    },
    yAxis: {
      type: "value",
      max: 1,
      axisLabel: { color: "rgba(30, 41, 59, 0.82)" },
      splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.16)" } },
    },
    series: [
      {
        name: "Base",
        type: "bar",
        barMaxWidth: 22,
        itemStyle: { color: "rgba(148, 163, 184, 0.6)", borderRadius: [10, 10, 0, 0] },
        data: metricComparison.map((metric) => metric.base),
      },
      {
        name: "Optimizado",
        type: "bar",
        barMaxWidth: 22,
        itemStyle: { color: "#38bdf8", borderRadius: [10, 10, 0, 0] },
        data: metricComparison.map((metric) => metric.optimized),
      },
    ],
  };

  return (
    <section className="section-anchor pt-10" id="optimization">
      <SectionHeader
        eyebrow="Optimizacion"
        title="Algoritmo genetico"
        description="Fitness, comparacion y cromosoma."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {optimizationSummary.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
          >
            <GlassPanel className="h-full p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                {item.label}
              </div>
              <div className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartPanel
          title="Convergencia del fitness"
          subtitle="Mejor y promedio por generacion."
        >
          <div className="h-[360px]">
            <ReactECharts option={convergenceOption} style={{ height: "100%", width: "100%" }} />
          </div>
        </ChartPanel>
        <ChartPanel
          title="Comparacion base vs optimizado"
          subtitle="Metricas comparativas."
        >
          <div className="h-[360px]">
            <ReactECharts option={metricsOption} style={{ height: "100%", width: "100%" }} />
          </div>
        </ChartPanel>
      </div>

      <GlassPanel className="mt-6 p-6 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80">
              Vista del mejor cromosoma
            </div>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">
              Resumen de parametros ajustados
            </h3>
          </div>
          <div className="grid gap-3">
            {mockChromosomePreview.map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-sky-100 bg-white px-4 py-3 font-mono text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>
    </section>
  );
}
