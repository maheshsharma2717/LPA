"use client";

import { useEffect } from "react";

type Props = {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  isSaving: boolean;
  allFormData: any;
  currentDonorIndex: number;
};

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Person = {
  id?: string;
  title: string;
  firstName: string;
  lastName: string;
  middleName: string;
  postcode: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  county: string;
};

export default function CertificateProviderTab({ data, updateData, onNext, isSaving, allFormData, currentDonorIndex }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeLpaId, setActiveLpaId] = useState<string | null>(null);

  const applicationId = allFormData?.who?.applicationId;

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

        let activeDonorId = allFormData?.["which-donor"]?.donorId;
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

        if (lpaDocs && lpaDocs.length > 0) {
          const lpaId = lpaDocs[0].id;
          setActiveLpaId(lpaId);

          // 2. Get existing Cert Provider
          const cpRes = await fetch(`/api/certificate-providers?lpaDocId=${lpaId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const { data: cpData } = await cpRes.json();

          if (cpData) {
            setChoice("yes");
            setRelationship(cpData.certification_basis === 'personal_knowledge' ? 'Friend' : (cpData.professional_title || "GP")); // Fallback/default logic

            // Map DB fields to local Person type
            const person: Person & { id: string } = {
              id: cpData.id,
              title: cpData.title || "",
              firstName: cpData.first_name || "",
              lastName: cpData.last_name || "",
              middleName: cpData.middle_name || "",
              postcode: cpData.postcode || "",
              addressLine1: cpData.address_line_1 || "",
              addressLine2: cpData.address_line_2 || "",
              city: cpData.city || "",
              county: cpData.county || "",
            };

            setProviders([person]);
            setSelectedProviderId(person.id);
          }
          else if (data?.hasProvider !== undefined) {
            setChoice(data.hasProvider ? "yes" : "no");
          }
        }
      } catch (err) {
        console.error("Error loading Step 8:", err);
        setError("Failed to load certificate provider details.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [allFormData?.who, currentDonorIndex, applicationId]);

  useEffect(() => {
    if (isSaving) {
      handleFinalSave();
    }
  }, [isSaving]);
  const [openModal, setOpenModal] = useState(false);
  const [choice, setChoice] = useState<"yes" | "no" | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [relationship, setRelationship] = useState<string>("");
  const [providers, setProviders] = useState<(Person & { id: string })[]>([]);

  const [newPerson, setNewPerson] = useState<Person>({
    title: "",
    firstName: "",
    lastName: "",
    middleName: "",
    postcode: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    county: "",
  });
  const [showManualAddress, setShowManualAddress] = useState(false);

  const handleAddPerson = () => {
    if (
      !newPerson.title ||
      !newPerson.firstName ||
      !newPerson.lastName ||
      !newPerson.postcode ||
      !newPerson.addressLine1 ||
      !newPerson.city
    )
      return;

    // Use a temp ID if not already present
    const personWithId = { ...newPerson, id: providers[0]?.id || `temp-${Date.now()}` };
    setProviders([personWithId]);
    setSelectedProviderId(personWithId.id);

    setNewPerson({
      title: "",
      firstName: "",
      lastName: "",
      middleName: "",
      postcode: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      county: "",
    });
    setOpenModal(false);
    setShowManualAddress(false);
  };

  const handleFinalSave = async () => {
    if (choice === "yes" && providers.length === 0) {
      setError("Please add certificate provider details.");
      return;
    }
    if (choice === "yes" && !relationship) {
      setError("Please select a relationship.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;

      if (choice === "yes" && providers.length > 0 && activeLpaId) {
        const p = providers[0];
        const isProfessional = ['GP', 'Social Worker', 'Registered Nurse'].includes(relationship);

        const body = {
          lpa_document_id: activeLpaId,
          title: p.title,
          first_name: p.firstName,
          last_name: p.lastName,
          middle_name: p.middleName,
          address_line_1: p.addressLine1,
          address_line_2: p.addressLine2,
          city: p.city,
          county: p.county,
          postcode: p.postcode,
          certification_basis: isProfessional ? 'professional' : 'personal_knowledge',
          professional_title: isProfessional ? relationship : null,
          relationship_length_years: isProfessional ? null : 2
        };

        if (p.id && !p.id.startsWith('temp-')) {
          await fetch("/api/certificate-providers", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id: p.id, ...body }),
          });
        } else {
          await fetch("/api/certificate-providers", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
          });
        }
      }

      updateData({ hasProvider: choice === "yes", relationship });
      onNext();
    } catch (err) {
      console.error("Error saving certificate provider:", err);
      setError("Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const allowedRelationships = [
    { label: "Friend", value: "Friend" },
    { label: "Neighbour", value: "Neighbour" },
    { label: "GP", value: "GP" },
    { label: "Social Worker", value: "Social Worker" },
    { label: "Registered Nurse", value: "Registered Nurse" },
  ];

  const disallowedRelationships = [
    { label: "Partner -- (this person can't be used)", value: "Partner" },
    { label: "Son -- (this person can't be used)", value: "Son" },
    { label: "Daughter -- (this person can't be used)", value: "Daughter" },
    { label: "Brother -- (this person can't be used)", value: "Brother" },
    { label: "Sister -- (this person can't be used)", value: "Sister" },
    { label: "Father -- (this person can't be used)", value: "Father" },
    { label: "Mother -- (this person can't be used)", value: "Mother" },
    { label: "Father-in-law -- (this person can't be used)", value: "Father-in-law" },
    { label: "Mother-in-law -- (this person can't be used)", value: "Mother-in-law" },
  ];

  if (loading) return <Box p={10} display="flex" justifyContent="center"><CircularProgress /></Box>;

  return (
    <>
      <section className="max-w-3xl mx-auto pb-10">
        {error && <Alert severity="error" className="mb-6">{error}</Alert>}
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-9">
            <h4 className="text-center text-3xl font-bold text-[#334a5e]">
              The <span className="text-cyan-400">Certificate Provider</span>
            </h4>

            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>

            <div className="flex flex-col gap-5">
              <p className="text-gray-700 font-medium">
                This person signs to confirm they have discussed the Lasting
                Power of Attorney with the Donor and that they are fully aware
                of what they are doing.
              </p>

              <div className="flex flex-col gap-4">
                <p className="text-xl font-semibold">
                  Do you want to choose your certificate provider now?
                </p>
                <div className="flex flex-col gap-0 border-2 border-[#334a5e] rounded-md overflow-hidden">
                  <button
                    onClick={() => setChoice("no")}
                    className={`leading-loose p-4 text-center font-semibold transition-colors ${choice === "no"
                      ? "bg-[#334a5e] text-white"
                      : "bg-white text-[#334a5e] hover:bg-gray-50"
                      }`}
                  >
                    No, I will add them when I sign the documents
                  </button>
                  <button
                    onClick={() => setChoice("yes")}
                    className={`leading-loose p-4 text-center font-semibold border-t-2 border-[#334a5e] transition-colors ${choice === "yes"
                      ? "bg-[#334a5e] text-white"
                      : "bg-white text-[#334a5e] hover:bg-gray-50"
                      }`}
                  >
                    Yes, I know the details now
                  </button>
                </div>
              </div>

              {choice === "yes" && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  <div className="flex flex-col gap-5 bg-cyan-50 rounded p-6 border border-cyan-200">
                    <div className="flex text-xl text-cyan-900 font-semibold items-center gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        className="text-cyan-500"
                        fill="currentColor"
                      >
                        <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 9.5C12.8284 9.5 13.5 8.82843 13.5 8C13.5 7.17157 12.8284 6.5 12 6.5C11.1716 6.5 10.5 7.17157 10.5 8C10.5 8.82843 11.1716 9.5 12 9.5ZM14 15H13V10.5H10V12.5H11V15H10V17H14V15Z"></path>
                      </svg>
                      <p>Please read the below carefully</p>
                    </div>
                    <div className="flex flex-col gap-4 text-cyan-800 text-sm">
                      <p className="text-lg font-bold">Recommended</p>
                      <div className="space-y-3 leading-relaxed">
                        <p>We suggest using a friend or neighbour of the donor to be a certificate provider.</p>
                        <p>This person signs to confirm they have discussed the Lasting Power of Attorney with the Donor.</p>
                        <p>This person must be over 18 and have known the donor for a minimum of 2 years.</p>
                        <p>This is very important: there are rules on who can't be a certificate provider, too.</p>
                        <p>The certificate provider <u className="font-bold">must not</u> be:</p>
                        <ul className="list-disc ps-6 space-y-2">
                          <li>An attorney or replacement attorney</li>
                          <li>A relative, or someone who's related to an attorney - this includes civil partners, spouses, in-laws and step-relatives</li>
                          <li>The Donor's (unmarried) partner, or the partner of one of your attorneys - whether they live together or not</li>
                          <li>The Donor's, or attorney's business partner or employee</li>
                          <li>Someone who owns, manages, is a director of or works at a care home where they live, or anyone related to them</li>
                        </ul>
                      </div>
                      <p className="text-lg font-bold mt-2">Alternative</p>
                      <p>You can also use a medical professional (doctor, social worker, nurse) to sign the document. They will sign in their professional capacity to ensure the donor has mental capacity.</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <p className="text-lg font-semibold">Please add the certificate provider details below.</p>

                    {providers.map((p: any) => (
                      <div key={p.id} className="bg-[#3A4C5F] text-white rounded p-6 flex justify-between items-center ring-2 ring-blue-500">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-lg">{p.firstName} {p.lastName}</p>
                            <p className="text-gray-300 text-sm">{p.email || "No email provided"}</p>
                            <button
                              onClick={() => setOpenModal(true)}
                              className="text-cyan-300 text-sm font-medium hover:underline flex items-center gap-1 mt-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                              Change this person
                            </button>
                          </div>
                        </div>
                        <input type="checkbox" checked className="w-6 h-6 accent-white" readOnly />
                      </div>
                    ))}

                    {providers.length === 0 && (
                      <button
                        onClick={() => setOpenModal(true)}
                        className="border-2 border-dashed border-gray-300 p-4 flex items-center justify-center gap-2 font-semibold text-gray-600 hover:border-cyan-400 hover:text-cyan-500 transition-all cursor-pointer rounded"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="20"
                          height="20"
                          fill="currentColor"
                        >
                          <path d="M14 14.252V22H4C4 17.5817 7.58172 14 12 14C12.6906 14 13.3608 14.0875 14 14.252ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13ZM18 17V14H20V17H23V19H20V22H18V19H15V17H18Z" />
                        </svg>
                        <span>Add a Certificate Provider</span>
                      </button>
                    )}
                  </div>

                  {providers.length > 0 && (
                    <div className="flex flex-col gap-3 animate-fadeIn">
                      <p className="text-lg font-semibold">What relationship is this person to the Donor?</p>
                      <Select
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        fullWidth
                        displayEmpty
                        className="bg-white border-2 border-gray-300 rounded-md outline-none"
                        renderValue={(selected) => {
                          if (!selected) return <span className="text-gray-400">Choose Relationship...</span>;
                          const all = [...allowedRelationships, ...disallowedRelationships];
                          const match = all.find(r => r.value === selected);
                          return <span className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {match?.label || selected}
                          </span>;
                        }}
                      >
                        <MenuItem disabled value="" className="bg-[#2563eb] text-white font-bold opacity-100 italic">
                          Choose Relationship...
                        </MenuItem>
                        {allowedRelationships.map((r) => (
                          <MenuItem key={r.value} value={r.value} className="flex gap-2 items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {r.label}
                          </MenuItem>
                        ))}
                        {disallowedRelationships.map((r) => (
                          <MenuItem key={r.value} value={r.value} disabled className="flex gap-2 items-center bg-gray-100 text-gray-500 opacity-60">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            {r.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-12 mb-10">
            <button
              onClick={() => { }}
              className="flex items-center gap-2 text-gray-400 font-semibold hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Back</span>
            </button>

            <button
              onClick={handleFinalSave}
              disabled={isSubmitting}
              className="px-10 py-3 rounded text-white font-bold shadow-lg transition-all flex items-center justify-center min-w-[180px] bg-[#06b6d4] hover:bg-cyan-600 disabled:bg-gray-400"
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Save and continue"}
            </button>
          </div>
        </div>
      </section>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <div className="flex justify-between items-center px-6 py-4 bg-[#334a5e]">
          <DialogTitle className="text-white p-0">Add person</DialogTitle>
          <button
            className="text-white hover:text-gray-300 transition-colors"
            onClick={() => setOpenModal(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="currentColor"
            >
              <path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"></path>
            </svg>
          </button>
        </div>

        <DialogContent className="p-8 space-y-8">
          <div className="space-y-6">
            <p className="text-xl font-bold text-[#334a5e]">Full legal name</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormControl fullWidth>
                <p className="text-sm font-semibold mb-2 text-gray-600">Title</p>
                <Select
                  value={newPerson.title}
                  onChange={(e) =>
                    setNewPerson({ ...newPerson, title: e.target.value })
                  }
                  className="bg-white"
                >
                  {["Mr", "Mrs", "Miss", "Ms", "Mx", "Dr", "Rev", "Prof", "Lady", "Lord"].map((title) => (
                    <MenuItem key={title} value={title}>{title}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <div className="hidden md:block"></div>

              <FormControl fullWidth>
                <p className="text-sm font-semibold mb-2 text-gray-600">First Name</p>
                <TextField
                  fullWidth
                  value={newPerson.firstName}
                  onChange={(e) =>
                    setNewPerson({ ...newPerson, firstName: e.target.value })
                  }
                  variant="outlined"
                />
              </FormControl>

              <FormControl fullWidth>
                <p className="text-sm font-semibold mb-2 text-gray-600">Last Name</p>
                <TextField
                  fullWidth
                  value={newPerson.lastName}
                  onChange={(e) =>
                    setNewPerson({ ...newPerson, lastName: e.target.value })
                  }
                  variant="outlined"
                />
              </FormControl>
            </div>

            <FormControl fullWidth>
              <p className="text-sm font-semibold mb-2 text-gray-600">Middle Name (optional)</p>
              <TextField
                fullWidth
                value={newPerson.middleName}
                onChange={(e) =>
                  setNewPerson({ ...newPerson, middleName: e.target.value })
                }
                variant="outlined"
              />
            </FormControl>
          </div>

          <div className="space-y-6">
            <p className="text-xl font-bold text-[#334a5e]">What's their address?</p>
            <div className="flex gap-4 items-end">
              <FormControl className="flex-grow">
                <p className="text-sm font-semibold mb-2 text-gray-600">Postcode</p>
                <TextField
                  fullWidth
                  value={newPerson.postcode}
                  onChange={(e) =>
                    setNewPerson({ ...newPerson, postcode: e.target.value })
                  }
                  variant="outlined"
                />
              </FormControl>
              <Button
                variant="contained"
                className="bg-blue-500 hover:bg-blue-600 h-[56px] px-8 font-bold"
              >
                Search
              </Button>
            </div>
            {!showManualAddress && (
              <button
                type="button"
                onClick={() => setShowManualAddress(true)}
                className="text-cyan-500 font-semibold hover:underline"
              >
                Enter address manually
              </button>
            )}

            {showManualAddress && (
              <div className="space-y-6 animate-fadeIn">
                <FormControl fullWidth>
                  <p className="text-sm font-semibold mb-2 text-gray-600">Address Line 1</p>
                  <TextField
                    fullWidth
                    value={newPerson.addressLine1}
                    onChange={(e) =>
                      setNewPerson({ ...newPerson, addressLine1: e.target.value })
                    }
                    variant="outlined"
                  />
                </FormControl>

                <FormControl fullWidth>
                  <p className="text-sm font-semibold mb-2 text-gray-600">Address Line 2 (optional)</p>
                  <TextField
                    fullWidth
                    value={newPerson.addressLine2}
                    onChange={(e) =>
                      setNewPerson({ ...newPerson, addressLine2: e.target.value })
                    }
                    variant="outlined"
                  />
                </FormControl>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormControl fullWidth>
                    <p className="text-sm font-semibold mb-2 text-gray-600">City</p>
                    <TextField
                      fullWidth
                      value={newPerson.city}
                      onChange={(e) =>
                        setNewPerson({ ...newPerson, city: e.target.value })
                      }
                      variant="outlined"
                    />
                  </FormControl>

                  <FormControl fullWidth>
                    <p className="text-sm font-semibold mb-2 text-gray-600">County (optional)</p>
                    <TextField
                      fullWidth
                      value={newPerson.county}
                      onChange={(e) =>
                        setNewPerson({ ...newPerson, county: e.target.value })
                      }
                      variant="outlined"
                    />
                  </FormControl>
                </div>
              </div>
            )}
          </div>

          <div className="hidden">
            <p className="text-xl font-bold text-[#334a5e]">What's their email address? (optional)</p>
            <TextField
              fullWidth
              value={""}
              variant="outlined"
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-4">
            <p className="text-xl font-bold text-[#334a5e]">Age</p>
            <RadioGroup
              defaultValue="over18"
              name="age-group"
              className="flex flex-row gap-8"
            >
              <FormControlLabel
                value="over18"
                control={<Radio color="primary" />}
                label={<span className="font-medium">Over 18</span>}
              />
              <FormControlLabel
                disabled
                value="under18"
                control={<Radio color="primary" />}
                label={<span className="font-medium">Under 18 (Cannot be a provider)</span>}
              />
            </RadioGroup>
          </div>
        </DialogContent>

        <DialogActions className="p-6 bg-gray-50 border-t">
          <Button
            variant="contained"
            onClick={handleAddPerson}
            fullWidth
            className="bg-blue-600 hover:bg-blue-700 py-4 text-lg font-bold shadow-lg text-white"
          >
            Save and continue
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
