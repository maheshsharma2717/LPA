"use client";

import {useState, useEffect} from "react";
import {useRouter, usePathname, useSearchParams} from "next/navigation";
import {Stepper, Step, StepLabel, Button, CircularProgress} from "@mui/material";
import {steps} from "../step-config";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onExitWizard: () => void;
  onFinish: () => void;
  currentDonorIndex: number;
};

export default function WizardLayout({
  activeStep,
  setActiveStep,
  completedSteps,
  setCompletedSteps,
  formData,
  setFormData,
  onExitWizard,
  onFinish,
  currentDonorIndex
}: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const currentStepKey = steps[activeStep].key;
    const currentParam = searchParams.get('step');
    
    if (currentParam !== currentStepKey) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('step', currentStepKey);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [activeStep, pathname, router, searchParams]);

  const handleNext = async () => {
    setIsSaving(true);
  };

  const onNavigateNext = () => {
    setCompletedSteps((prev) =>
      prev.includes(activeStep) ? prev : [...prev, activeStep],
    );

    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      onFinish?.();
    }
    setIsSaving(false);
  };

  const handleBack = () => {
    if (activeStep === 0) {
      onExitWizard();
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
        <div className="w-full">
          <Stepper
            activeStep={activeStep}
            alternativeLabel
            sx={{
              "& .MuiStepIcon-root.Mui-active": {
                color: "#28a745",
              },
              "& .MuiStepIcon-root.Mui-completed": {
                color: "#28a745",
              },
              "& .MuiStepLabel-label.Mui-active": {
                fontWeight: 600,
                color: "#1f2937",
              },
              "& .MuiStepLabel-labelContainer": {
                display: {xs: "none", md: "block"},
              },
            }}
          >
            {steps.map((step, index) => (
              <Step key={step.key} completed={completedSteps.includes(index)}>
                <StepLabel
                  onClick={() => handleStepClick(index)}
                  sx={{cursor: (completedSteps.includes(index) || index === activeStep) ? 'pointer' : 'default'}}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Active Step Label for Mobile */}
          <div className="text-center mt-4 md:hidden font-semibold text-zenco-dark text-lg">
            {steps[activeStep].label}
          </div>
        </div>

        {/* Current Step Content */}
        <div>
          <CurrentStepComponent
            data={formData[steps[activeStep].key]}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            updateData={(data: any) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setFormData((prev: any) => ({
                ...prev,
                [steps[activeStep].key]: data,
              }))
            }
            onNext={onNavigateNext}
            isSaving={isSaving}
            allFormData={formData}
            currentDonorIndex={currentDonorIndex}
          />
        </div>

        {/* Navigation Buttons - Show only if not hidden by step config */}
        {!steps[activeStep].hideNext && (
          <div className="flex justify-between pt-6">
            <Button
              onClick={handleBack}
              sx={{color: '#6b7280', textTransform: 'none'}}
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
                "&:hover": {backgroundColor: "#1d4ed8"},
              }}
            >
              {isSaving ? <CircularProgress size={24} color="inherit" /> : (activeStep === steps.length - 1 ? "Finish" : "Next")}
            </Button>
          </div>
        )}
      </div></>

  );
}
