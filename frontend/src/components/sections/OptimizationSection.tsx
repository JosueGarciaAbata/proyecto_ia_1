import ReactECharts from "echarts-for-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, RefreshCw, X } from "lucide-react";
import {
  defaultReentrenarParams,
  getFieldLabel,
  obtenerComparacionGA,
  obtenerHistorialGA,
  reentrenarGAStream,
  type GAComparacionResponse,
  type GAHistorialResponse,
  type GeneracionHistorial,
  type ReentrenarParams,
} from "../../lib/riesgoMaterno";
import { ChartPanel } from "../ui/ChartPanel";
import { GlassPanel } from "../ui/GlassPanel";
import { SectionHeader } from "../ui/SectionHeader";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ParamSpec {
  key: keyof ReentrenarParams;
  label: string;
  hint: string;
  step: number;
  min: number;
  max: number;
  isFloat: boolean;
}

const PARAM_SPECS: ParamSpec[] = [
  { key: "tamano_poblacion",    label: "Tamaño de poblacion",   hint: "Minimo 4",          step: 1,    min: 4,   max: 500,  isFloat: false },
  { key: "cantidad_hijos",      label: "Cantidad de hijos",     hint: "Minimo 2",          step: 1,    min: 2,   max: 500,  isFloat: false },
  { key: "maximo_generaciones", label: "Maximo de generaciones",hint: "Minimo 1",          step: 1,    min: 1,   max: 1000, isFloat: false },
  { key: "probabilidad_cruce",  label: "Probabilidad de cruce", hint: "Entre 0.01 y 1.0",  step: 0.01, min: 0.01,max: 1.0,  isFloat: true  },
  { key: "probabilidad_mutacion",label:"Probabilidad de mutacion",hint:"Entre 0.001 y 1.0",step: 0.001,min: 0.001,max: 1.0, isFloat: true  },
];

// ── Seccion principal ─────────────────────────────────────────────────────────

