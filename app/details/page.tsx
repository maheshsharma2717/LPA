"use client";

import { useState } from "react";
import InitialDetailsForm from "./components/InitialDetailsForm";
import WizardLayout from "./components/WizardLayout";

export default function DetailsPage() {
  const [initialCompleted, setInitialCompleted] = useState(false);

  const [activeStep, setActiveStep] = useState(0);

  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [formData, setFormData] = useState<any>({
    who: {},
    "which-document": {},
    "which-donor": {},
    attorneys: {},
    "health-&-finances": {},
    "people-to-Notify": {},
    "application-information": {},
    "certificate-provider": {},
    "opg-fees": {},
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 py-4 px-6 sm:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-zenco-blue rounded-full"></div>
          <span className="text-lg font-bold text-zenco-dark tracking-tight">
            ZENCO<span className="text-zenco-blue">LEGAL</span>
          </span>
        </div>
      </header>

      <main className="grow flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-5xl w-full bg-white rounded-2xl shadow-lg p-8 sm:p-12 border border-blue-50">
          {!initialCompleted ? (
            <InitialDetailsForm onComplete={() => setInitialCompleted(true)} />
          ) : (
            <WizardLayout
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              completedSteps={completedSteps}
              setCompletedSteps={setCompletedSteps}
              formData={formData}
              setFormData={setFormData}
              onExitWizard={() => setInitialCompleted(false)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
