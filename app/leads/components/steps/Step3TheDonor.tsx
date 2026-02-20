"use client";

import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  CircularProgress,
  Alert,
  Box
} from "@mui/material";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  isSaving: boolean;
  allFormData: any;
};

export default function DonorTab({ onNext, isSaving, allFormData, updateData }: Props) {
  const [loading, setLoading] = useState(true);
  const [currentDonor, setCurrentDonor] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Internal Step State: 0 = Personal Details, 1 = Address/Contact
  const [subStep, setSubStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    lastName: "",
    middleName: "",
    preferredName: "",
    day: "",
    month: "",
    year: "",
    postcode: "",
    address: "",
    mobile: "",
    landline: "",
    city: "",      // Added to match schema/form
    county: "",    // Added
    addressLine2: "" // Added
  });

  const applicationId = allFormData?.who?.applicationId;

  // Initial Data Fetch
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
          setLoading(false);
          return;
        }

        // Filter active donors (same logic as Step 2)
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

        // SELECT FIRST DONOR
        // TODO: In future, handle multiple donors iteration
        const firstDonor = activeDonors[0];

        if (firstDonor) {
          setCurrentDonor(firstDonor);

          // Parse DOB
          let day = "", month = "", year = "";
          if (firstDonor.date_of_birth) {
            const date = new Date(firstDonor.date_of_birth);
            day = String(date.getDate());
            // Month names array matches the Select options
            const months = [
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"
            ];
            month = months[date.getMonth()];
            year = String(date.getFullYear());
          }

          setFormData({
            title: firstDonor.title || "",
            firstName: firstDonor.first_name || "",
            lastName: firstDonor.last_name || "",
            middleName: firstDonor.middle_name || "",
            preferredName: firstDonor.preferred_name || "",
            day,
            month,
            year,
            postcode: firstDonor.postcode || "",
            address: firstDonor.address_line_1 || "",
            addressLine2: firstDonor.address_line_2 || "",
            city: firstDonor.city || "",
            county: firstDonor.county || "",
            mobile: "", // Donor table doesn't have mobile? Leads table does. 
            // If it's the Lead, we might want to fetch from Leads table or use what's in Donors if we added it?
            // Schema check: Donors table (from API_REFERENCE) does NOT have mobile/landline.
            // Leads table has mobile.
            // Step 3 UI asks for contact info?
            // Let's check the UI code I'm replacing... 
            // It had mobile/landline inputs. "address" field (single line?).
            // API Reference -> Donors: address_line_1, address_line_2, city, county, postcode.
            // No mobile/landline in Donors table. 
            // If it's the Lead, we updated Profile.
            // If it's another person, do we collect mobile?
            // Reference says "Leads" extends users. "Donors" does not have contact info columns in the snippet.
            // Wait, looking at API_REFERENCE again.
            // Table `donors`: title, first_name... address... relationship... 
            // NO mobile/email in `donors` table.
            // `attorneys` table has email.
            // `leads` table has mobile/landline.
            // So if this donor is NOT the lead, we might not be storing mobile?
            // OR the UI expects it but backend doesn't support it yet?
            // For now, I'll bind what I can.
            landline: ""
          });
        }

      } catch (err) {
        console.error("Error loading Step 3:", err);
        setError("Failed to load donor details.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [applicationId, allFormData?.who]);

  // Handle Internal "Next"
  const handleInternalNext = async () => {
    if (subStep === 0) {
      // Validation for Personal Details could go here
      setSubStep(1);
      window.scrollTo(0, 0);
    } else {
      // Final Save
      setIsSubmitting(true);
      await handleSave();
      setIsSubmitting(false);
    }
  };

  const handleInternalBack = () => {
    if (subStep === 1) {
      setSubStep(0);
      window.scrollTo(0, 0);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;

      // Construct DOB
      const monthIdx = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ].indexOf(formData.month);

      let dob = null;
      if (formData.year && formData.month && formData.day) {
        // Create date object (UTC or local? simple ISO string YYYY-MM-DD usually best for date type)
        // Note: Date.parse might be timezone dependent.
        // Safer:
        const m = String(monthIdx + 1).padStart(2, '0');
        const d = String(formData.day).padStart(2, '0');
        dob = `${formData.year}-${m}-${d}`;
      }

      const body = {
        id: currentDonor.id,
        title: formData.title,
        first_name: formData.firstName,
        last_name: formData.lastName,
        middle_name: formData.middleName,
        preferred_name: formData.preferredName,
        date_of_birth: dob,
        address_line_1: formData.address, // Mapping 'address' input to line 1
        address_line_2: formData.addressLine2,
        city: formData.city,
        county: formData.county,
        postcode: formData.postcode,
        // Mobile/Landline not in `donors` schema, ignoring for now or needs schema update.
      };

      await fetch("/api/donors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      // Save donorId to formData so downstream steps (4, 5, etc.) can access it
      updateData({ donorId: currentDonor.id });

      onNext();
    } catch (err) {
      console.error("Error saving donor:", err);
      setError("Failed to save details.");
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!currentDonor) return <Alert severity="info">No donor found. Please go back.</Alert>;

  const donorName = `${currentDonor.first_name} ${currentDonor.last_name}`;

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-top-4">
      <div className="flex flex-col gap-5">
        <h1 className="text-center text-3xl font-bold text-zenco-dark">
          Details for <span className="text-zenco-blue">{donorName}</span> (The Donor)
        </h1>

        {subStep === 0 && (
          <div className="flex flex-col gap-3 text-gray-600">
            <p>The 'Donor' is the person appointing other people to make decisions on their behalf and must be:</p>
            <ul className="list-none space-y-2">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Aged 18 or over.
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Have mental capacity to make decisions at the time their Lasting Power of Attorney is being made.
              </li>
            </ul>
            <p>The Donor is the only one who can make decisions about their Lasting Power of Attorney and the people it should involve.</p>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-8">

        {/* SUB-STEP 0: PERSONAL DETAILS */}
        {subStep === 0 && (
          <div className="space-y-8 animate-in fade-in">
            <h3 className="font-semibold text-lg text-zenco-dark border-b pb-2">Full legal name</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormControl fullWidth>
                <InputLabel>Title</InputLabel>
                <Select value={formData.title} label="Title" onChange={(e) => handleFormChange("title", e.target.value)}>
                  {["Mr", "Mrs", "Miss", "Ms", "Mx", "Dr", "Rev", "Prof", "Lady", "Lord"].map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="First Name" value={formData.firstName} onChange={(e) => handleFormChange("firstName", e.target.value)} fullWidth />
              <TextField label="Last Name" value={formData.lastName} onChange={(e) => handleFormChange("lastName", e.target.value)} fullWidth />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextField label="Middle names (if any)" value={formData.middleName} onChange={(e) => handleFormChange("middleName", e.target.value)} fullWidth />
              <TextField label="Preferred Name (Optional)" value={formData.preferredName} onChange={(e) => handleFormChange("preferredName", e.target.value)} fullWidth />
            </div>

            <h3 className="font-semibold text-lg text-zenco-dark border-b pb-2 mt-8">Date of birth</h3>
            <div className="grid grid-cols-3 gap-6">
              <FormControl fullWidth>
                <InputLabel>Day</InputLabel>
                <Select value={formData.day} label="Day" onChange={(e) => handleFormChange("day", e.target.value)}>
                  {[...Array(31)].map((_, i) => <MenuItem key={i + 1} value={String(i + 1)}>{i + 1}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select value={formData.month} label="Month" onChange={(e) => handleFormChange("month", e.target.value)}>
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select value={formData.year} label="Year" onChange={(e) => handleFormChange("year", e.target.value)}>
                  {Array.from({ length: 110 }, (_, i) => {
                    const y = new Date().getFullYear() - i;
                    return <MenuItem key={y} value={String(y)}>{y}</MenuItem>
                  })}
                </Select>
              </FormControl>
            </div>
          </div>
        )}

        {/* SUB-STEP 1: ADDRESS & CONTACT DETAILS */}
        {subStep === 1 && (
          <div className="space-y-8 animate-in fade-in">
            <h3 className="font-semibold text-lg text-zenco-dark border-b pb-2">Address & Contact</h3>
            <div className="space-y-4">
              <TextField label="Address Line 1" value={formData.address} onChange={(e) => handleFormChange("address", e.target.value)} fullWidth />
              <TextField label="Address Line 2 (Optional)" value={formData.addressLine2} onChange={(e) => handleFormChange("addressLine2", e.target.value)} fullWidth />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField label="City" value={formData.city} onChange={(e) => handleFormChange("city", e.target.value)} fullWidth />
                <TextField label="County (Optional)" value={formData.county} onChange={(e) => handleFormChange("county", e.target.value)} fullWidth />
              </div>
              <TextField label="Postcode" value={formData.postcode} onChange={(e) => handleFormChange("postcode", e.target.value)} fullWidth />
            </div>
          </div>
        )}
      </div>

      {/* Internal Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button
          onClick={handleInternalBack}
          sx={{ color: '#6b7280', textTransform: 'none', opacity: subStep === 0 ? 0 : 1 }}
          disabled={subStep === 0}
        >
          Back
        </Button>

        <Button
          variant="contained"
          onClick={handleInternalNext}
          disabled={isSubmitting}
          sx={{
            backgroundColor: "#08B9ED", // zenco-blue
            textTransform: "none",
            borderRadius: "8px",
            padding: "8px 32px",
            "&:hover": { backgroundColor: "#1d4ed8" },
          }}
        >
          {subStep === 1 ? (isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Save and Continue") : "Save and Continue"}
        </Button>
      </div>
    </section>
  );
}
