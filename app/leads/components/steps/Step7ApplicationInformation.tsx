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

export default function ApplicationInfoTab({ onNext,onBack, isSaving, allFormData, updateData, currentDonorIndex }: Props) {
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

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((row: any) => row.role === "primary")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const notifyList = (notifyPeople || []).map((p: any) => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          email: p.email || "No email provided",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  }, [applicationId, currentDonorIndex, allFormData?.who, donorId]);

  useEffect(() => {
    if (isSaving) {
      handleSave();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <main className="grow flex items-center justify-center pb-20">
      <div className="max-w-3xl w-full">
        {currentView === "applying" ? (
          <>
            <h4 className={styles.stepHeading}>
              Who is applying <span className="text-cyan-400">to register?</span>
            </h4>

            <div className={styles.dividerZenco}></div>

            <p className={styles.pZenco + " font-normal text-gray-600 mb-8"}>
              This document can&apos;t be used until it is registered by the Office of the Public Guardian (OPG).
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
                className={`${styles.selectedApplication} ${isChecked ? 'border-2 border-blue-500' : ''} mt-6 cursor-pointer rounded`}
                onClick={() => {
                  if (selectedRole !== "donor") setIsChecked(!isChecked);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">{currentDisplayApplicant.name}</p>
                    <p className="text-sm opacity-90">
                      {currentDisplayApplicant.email || "No email provided"}
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={selectedRole === "donor" ? true : isChecked}
                  disabled={selectedRole === "donor"}
                  onChange={() => {
                    if (selectedRole !== "donor") setIsChecked(!isChecked);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-5 h-5 accent-blue-500 shrink-0"
                />
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

            <p className={styles.pZenco + " font-normal text-gray-600"}>
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
                  className={`rounded p-4 flex justify-between items-center cursor-pointer transition-all ${selectedRecipientId === donorRecord.id ? 'bg-[#3A4C5F] text-white' : 'border border-gray-200 text-gray-700'}`}
                  onClick={() => setSelectedRecipientId(donorRecord.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedRecipientId === donorRecord.id ? 'bg-gray-400' : 'bg-gray-100'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${selectedRecipientId === donorRecord.id ? 'text-white' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{donorRecord.name}</p>
                      <p className={`${selectedRecipientId === donorRecord.id ? 'text-gray-300' : 'text-gray-500'}`}>{donorRecord.email}</p>
                      {/* <button className={`text-sm font-medium hover:underline flex items-center gap-1 mt-1 ${selectedRecipientId === donorRecord.id ? 'text-cyan-300' : 'text-cyan-500'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Update this person&apos;s details
                      </button> */}
                    </div>
                  </div>
                  <input type="checkbox" checked={selectedRecipientId === donorRecord.id} readOnly className="w-6 h-6 accent-white" />
                </div>
              )}

              {selectedRecipientType === "attorney" && attorneyRecords.map(person => (
                <div
                  key={person.id}
                  className={`rounded p-4 flex justify-between items-center cursor-pointer transition-all ${selectedRecipientId === person.id ? 'bg-[#3A4C5F] text-white' : 'border border-gray-200 text-gray-700'}`}
                  onClick={() => setSelectedRecipientId(person.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedRecipientId === person.id ? 'bg-gray-400' : 'bg-gray-100'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${selectedRecipientId === person.id ? 'text-white' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{person.name}</p>
                      <p className={`${selectedRecipientId === person.id ? 'text-gray-300' : 'text-gray-500'}`}>{person.email}</p>
                      {/* <button className={`text-sm font-medium hover:underline flex items-center gap-1 mt-1 ${selectedRecipientId === person.id ? 'text-cyan-300' : 'text-cyan-500'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Update this person&apos;s details
                      </button> */}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedRecipientId === person.id}
                    readOnly
                    className="w-6 h-6 accent-white"
                  />
                </div>
              ))}

              {selectedRecipientType === "other" && otherPeople.map(person => (
                <div
                  key={person.id}
                  className={`rounded p-4 flex justify-between items-center cursor-pointer transition-all ${selectedRecipientId === person.id ? 'bg-[#3A4C5F] text-white' : 'border border-gray-200 text-gray-700'}`}
                  onClick={() => setSelectedRecipientId(person.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedRecipientId === person.id ? 'bg-gray-400' : 'bg-gray-100'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${selectedRecipientId === person.id ? 'text-white' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{person.name}</p>
                      <p className={`${selectedRecipientId === person.id ? 'text-gray-300' : 'text-gray-500'}`}>{person.email}</p>
                      {/* <button className={`text-sm font-medium hover:underline flex items-center gap-1 mt-1 ${selectedRecipientId === person.id ? 'text-cyan-300' : 'text-cyan-500'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Update this person&apos;s details
                      </button> */}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedRecipientId === person.id}
                    readOnly
                    className="w-6 h-6 accent-white"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex items-center justify-between mt-12 mb-10">
          <button onClick={handleBack} className={`cursor-pointer`}>
          ← back
        </button>

          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className={`px-10 py-3 rounded text-white font-bold shadow-lg transition-all flex items-center justify-center min-w-45 ${currentView === "applying"
              ? "bg-[#2563eb] hover:bg-blue-700"
              : "bg-[#06b6d4] hover:bg-cyan-600"
              }`}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Save and continue"}
          </button>
          
        </div>
      </div>
    </main>
  );
}
