import { motion } from "framer-motion";
import {
  Activity,
  Droplets,
  HeartPulse,
  LoaderCircle,
  Stethoscope,
  Thermometer,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import type { PatientFormData } from "../../data/mockData";
import { getFieldRange, numericFieldSpecs, type NumericFormField } from "../../lib/riesgoMaterno";
import { cn } from "../../lib/utils";
import { GlassPanel } from "../ui/GlassPanel";
import { SectionHeader } from "../ui/SectionHeader";

interface PatientDataSectionProps {
  formData: PatientFormData;
  isAnalyzing: boolean;
  onFieldChange: (
    field: keyof PatientFormData,
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  onAnalyze: () => void;
  compact?: boolean;
}

const iconByField: Record<NumericFormField, LucideIcon> = {
  age: UserRound,
  systolicBP: Stethoscope,
  diastolicBP: Activity,
  bloodGlucose: Droplets,
  bodyTemperature: Thermometer,
  heartRate: HeartPulse,
};

export function PatientDataSection({
  compact = false,
  formData,
  isAnalyzing,
  onFieldChange,
  onAnalyze,
}: PatientDataSectionProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAnalyze();
  }

  return (
    <section className={cn("section-anchor", compact ? "" : "pt-10")} id="patient-entry">
      {!compact ? (
        <SectionHeader
          eyebrow="Ingreso clinico"
          title="Variables del paciente"
          description="Ingrese los 6 indicadores clinicos para ejecutar la inferencia difusa."
        />
      ) : null}

      <GlassPanel className="overflow-hidden">
        <div className="border-b border-sky-100/80 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700/80">
                Entrada clinica
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Variables del paciente
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ingrese los indicadores clinicos del caso.
              </p>
            </div>
          </div>
        </div>

        <form className="p-5 sm:p-6" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {numericFieldSpecs.map((field, index) => {
              const Icon = iconByField[field.formKey];

              return (
                <motion.label
                  key={field.formKey}
                  className="rounded-[1.6rem] border border-sky-100 bg-white/82 p-3.5 transition hover:border-cyan-300/35 hover:bg-cyan-50/40"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.34, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-2xl border border-cyan-300/30 bg-cyan-50 p-2 text-cyan-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900">
                          {field.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-5 text-slate-400">
                          {getFieldRange(field.formKey)}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {field.unit}
                    </span>
                  </div>

                  <div className="relative mt-3">
                    <input
                      className="w-full rounded-2xl border border-sky-100 bg-white px-3.5 py-2.5 pr-16 text-[15px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-200"
                      inputMode="decimal"
                      max={field.max}
                      min={field.min}
                      placeholder={field.placeholder}
                      step={field.step}
                      type="number"
                      value={formData[field.formKey]}
                      onChange={(event) => onFieldChange(field.formKey, event)}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {field.unit}
                    </span>
                  </div>
                </motion.label>
              );
            })}
          </div>

          <div className="sticky bottom-0 z-10 -mx-5 mt-5 border-t border-sky-100/90 bg-white/92 px-5 py-4 backdrop-blur sm:-mx-6 sm:px-6">
            <div className="flex justify-end">
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-wait disabled:opacity-90 sm:w-auto"
                disabled={isAnalyzing}
                type="submit"
              >
                {isAnalyzing ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Ejecutando inferencia...
                  </>
                ) : (
                  "Ejecutar inferencia"
                )}
              </button>
            </div>
          </div>
        </form>
      </GlassPanel>
    </section>
  );
}
