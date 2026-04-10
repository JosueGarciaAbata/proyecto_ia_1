import { useState } from "react";
import ReactECharts from "echarts-for-react";
import { motion } from "framer-motion";
import { membershipProfiles } from "../../data/mockData";
import { generateMembershipSeries } from "../../lib/membership";
import { ChartPanel } from "../ui/ChartPanel";
import { GlassPanel } from "../ui/GlassPanel";
import { SectionHeader } from "../ui/SectionHeader";

const variableNames = Object.keys(membershipProfiles);

export function MembershipFunctionsSection() {
  const [selectedVariable, setSelectedVariable] = useState(variableNames[1]);
  const profile = membershipProfiles[selectedVariable];

  const series = profile.categories.flatMap((category) => {
    const baseSeries = generateMembershipSeries(profile.domain, category.base);
    const optimizedSeries = generateMembershipSeries(profile.domain, category.optimized);

    return [
      {
        name: `${category.name} (base)`,
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: {
          width: 2,
          type: "dashed",
          color: category.color,
          opacity: 0.55,
        },
        emphasis: { focus: "series" },
        data: baseSeries.map((point) => [point.x, point.membership]),
      },
      {
        name: `${category.name} (optimizada)`,
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: {
          width: 3,
          color: category.color,
        },
        areaStyle: {
          opacity: 0.07,
          color: category.color,
        },
        emphasis: { focus: "series" },
        data: optimizedSeries.map((point) => [point.x, point.membership]),
      },
    ];
  });

  const chartOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.96)",
      borderColor: "rgba(125, 211, 252, 0.65)",
      textStyle: { color: "#0f172a" },
    },
    legend: {
      type: "scroll",
      top: 0,
      textStyle: { color: "rgba(15, 23, 42, 0.82)" },
    },
    grid: {
      left: 12,
      right: 12,
      top: 48,
      bottom: 12,
      containLabel: true,
    },
    xAxis: {
      type: "value",
      name: profile.unit,
      nameTextStyle: { color: "rgba(71, 85, 105, 0.8)" },
      axisLine: { lineStyle: { color: "rgba(148, 163, 184, 0.35)" } },
      splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.16)" } },
      axisLabel: { color: "rgba(30, 41, 59, 0.82)" },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 1,
      axisLine: { lineStyle: { color: "rgba(148, 163, 184, 0.35)" } },
      splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.16)" } },
      axisLabel: { color: "rgba(30, 41, 59, 0.82)" },
    },
    series,
  };

  return (
    <section className="section-anchor pt-10" id="membership-functions">
      <SectionHeader
        eyebrow="Funciones de membresia"
        title="Curvas trapezoidales"
        description="Curvas base y optimizadas."
      />

      <div className="grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
        <GlassPanel className="p-5 sm:p-6">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80">
            Selector de variable
          </div>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Variables de entrada</h3>

          <div className="mt-6 flex flex-wrap gap-2">
            {variableNames.map((variable) => (
              <button
                key={variable}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedVariable === variable
                    ? "bg-cyan-600 text-white"
                    : "border border-sky-100 bg-white text-slate-700 hover:border-cyan-300/35 hover:bg-cyan-50"
                }`}
                onClick={() => setSelectedVariable(variable)}
                type="button"
              >
                {variable}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            {profile.categories.map((category, index) => (
              <motion.div
                key={category.name}
                className="rounded-3xl border border-sky-100 bg-white/82 p-4"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="text-sm font-semibold text-slate-900">{category.name}</div>
                </div>
                <div className="mt-3 text-xs leading-6 text-slate-500">
                  Base: [{category.base.join(", ")}]
                </div>
                <div className="text-xs leading-6 text-cyan-700/85">
                  Optimizada: [{category.optimized.join(", ")}]
                </div>
              </motion.div>
            ))}
          </div>
        </GlassPanel>

        <ChartPanel
          title={`${profile.label}: curvas de membresia`}
          subtitle="Base y optimizada."
        >
          <div className="h-[520px]">
            <ReactECharts option={chartOption} style={{ height: "100%", width: "100%" }} />
          </div>
        </ChartPanel>
      </div>
    </section>
  );
}
