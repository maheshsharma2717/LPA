"use client";

import { useEffect, useState, Suspense } from "react";
import InitialDetailsForm from "./components/InitialDetailsForm";
import WizardLayout from "./components/WizardLayout";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Step10 from "./components/Step10";

export default function DetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenco-blue"></div>
      </div>
    }>
      <DetailsPageContent />
    </Suspense>
  );
}

function DetailsPageContent() {
  const [initialCompleted, setInitialCompleted] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [lead, setLead] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const searchParams = useSearchParams();
  const [currentDonorIndex, setCurrentDonorIndex] = useState(
    parseInt(searchParams.get("currentDonorIndex") || "0")
  );

  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [wizardCompleted, setWizardCompleted] = useState(false);

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

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }
        setUser(user);

        const { data: leads, error: leadError } = await supabase
          .from("leads")
          .select("*")
          .eq("id", user.id)
          .limit(1);

        const leadData = leads?.[0];


        const { data: appsData, error: appsError } = await supabase
          .from("applications")
          .select("*")
          .eq("lead_id", user.id)
          .is("deleted_at", null);

        if (appsError) {
          throw appsError;
        }

        setLead(leadData);
        setApplications(appsData || []);

        // Auto-complete initial form if lead is already filled out
        if (leadData?.first_name && leadData?.address_line_1) {
          setInitialCompleted(true);
        }
      } catch (err: any) {
        console.error("Unexpected error:", err);
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  // Sync state with URL but also handle wizard reset when transitioning between donors
  useEffect(() => {
    const idxStr = searchParams.get("currentDonorIndex");
    const newIndex = parseInt(idxStr || "0");

    if (newIndex !== currentDonorIndex) {
      setCurrentDonorIndex(newIndex);

      // If it's a secondary donor, jump directly to Step 3 (index 2)
      if (newIndex > 0) {
        setActiveStep(2); // Jump to "About You (Donor)" step
        setWizardCompleted(false);
        setCompletedSteps([0, 1]); // Mark Who and Which Document as completed
        setInitialCompleted(true);
      }
    }
  }, [searchParams, currentDonorIndex]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenco-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="zen_logo.png" className="w-20" alt="Zenco Logo" />
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-700 hover:text-zenco-blue transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="grow flex justify-center sm:p-12">
        <div className="max-w-5xl w-full">
          {/*  bg-white rounded-2xl shadow-lg */}
          {/* {!initialCompleted ? (
                        <InitialDetailsForm
                            lead={lead}
                            userId={user?.id}
                            onComplete={() => setInitialCompleted(true)}
                        />
                    ) : (
                        <WizardLayout
                            activeStep={activeStep}
                            setActiveStep={setActiveStep}
                            completedSteps={completedSteps}
                            setCompletedSteps={setCompletedSteps}
                            formData={formData}
                            setFormData={setFormData}
                            onExitWizard={() => setInitialCompleted(false)}
                            onFinish={() => setWizardCompleted(true)}
                        />
                    )
                    } */}
          {!initialCompleted && (
            <InitialDetailsForm
              lead={lead}
              userId={user?.id}
              onComplete={() => setInitialCompleted(true)}
            />
          )}

          {initialCompleted && !wizardCompleted && (
            <WizardLayout
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              completedSteps={completedSteps}
              setCompletedSteps={setCompletedSteps}
              formData={formData}
              setFormData={setFormData}
              onExitWizard={() => setInitialCompleted(false)}
              onFinish={() => setWizardCompleted(true)}
              currentDonorIndex={currentDonorIndex}
            />
          )}

          {wizardCompleted && (
            <Step10
              allFormData={formData}
              onEdit={(stepIndex: number) => {
                setActiveStep(stepIndex);
                setWizardCompleted(false);
              }}
              currentDonorIndex={currentDonorIndex}
            />
          )}
        </div>
      </main>
    </div>
  );
}
