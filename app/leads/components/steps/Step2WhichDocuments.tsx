"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Box,
  FormControl,
  MenuItem,
  Select,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";

type DocumentSelection =
  | "Health and Welfare"
  | "Property and Finance"
  | "Both"
  | "";

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
};

type Donor = {
  id: string;
  first_name: string;
  last_name: string;
  is_lead: boolean;
  relationship_to_lead: string;
};

export default function Step2WhichDocuments({
  updateData,
  onNext,
  onBack,
  isSaving,
  allFormData,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [selections, setSelections] = useState<
    Record<string, DocumentSelection>
  >({});
  const [error, setError] = useState<string | null>(null);

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

        if (!fetchedDonors) {
          setDonors([]);
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
        const activeDonors = fetchedDonors.filter((d: any) => {
          if (d.is_lead) return isLeadSelected;
          return step1SelectedIds.includes(d.id);
        });

        setDonors(activeDonors);

        const initialSelections: Record<string, DocumentSelection> = {};

        await Promise.all(
          activeDonors.map(async (donor: Donor) => {
            const lpasRes = await fetch(
              `/api/lpa-documents?donorId=${donor.id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            const { data: lpas } = await lpasRes.json();

            if (lpas && Array.isArray(lpas)) {
              const hasHealth = lpas.some(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (doc: any) => doc.lpa_type === "health_and_welfare",
              );
              const hasFinance = lpas.some(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (doc: any) => doc.lpa_type === "property_and_finance",
              );

              if (hasHealth && hasFinance) initialSelections[donor.id] = "Both";
              else if (hasHealth)
                initialSelections[donor.id] = "Health and Welfare";
              else if (hasFinance)
                initialSelections[donor.id] = "Property and Finance";
              else initialSelections[donor.id] = "";
            } else {
              initialSelections[donor.id] = "";
            }
          }),
        );

        setSelections(initialSelections);
      } catch (err) {
        console.error("Error loading Step 2:", err);
        setError("Failed to load donor data.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [applicationId, allFormData?.who]);

  useEffect(() => {
    if (isSaving) {
      handleSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

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

  const handleContinue = async () => {
    setLoading(true);
    try {
      handleSave();
    } catch (err) {
      console.error("Error saving step:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionChange = (donorId: string, value: DocumentSelection) => {
    setSelections((prev) => ({ ...prev, [donorId]: value }));
  };

  const handleSave = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;

      for (const donor of donors) {
        const selection = selections[donor.id];
        if (!selection) continue;
        const lpasRes = await fetch(`/api/lpa-documents?donorId=${donor.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: currentLpas } = await lpasRes.json();
        const currentDocs = Array.isArray(currentLpas) ? currentLpas : [];

        const needsHealth =
          selection === "Health and Welfare" || selection === "Both";
        const needsFinance =
          selection === "Property and Finance" || selection === "Both";

        const existingHealth = currentDocs.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (d: any) => d.lpa_type === "health_and_welfare",
        );
        const existingFinance = currentDocs.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (d: any) => d.lpa_type === "property_and_finance",
        );

        if (needsHealth && !existingHealth) {
          console.log("Creating Health & Welfare document for", donor.id);
          const res = await fetch("/api/lpa-documents", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              donor_id: donor.id,
              lpa_type: "health_and_welfare",
              status: "draft",
            }),
          });
          const result = await res.json();
          if (result.error) {
            console.error("Failed to create Health document:", result.error);
            setError(
              `Failed to create Health document for ${donor.first_name}`,
            );
            return;
          }
        } else if (!needsHealth && existingHealth) {
          console.log(
            "Soft-deleting Health & Welfare document",
            existingHealth.id,
          );
          const res = await fetch(`/api/lpa-documents`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              id: existingHealth.id,
              deleted_at: new Date().toISOString(),
            }),
          });
          const result = await res.json();
          if (result.error)
            console.error("Failed to delete Health document:", result.error);
        } else if (needsHealth && existingHealth && existingHealth.deleted_at) {
          console.log(
            "Reactivating Health & Welfare document",
            existingHealth.id,
          );
          await fetch("/api/lpa-documents", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ id: existingHealth.id, deleted_at: null }),
          });
        }

        if (needsFinance && !existingFinance) {
          console.log("Creating Property & Finance document for", donor.id);
          const res = await fetch("/api/lpa-documents", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              donor_id: donor.id,
              lpa_type: "property_and_finance",
              status: "draft",
            }),
          });
          const result = await res.json();
          if (result.error) {
            console.error("Failed to create Finance document:", result.error);
            setError(
              `Failed to create Finance document for ${donor.first_name}`,
            );
            return;
          }
        } else if (!needsFinance && existingFinance) {
          console.log(
            "Soft-deleting Property & Finance document",
            existingFinance.id,
          );
          const res = await fetch(`/api/lpa-documents`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              id: existingFinance.id,
              deleted_at: new Date().toISOString(),
            }),
          });
          const result = await res.json();
          if (result.error)
            console.error("Failed to delete Finance document:", result.error);
        } else if (
          needsFinance &&
          existingFinance &&
          existingFinance.deleted_at
        ) {
          console.log(
            "Reactivating Property & Finance document",
            existingFinance.id,
          );
          await fetch("/api/lpa-documents", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ id: existingFinance.id, deleted_at: null }),
          });
        }
      }

      updateData({ selections });
      onNext();
    } catch (err) {
      console.error("Error saving documents:", err);
      setError("Failed to save document selections.");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-top-4">
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-bold text-black">
          Which{" "}
          <span className="text-[#08b9ed]">Lasting Power of Attorney</span>{" "}
          documents do you need?
        </h1>
        <p className="text-black">
          You need to choose which type of documents you want. Choose Health and
          Welfare for health decisions, Property and Finance for decisions about
          your finances, or choose Both.
        </p>
        <div className="flex items-end gap-3 font-semibold">
          <span className="">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              width="24"
              height="24"
              fill="currentColor"
              className="text-[#08b9ed]"
            >
              <path d="M420.9 448C428.2 425.7 442.8 405.5 459.3 388.1C492 353.7 512 307.2 512 256C512 150 426 64 320 64C214 64 128 150 128 256C128 307.2 148 353.7 180.7 388.1C197.2 405.5 211.9 425.7 219.1 448L420.8 448zM416 496L224 496L224 512C224 556.2 259.8 592 304 592L336 592C380.2 592 416 556.2 416 512L416 496zM312 176C272.2 176 240 208.2 240 248C240 261.3 229.3 272 216 272C202.7 272 192 261.3 192 248C192 181.7 245.7 128 312 128C325.3 128 336 138.7 336 152C336 165.3 325.3 176 312 176z" />
            </svg>
          </span>
          <p className="text-sm text-black">
            We strongly recommend taking both documents for peace of mind and
            the best protection.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {donors.map((donor) => {
          const selectedValue = selections[donor.id] || "";

          return (
            <div key={donor.id}>
              <h3 className="text-xl font-medium text-black mb-4">
                Which documents does{" "}
                <span className="text-[#08b9ed]">
                  {donor.first_name} {donor.last_name}
                </span>{" "}
                need?
              </h3>

              <div className="flex flex-col border border-[#adb5bd] overflow-hidden">
                <button
                  onClick={() =>
                    handleSelectionChange(donor.id, "Health and Welfare")
                  }
                  className={`p-5 text-center text-lg transition ${
                    selectedValue === "Health and Welfare"
                      ? "bg-[#35495E] text-white"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  Health and Welfare
                </button>

                <button
                  onClick={() =>
                    handleSelectionChange(donor.id, "Property and Finance")
                  }
                  className={`p-5 text-center text-lg transition ${
                    selectedValue === "Property and Finance"
                      ? "bg-[#35495E] text-white"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  Property and Finance
                </button>

                <button
                  onClick={() => handleSelectionChange(donor.id, "Both")}
                  className={`p-5 text-center text-lg transition ${
                    selectedValue === "Both"
                      ? "bg-[#35495E] text-white"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  Both
                </button>
              </div>
            </div>
          );
        })}

        {donors.length === 0 && (
          <Alert severity="info">
            No people selected. Please go back and select who this LPA is for.
          </Alert>
        )}
      </div>
      <div className="flex justify-between pt-4">
        <button onClick={handleBack} className={`cursor-pointer`}>
          ← back
        </button>
        <button
          onClick={handleContinue}
          className={`p-4 rounded text-white font-bold transition-all flex items-center justify-center min-w-45 
                       bg-[#08b9ed] hover:bg-cyan-600 cursor-pointer
                      `}
        >
         Save and Continue
        </button>
      </div>
    </section>
  );
}
