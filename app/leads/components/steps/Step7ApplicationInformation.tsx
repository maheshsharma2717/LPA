"use client";

import { useState, useEffect } from "react";
import styles from "./Steps.module.css";
import { supabase } from "@/lib/supabase";
import { CircularProgress, Alert } from "@mui/material";

type ApplicantRecord = {
  id: string;
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
  currentDonorIndex: number;
};

export default function ApplicationInfoTab({ onNext, isSaving, allFormData, updateData, currentDonorIndex }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [donorRecord, setDonorRecord] = useState<ApplicantRecord | null>(null);
  const [attorneyRecords, setAttorneyRecords] = useState<ApplicantRecord[]>([]);

  const [currentView, setCurrentView] = useState<"applying" | "receiving">("applying");
  const [selectedRole, setSelectedRole] = useState<"donor" | "attorney">("donor");
  const [selectedAttorneyId, setSelectedAttorneyId] = useState<string>("");
  const [isChecked, setIsChecked] = useState(false);
  const [selectedRecipientType, setSelectedRecipientType] = useState<string>("donor");
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>("");
  const [otherPeople, setOtherPeople] = useState<ApplicantRecord[]>([]);

  const applicationId = allFormData?.who?.applicationId;
  const donorId = allFormData?.["which-donor"]?.donorId;
  const [lpaDocId, setLpaDocId] = useState<string | null>(null);

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

        const donorsRes = await fetch(`/api/donors?applicationId=${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: fetchedDonors } = await donorsRes.json();

        let activeDonorId = donorId;
        if (fetchedDonors) {
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
          activeDonorId = activeDonors[currentDonorIndex]?.id;
        }

        if (!activeDonorId) {
          setLoading(false);
          return;
        }

        const lpaDocsRes = await fetch(`/api/lpa-documents?donorId=${activeDonorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: lpaDocs } = await lpaDocsRes.json();

        if (!lpaDocs || lpaDocs.length === 0) {
          setError("No LPA documents found for this donor.");
          setLoading(false);
          return;
        }

        const activeLpaId = lpaDocs[0].id;
        setLpaDocId(activeLpaId);

        const donor = fetchedDonors?.find((d: any) => d.id === activeDonorId);

        if (donor) {
          setDonorRecord({
            id: donor.id,
            name: `${donor.first_name} ${donor.last_name}`,
            email: donor.email || "No email provided",
            role: "donor"
          });
        }

        const attorneysRes = await fetch(`/api/lpa-document-attorneys?lpaDocId=${activeLpaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: junctionRows } = await attorneysRes.json();

        let primaryAttorneys: ApplicantRecord[] = [];
        if (junctionRows) {
          primaryAttorneys = junctionRows
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

        // Fetch other people (e.g. for Notify)
        const notifyRes = await fetch(`/api/people-to-notify?lpaDocId=${activeLpaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: notifyPeople } = await notifyRes.json();
        const notifyList = (notifyPeople || []).map((p: any) => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          email: p.email || "No email provided",
          role: "notify" as any
        }));

        setOtherPeople(notifyList);

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
  }, [applicationId, currentDonorIndex, allFormData?.who]);

  useEffect(() => {
    if (isSaving) {
      handleSave();
    }
  }, [isSaving]);

  const handleSave = async () => {
    if (currentView === "applying") {
      setCurrentView("receiving");
      return;
    }

    if (!lpaDocId || !isChecked) {
      onNext();
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;

      await fetch(`/api/lpa-document-applicants?lpaDocId=${lpaDocId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

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

      const registeringName = currentDisplayApplicant?.name || donorRecord?.name || "Donor";

      let receivingName = "Donor";
      if (selectedRecipientType === "donor") receivingName = donorRecord?.name || "Donor";
      else if (selectedRecipientType === "attorney") receivingName = attorneyRecords.find(a => a.id === selectedRecipientId)?.name || "Attorney";
      else if (selectedRecipientType === "other") receivingName = otherPeople.find(p => p.id === selectedRecipientId)?.name || "Other";

      updateData({
        registeringPerson: registeringName,
        receivingPerson: receivingName,
        selectedRole,
        selectedAttorneyId,
        selectedRecipientType,
        selectedRecipientId
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
    <main className="grow flex items-center justify-center pb-20">
      <div className="max-w-3xl w-full">
        {currentView === "applying" ? (
          <>
            <h4 className={styles.stepHeading}>
              Who is applying <span className="text-cyan-400">to register?</span>
            </h4>

            <div className={styles.dividerZenco}></div>

            <p className={styles.pZenco + " text-gray-600 mb-8"}>
              This document can't be used until it is registered by the Office of the Public Guardian (OPG).
              Only the donor ({donorRecord?.name}) or one of the attorneys can apply to register this document.
              Select from the option below whether the donor ({donorRecord?.name}) is registering or one of the attorneys.
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
                <option value="attorney">Attorneys</option>
              </select>
            </div>

            {selectedRole === "attorney" && attorneyRecords.length === 1 && (
              <p className="text-sm text-gray-500 mt-4 mb-2">
                You only have one attorney, they have been automatically selected.
              </p>
            )}

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
                className={`${isChecked ? styles.btnSelectDark : styles.btnSelectWhite} mt-6`}
                onClick={() => {
                  if (selectedRole !== "donor") setIsChecked(!isChecked);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isChecked ? 'bg-white/20' : 'bg-gray-100'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isChecked ? 'text-white' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-semibold ${isChecked ? 'text-white' : 'text-gray-800'}`}>{currentDisplayApplicant.name}</p>
                    <p className={`text-sm ${isChecked ? 'text-white/80' : 'text-gray-500'}`}>
                      {currentDisplayApplicant.email || "No email provided"}
                    </p>
                  </div>
                </div>

                <div className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-white border-white' : 'border-gray-200 bg-white'}`}>
                  {isChecked && (
                    <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            )}

            {selectedRole === "attorney" && attorneyRecords.length === 0 && (
              <Alert severity="warning" className="mt-4">
                No primary attorneys found. Please go back to Step 4 and add at least one primary attorney if you wish to select an attorney as the applicant.
              </Alert>
            )}
          </>
        ) : (
          <>
            <h4 className={styles.stepHeading}>
              Who should <span className="text-cyan-400">receive the document?</span>
            </h4>

            <div className={styles.dividerZenco}></div>

            <p className={styles.pZenco + " text-gray-600"}>
              Once this document is registered with the Office of the Public Guardian (OPG) it will be sent to the person listed below.
            </p>

            <div className="mt-6">
              <label className="font-semibold text-sm block mb-2">
                Where should the registered document be sent?
              </label>

              <select
                value={selectedRecipientType}
                onChange={(e) => {
                  setSelectedRecipientType(e.target.value);
                  setSelectedRecipientId("");
                  if (e.target.value === "donor") setSelectedRecipientId(donorRecord?.id || "");
                  if (e.target.value === "attorney" && attorneyRecords.length === 1) setSelectedRecipientId(attorneyRecords[0].id);
                }}
                className={styles.applicantDropdown}
              >
                <option value="">Choose from this list...</option>
                <option value="attorney">Attorney</option>
                <option value="donor">Donor</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mt-8 space-y-4">
              {selectedRecipientId && (
                <p className="text-sm font-semibold text-gray-500 mb-2">
                  Who you would like to recieve the registered document.
                </p>
              )}
              {selectedRecipientType === "donor" && donorRecord && (
                <div
                  className={`${selectedRecipientId === donorRecord.id ? styles.btnSelectDark : styles.btnSelectWhite}`}
                  onClick={() => setSelectedRecipientId(donorRecord.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedRecipientId === donorRecord.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${selectedRecipientId === donorRecord.id ? 'text-white' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className={`font-semibold text-lg ${selectedRecipientId === donorRecord.id ? 'text-white' : 'text-gray-800'}`}>{donorRecord.name}</p>
                      <p className={`text-sm ${selectedRecipientId === donorRecord.id ? 'text-white/80' : 'text-gray-500'}`}>{donorRecord.email}</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center transition-all ${selectedRecipientId === donorRecord.id ? 'bg-white border-white' : 'border-gray-200 bg-white'}`}>
                    {selectedRecipientId === donorRecord.id && (
                      <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              )}

              {selectedRecipientType === "attorney" && attorneyRecords.map(person => (
                <div
                  key={person.id}
                  className={`${selectedRecipientId === person.id ? styles.btnSelectDark : styles.btnSelectWhite}`}
                  onClick={() => setSelectedRecipientId(person.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedRecipientId === person.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${selectedRecipientId === person.id ? 'text-white' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className={`font-semibold text-lg ${selectedRecipientId === person.id ? 'text-white' : 'text-gray-800'}`}>{person.name}</p>
                      <p className={`text-sm ${selectedRecipientId === person.id ? 'text-white/80' : 'text-gray-500'}`}>{person.email}</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center transition-all ${selectedRecipientId === person.id ? 'bg-white border-white' : 'border-gray-200 bg-white'}`}>
                    {selectedRecipientId === person.id && (
                      <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}

              {selectedRecipientType === "other" && otherPeople.map(person => (
                <div
                  key={person.id}
                  className={`${selectedRecipientId === person.id ? styles.btnSelectDark : styles.btnSelectWhite}`}
                  onClick={() => setSelectedRecipientId(person.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedRecipientId === person.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${selectedRecipientId === person.id ? 'text-white' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className={`font-semibold text-lg ${selectedRecipientId === person.id ? 'text-white' : 'text-gray-800'}`}>{person.name}</p>
                      <p className={`text-sm ${selectedRecipientId === person.id ? 'text-white/80' : 'text-gray-500'}`}>{person.email}</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center transition-all ${selectedRecipientId === person.id ? 'bg-white border-white' : 'border-gray-200 bg-white'}`}>
                    {selectedRecipientId === person.id && (
                      <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex items-center justify-between mt-12 mb-10">
          <button
            onClick={() => currentView === "receiving" ? setCurrentView("applying") : null}
            className="flex items-center gap-2 text-gray-400 font-semibold hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span>Back</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className={styles.btnPrimaryZenco}
            style={{ width: 'auto', minWidth: '180px', borderRadius: '0.25rem' }}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Save and continue"}
          </button>
        </div>
      </div>
    </main>
  );
}
