"use client";

import { useState, useEffect } from "react";
import { Button, Box, CircularProgress, Alert } from "@mui/material";
import { supabase } from "@/lib/supabase";
import styles from "./Steps.module.css";

type LpaDoc = {
  id: string;
  donor_id: string;
  lpa_type: "health_and_welfare" | "property_and_finance";
  life_sustaining_treatment?: boolean | null;
  when_attorneys_can_act?: string | null;
};

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allFormData: any;
  currentDonorIndex: number;
};

export default function HealthFinanceTab({
  onNext,
  onBack,
  allFormData,
  updateData,
  currentDonorIndex,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorFirstName, setDonorFirstName] = useState("");

  const [lpaDocs, setLpaDocs] = useState<LpaDoc[]>([]);
  const hasHealth = lpaDocs.some((d) => d.lpa_type === "health_and_welfare");
  const hasFinance = lpaDocs.some((d) => d.lpa_type === "property_and_finance");

  const [subStep, setSubStep] = useState(0);

  const [lifeSustaining, setLifeSustaining] = useState<boolean | null>(null);

  const [whenCanAct, setWhenCanAct] = useState<
    "when_registered" | "loss_of_capacity" | null
  >(null);

  const applicationId = allFormData?.who?.applicationId;

  useEffect(() => {
    const init = async () => {
      if (!applicationId) {
        setLoading(false);
        return;
      }
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;
        const token = session.access_token;

        const donorsRes = await fetch(
          `/api/donors?applicationId=${applicationId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const { data: fetchedDonors } = await donorsRes.json();

        if (!fetchedDonors || fetchedDonors.length === 0) {
          setLoading(false);
          return;
        }

        const step1Selection = allFormData?.who?.selection;
        const step1SelectedIds = allFormData?.who?.selectedPeopleIds || [];
        const isLeadSelected =
          step1Selection === "You" ||
          step1Selection === "You and your partner" ||
          step1Selection === "You and someone else";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activeDonors = (fetchedDonors || []).filter((d: any) => {
          if (d.is_lead) return isLeadSelected;
          return step1SelectedIds.includes(d.id);
        });

        const firstDonor = activeDonors[currentDonorIndex];
        if (!firstDonor) {
          setLoading(false);
          return;
        }

        setDonorName(`${firstDonor.first_name} ${firstDonor.last_name}`);
        setDonorFirstName(firstDonor.first_name);

        const lpasRes = await fetch(
          `/api/lpa-documents?donorId=${firstDonor.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const { data: existingDocs } = await lpasRes.json();

        if (
          existingDocs &&
          Array.isArray(existingDocs) &&
          existingDocs.length > 0
        ) {
          setLpaDocs(existingDocs);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const healthDoc = existingDocs.find(
            (d: any) => d.lpa_type === "health_and_welfare",
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const financeDoc = existingDocs.find(
            (d: any) => d.lpa_type === "property_and_finance",
          );

          if (
            healthDoc?.life_sustaining_treatment !== null &&
            healthDoc?.life_sustaining_treatment !== undefined
          ) {
            setLifeSustaining(healthDoc.life_sustaining_treatment);
          }
          if (financeDoc?.when_attorneys_can_act) {
            setWhenCanAct(
              financeDoc.when_attorneys_can_act as
                | "when_registered"
                | "loss_of_capacity",
            );
          }
        }

        const saved = allFormData?.["health-&-finances"];
        if (saved) {
          if (
            saved.lifeSustaining !== undefined &&
            saved.lifeSustaining !== null
          )
            setLifeSustaining(saved.lifeSustaining);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, currentDonorIndex, allFormData?.who]);

  const pages: ("health" | "finance")[] = [];
  if (hasHealth) pages.push("health");
  if (hasFinance) pages.push("finance");
  const currentPage = pages[subStep] || null;
  const handleInternalNext = async () => {
    if (currentPage === "health") {
      if (lifeSustaining === null) {
        setError("Please select an option.");
        return;
      }
      setError(null);
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

    setIsSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;

      const healthDoc = lpaDocs.find(
        (d) => d.lpa_type === "health_and_welfare",
      );
      if (healthDoc && lifeSustaining !== null) {
        await fetch("/api/lpa-documents", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: healthDoc.id,
            life_sustaining_treatment: lifeSustaining,
          }),
        });
      }

      const financeDoc = lpaDocs.find(
        (d) => d.lpa_type === "property_and_finance",
      );
      if (financeDoc && whenCanAct !== null) {
        await fetch("/api/lpa-documents", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: financeDoc.id,
            when_attorneys_can_act: whenCanAct,
          }),
        });
      }

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

  if (loading)
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );

  if (pages.length === 0) {
    return (
      <Alert severity="info">
        No LPA documents found for the current donor. Please go back and select
        a document type in Step 2.
      </Alert>
    );
  }

  const handleBack = async () => {
    setLoading(true);
    try {
      onBack();
    } catch (err) {
      console.error("Error saving reversing step:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="max-w-3xl w-full space-y-8 animate-in fade-in slide-in-from-top-4">
        {/* ═══════ HEALTH & WELFARE: LIFE-SUSTAINING TREATMENT ═══════ */}
        {currentPage === "health" && (
          <div className="space-y-6 animate-in fade-in">
            <h1
              className={`text-center text-3xl font-bold text-zenco-dark ${styles.headingBorderBottom}`}
            >
              Life-sustaining <span className="text-[#08b9ed]">Treatment</span>
            </h1>
            <div className="flex flex-col gap-3 text-gray-700">
              <p>
                <span className="text-[#08b9ed] font-semibold">
                  {donorName}
                </span>{" "}
                must choose what they want to happen if they needed medical help
                to keep them alive and they no longer had mental capacity.
              </p>
              <p>
                If they choose YES and{" "}
                <span className="text-[#08b9ed] font-semibold">
                  {donorName}
                </span>{" "}
                ever needed life-sustaining treatment but can&apos;t make
                decisions, the attorneys can speak to doctors on their behalf as
                if they were{" "}
                <span className="text-[#08b9ed] font-semibold">
                  {donorName}
                </span>
                .
              </p>
              <p>
                If you choose NO doctors will make decisions about
                life-sustaining treatment for{" "}
                <span className="text-[#08b9ed] font-semibold">
                  {donorName}
                </span>
                .
              </p>
            </div>

            <p className="text-xl font-semibold text-zenco-dark">
              Do you want the attorneys to make decisions about life-sustaining
              treatment?
            </p>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <div className="flex flex-col border-2 border-gray-300">
              <button
                onClick={() => setLifeSustaining(true)}
                className={` p-4 text-center transition-all cursor-pointer ${
                  lifeSustaining === true
                    ? " bg-[#334a5e] text-white font-semibold"
                    : "hover:bg-gray-50 font-semibold"
                }`}
              >
                Yes - give the attorneys authority
              </button>
              <button
                onClick={() => setLifeSustaining(false)}
                className={`p-4 text-center transition-all cursor-pointer ${
                  lifeSustaining === false
                    ? " bg-[#334a5e] text-white font-semibold"
                    : "hover:bg-gray-50 font-semibold"
                }`}
              >
                No - do not give the attorneys authority
              </button>
            </div>

            {/* ═══════ INTERNAL NAVIGATION ═══════ */}
            <div className="flex justify-between pt-6">
              {/* <Button
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
        </Button> */}
              <button onClick={handleBack} className={`cursor-pointer text-lg`}>
                ← <u>Back</u>
              </button>
              <button
                onClick={handleInternalNext}
                disabled={isSubmitting}
                className={`p-4 text-lg rounded text-white font-bold transition-all flex items-center justify-center min-w-45 
               bg-[#08b9ed] hover:bg-cyan-600 cursor-pointer
              `}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Save and continue"
                )}
              </button>
            </div>
          </div>
        )}

        {/* ═══════ PROPERTY & FINANCE: WHEN ATTORNEYS CAN ACT ═══════ */}
        {currentPage === "finance" && (
          <div className="space-y-6 animate-in fade-in">
            <h1
              className={`text-center text-3xl font-bold text-zenco-dark ${styles.headingBorderBottom}`}
            >
              When do the{" "}
              <span className="text-[#08b9ed]">
                property and finance documents become effective?
              </span>
            </h1>

            <div className="flex flex-col gap-4 text-black font-medium">
              <p>
                {donorName} can choose to allow the attorneys to make decisions
                either:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  As soon as the lasting power of attorney has been registered
                  by the Office of the Public Guardian
                </li>
                <li>
                  Only when {donorFirstName} doesn&apos;t have mental capacity
                </li>
              </ul>

              <p className="text-sm font-medium">
                Most people choose the first option of &apos;As soon as the
                lasting power of attorney has been registered&apos;.
              </p>
            </div>

            <p className="text-xl font-medium text-zenco-dark">
              When do you want the attorneys to be able to make decisions?
            </p>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <div className="flex flex-col gap-4 max-w-2xl">
              {/* Option 1: As soon as registered */}
              <div
                onClick={() => setWhenCanAct("when_registered")}
                className={`border-2 p-5 cursor-pointer transition-all ${
                  whenCanAct === "when_registered"
                    ? "border-[#334a5e] bg-[#334a5e] text-white shadow-md"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <p
                      className={`font-semibold  ${
                        whenCanAct === "when_registered"
                          ? "text-white"
                          : " text-black"
                      }`}
                    >
                      As soon as the lasting power of attorney has been
                      registered
                    </p>
                    <p
                      className={`text-sm  ${
                        whenCanAct === "when_registered"
                          ? "text-white"
                          : " text-black"
                      }`}
                    >
                      (and also when the donor does not have the mental
                      capacity)
                    </p>
                    <p
                      className={`text-sm  ${
                        whenCanAct === "when_registered"
                          ? "text-white"
                          : " text-black"
                      }`}
                    >
                      Most people choose this option because it is the most
                      practical
                    </p>
                    <p
                      className={`text-sm  ${
                        whenCanAct === "when_registered"
                          ? "text-white"
                          : "text-black"
                      }`}
                    >
                      While you still have mental capacity, attorneys can only
                      act with your consent. If you later lose capacity, they
                      can continue to act on your behalf for all decisions
                      covered by this lasting power of attorney.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={whenCanAct === "when_registered"}
                    onChange={() => {}}
                    className="w-5 h-5 mt-1 cursor-pointer accent-[#08b9ed] shrink-0"
                  />
                </div>
              </div>

              {/* Option 2: Only when donor loses mental capacity */}
              <div
                onClick={() => setWhenCanAct("loss_of_capacity")}
                className={`border-2 p-5 cursor-pointer transition-all ${
                  whenCanAct === "loss_of_capacity"
                    ? "border-[#334a5e] bg-[#334a5e] text-white shadow-md"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <p
                      className={`font-semibold ${whenCanAct === "loss_of_capacity" ? "text-white" : "text-black"}`}
                    >
                      Only when the donor does not have mental capacity
                    </p>
                    <p
                      className={`text-sm ${whenCanAct === "loss_of_capacity" ? "text-white" : "text-black"}`}
                    >
                      This can make your lasting power of attorney less useful.
                      Your attorneys might be asked to prove you do not have the
                      mental capacity each time they try to use the lasting
                      power of attorney.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={whenCanAct === "loss_of_capacity"}
                    onChange={() => {}}
                    className="w-5 h-5 mt-1 cursor-pointer accent-[#08b9ed] shrink-0"
                  />
                </div>
              </div>
              {/* ═══════ INTERNAL NAVIGATION ═══════ */}
              <div className="flex justify-between pt-6">
                {/* <Button
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
        </Button> */}
                <button onClick={handleBack} className={`cursor-pointer`}>
                  ← back
                </button>
                <button
                  onClick={handleInternalNext}
                  disabled={isSubmitting}
                  className={`px-10 py-3 rounded text-white font-bold transition-all flex items-center justify-center min-w-45 
               bg-[#06b6d4] hover:bg-cyan-600
              `}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Save and continue"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
