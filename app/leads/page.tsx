"use client";

import { useEffect, useState } from "react";
import InitialDetailsForm from "./components/InitialDetailsForm";
import WizardLayout from "./components/WizardLayout";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Step10 from "./components/Step10";

export default function DetailsPage() {
  const [initialCompleted, setInitialCompleted] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [lead, setLead] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

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

        // Fetch lead profile and applications via API
        const response = await fetch(`/api/leads?userId=${user.id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load data");
        }

        const { lead: leadData, applications: appsData } =
          await response.json();
        setLead(leadData);
        setApplications(appsData || []);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

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

      <main className="grow flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-5xl w-full p-8 sm:p-12 border border-blue-50">
            {/*  bg-white rounded-2xl shadow-lg */}
          {/* {!initialCompleted ? (
                        <InitialDetailsForm
                            lead={lead}
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
            <InitialDetailsForm onComplete={() => setInitialCompleted(true)} />
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
            />
          )}

          {wizardCompleted && <Step10 />}
        </div>
      </main>
    </div>
  );
}