export function OptimizationSection() {
  const [historial, setHistorial] = useState<GAHistorialResponse | null>(null);
  const [comparacion, setComparacion] = useState<GAComparacionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [logLines, setLogLines] = useState<string[]>([]);
  // Generaciones acumuladas en vivo para cards y grafica
  const [liveGens, setLiveGens] = useState<GeneracionHistorial[]>([]);
  // Mejor cromosoma decodificado de la última generacion recibida
  const [liveMembresias, setLiveMembresias] = useState<Record<string, Record<string, number[]>> | null>(null);
  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const logPanelRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  async function handleStartTraining(params: ReentrenarParams) {
    setShowModal(false);
    setLogLines([]);
    setLiveGens([]);
    setLiveMembresias(null);
    setRetraining(true);
    setFetchError(null);

    // Desplaza hasta el panel de log sin mover toda la página
    setTimeout(() => {
      logPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const stream = reentrenarGAStream(params, controller.signal);
      for await (const evento of stream) {
        if (controller.signal.aborted) break;

        if (evento.tipo === "generacion") {
          const gen: GeneracionHistorial = {
            generacion: evento.generacion,
            mejor_fitness: evento.mejor_fitness,
            fitness_promedio: evento.fitness_promedio,
            macro_f1_validacion: evento.macro_f1_validacion,
            recall_alto_validacion: evento.recall_alto_validacion,
          };
          setLiveGens((prev) => [...prev, gen]);
          setLiveMembresias(evento.membresias_decodificadas);

          const line =
            `Gen ${String(evento.generacion).padStart(3, "0")}  ` +
            `fitness=${evento.mejor_fitness.toFixed(4)}  ` +
            `macro_f1=${evento.macro_f1_validacion.toFixed(4)}  ` +
            `recall_alto=${evento.recall_alto_validacion.toFixed(4)}`;
          setLogLines((prev) => [...prev, line]);
        } else if (evento.tipo === "done") {
          setLogLines((prev) => [
            ...prev,
            `─── Completado: ${evento.generaciones} generaciones | fitness=${evento.fitness.toFixed(4)} ───`,
          ]);
        } else if (evento.tipo === "error") {
          setFetchError(evento.mensaje);
        }
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        setFetchError(e instanceof Error ? e.message : "Error en reentrenamiento.");
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setRetraining(false);
      await fetchData();
    }
  }

  // Scroll interno del contenedor del log (no mueve la pagina)
  useEffect(() => {
    const container = logContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [logLines]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const noData = !loading && !retraining && historial && !historial.disponible;

  // ── Qué mostrar en cards y gráfica ───────────────────────────────────────────
  // Prioridad: datos en vivo → datos del historial ya cargado → nada
  const lastLive = liveGens.length > 0 ? liveGens[liveGens.length - 1] : null;

  const cardData: SummaryData | null = lastLive
    ? {
        mejor_fitness: lastLive.mejor_fitness,
        generaciones: lastLive.generacion,
        macro_f1_validacion: lastLive.macro_f1_validacion,
        recall_alto_validacion: lastLive.recall_alto_validacion,
      }
    : historial?.disponible
    ? {
        mejor_fitness: historial.mejor_fitness,
        generaciones: historial.generaciones,
        macro_f1_validacion: historial.macro_f1_validacion,
        recall_alto_validacion: historial.recall_alto_validacion,
      }
    : null;

  const chartGens: GeneracionHistorial[] | null =
    liveGens.length > 0
      ? liveGens
      : historial?.disponible
      ? historial.historial_generaciones
      : null;

  // Estamos en vivo si hay generaciones llegando en este momento
  const isLive = retraining && liveGens.length > 0;
  // Acaba de terminar y está actualizando desde el servidor
  const isRefreshing = !retraining && loading && liveGens.length > 0;

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
          onClick={() => setShowModal(true)}
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

      {/* Log de progreso en vivo */}
      {(retraining || logLines.length > 0) && (
        <div ref={logPanelRef}>
          <GlassPanel className="mt-4 overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-sky-100 px-4 py-2.5">
              {retraining && <LoaderCircle className="h-3.5 w-3.5 animate-spin text-cyan-600" />}
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700/80">
                {retraining ? "Entrenamiento en progreso..." : "Log de entrenamiento"}
              </span>
            </div>
            <div
              ref={logContainerRef}
              className="max-h-64 overflow-y-auto bg-slate-950/95 px-4 py-3 font-mono text-xs leading-6"
            >
              {logLines.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.startsWith("───")
                      ? "text-cyan-400 font-semibold mt-1"
                      : "text-slate-300"
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Carga inicial sin datos previos */}
      {loading && !retraining && liveGens.length === 0 && (
        <GlassPanel className="flex min-h-48 items-center justify-center gap-3 p-8 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin text-cyan-600" />
          <span className="text-sm">Cargando datos del algoritmo genetico...</span>
        </GlassPanel>
      )}

      {fetchError && !retraining && (
        <GlassPanel className="mt-4 p-6 text-sm text-rose-700">{fetchError}</GlassPanel>
      )}

      {noData && (
        <GlassPanel className="mb-4 p-4 text-sm text-amber-700 border-amber-200 bg-amber-50">
          El modelo genetico aun no ha sido entrenado.
          Presione <strong>Entrenar GA</strong> para ejecutar el algoritmo y generar los datos de convergencia y comparacion.
        </GlassPanel>
      )}

      {/* Cards: siempre visibles si hay datos (vivos o del historial) */}
      {cardData && (
        <div className="relative">
          <SummaryCards data={cardData} isLive={isLive} />
          {/* Indicador sutil de actualización final */}
          {isRefreshing && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[2px]">
              <LoaderCircle className="h-5 w-5 animate-spin text-cyan-600" />
            </div>
          )}
        </div>
      )}

      {/* Gráfica de convergencia: siempre visible si hay datos */}
      {chartGens && (
        <div className="relative">
          <ConvergenceChart gens={chartGens} isLive={isLive} />
          {isRefreshing && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[2px]">
              <LoaderCircle className="h-5 w-5 animate-spin text-cyan-600" />
            </div>
          )}
        </div>
      )}

      {/* Comparación y cromosoma: visibles siempre que existan (no se reemplazan durante entrenamiento) */}
      {comparacion && comparacion.disponible && comparacion.tabla_comparativa.length > 0 && (
        <div className="relative">
          <ComparisonChart comparacion={comparacion} />
          {isRefreshing && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[2px]">
              <LoaderCircle className="h-5 w-5 animate-spin text-cyan-600" />
            </div>
          )}
        </div>
      )}
      {(liveMembresias || (comparacion && comparacion.disponible)) && (
        <div className="relative">
          <ChromosomeTable
            membresias={liveMembresias ?? comparacion!.membresias_decodificadas}
            isLive={isLive && liveMembresias !== null}
          />
          {isRefreshing && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[2px]">
              <LoaderCircle className="h-5 w-5 animate-spin text-cyan-600" />
            </div>
          )}
        </div>
      )}

      {/* Modal de parametros */}
      {showModal && (
        <ReentrenarModal
          onConfirm={handleStartTraining}
          onCancel={() => setShowModal(false)}
        />
      )}
    </section>
  );
}

// ── Modal de parametros ───────────────────────────────────────────────────────

function ReentrenarModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (params: ReentrenarParams) => void;
  onCancel: () => void;
}) {
  const [params, setParams] = useState<ReentrenarParams>({ ...defaultReentrenarParams });
  const [errors, setErrors] = useState<Partial<Record<keyof ReentrenarParams, string>>>({});

  function handleChange(key: keyof ReentrenarParams, value: string, isFloat: boolean) {
    const num = isFloat ? parseFloat(value) : parseInt(value, 10);
    setParams((prev) => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof ReentrenarParams, string>> = {};
    if (params.tamano_poblacion < 4)     newErrors.tamano_poblacion    = "Minimo 4";
    if (params.cantidad_hijos < 2)       newErrors.cantidad_hijos      = "Minimo 2";
    if (params.maximo_generaciones < 1)  newErrors.maximo_generaciones = "Minimo 1";
    if (params.probabilidad_cruce <= 0 || params.probabilidad_cruce > 1)
      newErrors.probabilidad_cruce   = "Debe estar entre 0.01 y 1.0";
    if (params.probabilidad_mutacion <= 0 || params.probabilidad_mutacion > 1)
      newErrors.probabilidad_mutacion = "Debe estar entre 0.001 y 1.0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (validate()) onConfirm(params);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-3xl border border-sky-100 bg-white/95 shadow-2xl backdrop-blur-xl"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-sky-100 px-6 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-700/80">Configuracion</div>
            <div className="mt-0.5 text-base font-semibold text-slate-900">Parametros del algoritmo genetico</div>
          </div>
          <button
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            onClick={onCancel}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Campos */}
        <div className="space-y-4 px-6 py-5">
          {PARAM_SPECS.map((spec) => (
            <div key={spec.key}>
              <label className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-slate-700">
                {spec.label}
                <span className="text-xs font-normal text-slate-400">{spec.hint}</span>
              </label>
              <input
                type="number"
                step={spec.step}
                min={spec.min}
                max={spec.max}
                value={params[spec.key]}
                onChange={(e) => handleChange(spec.key, e.target.value, spec.isFloat)}
                className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-cyan-300 ${
                  errors[spec.key]
                    ? "border-rose-300 bg-rose-50 focus:ring-rose-200"
                    : "border-sky-200 bg-white hover:border-cyan-300"
                }`}
              />
              {errors[spec.key] && (
                <p className="mt-1 text-xs text-rose-600">{errors[spec.key]}</p>
              )}
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 border-t border-sky-100 px-6 py-4">
          <button
            className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="rounded-full bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 active:scale-[0.97]"
            onClick={handleSubmit}
            type="button"
          >
            Iniciar entrenamiento
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Tarjetas resumen ──────────────────────────────────────────────────────────

interface SummaryData {
  mejor_fitness: number;
  generaciones: number;
  macro_f1_validacion: number;
  recall_alto_validacion: number;
}

function SummaryCards({ data, isLive }: { data: SummaryData; isLive?: boolean }) {
  const cards = [
    {
      label: "Mejor fitness",
      value: data.mejor_fitness.toFixed(4),
      detail: "Fitness maximo sobre datos de validacion.",
    },
    {
      label: "Generaciones",
      value: data.generaciones.toString(),
      detail: isLive
        ? "Generacion actual en curso."
        : "Generaciones hasta la convergencia por paciencia.",
    },
    {
      label: "Macro F1",
      value: (data.macro_f1_validacion * 100).toFixed(1) + "%",
      detail: "F1 macro ponderado en validacion.",
    },
    {
      label: "Recall alto riesgo",
      value: (data.recall_alto_validacion * 100).toFixed(1) + "%",
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
          <GlassPanel className={`h-full p-5 ${isLive ? "border-cyan-200" : ""}`}>
            <div className="flex items-center gap-2">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">{card.label}</div>
              {isLive && (
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
              )}
            </div>
            <div className="mt-3 font-mono text-3xl font-semibold text-slate-900">{card.value}</div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{card.detail}</p>
          </GlassPanel>
        </motion.div>
      ))}
    </div>
  );
}

// ── Convergencia ──────────────────────────────────────────────────────────────

function ConvergenceChart({ gens, isLive }: { gens: GeneracionHistorial[]; isLive?: boolean }) {
  const legendItems = [
    { label: "Azul: Mejor fitness", color: "#38bdf8" },
    { label: "Morado: Fitness promedio", color: "#818cf8" },
  ];

  const option = {
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
      title={isLive ? "Convergencia del fitness — en curso" : "Convergencia del fitness por generacion"}
      subtitle=""
    >
      <div className="mb-3 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 sm:text-sm">
        {legendItems.map((item) => (
          <span
            key={item.label}
            className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/75 px-3 py-1.5 shadow-sm"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
      <div className="h-[360px]">
        <ReactECharts
          notMerge={true}
          lazyUpdate={false}
          option={option}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </ChartPanel>
  );
}

// ── Comparacion base vs optimizado ────────────────────────────────────────────

function ComparisonChart({ comparacion }: { comparacion: GAComparacionResponse }) {
  const rows = comparacion.tabla_comparativa;

  const option = {
    backgroundColor: "transparent",
    animation: false,
    animationDuration: 0,
    animationDurationUpdate: 0,
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
          <ReactECharts
            notMerge={true}
            lazyUpdate={false}
            option={option}
            style={{ height: "100%", width: "100%" }}
          />
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

function ChromosomeTable({
  membresias,
  isLive,
}: {
  membresias: Record<string, Record<string, number[]>>;
  isLive?: boolean;
}) {
  return (
    <GlassPanel className={`mt-6 p-6 sm:p-7 ${isLive ? "border-cyan-200" : ""}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80">
          Mejor cromosoma — membresías decodificadas [a, b, c, d]
        </div>
        {isLive && (
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
        )}
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
