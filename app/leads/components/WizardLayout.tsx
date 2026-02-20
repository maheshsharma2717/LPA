"use client";

import { useState } from "react";
import { Stepper, Step, StepLabel, Button, CircularProgress } from "@mui/material";
import { steps } from "../step-config";
import WhoTab from "./steps/Step1Who";
import WhichDoucmentsTab from "./steps/Step2WhichDocuments";
import DonorTab from "./steps/Step3TheDonor";
import AttorneysTab from "./steps/Step4Attorneys";
import HealthFinanceTab from "./steps/Step5HealthFinance";
import PeopleToNotifyTab from "./steps/Step6PeopleToNotify";
import ApplicationInfoTab from "./steps/Step7ApplicationInformation";
import CertificateProviderTab from "./steps/Step8CertificateProvider";
import OPGFeesTab from "./steps/Step9OPGFees";


type Props = {
  activeStep: number;
  setActiveStep: (step: number) => void;
  completedSteps: number[];
  setCompletedSteps: React.Dispatch<React.SetStateAction<number[]>>;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onExitWizard: () => void;
  onFinish: () => void;

};

export default function WizardLayout({
  activeStep,
  setActiveStep,
  completedSteps,
  setCompletedSteps,
  formData,
  setFormData,
  onExitWizard,
  onFinish
}: Props) {
  // Map step key to component
  const stepComponentMap: Record<string, any> = {
    who: WhoTab,
    "which-document": WhichDoucmentsTab,
    "which-donor": DonorTab,
    attorneys: AttorneysTab,
    "health-&-finances": HealthFinanceTab,
    "people-to-Notify": PeopleToNotifyTab,
    "application-information": ApplicationInfoTab,
    "certificate-provider": CertificateProviderTab,
    "opg-fees": OPGFeesTab,
  };

  const CurrentStepComponent = stepComponentMap[steps[activeStep].key];

  const [isSaving, setIsSaving] = useState(false);

  const handleNext = async () => {
    setIsSaving(true);
    // This triggers the useEffect [isSaving] in Child components
  };

  const onNavigateNext = () => {
    setCompletedSteps((prev) =>
      prev.includes(activeStep) ? prev : [...prev, activeStep],
    );

    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
    setIsSaving(false);
  };

  const handleBack = () => {
    if (activeStep === 0) {
      onExitWizard(); // Go back to initial form
      return;
    }
    setActiveStep(activeStep - 1);
  };

  const handleStepClick = (index: number) => {
    if (completedSteps.includes(index) || index === activeStep) {
      setActiveStep(index);
    }
  };

  return (
    <>
    <div className="space-y-10">
      {/* Horizontal Stepper */}
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          "& .MuiStepIcon-root.Mui-active": {
            color: "#08B9ED", // zenco-blue
          },
          "& .MuiStepIcon-root.Mui-completed": {
            color: "#08B9ED",
          },
          "& .MuiStepLabel-label.Mui-active": {
            fontWeight: 600,
            color: "#1f2937", // zenco-dark
          },
        }}
      >
        {steps.map((step, index) => (
          <Step key={step.key} completed={completedSteps.includes(index)}>
            <StepLabel
              onClick={() => handleStepClick(index)}
              sx={{ cursor: (completedSteps.includes(index) || index === activeStep) ? 'pointer' : 'default' }}
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Current Step Content */}
      <div>
        <CurrentStepComponent
          data={formData[steps[activeStep].key]}
          updateData={(data: any) =>
            setFormData((prev: any) => ({
              ...prev,
              [steps[activeStep].key]: data,
            }))
          }
          onNext={onNavigateNext} // Successful completion of save triggers navigation
          isSaving={isSaving}
          allFormData={formData}
        />
      </div>

      {/* Navigation Buttons - Show only if not hidden by step config */}
      {!steps[activeStep].hideNext && (
        <div className="flex justify-between pt-6">
          <Button
            onClick={handleBack}
            sx={{ color: '#6b7280', textTransform: 'none' }}
          >
            Back
          </Button>

          <Button
            variant="contained"
            disabled={isSaving}
            onClick={handleNext}
            sx={{
              backgroundColor: "#08B9ED",
              textTransform: "none",
              borderRadius: "8px",
              padding: "8px 32px",
              "&:hover": { backgroundColor: "#1d4ed8" },
            }}
          >
            {isSaving ? <CircularProgress size={24} color="inherit" /> : (activeStep === steps.length - 1 ? "Finish" : "Next")}
          </Button>
        </div>
      )}
    </div></>
    
  );
}
