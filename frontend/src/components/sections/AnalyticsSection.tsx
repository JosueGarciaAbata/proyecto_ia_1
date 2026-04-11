import ReactECharts from "echarts-for-react";
import {
  inputComparison,
  patientDistribution,
  riskFrequency,
  riskTrend,
  variableInfluence,
} from "../../data/mockData";
import { ChartPanel } from "../ui/ChartPanel";
import { SectionHeader } from "../ui/SectionHeader";

export function AnalyticsSection() {
  const cohortOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(255, 255, 255, 0.96)",
      borderColor: "rgba(125, 211, 252, 0.65)",
      textStyle: { color: "#0f172a" },
    },
    legend: { textStyle: { color: "rgba(15, 23, 42, 0.82)" } },
    grid: { left: 12, right: 12, top: 36, bottom: 12, containLabel: true },
    xAxis: {
      type: "category",
      data: patientDistribution.map((item) => item.cohort),
      axisLabel: { color: "rgba(30, 41, 59, 0.82)" },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "rgba(30, 41, 59, 0.82)" },
      splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.16)" } },
    },
    series: [
      {
        name: "Bajo",
        type: "bar",
        stack: "total",
        data: patientDistribution.map((item) => item.low),
        itemStyle: { color: "#4ade80" },
      },
      {
        name: "Medio",
        type: "bar",
        stack: "total",
        data: patientDistribution.map((item) => item.mid),
        itemStyle: { color: "#f59e0b" },
      },
      {
        name: "Alto",
        type: "bar",
        stack: "total",
        data: patientDistribution.map((item) => item.high),
        itemStyle: { color: "#fb7185" },
      },
    ],
  };

  const frequencyOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(255, 255, 255, 0.96)",
      borderColor: "rgba(125, 211, 252, 0.65)",
      textStyle: { color: "#0f172a" },
    },
    legend: { bottom: 0, textStyle: { color: "rgba(30, 41, 59, 0.82)" } },
    series: [
      {
        type: "pie",
        radius: ["52%", "74%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: false,
        label: { color: "#0f172a" },
        labelLine: { show: false },
        itemStyle: {
          borderColor: "rgba(255, 255, 255, 1)",
          borderWidth: 4,
        },
        data: [
          {
            value: riskFrequency[0].value,
            name: riskFrequency[0].name,
            itemStyle: { color: "#4ade80" },
          },
          {
            value: riskFrequency[1].value,
            name: riskFrequency[1].name,
            itemStyle: { color: "#f59e0b" },
          },
          {
            value: riskFrequency[2].value,
            name: riskFrequency[2].name,
            itemStyle: { color: "#fb7185" },
          },
        ],
      },
    ],
  };

  const trendOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.96)",
      borderColor: "rgba(125, 211, 252, 0.65)",
      textStyle: { color: "#0f172a" },
    },
    grid: { left: 12, right: 12, top: 24, bottom: 12, containLabel: true },
    xAxis: {
      type: "category",
      data: riskTrend.map((item) => item.day),
      axisLabel: { color: "rgba(30, 41, 59, 0.82)" },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "rgba(30, 41, 59, 0.82)" },
      splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.16)" } },
    },
    series: [
      {
        type: "line",
        smooth: true,
        symbolSize: 8,
        itemStyle: { color: "#38bdf8" },
        lineStyle: { width: 3, color: "#38bdf8" },
        areaStyle: { color: "rgba(56, 189, 248, 0.12)" },
        data: riskTrend.map((item) => item.riskScore),
      },
    ],
  };

  const influenceOption = {
    backgroundColor: "transparent",
    radar: {
      indicator: variableInfluence.map((item) => ({
        name: item.variable,
        max: 1,
      })),
      splitArea: {
        areaStyle: {
          color: ["rgba(255, 255, 255, 0.75)", "rgba(224, 242, 254, 0.6)"],
        },
      },
      axisName: { color: "#0f172a" },
      splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.2)" } },
      axisLine: { lineStyle: { color: "rgba(148, 163, 184, 0.2)" } },
    },
    series: [
      {
        type: "radar",
        data: [
          {
            value: variableInfluence.map((item) => item.value),
            areaStyle: { color: "rgba(56, 189, 248, 0.2)" },
            lineStyle: { color: "#38bdf8", width: 2.5 },
            itemStyle: { color: "#38bdf8" },
          },
        ],
      },
    ],
  };

  const comparisonOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(255, 255, 255, 0.96)",
      borderColor: "rgba(125, 211, 252, 0.65)",
      textStyle: { color: "#0f172a" },
    },
    legend: { textStyle: { color: "rgba(30, 41, 59, 0.82)" } },
    grid: { left: 12, right: 12, top: 36, bottom: 12, containLabel: true },
    xAxis: {
      type: "category",
      data: inputComparison.map((item) => item.variable),
      axisLabel: { color: "rgba(30, 41, 59, 0.82)", rotate: 16 },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "rgba(30, 41, 59, 0.82)" },
      splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.16)" } },
    },
    series: [
      {
        name: "Entrada del paciente",
        type: "bar",
        data: inputComparison.map((item) => item.patient),
        itemStyle: { color: "#38bdf8" },
      },
      {
        name: "Referencia base",
        type: "bar",
        data: inputComparison.map((item) => item.baseline),
        itemStyle: { color: "rgba(148, 163, 184, 0.55)" },
      },
      {
        name: "Senal optimizada",
        type: "bar",
        data: inputComparison.map((item) => item.optimized),
        itemStyle: { color: "#818cf8" },
      },
    ],
  };

  return (
    <section className="section-anchor pt-10" id="analytics">
      <SectionHeader
        eyebrow="Analitica"
        title="Visualizaciones de apoyo"
        description="Graficas del sistema."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartPanel
          title="Distribucion de pacientes evaluados"
          subtitle="Cohortes y categorias."
        >
          <div className="h-[320px]">
            <ReactECharts option={cohortOption} style={{ height: "100%", width: "100%" }} />
          </div>
        </ChartPanel>
        <ChartPanel
          title="Frecuencia por categoria de riesgo"
          subtitle="Riesgo bajo, medio y alto."
        >
          <div className="h-[320px]">
            <ReactECharts option={frequencyOption} style={{ height: "100%", width: "100%" }} />
          </div>
        </ChartPanel>
        <ChartPanel
          title="Tendencia temporal del puntaje"
          subtitle="Evolucion del puntaje."
        >
          <div className="h-[320px]">
            <ReactECharts option={trendOption} style={{ height: "100%", width: "100%" }} />
          </div>
        </ChartPanel>
        <ChartPanel
          title="Influencia relativa de variables"
          subtitle="Aporte por variable."
        >
          <div className="h-[320px]">
            <ReactECharts option={influenceOption} style={{ height: "100%", width: "100%" }} />
          </div>
        </ChartPanel>
      </div>

      <div className="mt-6">
        <ChartPanel
          title="Comparacion de variables de entrada"
          subtitle="Caso actual vs referencias."
        >
          <div className="h-[360px]">
            <ReactECharts option={comparisonOption} style={{ height: "100%", width: "100%" }} />
          </div>
        </ChartPanel>
      </div>
    </section>
  );
}
