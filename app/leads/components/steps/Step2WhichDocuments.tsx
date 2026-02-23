"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  CircularProgress,
  Alert,
} from "@mui/material";
import { ArrowLeft } from "lucide-react";
import styles from "./Steps.module.css";

type DocumentSelection = "Health and Welfare" | "Property and Finance" | "Both" | "";

type Props = {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  isSaving: boolean;
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
  data,
  updateData,
  onNext,
  isSaving,
  allFormData,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [selections, setSelections] = useState<Record<string, DocumentSelection>>({});
  const [error, setError] = useState<string | null>(null);

  const applicationId = allFormData?.who?.applicationId;
  const selectedPeopleIds = allFormData?.who?.selectedPeopleIds || [];
 
  useEffect(() => {
    const init = async () => {
      if (!applicationId) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const token = session.access_token;

        const donorsRes = await fetch(`/api/donors?applicationId=${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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

        const activeDonors = fetchedDonors.filter((d: any) => {
          if (d.is_lead) return isLeadSelected;
          return step1SelectedIds.includes(d.id);
        });

        setDonors(activeDonors);

        const initialSelections: Record<string, DocumentSelection> = {};

        await Promise.all(
          activeDonors.map(async (donor: Donor) => {


            const lpasRes = await fetch(`/api/lpa-documents?donorId=${donor.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const { data: lpas } = await lpasRes.json();

            if (lpas && Array.isArray(lpas)) {
              const hasHealth = lpas.some((doc: any) => doc.lpa_type === "health_and_welfare");
              const hasFinance = lpas.some((doc: any) => doc.lpa_type === "property_and_finance");

              if (hasHealth && hasFinance) initialSelections[donor.id] = "Both";
              else if (hasHealth) initialSelections[donor.id] = "Health and Welfare";
              else if (hasFinance) initialSelections[donor.id] = "Property and Finance";
              else initialSelections[donor.id] = "";
            } else {
              initialSelections[donor.id] = "";
            }
          })
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
  }, [isSaving]);

  const handleSelectionChange = (donorId: string, value: DocumentSelection) => {
    setSelections((prev) => ({ ...prev, [donorId]: value }));
  };

  const handleSave = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
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

        const needsHealth = selection === "Health and Welfare" || selection === "Both";
        const needsFinance = selection === "Property and Finance" || selection === "Both";

        const existingHealth = currentDocs.find((d: any) => d.lpa_type === "health_and_welfare");
        const existingFinance = currentDocs.find((d: any) => d.lpa_type === "property_and_finance");

        if (needsHealth && !existingHealth) {
          console.log("Creating Health & Welfare document for", donor.id);
          const res = await fetch("/api/lpa-documents", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ donor_id: donor.id, lpa_type: "health_and_welfare", status: "draft" }),
          });
          const result = await res.json();
          if (result.error) {
            console.error("Failed to create Health document:", result.error);
            setError(`Failed to create Health document for ${donor.first_name}`);
            return;
          }
        } else if (!needsHealth && existingHealth) {
          console.log("Soft-deleting Health & Welfare document", existingHealth.id);
          const res = await fetch(`/api/lpa-documents`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id: existingHealth.id, deleted_at: new Date().toISOString() }),
          });
          const result = await res.json();
          if (result.error) console.error("Failed to delete Health document:", result.error);
        } else if (needsHealth && existingHealth && existingHealth.deleted_at) {
          console.log("Reactivating Health & Welfare document", existingHealth.id);
          await fetch("/api/lpa-documents", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id: existingHealth.id, deleted_at: null }),
          });
        }

        if (needsFinance && !existingFinance) {
          console.log("Creating Property & Finance document for", donor.id);
          const res = await fetch("/api/lpa-documents", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ donor_id: donor.id, lpa_type: "property_and_finance", status: "draft" }),
          });
          const result = await res.json();
          if (result.error) {
            console.error("Failed to create Finance document:", result.error);
            setError(`Failed to create Finance document for ${donor.first_name}`);
            return;
          }
        } else if (!needsFinance && existingFinance) {
          console.log("Soft-deleting Property & Finance document", existingFinance.id);
          const res = await fetch(`/api/lpa-documents`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id: existingFinance.id, deleted_at: new Date().toISOString() }),
          });
          const result = await res.json();
          if (result.error) console.error("Failed to delete Finance document:", result.error);
        } else if (needsFinance && existingFinance && existingFinance.deleted_at) {
          console.log("Reactivating Property & Finance document", existingFinance.id);
          await fetch("/api/lpa-documents", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

  const handleBack = () => {
    // Implement back logic (e.g. windows.history.back() or a prop-based back call)
    window.history.back();
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
    <section className="space-y-8 animate-in fade-in slide-in-from-top-4 pb-20">
      <div className="flex flex-col gap-3">
        <h1 className={styles.stepHeading}>
          Which <span className="text-zenco-blue">Lasting Power of Attorney</span> documents do you need?
        </h1>
        <p className="text-gray-600 text-sm">
          You need to choose which type of documents you want for you and your partner, choose either Health and Welfare for
          health decisions, Property and Finance for decisions about your finances or choose both.
        </p>
        <div className={styles.recommendationBox}>
          <span className="text-lg">💡</span>
          <span>We strongly recommend taking both documents for peace of mind and the best protection.</span>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        {donors.map((donor) => {
          const currentSelection = selections[donor.id] || "";
          return (
            <div key={donor.id}>
              <h3 className={styles.stepSubHeading}>
                Which documents does <span className="text-zenco-blue">{donor.is_lead ? "You" : `${donor.first_name} ${donor.last_name}`}</span> need?
              </h3>

              <div className={styles.stackedButtonGroup}>
                <button
                  onClick={() => handleSelectionChange(donor.id, "Health and Welfare")}
                  className={`${styles.btnSelectStacked} ${currentSelection === "Health and Welfare" ? styles.btnSelectStackedActive : ""}`}
                >
                  Health and Welfare
                </button>
                <button
                  onClick={() => handleSelectionChange(donor.id, "Property and Finance")}
                  className={`${styles.btnSelectStacked} ${currentSelection === "Property and Finance" ? styles.btnSelectStackedActive : ""}`}
                >
                  Property and Finance
                </button>
                <button
                  onClick={() => handleSelectionChange(donor.id, "Both")}
                  className={currentSelection === "Both" ? styles.btnSelectStackedDark : styles.btnSelectStacked}
                >
                  Both
                </button>
              </div>
            </div>
          );
        })}

        {donors.length === 0 && (
          <Alert severity="info">No people selected. Please go back and select who this LPA is for.</Alert>
        )}
      </div>

      {/* <div className="flex justify-between items-center pt-8 border-t border-gray-100">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-500 hover:text-zenco-blue transition-colors font-medium"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={donors.length === 0 || isSaving}
          className="bg-zenco-blue hover:bg-[#07bdf5ff] text-white px-8 py-3 rounded-md font-bold transition-all disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save and continue"}
        </button>
      </div> */}
    </section>
  );
}
