import { motion } from "framer-motion";
import {
  Activity,
  Droplets,
  HeartPulse,
  LoaderCircle,
  Stethoscope,
  Thermometer,
  UserRound,
} from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import type { PatientFormData } from "../../data/mockData";
import { GlassPanel } from "../ui/GlassPanel";
import { SectionHeader } from "../ui/SectionHeader";

interface PatientDataSectionProps {
  formData: PatientFormData;
  isAnalyzing: boolean;
  onFieldChange: (
    field: keyof PatientFormData,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onAnalyze: () => void;
}

const fields = [
  {
    key: "age",
    label: "Edad",
    helper: "Edad materna en anos",
    placeholder: "31",
    unit: "anos",
    icon: UserRound,
  },
  {
    key: "systolicBP",
    label: "Presion sistolica",
    helper: "Valor superior de referencia",
    placeholder: "146",
    unit: "mmHg",
    icon: Stethoscope,
  },
  {
    key: "diastolicBP",
    label: "Presion diastolica",
    helper: "Valor inferior de referencia",
    placeholder: "94",
    unit: "mmHg",
    icon: Activity,
  },
  {
    key: "bloodGlucose",
    label: "Glucosa / BS",
    helper: "Medicion de glucosa en sangre",
    placeholder: "7.8",
    unit: "mmol/L",
    icon: Droplets,
  },
  {
    key: "bodyTemperature",
    label: "Temperatura corporal",
    helper: "Registro termico observado",
    placeholder: "100.1",
    unit: "F",
    icon: Thermometer,
  },
  {
    key: "heartRate",
    label: "Frecuencia cardiaca",
    helper: "Frecuencia cardiaca observada",
    placeholder: "118",
    unit: "bpm",
    icon: HeartPulse,
  },
] as const;

export function PatientDataSection({
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
    <section className="section-anchor pt-10" id="patient-entry">
      <SectionHeader
        eyebrow="Ingreso clinico"
        title="Ingreso de datos del paciente"
        description="Ingrese los valores del caso."
      />
      <GlassPanel className="overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <form className="p-6 sm:p-8" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              {fields.map((field, index) => {
                const Icon = field.icon;

                return (
                  <motion.label
                    key={field.key}
                    className="rounded-3xl border border-sky-100 bg-white/78 p-4 transition hover:border-cyan-300/35 hover:bg-cyan-50"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl border border-cyan-300/30 bg-cyan-50 p-2.5 text-cyan-700">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block text-sm font-semibold text-slate-900">
                            {field.label}
                          </span>
                          <span className="text-xs text-slate-500">{field.helper}</span>
                        </div>
                      </div>
                      <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {field.unit}
                      </span>
                    </div>
                    <input
                      className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-200"
                      inputMode="decimal"
                      placeholder={field.placeholder}
                      type="text"
                      value={formData[field.key]}
                      onChange={(event) => onFieldChange(field.key, event)}
                    />
                  </motion.label>
                );
              })}
            </div>

            <label className="mt-5 block rounded-3xl border border-sky-100 bg-white/78 p-4 transition hover:border-cyan-300/35 hover:bg-cyan-50">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <span className="block text-sm font-semibold text-slate-900">
                    Sintomas / observaciones
                  </span>
                </div>
                <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                  Texto libre
                </span>
              </div>
              <textarea
                className="min-h-32 w-full resize-none rounded-2xl border border-sky-100 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-200"
                placeholder="Cefalea, edema, mareo, cambios relevantes o cualquier observacion clinica..."
                value={formData.observations}
                onChange={(event) => onFieldChange("observations", event)}
              />
            </label>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <button
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] hover:brightness-105 disabled:cursor-wait disabled:opacity-90"
                disabled={isAnalyzing}
                type="submit"
              >
                {isAnalyzing ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Analizando caso
                  </>
                ) : (
                  "Ejecutar analisis"
                )}
              </button>
            </div>
          </form>

          <div className="border-t border-sky-100 bg-sky-50/45 p-6 sm:p-8 lg:border-l lg:border-t-0">
            <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80">
                Campos
              </div>
              <div className="mt-3 grid gap-3 text-sm text-slate-700">
                <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3">
                  Edad, presion sistolica, presion diastolica
                </div>
                <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3">
                  Glucosa, temperatura corporal, frecuencia cardiaca
                </div>
                <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3">
                  Observaciones clinicas
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassPanel>
    </section>
  );
}
