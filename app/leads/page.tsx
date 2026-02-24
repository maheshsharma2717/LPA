"use client";

import { useEffect, useState, Suspense } from "react";
import InitialDetailsForm from "./components/InitialDetailsForm";
import WizardLayout from "./components/WizardLayout";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Step10 from "./components/Step10";
import"./components/steps/Steps.module.css";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lead, setLead] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  const [applications, setApplications] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const searchParams = useSearchParams();
  const [currentDonorIndex, setCurrentDonorIndex] = useState(
    parseInt(searchParams.get("currentDonorIndex") || "0")
  );

  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [wizardCompleted, setWizardCompleted] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // localStorage key scoped per user
  const storageKey = (userId: string) => `lpa_wizard_state_${userId}`;

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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

        // Restore wizard state from localStorage
        const saved = localStorage.getItem(storageKey(user.id));
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.formData) setFormData(parsed.formData);
            if (parsed.completedSteps) setCompletedSteps(parsed.completedSteps);
            if (typeof parsed.activeStep === "number") setActiveStep(parsed.activeStep);
            if (typeof parsed.initialCompleted === "boolean") {
              setInitialCompleted(parsed.initialCompleted);
            }
          } catch {
            // corrupted storage, ignore
          }
        }

        // Always auto-complete initial form if lead data already exists in DB
        if (leadData?.first_name && leadData?.address_line_1) {
          setInitialCompleted(true);
        }
      } catch (err: unknown) {
        console.error("Unexpected error:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  // Persist wizard state to localStorage whenever it changes
  useEffect(() => {
    if (!user) return;
    const state = { activeStep, completedSteps, initialCompleted, formData };
    localStorage.setItem(storageKey(user.id), JSON.stringify(state));
  }, [activeStep, completedSteps, initialCompleted, formData, user]);

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

  // Clear persisted state on wizard completion
  const handleWizardComplete = () => {
    if (user) {
      localStorage.removeItem(storageKey(user.id));
    }
    setWizardCompleted(true);
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
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

      <main className="grow flex justify-center sm:p-12 w-full">
        <div className="max-w-5xl w-full">
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
              onFinish={handleWizardComplete}
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

