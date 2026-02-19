"use client";

import { Stepper, Step, StepLabel, Button } from "@mui/material";
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

  const handleNext = () => {
    setCompletedSteps((prev) =>
      prev.includes(activeStep) ? prev : [...prev, activeStep],
    );

    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else{
      onFinish();
    }
  };

  const handleBack = () => {
    if (activeStep === 0) {
      onExitWizard(); // Go back to initial form
      return;
    }
    setActiveStep(activeStep - 1);

    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
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
            color: "#2563eb", // zenco-blue
          },
          "& .MuiStepIcon-root.Mui-completed": {
            color: "#2563eb",
          },
          "& .MuiStepLabel-label.Mui-active": {
            fontWeight: 600,
            color: "#1f2937", // zenco-dark
          },
        }}
      >
        {steps.map((step, index) => (
          <Step key={step.key} completed={completedSteps.includes(index)}>
            <StepLabel onClick={() => handleStepClick(index)}>
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
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button 
        // disabled={activeStep === 0} 
        onClick={handleBack}>
          Back
        </Button>

        <Button
          variant="contained"
          onClick={handleNext}
          sx={{
            backgroundColor: "#2563eb",
            "&:hover": { backgroundColor: "#1d4ed8" },
          }}
        >
          {activeStep === steps.length - 1 ? "Finish" : "Next"}
        </Button>
      </div>
    </div></>
    
  );
}
