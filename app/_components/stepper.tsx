"use client";

import React from "react";
import { cn } from "@/src/lib/utils";

interface StepperProps {
  steps: string[];
  current: number;
  className?: string;
}

export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                index < current
                  ? "bg-[#FFC700] text-black"
                  : index === current
                  ? "bg-[#FFC700]/20 text-[#FFC700] border-2 border-[#FFC700]"
                  : "bg-white/10 text-white/50"
              )}
            >
              {index < current ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <span
              className={cn(
                "mt-2 text-xs hidden sm:block transition-colors",
                index <= current ? "text-white" : "text-white/50"
              )}
            >
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "flex-1 h-0.5 mx-2 transition-colors",
                index < current ? "bg-[#FFC700]" : "bg-white/20"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
