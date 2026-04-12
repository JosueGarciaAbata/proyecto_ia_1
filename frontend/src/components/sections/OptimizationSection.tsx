import ReactECharts from "echarts-for-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import {
  getFieldLabel,
  obtenerComparacionGA,
  obtenerHistorialGA,
  reentrenarGA,
  type GAComparacionResponse,
  type GAHistorialResponse,
} from "../../lib/riesgoMaterno";
import { ChartPanel } from "../ui/ChartPanel";
import { GlassPanel } from "../ui/GlassPanel";
import { SectionHeader } from "../ui/SectionHeader";

export function OptimizationSection() {
  const [historial, setHistorial] = useState<GAHistorialResponse | null>(null);
  const [comparacion, setComparacion] = useState<GAComparacionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setFetchError(null);
    try {
      const [h, c] = await Promise.all([obtenerHistorialGA(), obtenerComparacionGA()]);
      setHistorial(h);
      setComparacion(c);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Error al cargar datos del GA.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRetrain() {
    setRetraining(true);
    try {
      await reentrenarGA();
      await fetchData();
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Error en reentrenamiento.");
      setRetraining(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const noData = !loading && historial && !historial.disponible;

  return (
    <section className="section-anchor pt-10" id="optimization">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          eyebrow="Optimizacion"
          title="Algoritmo genetico"
          description="Convergencia del fitness, comparacion base vs optimizado y cromosoma decodificado."
        />
        <button
          className="mt-10 inline-flex shrink-0 items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 disabled:opacity-60"
          disabled={loading || retraining}
          onClick={handleRetrain}
          type="button"
        >
          {retraining ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              {noData ? "Entrenando..." : "Reentrenando..."}
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              {noData ? "Entrenar GA" : "Reentrenar GA"}
            </>
          )}
        </button>
      </div>

      {loading ? (
        <GlassPanel className="flex min-h-48 items-center justify-center gap-3 p-8 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin text-cyan-600" />
          <span className="text-sm">Cargando datos del algoritmo genetico...</span>
        </GlassPanel>
      ) : fetchError ? (
        <GlassPanel className="p-6 text-sm text-rose-700">{fetchError}</GlassPanel>
      ) : (
        <>
          {noData && (
            <GlassPanel className="mb-4 p-4 text-sm text-amber-700 border-amber-200 bg-amber-50">
              El modelo genetico aun no ha sido entrenado.
              Presione <strong>Entrenar GA</strong> para ejecutar el algoritmo y generar los datos de convergencia y comparacion.
            </GlassPanel>
          )}
          {historial && historial.disponible && <SummaryCards historial={historial} />}
          {historial && historial.disponible && <ConvergenceChart historial={historial} />}
          {comparacion && comparacion.disponible && comparacion.tabla_comparativa.length > 0 && (
            <ComparisonChart comparacion={comparacion} />
          )}
          {comparacion && comparacion.disponible && (
            <ChromosomeTable comparacion={comparacion} />
          )}
        </>
      )}
    </section>
  );
}

// ── Tarjetas resumen ──────────────────────────────────────────────────────────

function SummaryCards({ historial }: { historial: GAHistorialResponse }) {
  const cards = [
    {
      label: "Mejor fitness",
      value: historial.mejor_fitness.toFixed(4),
      detail: "Fitness maximo sobre datos de validacion.",
    },
    {
      label: "Generaciones",
      value: historial.generaciones.toString(),
      detail: "Generaciones hasta la convergencia por paciencia.",
    },
    {
      label: "Macro F1",
      value: (historial.macro_f1_validacion * 100).toFixed(1) + "%",
      detail: "F1 macro ponderado en validacion.",
    },
    {
      label: "Recall alto riesgo",
      value: (historial.recall_alto_validacion * 100).toFixed(1) + "%",
      detail: "Recall de la clase de riesgo alto.",
    },
  ];

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: i * 0.06 }}
        >
          <GlassPanel className="h-full p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">{card.label}</div>
            <div className="mt-3 font-mono text-3xl font-semibold text-slate-900">{card.value}</div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{card.detail}</p>
          </GlassPanel>
        </motion.div>
      ))}
    </div>
  );
}

// ── Convergencia ──────────────────────────────────────────────────────────────

