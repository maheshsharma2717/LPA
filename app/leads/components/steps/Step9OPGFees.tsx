"use client";

import { useState, useEffect } from "react";
import { TextField, Box, CircularProgress, Alert } from "@mui/material";
import { supabase } from "@/lib/supabase";

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

type ViewState =
  | "exemption-check"
  | "benefit-selection"
  | "evidence-exemption"
  | "remission-check" // Combined Income & UC & Types
  | "evidence-remission"
  | "payment";

export default function OPGFeesTab({
  data,
  updateData,
  onNext,
  onBack,
  isSaving,
  allFormData,
  currentDonorIndex,
}: Props) {
  const [currentView, setCurrentView] = useState<ViewState>("exemption-check");
  const [remissionStep, setRemissionStep] = useState(1); // 1: Questions, 2: Income Types

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [hasBenefits, setHasBenefits] = useState<boolean | null>(
    data?.hasBenefits ?? null,
  );
  const [incomeLess12k, setIncomeLess12k] = useState<boolean | null>(
    data?.incomeLess12k ?? null,
  );
  const [hasUniversalCredit, setHasUniversalCredit] = useState<boolean | null>(
    data?.hasUniversalCredit ?? null,
  );

  const [selectedBenefits, setSelectedBenefits] = useState<string[]>(
    data?.benefits || [],
  );
  const [selectedIncomeTypes, setSelectedIncomeTypes] = useState<string[]>(
    data?.incomeTypes || [],
  );
  const [paymentMethod, setPaymentMethod] = useState<"Card" | "Cheque" | null>(
    data?.paymentMethod || null,
  );
  const [phoneNumber, setPhoneNumber] = useState(data?.phoneNumber || "");

  const donorName =
    allFormData?.["which-donor"]?.firstName &&
    allFormData?.["which-donor"]?.lastName
      ? "You" // Defaulting to "You" as per refined screenshots, but keeping logic for donorName if needed
      : "You";

  const applicationId = allFormData?.who?.applicationId;

  const getDonorId = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;
    const token = session.access_token;

    const step1Selection = allFormData?.who?.selection;
    const step1SelectedIds = allFormData?.who?.selectedPeopleIds || [];
    const isLeadSelected =
      step1Selection === "You" ||
      step1Selection === "You and your partner" ||
      step1Selection === "You and someone else";

    const donorsRes = await fetch(
      `/api/donors?applicationId=${applicationId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const { data: fetchedDonors } = await donorsRes.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeDonors = (fetchedDonors || []).filter((d: any) => {
      if (d.is_lead) return isLeadSelected;
      return step1SelectedIds.includes(d.id);
    });

    return activeDonors[currentDonorIndex]?.id;
  };

  useEffect(() => {
    const init = async () => {
      const donorId = await getDonorId();
      if (!donorId) {
        setLoading(false);
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;
        const token = session.access_token;

        const res = await fetch(
          `/api/benefits-assessments?donorId=${donorId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const { data: assessment } = await res.json();

        if (assessment) {
          setHasBenefits(assessment.receives_means_tested_benefits);
          setSelectedBenefits(assessment.selected_benefits || []);
          setIncomeLess12k(!assessment.income_12k_or_more);
          setHasUniversalCredit(assessment.receives_universal_credit);
          setSelectedIncomeTypes(assessment.income_sources || []);
        }
      } catch (err) {
        console.error("Error loading Step 9:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDonorIndex, applicationId, allFormData?.who]);

  const handleBack = async () => {
    // Navigate backwards through sub-views before exiting the step
    if (currentView === "payment") {
      // Could have come from evidence-remission, evidence-exemption, or remission-check
      // Default: go back to exemption-check as the entry point
      setCurrentView("exemption-check");
      window.scrollTo(0, 0);
      return;
    }
    if (currentView === "evidence-remission") {
      setCurrentView("remission-check");
      window.scrollTo(0, 0);
      return;
    }
    if (currentView === "evidence-exemption") {
      setCurrentView("exemption-check");
      window.scrollTo(0, 0);
      return;
    }
    if (currentView === "benefit-selection") {
      setCurrentView("exemption-check");
      window.scrollTo(0, 0);
      return;
    }
    if (currentView === "remission-check") {
      if (remissionStep === 2) {
        setRemissionStep(1);
        window.scrollTo(0, 0);
        return;
      }
      setCurrentView("exemption-check");
      window.scrollTo(0, 0);
      return;
    }
    // At "exemption-check" (first view) — exit to previous wizard step
    setLoading(true);
    try {
      onBack();
    } catch (err) {
      console.error("Error saving reversing step:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSave = async () => {
    const donorId = await getDonorId();
    if (!donorId) {
      onNext();
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;

      const body = {
        donor_id: donorId,
        receives_means_tested_benefits: hasBenefits,
        selected_benefits: selectedBenefits,
        income_12k_or_more: !incomeLess12k,
        receives_universal_credit: hasUniversalCredit,
        income_sources: selectedIncomeTypes,
        calculated_fee_tier: hasBenefits
          ? "exempt"
          : incomeLess12k || hasUniversalCredit
            ? "reduced"
            : "full",
      };

      await fetch("/api/benefits-assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      updateData({
        ...data,
        benefits: selectedBenefits,
        incomeTypes: selectedIncomeTypes,
        hasBenefits,
        incomeLess12k,
        hasUniversalCredit,
        paymentMethod,
        phoneNumber,
      });
      onNext();
    } catch (err) {
      console.error("Error saving Step 9:", err);
      setError("Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isSaving) {
      handleFinalSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  const toggleBenefit = (id: string) => {
    setSelectedBenefits((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

  const toggleIncomeType = (id: string) => {
    setSelectedIncomeTypes((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

  const benefitsOptions = [
    { id: "income-support", label: "Income Support" },
    {
      id: "income-based-esa",
      label: "Income based employment and support allowance",
    },
    { id: "income-based-jsa", label: "Income Based Jobseeker's Allowance" },
    {
      id: "pension-credit",
      label: "Guaranteed Credit Element of State Pension Credit",
    },
    { id: "housing-benefit", label: "Housing Benefit" },
    { id: "council-tax", label: "Council Tax Reduction/Support" },
    { id: "none", label: "None of above" },
  ];

  const exemptionEvidence: Record<
    string,
    { title: string; desc: React.ReactNode }
  > = {
    "income-support": {
      title: "Income support",
      desc: (
        <>
          Evidence provided for Income Support is usually provided from the{" "}
          <a href="https://www.gov.uk" className="text-cyan-500 underline">
            gov.uk website
          </a>{" "}
          through an online log in for you showing your income support that you
          receive and will have your{" "}
          <span className="text-cyan-500 font-bold">name</span> and{" "}
          <span className="text-cyan-500 font-bold">address</span> on the print
          outs.
        </>
      ),
    },
    "income-based-esa": {
      title: "Income based employment and support allowance",
      desc: (
        <>
          An <span className="text-cyan-500 font-bold">official letter</span>{" "}
          from the{" "}
          <span className="text-cyan-500 font-bold">
            Department of Work and Pensions
          </span>{" "}
          for the current financial year.
        </>
      ),
    },
    "income-based-jsa": {
      title: "Income Based Jobseeker's Allowance",
      desc: (
        <>
          An <span className="text-cyan-500 font-bold">official letter</span>{" "}
          from the{" "}
          <span className="text-cyan-500 font-bold">
            Department of Work and Pensions
          </span>{" "}
          for the current financial year.
        </>
      ),
    },
    "pension-credit": {
      title: "Guaranteed Credit Element of State Pension Credit",
      desc: (
        <>
          An <span className="text-cyan-500 font-bold">official letter</span>{" "}
          from the{" "}
          <span className="text-cyan-500 font-bold">Pension Service</span> for
          the current financial year. Please contact the HMRC helpline if you
          need copies on{" "}
          <span className="text-cyan-500 font-bold underline">
            0800 731 0469
          </span>
          .
        </>
      ),
    },
    "housing-benefit": {
      title: "Housing Benefit",
      desc: (
        <>
          An <span className="text-cyan-500 font-bold">official letter</span>{" "}
          from your{" "}
          <span className="text-cyan-500 font-bold">local Council</span> for the
          current financial year.
        </>
      ),
    },
    "council-tax": {
      title: "Council Tax Reduction/Support",
      desc: (
        <>
          An <span className="text-cyan-500 font-bold">offer letter</span> from
          your <span className="text-cyan-500 font-bold">local Council</span>{" "}
          for the current financial year.
        </>
      ),
    },
    none: {
      title: "None of above",
      desc: "Please provide any other relevant financial documents if requested.",
    },
  };

  const incomeOptions = [
    { id: "paid-employment", label: "Paid employment" },
    { id: "self-employment", label: "Self-employment" },
    {
      id: "non-means-benefits",
      label: "Non-means-tested benefits and pensions",
    },
    { id: "interest", label: "Interest from capital stocks, shares or bonds" },
    { id: "no-income", label: "No income" },
    { id: "none", label: "None of above" },
  ];

  const evidenceData: Record<string, { title: string; desc: React.ReactNode }> =
    {
      "paid-employment": {
        title: "Paid employment",
        desc: (
          <>
            A <span className="text-cyan-500 font-bold">P60</span> or{" "}
            <span className="text-cyan-500 font-bold">
              3 months&apos; consecutive wage slips
            </span>{" "}
            from your{" "}
            <span className="text-cyan-500 font-bold underline">
              current employment
            </span>
            ,(from when returning documents e.g., if returning documents in May
            you would need to provide April, March & February).
          </>
        ),
      },
      "self-employment": {
        title: "Self-employment",
        desc: (
          <>
            Your most recent{" "}
            <span className="text-cyan-500 font-bold underline">
              self-assessment tax return
            </span>{" "}
            and{" "}
            <span className="text-cyan-500 font-bold underline">
              HMRC tax calculation
            </span>{" "}
            or{" "}
            <span className="text-cyan-500 font-bold underline">
              audited accounts
            </span>{" "}
            certified by a qualified accountant.
          </>
        ),
      },
      "non-means-benefits": {
        title: "Non-means-tested benefits and pensions",
        desc: (
          <>
            An{" "}
            <span className="text-cyan-500 font-bold underline">
              official letter
            </span>{" "}
            from the{" "}
            <span className="text-cyan-500 font-bold underline text-xs">
              Pension Service
            </span>{" "}
            for the current financial year. Please contact the HMRC helpline if
            you need copies on{" "}
            <span className="text-cyan-500 font-bold underline">
              0800 731 0469
            </span>
            .
          </>
        ),
      },
      interest: {
        title: "Interest from capital stocks, shares or bonds",
        desc: (
          <>
            <span className="text-cyan-500 font-bold underline">
              Statements
            </span>{" "}
            or{" "}
            <span className="text-cyan-500 font-bold underline">vouchers</span>{" "}
            showing{" "}
            <span className="text-cyan-500 font-bold underline">
              gross income
            </span>{" "}
            for the current financial year.
          </>
        ),
      },
      "no-income": {
        title: "No income",
        desc: (
          <>
            Your most recent{" "}
            <span className="text-cyan-500 font-bold underline">
              self-assessment tax return
            </span>{" "}
            and{" "}
            <span className="text-cyan-500 font-bold underline">
              HMRC tax calculation
            </span>{" "}
            or{" "}
            <span className="text-cyan-500 font-bold underline">
              audited accounts
            </span>{" "}
            certified by a qualified accountant.
          </>
        ),
      },
      none: {
        title: "None of above",
        desc: "Please provide any other relevant financial documents if requested.",
      },
    };

  const getFinalAmount = () => {
    if (hasBenefits) return 0;
    if (incomeLess12k || hasUniversalCredit) return 92;
    return 184;
  };

  const finalAmount = getFinalAmount();

  if (loading)
    return (
      <Box p={10} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );

  return (
    <main className="max-w-4xl mx-auto pb-20 px-4">
      {/* Dynamic Heading */}
      <div className="text-center mb-10">
        <h4 className="text-3xl font-bold text-[#334a5e]">
          {/* Registration {currentView === "payment" ? "fees" : "fee"}{" "}
          <span className="text-cyan-400">
            {currentView === "payment"
              ? hasBenefits || incomeLess12k || hasUniversalCredit
                ? "fees"
                : "fees"
              : hasBenefits === false
                ? "remission"
                : "exemption"}
          </span> */}
          Registration fee <span className="text-[#08b9ed]">examption</span> 
        </h4>
        {(currentView === "evidence-exemption" ||
          currentView === "evidence-remission") && (
          <p className="text-cyan-500 font-bold mt-2 uppercase tracking-wide text-lg">
            Evidence for {hasBenefits ? "exemption" : "remission"}
          </p>
        )}
        <div className="h-0.5 w-full bg-linear-to-r from-transparent via-gray-200 to-transparent mt-6"></div>
      </div>

      <div className="space-y-6 text-black leading-relaxed">
        {/* VIEW 1: EXEMPTION CHECK */}
        {currentView === "exemption-check" && (
          <div className="space-y-6 animate-fadeIn">
            <p>
              If <span className="text-cyan-500 font-bold">{donorName}</span>{" "}
              are in receipt of means tested benefits, you may be eligible to be
              exempt from paying registration fees with the Office of the Public
              Guardian.
            </p>
            <p>
              If applicable, please select any benefits below that{" "}
              <span className="text-cyan-500 font-bold">{donorName}</span> are
              in receipt of.
            </p>
            <p className="">
              You must be able to supply evidence for at least one if selected.
            </p>
            <p className="">
              Please note, if{" "}
              <span className="text-cyan-500 font-bold">{donorName}</span> have
              been awarded personal injury damages of more than £16,000 which
              were ignored when they were assessed for one of the qualifying
              benefits, they won&apos;t qualify for exemption.
            </p>

            <div className="pt-6">
              <p className="text-lg font-bold mb-4">
                Are you in receipt of means tested benefits?
              </p>
              <div className="flex flex-col border-2 border-[#334a5e] overflow-hidden shadow-sm">
                <button
                  onClick={() => {
                    setHasBenefits(false);
                    setSelectedBenefits([]);
                  }}
                  className={`p-5 text-xl transition-all ${hasBenefits === false ? "bg-[#334a5e] text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                >
                  No, you do not receive benefits
                </button>
                <button
                  onClick={() => setHasBenefits(true)}
                  className={`p-5 text-xl border-t-2 border-[#334a5e] transition-all ${hasBenefits === true ? "bg-[#334a5e] text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                >
                  Yes, you are in receipt of benefits
                </button>
              </div>
            </div>

            {hasBenefits === true && (
              <div className="pt-8 animate-fadeIn">
                <p className="text-xl font-bold mb-6 text-gray-800">
                  Which benefits do you get?
                </p>
                <div className="space-y-1">
                  {benefitsOptions.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => toggleBenefit(opt.id)}
                      className={`flex justify-between items-center p-5 border-2 cursor-pointer transition-all ${selectedBenefits.includes(opt.id) ? "border-[#334a5e] bg-[#334a5e]" : "border-gray-100 bg-white"}`}
                    >
                      <p
                        className={`font-black text-lg ${selectedBenefits.includes(opt.id) ? "text-white" : "text-black"}`}
                      >
                        {opt.label}
                      </p>
                      <div
                        className={`w-7 h-7 border-2 rounded flex items-center justify-center ${selectedBenefits.includes(opt.id) ? "bg-[#334a5e] border-white" : "border-gray-300 bg-white"}`}
                      >
                        {selectedBenefits.includes(opt.id) && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-white"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: EVIDENCE (EXEMPTION) */}
        {currentView === "evidence-exemption" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="space-y-4">
              <p>
                When these documents are sent to the Office of the Public
                Guardian, you will need to provide one of the following as
                evidence to prove the donor is eligible for fee exemption.
              </p>
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg shadow-sm">
                <p className="font-bold text-orange-800 leading-tight text-sm">
                  You don&apos;t need these to finish your documents today, this
                  is just for information as it is a good idea to get these
                  ready while we post the documents to you.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {selectedBenefits.map((id) => {
                const evidence = exemptionEvidence[id];
                if (!evidence) return null;
                return (
                  <div
                    key={id}
                    className="p-6 border-2 border-gray-100 rounded-xl shadow-sm bg-white hover:border-cyan-200 transition-all"
                  >
                    <p className="text-lg font-bold text-gray-400 mb-2 uppercase tracking-wide">
                      {evidence.title}
                    </p>
                    <p className="text-gray-600 leading-relaxed text-sm font-medium">
                      {evidence.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 4: REMISSION CHECK (COMBINED) */}
        {currentView === "remission-check" && (
          <div className="space-y-6 animate-fadeIn text-gray-700">
            <p>
              If <span className="text-cyan-500 font-bold">{donorName}</span>{" "}
              are not in receipt of benefits which qualify for exemption of the
              fees, but the gross annual income is less than £12,000 per year
              (before tax) or you receive Universal Credit, you may be able to
              receive a fee remission of 50% discount on the registration fees
              with the Office of the Public Guardian.
            </p>
            <p>
              If applicable, please select any of the requirements below that{" "}
              <span className="text-cyan-500 font-bold">{donorName}</span> meet.
            </p>
            <p className="font-bold border-l-4 border-cyan-400 pl-4 py-1">
              You must be able to supply evidence for at least one if selected.
            </p>

            <div className="pt-6">
              <p className="text-lg font-bold mb-4">
                Is your income less than £12,000 a year?
              </p>
              <div className="flex flex-col border-2 border-[#334a5e] rounded-lg overflow-hidden shadow-sm mb-8">
                <button
                  onClick={() => {
                    setIncomeLess12k(false);
                    setSelectedIncomeTypes([]);
                  }}
                  className={`p-5 text-xl font-semibold transition-all ${incomeLess12k === false ? "bg-[#334a5e] text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                >
                  No, your income is £12k per year or more
                </button>
                <button
                  onClick={() => {
                    setIncomeLess12k(true);
                  }}
                  className={`p-5 text-xl font-semibold border-t-2 border-[#334a5e] transition-all ${incomeLess12k === true ? "bg-[#334a5e] text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                >
                  Yes, your income is less than £12k per year
                </button>
              </div>

              {remissionStep === 1 && (
                <div className="animate-fadeIn">
                  <p className="text-lg font-bold mb-4">
                    Do you receive Universal Credit?
                  </p>
                  <div className="flex flex-col border-2 border-[#334a5e] rounded-lg overflow-hidden shadow-sm">
                    <button
                      onClick={() => setHasUniversalCredit(false)}
                      className={`p-5 text-xl font-semibold transition-all ${hasUniversalCredit === false ? "bg-[#334a5e] text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                    >
                      No, you do not receive universal credit
                    </button>
                    <button
                      onClick={() => setHasUniversalCredit(true)}
                      className={`p-5 text-xl font-semibold border-t-2 border-[#334a5e] transition-all ${hasUniversalCredit === true ? "bg-[#334a5e] text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                    >
                      Yes, you do receive universal credit
                    </button>
                  </div>
                </div>
              )}

              {remissionStep === 2 && (
                <div className="space-y-6 animate-fadeIn mb-8">
                  <p className="text-lg font-bold uppercase tracking-tight text-gray-800">
                    Please choose anything below that applies to you.
                  </p>
                  <p className="text-gray-500 font-semibold mb-4">
                    Select from the choices below:
                  </p>
                  <div className="space-y-3">
                    {incomeOptions.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => toggleIncomeType(opt.id)}
                        className={`flex justify-between items-center p-5 border rounded-lg cursor-pointer transition-all ${selectedIncomeTypes.includes(opt.id) ? "border-[#334a5e] bg-[#334a5e] text-white shadow-md" : "border-gray-300 hover:border-cyan-400"}`}
                      >
                        <p
                          className={`font-black text-lg ${selectedIncomeTypes.includes(opt.id) ? "text-white" : "text-gray-700"}`}
                        >
                          {opt.label}
                        </p>
                        <div
                          className={`w-7 h-7 border-2 rounded flex items-center justify-center ${selectedIncomeTypes.includes(opt.id) ? "bg-white border-white" : "border-gray-400 bg-white"}`}
                        >
                          {selectedIncomeTypes.includes(opt.id) && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-[#334a5e]"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 6: EVIDENCE FOR REMISSION */}
        {currentView === "evidence-remission" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="space-y-4">
              <p>
                When these documents are sent to the Office of the Public
                Guardian, you will need to provide one of the following as
                evidence to prove the donor is eligible for fee remission.
              </p>
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg shadow-sm">
                <p className="font-bold text-orange-800 leading-tight text-sm">
                  You don&apos;t need these to finish your documents today, this
                  is just for information as it is a good idea to get these
                  ready while we post the documents to you.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {hasUniversalCredit && (
                <div className="p-6 border-2 border-gray-100 rounded-xl shadow-sm bg-white hover:border-cyan-200 transition-all">
                  <p className="text-lg font-bold text-gray-400 mb-3 uppercase tracking-wide">
                    Universal Credit
                  </p>
                  <p className="text-gray-600 leading-relaxed text-sm font-medium">
                    A copy of your{" "}
                    <span className="text-cyan-500 font-bold">
                      Universal Credit Statement
                    </span>{" "}
                    for the last assessment period.
                  </p>
                </div>
              )}
              {selectedIncomeTypes.map((id) => {
                const detail = evidenceData[id];
                if (!detail) return null;
                return (
                  <div
                    key={id}
                    className="p-6 border-2 border-gray-100 rounded-xl shadow-sm bg-white hover:border-cyan-200 transition-all"
                  >
                    <p className="text-lg font-bold text-gray-400 mb-3 uppercase tracking-wide">
                      {detail.title}
                    </p>
                    <p className="text-gray-600 leading-relaxed text-sm font-medium">
                      {detail.desc}
                    </p>
                  </div>
                );
              })}
              {!hasUniversalCredit && selectedIncomeTypes.length === 0 && (
                <div className="p-10 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 italic">
                  No evidence items to display.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 7: PAYMENT */}
        {currentView === "payment" && (
          <div className="space-y-10 animate-fadeIn bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="space-y-6">
              <div className="border-l-4 border-cyan-400 pl-6 py-2">
                <p className="text-lg font-medium text-gray-600">
                  {finalAmount === 184
                    ? "You have said that You do not qualify for remission (discount) or exemption of the fees."
                    : "You qualify for remission (discount) of the fees."}
                </p>
                <button
                  onClick={() => setCurrentView("exemption-check")}
                  className="text-cyan-500 hover:text-cyan-600 underline font-bold mt-2 transition-colors"
                >
                  Click here to go back and change your selection
                </button>
              </div>

              <div className="flex items-baseline gap-4">
                <p className="text-2xl font-bold text-gray-800">
                  The amount due is
                </p>
                <p className="text-5xl font-black text-cyan-500">
                  £{finalAmount}
                </p>
              </div>

              <div className="space-y-4">
                <p className="font-black text-gray-800 text-xl">
                  Please tell us how you would like to pay below.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                    <p className="font-bold text-[#334a5e] mb-2 uppercase tracking-wide">
                      Cheque
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed italic">
                      Send a cheque addressed to &apos;Office of the Public
                      Guardian&apos; with your application writing the name of
                      the donor (
                      <span className="text-cyan-500 font-bold">
                        {donorName}
                      </span>
                      ) on the back.
                    </p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                    <p className="font-bold text-[#334a5e] mb-2 uppercase tracking-wide">
                      Card
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed italic">
                      Provide a contact phone number below so the Office of the
                      Public Guardian can contact you to take payment.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <p className="text-xl font-black mb-6 text-gray-800">
                How do you want to pay the registration fees?
              </p>
              <div className="flex flex-col border-2 border-[#334a5e] rounded-xl overflow-hidden shadow-lg transition-all">
                <button
                  onClick={() => setPaymentMethod("Card")}
                  className={`p-6 text-2xl font-bold transition-all flex items-center justify-center gap-3 ${paymentMethod === "Card" ? "bg-[#334a5e] text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                >
                  {paymentMethod === "Card" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  Card
                </button>
                <button
                  onClick={() => setPaymentMethod("Cheque")}
                  className={`p-6 text-2xl font-bold border-t-2 border-[#334a5e] transition-all flex items-center justify-center gap-3 ${paymentMethod === "Cheque" ? "bg-[#334a5e] text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                >
                  {paymentMethod === "Cheque" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  Cheque
                </button>
              </div>
            </div>

            {paymentMethod === "Card" && (
              <div className="space-y-4 animate-slideDown p-6 bg-cyan-50 rounded-xl border border-cyan-100 shadow-inner">
                <p className="font-bold text-gray-800 text-lg">
                  Contact phone number for payment:
                </p>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 07700 900000"
                  className="bg-white rounded-lg shadow-sm"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&.Mui-focused fieldset": {
                        borderColor: "#06b6d4",
                      },
                    },
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* NAVIGATION BUTTONS */}
        <div className="flex items-center justify-between mt-16 pb-10">
          <button onClick={handleBack} className={`cursor-pointer`}>
           ← <u>Back</u> 
          </button>

          

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <button
            onClick={() => {
              if (currentView === "exemption-check") {
                if (hasBenefits === true) {
                  if (selectedBenefits.length > 0)
                    setCurrentView("evidence-exemption");
                } else if (hasBenefits === false) {
                  setCurrentView("remission-check");
                  setRemissionStep(1);
                }
              } else if (currentView === "evidence-exemption")
                setCurrentView("payment");
              else if (currentView === "remission-check") {
                if (remissionStep === 1) {
                  if (incomeLess12k === true) setRemissionStep(2);
                  else setCurrentView("payment");
                } else {
                  setCurrentView("evidence-remission");
                }
              } else if (currentView === "evidence-remission")
                setCurrentView("payment");
              else if (currentView === "payment") {
                if (paymentMethod) handleFinalSave();
              }
            }}
            disabled={
              isSubmitting ||
              (currentView === "exemption-check" &&
                (hasBenefits === null ||
                  (hasBenefits === true && selectedBenefits.length === 0))) ||
              (currentView === "remission-check" &&
                ((remissionStep === 1 &&
                  (incomeLess12k === null || hasUniversalCredit === null)) ||
                  (remissionStep === 2 && selectedIncomeTypes.length === 0))) ||
              (currentView === "payment" && !paymentMethod) ||
              (currentView === "payment" &&
                paymentMethod === "Card" &&
                !phoneNumber)
            }
            className={`px-10 py-4 rounded text-white font-black transition-all flex items-center justify-center min-w-60 ${
              (currentView === "exemption-check" && hasBenefits === null) ||
              (currentView === "benefit-selection" &&
                selectedBenefits.length === 0) ||
              (currentView === "remission-check" &&
                ((remissionStep === 1 &&
                  (incomeLess12k === null || hasUniversalCredit === null)) ||
                  (remissionStep === 2 && selectedIncomeTypes.length === 0))) ||
              (currentView === "payment" && !paymentMethod) ||
              (currentView === "payment" &&
                paymentMethod === "Card" &&
                !phoneNumber)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#06b6d4] hover:bg-cyan-600 active:scale-95"
            } `}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : currentView === "payment" ? (
              "Save and finish"
            ) : currentView.startsWith("evidence") ? (
              "Continue"
            ) : (
              "Save and continue"
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
