"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { cn } from "@/src/lib/utils";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  kind: ToastKind;
}

interface ToastContextType {
  toasts: ToastItem[];
  push: (toast: { title: string; description?: string; kind?: ToastKind }) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback(({ title, description, kind = "info" }: { title: string; description?: string; kind?: ToastKind }) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, title, description, kind }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, dismiss }: { toasts: ToastItem[]; dismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "px-4 py-3 rounded shadow-lg min-w-[280px]",
            t.kind === "success" && "bg-green-600 text-white",
            t.kind === "error" && "bg-red-600 text-white",
            t.kind === "info" && "bg-[#FFC700] text-black"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="font-medium">{t.title}</p>
              {t.description && <p className="text-sm opacity-90">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="opacity-70 hover:opacity-100">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  
  if (!context) {
    return {
      push: ({ title, description, kind }) => {
        console.log(`Toast [${kind}]: ${title} - ${description}`);
      },
      toasts: [],
      dismiss: () => {}
    };
  }
  
  return context;
}
