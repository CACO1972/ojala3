"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { SYMPTOMS, AGENDA_ONLINE_URL, WHATSAPP_URL, type PatientType } from "@/src/lib/constants";

type Step = 1 | 2 | 3;

export default function DiagnosticoPage() {
  const [step, setStep] = useState<Step>(1);
  const [patientType, setPatientType] = useState<PatientType>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const resetToHome = () => {
    setStep(1);
    setPatientType(null);
    setSelectedSymptoms([]);
    setAnalysis("");
  };

  const handlePatientTypeSelect = (type: PatientType) => {
    setPatientType(type);
    setStep(2);
  };

  const toggleSymptom = (id: string, checked: boolean) => {
    setSelectedSymptoms((prev) =>
      checked ? [...prev, id] : prev.filter((s) => s !== id)
    );
  };

  const streamAnalysis = useCallback(async (symptomLabels: string[], patientType: PatientType) => {
    const resp = await fetch("/api/diagnosis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms: symptomLabels, patientType }),
    });

    if (!resp.ok || !resp.body) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || "Error al obtener diagnóstico");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;
    let fullText = "";

    setStep(3);
    setIsStreaming(true);

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullText += content;
            setAnalysis(fullText);
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    setIsStreaming(false);
  }, []);

  const generateAnalysis = async () => {
    if (selectedSymptoms.length === 0) {
      toast.error("Por favor selecciona al menos una opción");
      return;
    }

    setIsLoading(true);
    setAnalysis("");
    
    try {
      const symptomLabels = selectedSymptoms.map(
        (id) => SYMPTOMS.find((s) => s.id === id)?.label || id
      );

      await streamAnalysis(symptomLabels, patientType);
    } catch (error) {
      console.error("Diagnosis error:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Error al procesar tu solicitud. Por favor intenta de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (step) {
      case 1: return "¿Cómo podemos ayudarte?";
      case 2: return "Cuéntanos un poco más";
      case 3: return "Tu orientación inicial";
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case 1: return "Selecciona una opción para comenzar.";
      case 2: return "Puedes marcar más de una opción";
      case 3: return "Basada en lo que nos contaste";
    }
  };

  return (
    <main className="relative min-h-screen">
      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded border border-primary/50">
            <span className="font-display text-xl text-primary">M</span>
          </div>
          <span className="hidden font-display text-xl tracking-[0.25em] text-white sm:block">MIRÓ</span>
        </Link>
        
        <Link href="/" className="nav-link">
          ← Volver al inicio
        </Link>
      </header>

      {/* Content */}
      <div className="container-narrow relative z-10 py-8">
        <div className="text-center pb-8">
          <span className="font-mono text-xs tracking-[0.25em] uppercase text-primary">
            Diagnóstico IA
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-extralight text-foreground mt-3 mb-2">
            {getTitle()}
          </h1>
          <p className="text-muted-foreground">{getSubtitle()}</p>
        </div>

        {/* Step 1: Patient Type Selection */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in-up">
            <SelectionCard
              icon="🦷"
              title="Soy paciente nuevo"
              onClick={() => handlePatientTypeSelect("nuevo")}
            />
            <SelectionCard
              icon="📋"
              title="Ya soy paciente de Clínica Miró"
              onClick={() => handlePatientTypeSelect("existente")}
            />
            <SelectionCard
              icon="🩻"
              title="Quiero una segunda opinión"
              onClick={() => handlePatientTypeSelect("opinion")}
            />
          </div>
        )}

        {/* Step 2: Symptom Selection */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <h3 className="font-display font-light text-foreground mb-4">
              ¿Qué te está pasando hoy?
            </h3>

            <div className="card p-5 mb-6">
              {SYMPTOMS.map((symptom) => (
                <label
                  key={symptom.id}
                  className="flex items-center gap-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-white/5 -mx-5 px-5 transition-colors"
                >
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={selectedSymptoms.includes(symptom.id)}
                    onChange={(e) => toggleSymptom(symptom.id, e.target.checked)}
                  />
                  <span className="text-foreground">{symptom.label}</span>
                </label>
              ))}
            </div>

            <div className="space-y-3">
              <button 
                onClick={generateAnalysis} 
                className="btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? "Analizando..." : "Continuar"}
              </button>
              <button 
                onClick={() => setStep(1)} 
                className="w-full py-3 text-sm text-white/50 hover:text-white transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Analysis Results */}
        {step === 3 && (
          <div className="animate-fade-in-up">
            <div className="card p-6 mb-6 min-h-[200px]">
              <div className="prose-diagnosis">
                {analysis.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) {
                    return <h2 key={i}>{line.replace('## ', '')}</h2>;
                  }
                  if (line.startsWith('- ')) {
                    return <li key={i}>{line.replace('- ', '')}</li>;
                  }
                  if (line.trim()) {
                    return <p key={i}>{line}</p>;
                  }
                  return null;
                })}
                {isStreaming && (
                  <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse" />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <a href={AGENDA_ONLINE_URL} target="_blank" rel="noreferrer">
                <button className="btn-primary w-full" disabled={isStreaming}>
                  Agendar evaluación gratuita
                </button>
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                <button className="btn-outline w-full" disabled={isStreaming}>
                  Consultar por WhatsApp
                </button>
              </a>
              <button 
                onClick={resetToHome} 
                className="w-full py-3 text-sm text-white/50 hover:text-white transition-colors"
                disabled={isStreaming}
              >
                ← Volver al inicio
              </button>
            </div>
          </div>
        )}

        <footer className="text-center text-xs text-muted-foreground mt-12 pb-4">
          Confidencialidad médica garantizada · Clínica Miró
        </footer>
      </div>
    </main>
  );
}

// Selection Card Component
function SelectionCard({ 
  icon, 
  title, 
  onClick 
}: { 
  icon: string; 
  title: string; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="card-selection w-full text-left flex items-center gap-4"
    >
      <span className="text-3xl">{icon}</span>
      <span className="font-display text-lg font-light text-foreground">{title}</span>
    </button>
  );
}
