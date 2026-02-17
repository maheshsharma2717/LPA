"use client";

import { useState } from "react";
import {
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
} from "@mui/material";

type Props = {
  onComplete: () => void;
};

export default function InitialDetailsForm({ onComplete }: Props) {
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
  });

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
    formData.mobile;

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
              backgroundColor: "#2563eb",
              "&:hover": { backgroundColor: "#1d4ed8" },
            }}
          >
            Search
          </Button>
        </div>

        <TextField
          label="Select address"
          value={formData.address}
          onChange={(e) => handleChange("address", e.target.value)}
          fullWidth
        />
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
          disabled={!isValid}
          onClick={onComplete}
          sx={{
            backgroundColor: "#2563eb",
            "&:hover": { backgroundColor: "#1d4ed8" },
            paddingY: 1.5,
          }}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
