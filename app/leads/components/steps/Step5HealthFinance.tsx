"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { supabase } from "@/lib/supabase";

type LpaDoc = {
  id: string;
  donor_id: string;
  lpa_type: "health_and_welfare" | "property_and_finance";
  life_sustaining_treatment?: boolean | null;
  when_attorneys_can_act?: string | null;
};

type Props = {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  isSaving: boolean;
  allFormData: any;
};

export default function HealthFinanceTab({ onNext, isSaving, allFormData, updateData }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Donor info
  const [donorName, setDonorName] = useState("");
  const [donorFirstName, setDonorFirstName] = useState("");

  // LPA docs for this donor
  const [lpaDocs, setLpaDocs] = useState<LpaDoc[]>([]);
  const hasHealth = lpaDocs.some((d) => d.lpa_type === "health_and_welfare");
  const hasFinance = lpaDocs.some((d) => d.lpa_type === "property_and_finance");

  // Internal sub-step tracking
  const [subStep, setSubStep] = useState(0);

  // Health & Welfare: life-sustaining treatment
  const [lifeSustaining, setLifeSustaining] = useState<boolean | null>(null);

  // Property & Finance: when attorneys can act
  const [whenCanAct, setWhenCanAct] = useState<"when_registered" | "loss_of_capacity" | null>(null);

  const applicationId = allFormData?.who?.applicationId;

  // ─── Data Fetch ───────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if (!applicationId) { setLoading(false); return; }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const token = session.access_token;

        // 1. Fetch all donors for this application
        const donorsRes = await fetch(`/api/donors?applicationId=${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: donors } = await donorsRes.json();

        if (!donors || donors.length === 0) {
          setLoading(false);
          return;
        }

        // 2. Determine active donors (same logic used in Step 2, 3, 4)
        const step1Selection = allFormData?.who?.selection;
        const step1SelectedIds = allFormData?.who?.selectedPeopleIds || [];
        const isLeadSelected =
          step1Selection === "You" ||
          step1Selection === "You and your partner" ||
          step1Selection === "You and someone else";

        const activeDonors = donors.filter((d: any) => {
          if (d.is_lead) return isLeadSelected;
          return step1SelectedIds.includes(d.id);
        });

        const firstDonor = activeDonors[0];
        if (!firstDonor) {
          setLoading(false);
          return;
        }

        setDonorName(`${firstDonor.first_name} ${firstDonor.last_name}`);
        setDonorFirstName(firstDonor.first_name);

        // 3. Fetch LPA documents for this specific donor
        const lpasRes = await fetch(`/api/lpa-documents?donorId=${firstDonor.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: docs } = await lpasRes.json();

        if (docs && Array.isArray(docs) && docs.length > 0) {
          setLpaDocs(docs);

          // Restore saved preferences from DB
          const healthDoc = docs.find((d: any) => d.lpa_type === "health_and_welfare");
          const financeDoc = docs.find((d: any) => d.lpa_type === "property_and_finance");

          if (healthDoc?.life_sustaining_treatment !== null && healthDoc?.life_sustaining_treatment !== undefined) {
            setLifeSustaining(healthDoc.life_sustaining_treatment);
          }
          if (financeDoc?.when_attorneys_can_act) {
            setWhenCanAct(financeDoc.when_attorneys_can_act as "when_registered" | "loss_of_capacity");
          }
        }

        // Also restore from wizard formData if available
        const saved = allFormData?.["health-&-finances"];
        if (saved) {
          if (saved.lifeSustaining !== undefined && saved.lifeSustaining !== null) setLifeSustaining(saved.lifeSustaining);
          if (saved.whenCanAct) setWhenCanAct(saved.whenCanAct);
        }
      } catch (err) {
        console.error("Error loading Step 5:", err);
        setError("Failed to load health & finance details.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [applicationId]);

  // ─── Determine which pages to show ────────────────────────
  const pages: ("health" | "finance")[] = [];
  if (hasHealth) pages.push("health");
  if (hasFinance) pages.push("finance");
  const currentPage = pages[subStep] || null;

  // ─── Save & Navigate ─────────────────────────────────────
  const handleInternalNext = async () => {
    if (currentPage === "health") {
      if (lifeSustaining === null) {
        setError("Please select an option.");
        return;
      }
      setError(null);

      // If there's a finance page next, go to it
      if (subStep < pages.length - 1) {
        setSubStep(subStep + 1);
        window.scrollTo(0, 0);
        return;
      }
    }

    if (currentPage === "finance") {
      if (whenCanAct === null) {
        setError("Please select an option.");
        return;
      }
      setError(null);
    }

    // Final save — persist to DB
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;

      // Save life-sustaining treatment to the health LPA document
      const healthDoc = lpaDocs.find((d) => d.lpa_type === "health_and_welfare");
      if (healthDoc && lifeSustaining !== null) {
        await fetch("/api/lpa-documents", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            id: healthDoc.id,
            life_sustaining_treatment: lifeSustaining,
          }),
        });
      }

      // Save when_attorneys_can_act to the finance LPA document
      const financeDoc = lpaDocs.find((d) => d.lpa_type === "property_and_finance");
      if (financeDoc && whenCanAct !== null) {
        await fetch("/api/lpa-documents", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            id: financeDoc.id,
            when_attorneys_can_act: whenCanAct,
          }),
        });
      }

      // Save to wizard formData for state restoration
      updateData({
        lifeSustaining,
        whenCanAct,
      });

      onNext();
    } catch (err) {
      console.error("Error saving health & finance:", err);
      setError("Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInternalBack = () => {
    if (subStep > 0) {
      setSubStep(subStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // ─── Render ───────────────────────────────────────────────
  if (loading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;

  if (pages.length === 0) {
    return (
      <Alert severity="info">
        No LPA documents found for the current donor. Please go back and select a document type in Step 2.
      </Alert>
    );
  }

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-top-4">

      {/* ═══════ HEALTH & WELFARE: LIFE-SUSTAINING TREATMENT ═══════ */}
      {currentPage === "health" && (
        <div className="space-y-6 animate-in fade-in">
          <h1 className="text-center text-3xl font-bold text-zenco-dark">
            Life-sustaining <span className="text-zenco-blue">Treatment</span>
          </h1>

          <div className="h-1 bg-gradient-to-r from-zenco-blue to-blue-400 rounded-full" />

          <div className="flex flex-col gap-3 text-gray-700">
            <p>
              <span className="text-zenco-blue font-semibold">{donorName}</span>{" "}
              must choose what they want to happen if they needed medical help to keep them alive and
              they no longer had mental capacity.
            </p>
            <p>
              If they choose YES and{" "}
              <span className="text-zenco-blue font-semibold">{donorName}</span>{" "}
              ever needed life-sustaining treatment but can&apos;t make decisions, the
              attorneys can speak to doctors on their behalf as if they were{" "}
              <span className="text-zenco-blue font-semibold">{donorName}</span>.
            </p>
            <p>
              If you choose NO doctors will make decisions about life-sustaining treatment for{" "}
              <span className="text-zenco-blue font-semibold">{donorName}</span>.
            </p>
          </div>

          <p className="text-xl font-semibold text-zenco-dark">
            Do you want the attorneys to make decisions about life-sustaining treatment?
          </p>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <div className="flex flex-col gap-0 max-w-xl">
            <button
              onClick={() => setLifeSustaining(true)}
              className={`border-2 p-4 text-center transition-all ${lifeSustaining === true
                ? "border-[#334a5e] bg-[#334a5e] text-white font-semibold"
                : "border-gray-300 hover:bg-gray-50"
                }`}
            >
              Yes - give the attorneys authority
            </button>
            <button
              onClick={() => setLifeSustaining(false)}
              className={`border-2 border-t-0 p-4 text-center transition-all ${lifeSustaining === false
                ? "border-[#334a5e] bg-[#334a5e] text-white font-semibold"
                : "border-gray-300 hover:bg-gray-50"
                }`}
            >
              No - do not give the attorneys authority
            </button>
          </div>
        </div>
      )}

      {/* ═══════ PROPERTY & FINANCE: WHEN ATTORNEYS CAN ACT ═══════ */}
      {currentPage === "finance" && (
        <div className="space-y-6 animate-in fade-in">
          <h1 className="text-center text-3xl font-bold text-zenco-dark">
            When do the <span className="text-zenco-blue">property and finance documents become effective?</span>
          </h1>

          <div className="h-1 bg-gradient-to-r from-zenco-blue to-blue-400 rounded-full" />

          <div className="flex flex-col gap-4 text-gray-700">
            <p>
              {donorName} can choose to allow the attorneys to make decisions either:
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                As soon as the lasting power of attorney has been registered by the Office of the Public Guardian
              </li>
              <li>
                Only when {donorFirstName} doesn&apos;t have mental capacity
              </li>
            </ul>

            <p className="text-zenco-blue text-sm italic">
              Most people choose the first option of &apos;As soon as the lasting power of attorney has been registered&apos;.
            </p>
          </div>

          <p className="text-xl font-semibold text-zenco-dark">
            When do you want the attorneys to be able to make decisions?
          </p>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <div className="flex flex-col gap-4 max-w-2xl">
            {/* Option 1: As soon as registered */}
            <div
              onClick={() => setWhenCanAct("when_registered")}
              className={`border-2 p-5 rounded-lg cursor-pointer transition-all ${whenCanAct === "when_registered"
                ? "border-[#334a5e] bg-white shadow-md"
                : "border-gray-300 hover:border-gray-400"
                }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-zenco-dark">
                    As soon as the lasting power of attorney has been registered
                  </p>
                  <p className="text-sm text-gray-500">
                    (and also when the donor does not have the mental capacity)
                  </p>
                  <p className="text-sm text-zenco-blue">
                    Most people choose this option because it is the most practical
                  </p>
                  <p className="text-sm text-gray-600">
                    While you still have mental capacity, attorneys can only act with your consent. If you
                    later lose capacity, they can continue to act on your behalf for all decisions covered by
                    this lasting power of attorney.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={whenCanAct === "when_registered"}
                  onChange={() => { }}
                  className="w-5 h-5 mt-1 cursor-pointer accent-zenco-blue flex-shrink-0"
                />
              </div>
            </div>

            {/* Option 2: Only when donor loses mental capacity */}
            <div
              onClick={() => setWhenCanAct("loss_of_capacity")}
              className={`border-2 p-5 rounded-lg cursor-pointer transition-all ${whenCanAct === "loss_of_capacity"
                ? "border-[#334a5e] bg-[#334a5e] text-white shadow-md"
                : "border-gray-300 hover:border-gray-400"
                }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <p className={`font-semibold ${whenCanAct === "loss_of_capacity" ? "text-white" : "text-zenco-dark"}`}>
                    Only when the donor does not have mental capacity
                  </p>
                  <p className={`text-sm ${whenCanAct === "loss_of_capacity" ? "text-gray-200" : "text-gray-600"}`}>
                    This can make your lasting power of attorney less useful. Your attorneys might be
                    asked to prove you do not have the mental capacity each time they try to use the
                    lasting power of attorney.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={whenCanAct === "loss_of_capacity"}
                  onChange={() => { }}
                  className="w-5 h-5 mt-1 cursor-pointer accent-zenco-blue flex-shrink-0"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ INTERNAL NAVIGATION ═══════ */}
      <div className="flex justify-between pt-6">
        <Button
          onClick={handleInternalBack}
          sx={{ color: "#6b7280", textTransform: "none", opacity: subStep === 0 ? 0 : 1 }}
          disabled={subStep === 0}
        >
          ← Back
        </Button>

        <Button
          variant="contained"
          onClick={handleInternalNext}
          disabled={isSubmitting}
          sx={{
            backgroundColor: "#08B9ED",
            textTransform: "none",
            borderRadius: "8px",
            padding: "8px 32px",
            "&:hover": { backgroundColor: "#1d4ed8" },
          }}
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Save and continue"}
        </Button>
      </div>
    </section>
  );
}
