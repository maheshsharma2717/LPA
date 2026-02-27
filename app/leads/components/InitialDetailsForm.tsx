"use client";

import { useState, useEffect } from "react";
import {
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  // InputLabel,
  CircularProgress,
} from "@mui/material";
import { supabase } from "@/lib/supabase";

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lead?: any;
  userId?: string;
  onComplete: () => void;
};

export default function InitialDetailsForm({
  lead,
  userId,
  onComplete,
}: Props) {
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

  const [otherName, setOtherName] = useState(false);

  const [openAddress, setOpenAddress] = useState(false);

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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const dob = `${formData.year}-${formData.month.padStart(2, "0")}-${formData.day.padStart(2, "0")}`;

      const response = await fetch("/api/leads", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  const isValidDay = /^(0?[1-9]|[12][0-9]|3[01])$/.test(formData.day);
  const isValidMonth = /^(0?[1-9]|1[0-2])$/.test(formData.month);
  const isValidYear = /^\d{4}$/.test(formData.year);

  return (
    <div className="space-y-10 max-w-2xl mx-auto px-4 sm:px-6 md:px-0 pb-16">
      {/* Heading */}
      <div>
        <h3 className="text-xl sm:text-2xl font-bold mb-4 text-zenco-dark">
          Tell us a little about{" "}
          <span className="text-[#08b9ed]">yourself</span>
        </h3>

        <div className="flex flex-col gap-4 text-gray-600 text-sm leading-relaxed">
          <p>
            First, please give us some information about yourself to create your
            account.
          </p>
          <p>
            You do not have to be the person the Lasting Power of Attorney is
            for – you might just be helping someone else make it.
          </p>
          <p>
            You&apos;ll be able to use these details in any documents you make using
            our service.
          </p>
        </div>
      </div>

      {/* Full Legal Name */}
      <div className="space-y-6">
        <h3 className="font-semibold text-lg text-zenco-dark">
          Full legal name
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-[#6B7588]   leading-loose">
          <FormControl fullWidth>
            <p>Title</p>
            <Select
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="bg-white"
            >
              {[
                "Choose...",
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

          <FormControl fullWidth>
            <p>First Name</p>
            <TextField
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              fullWidth
              className="bg-white"
            />
          </FormControl>

          <FormControl fullWidth>
            <p>Last Name</p>
            <TextField
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              fullWidth
              className="bg-white"
            />
          </FormControl>
        </div>

        {/* Middle / Optional */}
        <div className="flex flex-col gap-5 w-full md:max-w-[65%] text-[#6B7588]">
          <FormControl fullWidth>
            <p>Middle names (if any)</p>
            <TextField
              value={formData.middleName}
              onChange={(e) => handleChange("middleName", e.target.value)}
              fullWidth
              className="bg-white"
            />
          </FormControl>

          <FormControl fullWidth>
            {otherName ? (
              <div className="space-y-3">
                <p>
                  If this person has been known by any other names enter them
                  separated by a comma, for example &apos;Mary Smith, Mary
                  Smith-Cooper&apos;.
                </p>
                <p>
                  {" "}
                  This is only for other names you are known by on any legal or
                  medical forms, for example bank account or birth certificate.
                </p>
                <p className="text-right text-sm text-[#8F90A6]">(Optional)</p>

                <TextField
                  value={formData.knownByOtherNames}
                  onChange={(e) =>
                    handleChange("knownByOtherNames", e.target.value)
                  }
                  fullWidth
                  className="bg-white"
                />
              </div>
            ) : (
              <p
                onClick={() => setOtherName(true)}
                className="cursor-pointer text-[#08b9ed]"
              >
                <u>Known by any other names? Click Here</u>
              </p>
            )}
          </FormControl>

          <FormControl fullWidth>
            <p>Preferred Name (Optional)</p>
            <TextField
              value={formData.preferredName}
              onChange={(e) => handleChange("preferredName", e.target.value)}
              fullWidth
              className="bg-white"
            />
          </FormControl>
        </div>
      </div>

      {/* Date of Birth */}
      <div className="space-y-4  leading-loose">
        <h3 className="font-semibold text-lg text-zenco-dark">Date of birth</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-[#6B7588]">
          <FormControl fullWidth>
            <p>Day</p>
            <TextField
              value={formData.day}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value) && value.length <= 2) {
                  handleChange("day", value);
                }
              }}
              error={formData.day !== "" && !isValidDay}
              inputProps={{ inputMode: "numeric" }}
              className="bg-white"
            />
          </FormControl>

          <FormControl fullWidth>
            <p>Month</p>
            <TextField
              value={formData.month}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value) && value.length <= 2) {
                  handleChange("month", value);
                }
              }}
              error={formData.month !== "" && !isValidMonth}
              inputProps={{ inputMode: "numeric" }}
              className="bg-white"
            />
          </FormControl>

          <FormControl fullWidth>
            <p>Year</p>
            <TextField
              value={formData.year}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value) && value.length <= 4) {
                  handleChange("year", value);
              
                }
              }}
              error={formData.year !== "" &&
(! /^\d{4}$/.test(formData.year))
                //  !isValidYear
                }
              inputProps={{ inputMode: "numeric" }}
              className="bg-white"
            />
          </FormControl>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4 leading-loose">
        <h3 className="font-semibold text-lg text-zenco-dark">
          What&apos;s your address?
        </h3>

        {openAddress ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Address Line 1 */}
            <FormControl fullWidth>
              <p className="text-[#6B7588]">Address Line 1</p>
              <TextField
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                fullWidth
                className="bg-white"
              />
            </FormControl>

            {/* Address Line 2 */}
            <FormControl fullWidth>
              <p className="text-[#6B7588]">Address Line 2</p>
              <TextField
                value={formData.addressLine2}
                onChange={(e) => handleChange("addressLine2", e.target.value)}
                fullWidth
                className="bg-white"
              />
            </FormControl>

            {/* City */}
            <FormControl fullWidth>
              <p className="text-[#6B7588]">City</p>
              <TextField
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                fullWidth
                className="bg-white"
              />
            </FormControl>

            {/* County */}
            <FormControl fullWidth>
              <p className="text-[#6B7588]">County</p>
              <TextField
                value={formData.county}
                onChange={(e) => handleChange("county", e.target.value)}
                fullWidth
                className="bg-white"
              />
            </FormControl>




            {/* Postcode */}
            <FormControl fullWidth>
              <p className="text-[#6B7588]">Postcode</p>
              <TextField
                value={formData.postcode}
                onChange={(e) => handleChange("postcode", e.target.value)}
                fullWidth
                className="bg-white"
              />
            </FormControl>

            {/* Toggle Link */}
            <div className="sm:col-span-2">
              <p
                onClick={() => setOpenAddress(false)}
                className="cursor-pointer text-[#08b9ed]"
              >
                <u>Search for address</u>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <FormControl fullWidth>
              <p>Enter postcode to search</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
                  value={formData.postcode}
                  onChange={(e) => handleChange("postcode", e.target.value)}
                  fullWidth
                  className="bg-white"
                />

                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#08B9ED",
                    textTransform: "none",
                    fontSize: "15px",
                  }}
                  className="w-full h-full"
                >
                  Search
                </Button>
              </div>
            </FormControl>

            <p
              onClick={() => setOpenAddress(true)}
              className="cursor-pointer text-[#08b9ed]"
            >
              <u>Enter address manually</u>
            </p>
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="space-y-4 leading-loose ">
        <h3 className="font-semibold text-lg text-zenco-dark">
          Contact Number
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-[#6B7588]">
          <FormControl fullWidth>
            <p>Mobile number</p>
            <TextField
              value={formData.mobile}
              onChange={(e) => handleChange("mobile", e.target.value)}
              fullWidth
              className="bg-white"
            />
          </FormControl>

          <FormControl fullWidth>
            <p>Landline number (optional)</p>
            <TextField
              value={formData.landline}
              onChange={(e) => handleChange("landline", e.target.value)}
              fullWidth
              className="bg-white"
            />
          </FormControl>
        </div>
      </div>

      {/* Continue */}
      <div className="pt-6 flex justify-center sm:justify-end">
        <Button
          variant="contained"
          disabled={!isValid || loading}
          onClick={handleContinue}
          sx={{
            backgroundColor: "#08B9ED",
            padding: "14px 28px",
            textTransform: "none",
            fontSize: "15px", // 👈 Change here
          }}
          className="w-full sm:w-auto sm:min-w-45 text-lg"
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );
}
