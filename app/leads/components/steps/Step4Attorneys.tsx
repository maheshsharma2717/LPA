"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";
import { supabase } from "@/lib/supabase";

type Person = {
  id: string;
  title: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth?: string;
  is_lead: boolean;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  county?: string;
  postcode?: string;
  email?: string;
};

type Props = {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  isSaving: boolean;
  allFormData: any;
};

const emptyForm = {
  title: "Mr",
  firstName: "",
  lastName: "",
  middleName: "",
  dob: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  county: "",
  postcode: "",
  email: "",
};

export default function AttorneysTab({ onNext, isSaving, allFormData, updateData }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Internal sub-step: 0=Select Attorneys, 1=Document Authority, 2=Replacement Attorneys
  const [subStep, setSubStep] = useState(0);

  // People pool (all donors except the subject donor)
  const [peoplePool, setPeoplePool] = useState<Person[]>([]);

  // Selected attorney IDs (donor IDs chosen as primary attorneys)
  const [selectedAttorneyIds, setSelectedAttorneyIds] = useState<string[]>([]);

  // Document viewing authority
  const [canViewDocuments, setCanViewDocuments] = useState<boolean | null>(null);

  // Replacement attorneys
  const [wantsReplacement, setWantsReplacement] = useState<boolean | null>(null);
  const [selectedReplacementIds, setSelectedReplacementIds] = useState<string[]>([]);

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"attorney" | "replacement">("attorney");
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null); // null = add new, string = editing existing
  const [formData, setFormData] = useState({ ...emptyForm });

  const applicationId = allFormData?.who?.applicationId;

  // ─── Data Fetch ───────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if (!applicationId) { setLoading(false); return; }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const token = session.access_token;

        // Fetch all donors (the people pool)
        const donorsRes = await fetch(`/api/donors?applicationId=${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: donors } = await donorsRes.json();

        if (donors && donors.length > 0) {
          // Determine which donor is the "subject" (the one whose details were filled in Step 3)
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
          const subjectDonorId = activeDonors[0]?.id;

          // People pool = all donors EXCEPT the subject donor
          const pool = donors.filter((d: any) => d.id !== subjectDonorId);
          setPeoplePool(pool);
        }

        // Fetch existing attorneys for this application to restore selections
        const attorneysRes = await fetch(`/api/attorneys?applicationId=${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: existingAttorneys } = await attorneysRes.json();

        if (existingAttorneys && existingAttorneys.length > 0) {
          // We'll match attorneys back to donors by name (since attorneys are copies)
          // For now just store selectedIds from saved form data if available
        }

        // Restore saved form data selections
        const savedData = allFormData?.attorneys;
        if (savedData) {
          if (savedData.selectedAttorneyIds) setSelectedAttorneyIds(savedData.selectedAttorneyIds);
          if (savedData.selectedReplacementIds) setSelectedReplacementIds(savedData.selectedReplacementIds);
          if (savedData.canViewDocuments !== undefined) setCanViewDocuments(savedData.canViewDocuments);
          if (savedData.wantsReplacement !== undefined) setWantsReplacement(savedData.wantsReplacement);
        }
      } catch (err) {
        console.error("Error loading Step 4:", err);
        setError("Failed to load attorney details.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [applicationId]);

  // ─── Toggle Selection ─────────────────────────────────────
  const toggleAttorney = (id: string) => {
    setSelectedAttorneyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleReplacement = (id: string) => {
    setSelectedReplacementIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ─── Open Modal for Adding ────────────────────────────────
  const openAddModal = (mode: "attorney" | "replacement") => {
    setModalMode(mode);
    setEditingPersonId(null);
    setFormData({ ...emptyForm });
    setOpenModal(true);
  };

  // ─── Open Modal for Editing ───────────────────────────────
  const openEditModal = (person: Person, mode: "attorney" | "replacement") => {
    setModalMode(mode);
    setEditingPersonId(person.id);
    setFormData({
      title: person.title || "Mr",
      firstName: person.first_name || "",
      lastName: person.last_name || "",
      middleName: person.middle_name || "",
      dob: person.date_of_birth || "",
      addressLine1: person.address_line_1 || "",
      addressLine2: person.address_line_2 || "",
      city: person.city || "",
      county: person.county || "",
      postcode: person.postcode || "",
      email: person.email || "",
    });
    setOpenModal(true);
  };

  // ─── Save Modal (Add or Edit) ────────────────────────────
  const handleSaveModal = async () => {
    if (!formData.firstName || !formData.lastName) return;
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;

      const donorBody: any = {
        application_id: applicationId,
        is_lead: false,
        title: formData.title,
        first_name: formData.firstName,
        last_name: formData.lastName,
        middle_name: formData.middleName,
        date_of_birth: formData.dob || null,
        address_line_1: formData.addressLine1,
        address_line_2: formData.addressLine2,
        city: formData.city,
        county: formData.county,
        postcode: formData.postcode,
      };

      if (editingPersonId) {
        // PATCH existing donor
        const res = await fetch("/api/donors", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: editingPersonId, ...donorBody }),
        });
        const { data: updated } = await res.json();

        if (updated) {
          setPeoplePool((prev) =>
            prev.map((p) => (p.id === editingPersonId ? updated : p))
          );
        }
      } else {
        // POST new donor
        const res = await fetch("/api/donors", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(donorBody),
        });
        const { data: donor } = await res.json();

        if (donor) {
          setPeoplePool((prev) => [...prev, donor]);
          // Auto-select the newly created person
          if (modalMode === "attorney") {
            setSelectedAttorneyIds((prev) => [...prev, donor.id]);
          } else {
            setSelectedReplacementIds((prev) => [...prev, donor.id]);
          }
        }
      }

      setOpenModal(false);
      setFormData({ ...emptyForm });
      setEditingPersonId(null);
    } catch (err) {
      console.error("Error saving person:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Save & Navigate ─────────────────────────────────────
  const handleInternalNext = async () => {
    if (subStep === 0) {
      if (selectedAttorneyIds.length === 0) {
        setError("Please select at least one attorney.");
        return;
      }
      setError(null);
      setSubStep(1);
      window.scrollTo(0, 0);
    } else if (subStep === 1) {
      if (canViewDocuments === null) {
        setError("Please select an option.");
        return;
      }
      setError(null);
      setSubStep(2);
      window.scrollTo(0, 0);
    } else {
      // Final save — delete-and-recreate attorneys + junction table links
      setIsSubmitting(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const token = session.access_token;

        // ── 0. Resolve the active donor's ID independently ──
        let activeDonorId = allFormData?.["which-donor"]?.donorId;

        if (!activeDonorId) {
          // Fallback: derive from donors list (same pattern used in Steps 2, 3, 5)
          const donorsRes = await fetch(`/api/donors?applicationId=${applicationId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const { data: allDonors } = await donorsRes.json();
          if (allDonors && allDonors.length > 0) {
            const step1Selection = allFormData?.who?.selection;
            const step1SelectedIds = allFormData?.who?.selectedPeopleIds || [];
            const isLeadSelected =
              step1Selection === "You" ||
              step1Selection === "You and your partner" ||
              step1Selection === "You and someone else";
            const activeDonors = allDonors.filter((d: any) => {
              if (d.is_lead) return isLeadSelected;
              return step1SelectedIds.includes(d.id);
            });
            activeDonorId = activeDonors[0]?.id;
          }
        }

        if (!activeDonorId) {
          setError("Could not find the donor. Please go back to Step 3.");
          setIsSubmitting(false);
          return;
        }

        // ── 1. Fetch LPA documents for the donor ──
        const lpaDocsRes = await fetch(`/api/lpa-documents?donorId=${activeDonorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: lpaDocs } = await lpaDocsRes.json();

        // ── 2. Clean up old junction rows + old attorneys (delete-and-recreate) ──
        // 2a. Delete existing lpa_document_attorneys for each LPA doc
        if (lpaDocs && lpaDocs.length > 0) {
          for (const doc of lpaDocs) {
            // Fetch existing junction rows for this doc
            const junctionRes = await fetch(`/api/lpa-document-attorneys?lpaDocId=${doc.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const { data: existingLinks } = await junctionRes.json();
            if (existingLinks && existingLinks.length > 0) {
              for (const link of existingLinks) {
                await fetch(`/api/lpa-document-attorneys?id=${link.id}`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                });
              }
            }

            // Also clean up old lpa_document_applicants
            await fetch(`/api/lpa-document-applicants?lpaDocId=${doc.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }

        // 2b. Soft-delete existing attorneys for this application
        const existingAttRes = await fetch(`/api/attorneys?applicationId=${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: existingAttorneys } = await existingAttRes.json();
        if (existingAttorneys && existingAttorneys.length > 0) {
          for (const att of existingAttorneys) {
            await fetch(`/api/attorneys?id=${att.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }

        // ── 3. Create fresh primary attorneys ──
        const primaryAttorneyDbIds: string[] = [];
        for (const donorId of selectedAttorneyIds) {
          const person = peoplePool.find((p) => p.id === donorId);
          if (!person) continue;

          const res = await fetch("/api/attorneys", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              application_id: applicationId,
              title: person.title,
              first_name: person.first_name,
              last_name: person.last_name,
              middle_name: person.middle_name,
              date_of_birth: person.date_of_birth,
              address_line_1: person.address_line_1,
              address_line_2: person.address_line_2,
              city: person.city,
              county: person.county,
              postcode: person.postcode,
              email: person.email,
            }),
          });
          const { data: attorney } = await res.json();
          if (attorney) primaryAttorneyDbIds.push(attorney.id);
        }

        // ── 4. Create fresh replacement attorneys ──
        const replacementAttorneyDbIds: string[] = [];
        if (wantsReplacement) {
          for (const donorId of selectedReplacementIds) {
            const person = peoplePool.find((p) => p.id === donorId);
            if (!person) continue;

            const res = await fetch("/api/attorneys", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                application_id: applicationId,
                title: person.title,
                first_name: person.first_name,
                last_name: person.last_name,
                middle_name: person.middle_name,
                date_of_birth: person.date_of_birth,
                address_line_1: person.address_line_1,
                address_line_2: person.address_line_2,
                city: person.city,
                county: person.county,
                postcode: person.postcode,
                email: person.email,
              }),
            });
            const { data: attorney } = await res.json();
            if (attorney) replacementAttorneyDbIds.push(attorney.id);
          }
        }

        // ── 5. Link attorneys to LPA documents + create applicant entries ──
        if (lpaDocs && lpaDocs.length > 0) {
          for (const doc of lpaDocs) {
            // Link primary attorneys
            for (let i = 0; i < primaryAttorneyDbIds.length; i++) {
              await fetch("/api/lpa-document-attorneys", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  lpa_document_id: doc.id,
                  attorney_id: primaryAttorneyDbIds[i],
                  role: "primary",
                  sort_order: i + 1,
                }),
              });
            }

            // Link replacement attorneys
            for (let i = 0; i < replacementAttorneyDbIds.length; i++) {
              await fetch("/api/lpa-document-attorneys", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  lpa_document_id: doc.id,
                  attorney_id: replacementAttorneyDbIds[i],
                  role: "replacement",
                  sort_order: i + 1,
                }),
              });
            }

            // Create lpa_document_applicants — default: donor is the applicant
            await fetch("/api/lpa-document-applicants", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                lpa_document_id: doc.id,
                applicant_role: "donor",
                attorney_id: null,
              }),
            });
          }
        }

        // Save selections to formData for restoration
        updateData({
          selectedAttorneyIds,
          selectedReplacementIds,
          canViewDocuments,
          wantsReplacement,
        });

        onNext();
      } catch (err) {
        console.error("Error saving attorneys:", err);
        setError("Failed to save attorney details.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleInternalBack = () => {
    if (subStep > 0) {
      setSubStep(subStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // ─── Format helpers ───────────────────────────────────────
  const formatDob = (dob: string | undefined) => {
    if (!dob) return "";
    const d = new Date(dob);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  // ─── Render ───────────────────────────────────────────────
  if (loading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error && !peoplePool.length && subStep === 0) return <Alert severity="error">{error}</Alert>;

  // Eligible replacement attorneys = people pool minus selected primary attorneys
  const replacementPool = peoplePool.filter((p) => !selectedAttorneyIds.includes(p.id));

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-top-4">

      {/* ═══════ SUB-STEP 0: SELECT PRIMARY ATTORNEYS ═══════ */}
      {subStep === 0 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column - Attorney Selection */}
            <div className="flex-1 space-y-5">
              <h1 className="text-center text-3xl font-bold text-zenco-dark">Attorneys</h1>

              <div className="flex flex-col gap-3 text-gray-600">
                <p>
                  Attorneys are people a donor appoints to make decisions on their
                  behalf, you need to choose at least one Attorney.
                </p>
              </div>

              <p className="text-lg font-semibold text-zenco-dark">Select your attorneys</p>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <div className="space-y-3">
                {peoplePool.map((person) => {
                  const isSelected = selectedAttorneyIds.includes(person.id);
                  return (
                    <div
                      key={person.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${isSelected
                        ? "border-[#334a5e] bg-[#334a5e] text-white"
                        : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                    >
                      <div>
                        <p className="font-semibold">
                          {person.first_name} {person.last_name}
                          {person.is_lead ? " (You)" : ""}
                        </p>
                        <p className={`text-sm ${isSelected ? "text-gray-300" : "text-gray-500"}`}>
                          {formatDob(person.date_of_birth)}
                        </p>
                        <p
                          className={`text-sm underline cursor-pointer ${isSelected ? "text-blue-200 hover:text-blue-100" : "text-blue-600 hover:text-blue-800"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(person, "attorney");
                          }}
                        >
                          ✎ Update this person&apos;s details
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAttorney(person.id)}
                        className="w-5 h-5 cursor-pointer accent-zenco-blue"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Add new attorney */}
              <button
                onClick={() => openAddModal("attorney")}
                className="w-full border-2 border-dashed border-gray-300 p-4 flex items-center justify-center gap-2 font-semibold cursor-pointer rounded-lg hover:border-gray-400 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M14 14.252V22H4C4 17.5817 7.58172 14 12 14C12.6906 14 13.3608 14.0875 14 14.252ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13ZM18 17V14H20V17H23V19H20V22H18V19H15V17H18Z" />
                </svg>
                <span>Add new attorney</span>
              </button>
            </div>

            {/* Right Column - Info */}
            <div className="md:w-72 space-y-3">
              <h3 className="font-semibold text-zenco-dark">Who can be an Attorney?</h3>
              <p className="text-sm text-gray-600">The Attorney must be meet the following requirements:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Aged <strong>18 or over</strong>.
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Have <strong>mental capacity</strong> to make decisions.
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Must <strong>not</strong> be bankrupt, or subject to a debt relief order.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ SUB-STEP 1: DOCUMENT VIEW AUTHORITY ═══════ */}
      {subStep === 1 && (
        <div className="space-y-6 animate-in fade-in">
          <h1 className="text-center text-3xl font-bold text-zenco-dark">
            Can attorneys <span className="text-zenco-blue">view your legal documents?</span>
          </h1>

          <div className="h-1 bg-gradient-to-r from-zenco-blue to-blue-400 rounded-full" />

          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <p className="text-gray-700">
                Are you happy for your Attorneys to view your legal documents if you lose
                mental capacity?
              </p>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <div className="flex flex-col gap-0">
                <button
                  onClick={() => setCanViewDocuments(true)}
                  className={`border-2 p-4 text-center transition-all ${canViewDocuments === true
                    ? "border-[#334a5e] bg-[#334a5e] text-white font-semibold"
                    : "border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  Yes - give the attorneys authority
                </button>
                <button
                  onClick={() => setCanViewDocuments(false)}
                  className={`border-2 border-t-0 p-4 text-center transition-all ${canViewDocuments === false
                    ? "border-[#334a5e] bg-[#334a5e] text-white font-semibold"
                    : "border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  No - do not give the attorneys authority
                </button>
              </div>
            </div>

            {/* Right Column - Help */}
            <div className="md:w-72">
              <details className="border border-gray-200 rounded-lg">
                <summary className="p-3 font-semibold text-zenco-blue cursor-pointer">NEED HELP?</summary>
                <div className="p-3 text-sm text-gray-600">
                  <p>This gives your attorneys the authority to view your will, other LPAs, and related legal documents.</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ SUB-STEP 2: REPLACEMENT ATTORNEYS ═══════ */}
      {subStep === 2 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-5">
              <h1 className="text-center text-3xl font-bold text-zenco-dark">
                Replacement <span className="text-zenco-blue">Attorneys</span>
              </h1>

              <div className="flex flex-col gap-3 text-gray-600">
                <p>One or more replacement attorneys can be appointed, this is optional.</p>
                <p>
                  Replacement attorneys are people a donor appoints to make decisions on their
                  behalf if one of their attorneys can no longer make decisions on their behalf.
                </p>
              </div>

              <p className="text-lg font-semibold text-zenco-dark">
                Do you want any replacement attorneys?
              </p>

              <div className="flex flex-col gap-0">
                <button
                  onClick={() => { setWantsReplacement(false); setSelectedReplacementIds([]); }}
                  className={`border-2 p-4 text-center transition-all ${wantsReplacement === false
                    ? "border-[#334a5e] bg-[#334a5e] text-white font-semibold"
                    : "border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  No
                </button>
                <button
                  onClick={() => setWantsReplacement(true)}
                  className={`border-2 border-t-0 p-4 text-center transition-all ${wantsReplacement === true
                    ? "border-[#334a5e] bg-[#334a5e] text-white font-semibold"
                    : "border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  Yes
                </button>
              </div>

              {/* Show replacement selection if Yes */}
              {wantsReplacement && (
                <div className="space-y-4 animate-in fade-in mt-4">
                  <p className="text-lg font-semibold text-zenco-dark">Select your Replacement Attorneys</p>

                  <div className="space-y-3">
                    {replacementPool.map((person) => {
                      const isSelected = selectedReplacementIds.includes(person.id);
                      return (
                        <div
                          key={person.id}
                          className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                            ? "border-[#334a5e] bg-white shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="currentColor" className="text-gray-500">
                              <path d="M4 22C4 17.5817 7.58172 14 12 14C16.4183 14 20 17.5817 20 22H4ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13Z" />
                            </svg>
                            <div>
                              <p className="font-semibold text-zenco-dark">{person.first_name} {person.last_name}</p>
                              <p
                                className="text-sm underline text-blue-600 hover:text-blue-800 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(person, "replacement");
                                }}
                              >
                                ✎ Update this person&apos;s details
                              </p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleReplacement(person.id)}
                            className="w-5 h-5 cursor-pointer accent-zenco-blue"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Add new replacement attorney */}
                  <button
                    onClick={() => openAddModal("replacement")}
                    className="w-full border-2 border-dashed border-gray-300 p-4 flex items-center justify-center gap-2 font-semibold cursor-pointer rounded-lg hover:border-gray-400 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M14 14.252V22H4C4 17.5817 7.58172 14 12 14C12.6906 14 13.3608 14.0875 14 14.252ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13ZM18 17V14H20V17H23V19H20V22H18V19H15V17H18Z" />
                    </svg>
                    <span>Add new replacement attorney</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Column - Info */}
            <div className="md:w-72 space-y-3">
              <h3 className="font-semibold text-zenco-dark">Who can be a Replacement Attorney?</h3>
              <p className="text-sm text-gray-600">The replacement attorney must be meet the following requirements:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Aged <strong>18 or over</strong>.
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Have <strong>mental capacity</strong> to make decisions.
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Must <strong>not</strong> be bankrupt, or subject to a debt relief order.
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Must not already be assigned as an <strong>Attorney</strong>
                </li>
              </ul>
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

      {/* ═══════ ADD / EDIT PERSON MODAL ═══════ */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <div className="flex justify-between items-center px-4 py-2 bg-[#334a5e]">
          <DialogTitle className="text-white !p-0 !text-lg">
            {editingPersonId
              ? "Update person's details"
              : modalMode === "attorney"
                ? "Add attorney"
                : "Add replacement attorney"}
          </DialogTitle>
          <span className="hover:cursor-pointer text-white" onClick={() => setOpenModal(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z" />
            </svg>
          </span>
        </div>

        <DialogContent className="flex flex-col gap-5 mt-4">
          <p className="text-xl font-semibold text-zenco-dark">Full legal name</p>

          <FormControl fullWidth>
            <InputLabel>Title</InputLabel>
            <Select value={formData.title} label="Title" onChange={(e) => setFormData({ ...formData, title: e.target.value })}>
              {["Mr", "Mrs", "Miss", "Ms", "Mx", "Dr", "Rev", "Prof", "Lady", "Lord"].map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <div className="grid grid-cols-2 gap-4">
            <TextField label="First Name" fullWidth value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
            <TextField label="Last Name" fullWidth value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
          </div>

          <TextField label="Middle names (if any)" fullWidth value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} />

          <p className="text-xl font-semibold text-zenco-dark">What&apos;s their address?</p>
          <TextField label="Address Line 1" fullWidth value={formData.addressLine1} onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })} />
          <TextField label="Address Line 2 (Optional)" fullWidth value={formData.addressLine2} onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <TextField label="City" fullWidth value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
            <TextField label="County (Optional)" fullWidth value={formData.county} onChange={(e) => setFormData({ ...formData, county: e.target.value })} />
          </div>
          <TextField label="Postcode" fullWidth value={formData.postcode} onChange={(e) => setFormData({ ...formData, postcode: e.target.value })} />

          <p className="text-xl font-semibold text-zenco-dark">What&apos;s their date of birth?</p>
          <TextField type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />

          <p className="text-xl font-semibold text-zenco-dark">What&apos;s their email address? (optional)</p>
          <TextField label="Email" fullWidth value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </DialogContent>

        <DialogActions className="p-4">
          <Button
            fullWidth
            variant="contained"
            onClick={handleSaveModal}
            disabled={isSubmitting}
            sx={{
              backgroundColor: "#08B9ED",
              textTransform: "none",
              borderRadius: "8px",
              padding: "12px",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#1d4ed8" },
            }}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Save and continue"}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}
