"use client";

import { useState, useEffect } from "react";
import styles from "./Steps.module.css";
import { supabase } from "@/lib/supabase";
import { CircularProgress, Alert } from "@mui/material";

type ApplicantRecord = {
  id: string; // donorId or attorneyId
  name: string;
  email: string;
  role: "donor" | "attorney";
};

type Props = {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  isSaving: boolean;
  allFormData: any;
};

export default function ApplicationInfoTab({ onNext, isSaving, allFormData }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [donorRecord, setDonorRecord] = useState<ApplicantRecord | null>(null);
  const [attorneyRecords, setAttorneyRecords] = useState<ApplicantRecord[]>([]);

  const [selectedRole, setSelectedRole] = useState<"donor" | "attorney">("donor");
  const [selectedAttorneyId, setSelectedAttorneyId] = useState<string>("");
  const [isChecked, setIsChecked] = useState(false);

  const applicationId = allFormData?.who?.applicationId;
  const donorId = allFormData?.["which-donor"]?.donorId;
  const [lpaDocId, setLpaDocId] = useState<string | null>(null);

  // ─── Data Fetch ───────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if (!donorId) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const token = session.access_token;

        // 1. Fetch LPA documents for this donor
        const lpaDocsRes = await fetch(`/api/lpa-documents?donorId=${donorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: lpaDocs } = await lpaDocsRes.json();

        if (!lpaDocs || lpaDocs.length === 0) {
          setError("No LPA documents found for this donor.");
          setLoading(false);
          return;
        }

        const activeLpaId = lpaDocs[0].id; // Handling first one for now
        setLpaDocId(activeLpaId);

        // 2. Fetch Donor Details
        const donorRes = await fetch(`/api/donors?applicationId=${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: donors } = await donorRes.json();
        const donor = donors?.find((d: any) => d.id === donorId);

        if (donor) {
          setDonorRecord({
            id: donor.id,
            name: `${donor.first_name} ${donor.last_name}`,
            email: donor.email || "No email provided",
            role: "donor"
          });
        }

        // 3. Fetch Primary Attorneys for this LPA doc
        const attorneysRes = await fetch(`/api/lpa-document-attorneys?lpaDocId=${activeLpaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: junctionRows } = await attorneysRes.json();

        if (junctionRows) {
          const primaryAttorneys = junctionRows
            .filter((row: any) => row.role === "primary")
            .map((row: any) => ({
              id: row.attorneys.id,
              name: `${row.attorneys.first_name} ${row.attorneys.last_name}`,
              email: row.attorneys.email || "No email provided",
              role: "attorney" as const
            }));
          setAttorneyRecords(primaryAttorneys);
          if (primaryAttorneys.length > 0) {
            setSelectedAttorneyId(primaryAttorneys[0].id);
          }
        }

        // 4. Fetch existing applicant for this LPA doc to restore state
        const applicantRes = await fetch(`/api/lpa-document-applicants?lpaDocId=${activeLpaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: existingApplicants } = await applicantRes.json();

        if (existingApplicants && existingApplicants.length > 0) {
          const first = existingApplicants[0];
          setSelectedRole(first.applicant_role);
          if (first.applicant_role === "attorney") {
            setSelectedAttorneyId(first.attorney_id);
          }
          setIsChecked(true);
        }

      } catch (err) {
        console.error("Error loading applicant data:", err);
        setError("Failed to load application details.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [donorId]);

  useEffect(() => {
    if (isSaving) {
      handleSave();
    }
  }, [isSaving]);

  const handleSave = async () => {
    if (!lpaDocId || !isChecked) {
      onNext();
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;

      // 1. Delete existing junction entries (reset)
      await fetch(`/api/lpa-document-applicants?lpaDocId=${lpaDocId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      // 2. Insert new applicant
      const attorneyId = selectedRole === "attorney" ? selectedAttorneyId : null;

      await fetch("/api/lpa-document-applicants", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          lpa_document_id: lpaDocId,
          applicant_role: selectedRole,
          attorney_id: attorneyId
        })
      });

      onNext();
    } catch (err) {
      console.error("Error saving applicant:", err);
      setError("Failed to save selection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><CircularProgress /></div>;
  if (error) return <Alert severity="error" className="m-4">{error}</Alert>;

  const currentDisplayApplicant = selectedRole === "donor"
    ? donorRecord
    : attorneyRecords.find(a => a.id === selectedAttorneyId);

  return (
    <main className="grow flex items-center justify-center">
      <div className="max-w-3xl w-full">

        <h4 className={styles.stepHeading}>
          Who is applying to register?
        </h4>

        <div className={styles.dividerZenco}></div>

        <p className={styles.pZenco}>
          Only the donor (you) or one of the attorneys can apply to register
          this document.
        </p>

        <div className="mt-6">
          <label className="font-semibold text-sm block mb-2">
            Who is applying to register?
          </label>

          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value as "donor" | "attorney");
              setIsChecked(true);
            }}
            className={styles.applicantDropdown}
          >
            <option value="donor">Donor</option>
            <option value="attorney">Attorney</option>
          </select>
        </div>

        {selectedRole === "attorney" && attorneyRecords.length > 1 && (
          <div className="mt-4">
            <label className="font-semibold text-sm block mb-2">
              Select which attorney is applying:
            </label>
            <select
              value={selectedAttorneyId}
              onChange={(e) => setSelectedAttorneyId(e.target.value)}
              className={styles.applicantDropdown}
            >
              {attorneyRecords.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}

        {currentDisplayApplicant && (
          <div
            className={`${styles.selectedApplication} ${isChecked ? 'ring-2 ring-blue-500' : ''} mt-6`}
            onClick={() => setIsChecked(!isChecked)}
          >
            <div>
              <p className="font-semibold">{currentDisplayApplicant.name}</p>
              <p className="text-sm opacity-90">
                {currentDisplayApplicant.email}
              </p>
            </div>

            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => setIsChecked(!isChecked)}
              onClick={(e) => e.stopPropagation()}
              className="w-5 h-5 accent-white shrink-0"
            />
          </div>
        )}

        {selectedRole === "attorney" && attorneyRecords.length === 0 && (
          <Alert severity="warning" className="mt-4">
            No primary attorneys found. Please go back to Step 4 and add at least one primary attorney if you wish to select an attorney as the applicant.
          </Alert>
        )}

      </div>
    </main>
  );
}