function ConvergenceChart({ historial }: { historial: GAHistorialResponse }) {
  const gens = historial.historial_generaciones;

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255,255,255,0.96)",
      borderColor: "rgba(125,211,252,0.65)",
      textStyle: { color: "#0f172a" },
    },
    legend: {
      data: ["Mejor fitness", "Fitness promedio"],
      textStyle: { color: "rgba(15,23,42,0.82)" },
    },
    grid: { left: 12, right: 18, top: 44, bottom: 12, containLabel: true },
    xAxis: {
      type: "category",
      data: gens.map((g) => g.generacion),
      name: "Generacion",
      nameTextStyle: { color: "rgba(71,85,105,0.8)" },
      axisLabel: { color: "rgba(30,41,59,0.82)" },
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.35)" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "rgba(30,41,59,0.82)" },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.16)" } },
    },
    series: [
      {
        name: "Mejor fitness",
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: { width: 3, color: "#38bdf8" },
        areaStyle: { color: "rgba(56,189,248,0.10)" },
        data: gens.map((g) => g.mejor_fitness),
      },
      {
        name: "Fitness promedio",
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color: "#818cf8", type: "dashed" },
        data: gens.map((g) => g.fitness_promedio),
      },
    ],
  };

  return (
    <ChartPanel
      className="mt-6"
      title="Convergencia del fitness por generacion"
      subtitle="Mejor fitness y fitness promedio de la poblacion."
    >
      <div className="h-[360px]">
        <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />
      </div>
    </ChartPanel>
  );
}

// ── Comparacion base vs optimizado ────────────────────────────────────────────

function ComparisonChart({ comparacion }: { comparacion: GAComparacionResponse }) {
  const rows = comparacion.tabla_comparativa;

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(255,255,255,0.96)",
      borderColor: "rgba(125,211,252,0.65)",
      textStyle: { color: "#0f172a" },
    },
    legend: {
      data: ["Base", "Optimizado"],
      textStyle: { color: "rgba(15,23,42,0.82)" },
    },
    grid: { left: 12, right: 12, top: 44, bottom: 12, containLabel: true },
    xAxis: {
      type: "category",
      data: rows.map((r) => r.metrica),
      axisLabel: { color: "rgba(30,41,59,0.82)", rotate: 16, fontSize: 11 },
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.35)" } },
    },
    yAxis: {
      type: "value",
      max: 1,
      axisLabel: { color: "rgba(30,41,59,0.82)" },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.16)" } },
    },
    series: [
      {
        name: "Base",
        type: "bar",
        barMaxWidth: 28,
        itemStyle: { color: "rgba(148,163,184,0.55)", borderRadius: [6, 6, 0, 0] },
        data: rows.map((r) => Number(r.base.toFixed(4))),
      },
      {
        name: "Optimizado",
        type: "bar",
        barMaxWidth: 28,
        itemStyle: { color: "#38bdf8", borderRadius: [6, 6, 0, 0] },
        data: rows.map((r) => Number(r.optimizado.toFixed(4))),
      },
    ],
  };

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <ChartPanel title="Comparacion base vs optimizado" subtitle="Metricas en los tres splits.">
        <div className="h-[340px]">
          <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />
        </div>
      </ChartPanel>

      <GlassPanel className="p-5 sm:p-6">
        <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80 mb-4">
          Tabla comparativa
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sky-100 text-xs uppercase tracking-[0.14em] text-slate-500">
                <th className="py-2 pr-3 text-left">Metrica</th>
                <th className="py-2 px-3 text-right">Base</th>
                <th className="py-2 px-3 text-right">Opt.</th>
                <th className="py-2 pl-3 text-right">Delta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.metrica} className="border-b border-sky-50">
                  <td className="py-2 pr-3 text-slate-700">{row.metrica}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-500">
                    {row.base.toFixed(3)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-cyan-700">
                    {row.optimizado.toFixed(3)}
                  </td>
                  <td
                    className={`py-2 pl-3 text-right font-mono text-xs ${row.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {row.delta >= 0 ? "+" : ""}
                    {row.delta.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </div>
  );
}

// ── Cromosoma decodificado ────────────────────────────────────────────────────

function ChromosomeTable({ comparacion }: { comparacion: GAComparacionResponse }) {
  const membresias = comparacion.membresias_decodificadas;

  return (
    <GlassPanel className="mt-6 p-6 sm:p-7">
      <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80 mb-4">
        Mejor cromosoma — membresías decodificadas [a, b, c, d]
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sky-100 text-xs uppercase tracking-[0.14em] text-slate-500">
              <th className="py-2 pr-4 text-left">Variable</th>
              <th className="py-2 pr-4 text-left">Categoria</th>
              <th className="py-2 text-left font-mono">a</th>
              <th className="py-2 text-left font-mono">b</th>
              <th className="py-2 text-left font-mono">c</th>
              <th className="py-2 text-left font-mono">d</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(membresias).flatMap(([variable, cats]) =>
              Object.entries(cats).map(([cat, pts], catIdx) => (
                <tr
                  key={`${variable}-${cat}`}
                  className="border-b border-sky-50 hover:bg-sky-50/40"
                >
                  {catIdx === 0 ? (
                    <td
                      className="py-2.5 pr-4 font-semibold text-slate-800"
                      rowSpan={Object.keys(cats).length}
                    >
                      {getFieldLabel(variable)}
                    </td>
                  ) : null}
                  <td className="py-2.5 pr-4 text-slate-600">{cat}</td>
                  {pts.map((v, i) => (
                    <td key={i} className="py-2.5 pr-3 font-mono text-xs text-slate-700">
                      {v.toFixed(2)}
                    </td>
                  ))}
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}
