"use client";

import React from "react";
import { cn } from "@/src/lib/utils";

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({ 
  children, 
  className, 
  variant = "primary", 
  size = "md",
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#FFC700] text-black hover:bg-[#FFD740] hover:scale-105",
    outline: "border border-white/30 text-white hover:bg-white/10",
    ghost: "text-white/70 hover:text-white hover:bg-white/5"
  };
  
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

// Card
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        "bg-white/[0.03] border border-white/10 p-6 md:p-8 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm text-white/70">{label}</label>
      )}
      <input
        className={cn(
          "w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder-white/40",
          "transition-all duration-200 focus:outline-none focus:border-[#FFC700] focus:bg-white/10",
          error && "border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

// Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm text-white/70">{label}</label>
      )}
      <textarea
        className={cn(
          "w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder-white/40",
          "transition-all duration-200 focus:outline-none focus:border-[#FFC700] focus:bg-white/10",
          "min-h-[100px] resize-y",
          error && "border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
