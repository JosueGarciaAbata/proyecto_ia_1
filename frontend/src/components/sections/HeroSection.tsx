import { motion } from "framer-motion";
import {
  Activity,
  BrainCircuit,
  Microscope,
  ShieldCheck,
} from "lucide-react";
import { heroStats } from "../../data/mockData";
import { GlassPanel } from "../ui/GlassPanel";

interface HeroSectionProps {
  activeSectionLabel: string;
  onOpenPatientEntry: () => void;
  onOpenOptimization: () => void;
}

const icons = [ShieldCheck, BrainCircuit, Microscope, Activity];

export function HeroSection({
  activeSectionLabel,
  onOpenOptimization,
  onOpenPatientEntry,
}: HeroSectionProps) {
  return (
    <section className="section-anchor relative overflow-hidden pt-8" id="hero">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-800">
            Riesgo materno
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.04] sm:text-5xl xl:text-6xl">
            Sistema de apoyo
            <span className="block bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
              a la decision medica
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Clasificacion de riesgo materno con logica difusa Mamdani y optimizacion genetica.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
              onClick={onOpenPatientEntry}
              type="button"
            >
              Ir al ingreso de datos
            </button>
            <button
              className="rounded-full border border-sky-200 bg-white/85 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-slate-900"
              onClick={onOpenOptimization}
              type="button"
            >
              Ver optimizacion
            </button>
          </div>
          <div className="mt-6 rounded-3xl border border-sky-100 bg-white/80 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Seccion activa
            </div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{activeSectionLabel}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
        >
          <GlassPanel className="grid-background relative overflow-hidden p-5 sm:p-6">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent" />
            <div className="mb-4">
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-700/80">
                  Resumen del sistema
                </p>
              <h2 className="mt-2 text-xl font-semibold">
                Componentes principales
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {heroStats.map((item, index) => {
                const Icon = icons[index];

                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-sky-100 bg-white/78 p-4 transition hover:border-cyan-300/35 hover:bg-cyan-50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl border border-cyan-300/30 bg-cyan-50 p-3 text-cyan-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                          {item.label}
                        </div>
                        <div className="mt-1 text-base font-semibold text-slate-900">
                          {item.value}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
}
