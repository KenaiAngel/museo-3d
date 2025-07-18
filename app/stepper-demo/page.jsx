"use client";
import React from "react";
import { StepperMUIDemo } from "../../components/ui/StepperMUI";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-900">
      <h1 className="text-3xl font-bold mb-8 text-indigo-700 dark:text-indigo-200">Demo Stepper Material UI</h1>
      <StepperMUIDemo />
    </div>
  );
} 