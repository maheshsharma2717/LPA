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
        <h1 className="text-3xl font-bold text-zenco-dark">
          Which <span className="text-zenco-blue">Lasting Power of Attorney</span> documents do you need?
        </h1>
        <p className="text-gray-600">
          You need to choose which type of documents you want. Choose{" "}
          <strong className="text-zenco-dark">Health and Welfare</strong> for health decisions,{" "}
          <strong className="text-zenco-dark">Property and Finance</strong> for decisions about your finances, or choose{" "}
          <strong className="text-zenco-dark">Both</strong>.
        </p>
        <div className="bg-blue-50 border-l-4 border-zenco-blue p-4 rounded-r-md">
          <p className="text-sm text-zenco-dark">
            <span className="font-bold">💡 Recommendation:</span> We strongly recommend taking both documents for peace of mind and the best protection.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {donors.map((donor) => (
          <div key={donor.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-zenco-dark mb-4">
              Which documents does <span className="text-zenco-blue">{donor.first_name} {donor.last_name}</span> need?
            </h3>
            <FormControl fullWidth>
              <InputLabel>Document Selection</InputLabel>
              <Select
                value={selections[donor.id] || ""}
                label="Document Selection"
                onChange={(e) => handleSelectionChange(donor.id, e.target.value as DocumentSelection)}
              >
                <MenuItem value="Health and Welfare">Health and Welfare</MenuItem>
                <MenuItem value="Property and Finance">Property and Finance</MenuItem>
                <MenuItem value="Both">Both (Recommended)</MenuItem>
              </Select>
            </FormControl>
          </div>
        ))}

        {donors.length === 0 && (
          <Alert severity="info">No people selected. Please go back and select who this LPA is for.</Alert>
        )}
      </div>
    </section>
  );
}
