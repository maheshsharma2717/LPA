"use client";

import { useState, useEffect } from "react";
import {
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  CircularProgress
} from "@mui/material";
import { supabase } from "@/lib/supabase";

type Props = {
  lead?: any;
  userId?: string;
  onComplete: () => void;
};

export default function InitialDetailsForm({ lead, userId, onComplete }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    lastName: "",
    middleName: "",
    knownByOtherNames: "",
    preferredName: "",
    day: "",
    month: "",
    year: "",
    postcode: "",
    address: "",
    addressLine2: "",
    city: "",
    county: "",
    mobile: "",
    landline: "",
  });

  useEffect(() => {
    if (lead) {
      const dob = lead.date_of_birth ? new Date(lead.date_of_birth) : null;
      setFormData({
        title: lead.title || "",
        firstName: lead.first_name || "",
        lastName: lead.last_name || "",
        middleName: lead.middle_name || "",
        knownByOtherNames: lead.known_by_other_names || "",
        preferredName: lead.preferred_name || "",
        day: dob ? dob.getDate().toString() : "",
        month: dob ? (dob.getMonth() + 1).toString() : "",
        year: dob ? dob.getFullYear().toString() : "",
        postcode: lead.postcode || "",
        address: lead.address_line_1 || "",
        addressLine2: lead.address_line_2 || "",
        city: lead.city || "",
        county: lead.county || "",
        mobile: lead.mobile || "",
        landline: lead.landline || "",
      });
    }
  }, [lead]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isValid =
    formData.title &&
    formData.firstName &&
    formData.lastName &&
    formData.day &&
    formData.month &&
    formData.year &&
    formData.postcode &&
    formData.address &&
    formData.city &&
    formData.mobile;

  const handleContinue = async () => {
    const activeUserId = lead?.id || userId;

    if (!activeUserId) {
      onComplete();
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const dob = `${formData.year}-${formData.month.padStart(2, '0')}-${formData.day.padStart(2, '0')}`;

      const response = await fetch("/api/leads", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: activeUserId,
          title: formData.title,
          first_name: formData.firstName,
          last_name: formData.lastName,
          middle_name: formData.middleName,
          known_by_other_names: formData.knownByOtherNames,
          preferred_name: formData.preferredName,
          date_of_birth: dob,
          postcode: formData.postcode,
          address_line_1: formData.address,
          address_line_2: formData.addressLine2,
          city: formData.city,
          county: formData.county,
          mobile: formData.mobile,
          landline: formData.landline,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update lead details");
      }
      onComplete();
    } catch (err) {
      console.error("Error saving lead details:", err);
      // Fallback to next step even if save fails, but log it
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <h2 className="text-2xl font-bold text-zenco-dark">
          Tell us a little about yourself
        </h2>
        <p className="text-gray-600 mt-2 text-sm">
          First, please give us some information about yourself to create your
          account.
        </p>
      </div>

      {/* Full Legal Name */}
      <div className="space-y-6">
        <h3 className="font-semibold text-lg text-zenco-dark">
          Full legal name
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormControl fullWidth>
            <InputLabel>Title</InputLabel>
            <Select
              value={formData.title}
              label="Title"
              onChange={(e) => handleChange("title", e.target.value)}
            >
              {[
                "Mr",
                "Mrs",
                "Miss",
                "Ms",
                "Mx",
                "Dr",
                "Rev",
                "Prof",
                "Lady",
                "Lord",
              ].map((title) => (
                <MenuItem key={title} value={title}>
                  {title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="First Name"
            value={formData.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            fullWidth
          />

          <TextField
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            fullWidth
          />
        </div>
        <div className="flex flex-col gap-5">
          <TextField
            label="Middle names (if any)"
            value={formData.middleName}
            onChange={(e) => handleChange("middleName", e.target.value)}
            fullWidth
          />

          <TextField
            label="Have you ever been known by any other names? (Optional)"
            value={formData.knownByOtherNames}
            onChange={(e) => handleChange("knownByOtherNames", e.target.value)}
            fullWidth
          />

          <TextField
            label="Preferred Name (Optional)"
            value={formData.preferredName}
            onChange={(e) => handleChange("preferredName", e.target.value)}
            fullWidth
          />
        </div>
      </div>

      {/* Date of Birth */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-zenco-dark">Date of birth</h3>

        <div className="grid grid-cols-3 gap-6">
          <TextField
            label="Day"
            value={formData.day}
            onChange={(e) => handleChange("day", e.target.value)}
          />
          <TextField
            label="Month"
            value={formData.month}
            onChange={(e) => handleChange("month", e.target.value)}
          />
          <TextField
            label="Year"
            value={formData.year}
            onChange={(e) => handleChange("year", e.target.value)}
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-zenco-dark">
          What's your address?
        </h3>

        <div className="flex gap-4">
          <TextField
            label="Enter postcode"
            value={formData.postcode}
            onChange={(e) => handleChange("postcode", e.target.value)}
            fullWidth
          />

          <Button
            variant="contained"
            sx={{
              backgroundColor: "#08B9ED",
              "&:hover": { backgroundColor: "#07bdf5ff" },
            }}
          >
            Search
          </Button>
        </div>
<div className="flex gap-4">

        <TextField
          label="Address Line 1"
          value={formData.address}
          onChange={(e) => handleChange("address", e.target.value)}
          fullWidth
          />
          </div>
<div className="flex gap-4">

        <TextField
          label="Address Line 2 (Optional)"
          value={formData.addressLine2}
          onChange={(e) => handleChange("addressLine2", e.target.value)}
          fullWidth
        />
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            label="Town / City"
            value={formData.city}
            onChange={(e) => handleChange("city", e.target.value)}
            fullWidth
          />

          <TextField
            label="County (Optional)"
            value={formData.county}
            onChange={(e) => handleChange("county", e.target.value)}
            fullWidth
          />
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-zenco-dark">
          Contact Number
        </h3>

        <div className="grid grid-cols-2 gap-6">
          <TextField
            label="Mobile number"
            value={formData.mobile}
            onChange={(e) => handleChange("mobile", e.target.value)}
            fullWidth
          />

          <TextField
            label="Landline number (optional)"
            value={formData.landline}
            onChange={(e) => handleChange("landline", e.target.value)}
            fullWidth
          />
        </div>
      </div>

      {/* Continue */}
      <div className="pt-4">
        <Button
          fullWidth
          variant="contained"
          disabled={!isValid || loading}
          onClick={handleContinue}
          sx={{
            backgroundColor: "#08B9ED",
            "&:hover": { backgroundColor: "#1d4ed8" },
            paddingY: 1.5,
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Continue"}
        </Button>
      </div>
    </div>
  );
}
