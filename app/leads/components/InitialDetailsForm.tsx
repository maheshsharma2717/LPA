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
    country: "",
    county: "",
    town: "",
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
        country: lead.country || "",
        county: lead.county || "",
        town: lead.town || "",
        mobile: lead.mobile || "",
        landline: lead.landline || "",
      });
    }
  }, [lead]);

  const countries = [
    "United Kingdom",
    "Afghanistan",
    "Albania",
    "Algeria",
    "American Samoa",
    "Andorra",
    "Angola",
    "Anguilla",
    "Antarctica",
    "Antigua and Barbuda",
    "Argentina",
    "Armenia",
    "Aruba",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bermuda",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "British Indian Ocean Territory",
    "Brunei Darussalam",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Cape Verde",
    "Cayman Islands",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Christmas Island",
    "Cocos (Keeling) Islands",
    "Colombia",
    "Comoros",
    "Congo",
    "Congo, the Democratic Republic of the",
    "Cook Islands",
    "Costa Rica",
    "Cote D Ivoire",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czech Republic",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Ethiopia",
    "Falkland Islands (Malvinas)",
    "Faroe Islands",
    "Fiji",
    "Finland",
    "France",
    "French Guiana",
    "French Polynesia",
    "French Southern Territories",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Gibraltar",
    "Greece",
    "Greenland",
    "Grenada",
    "Guadeloupe",
    "Guam",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Heard Island and Mcdonald Islands",
    "Holy See (Vatican City State)",
    "Honduras",
    "Hong Kong",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran, Islamic Republic of",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Korea, Democratic Peoples Republic of",
    "Korea, Republic of",
    "Kuwait",
    "Kyrgyzstan",
    "Lao Peoples Democratic Republic",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libyan Arab Jamahiriya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Macao",
    "Macedonia, the Former Yugoslav Republic of",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Martinique",
    "Mauritania",
    "Mauritius",
    "Mayotte",
    "Mexico",
    "Micronesia, Federated States of",
    "Moldova, Republic of",
    "Monaco",
    "Mongolia",
    "Montserrat",
    "Morocco",
    "Mozambique",
    "Myanmar",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "Netherlands Antilles",
    "New Caledonia",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "Niue",
    "Norfolk Island",
    "Northern Mariana Islands",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Palestinian Territory, Occupied",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Pitcairn",
    "Poland",
    "Portugal",
    "Puerto Rico",
    "Qatar",
    "Reunion",
    "Romania",
    "Russian Federation",
    "Rwanda",
    "Saint Helena",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Pierre and Miquelon",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia and Montenegro",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Georgia and the South Sandwich Islands",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Svalbard and Jan Mayen",
    "Swaziland",
    "Sweden",
    "Switzerland",
    "Syrian Arab Republic",
    "Taiwan, Province of China",
    "Tajikistan",
    "Tanzania, United Republic of",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Tokelau",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Turks and Caicos Islands",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United States",
    "United States Minor Outlying Islands",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Venezuela",
    "Viet Nam",
    "Virgin Islands, British",
    "Virgin Islands, U.s.",
    "Wallis and Futuna",
    "Western Sahara",
    "Yemen",
    "Zambia",
    "Zimbabwe",
  ];

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
          country: formData.country,
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
        <h3 className="text-2xl font-bold mb-4 text-zenco-dark">
          Tell us a little about{" "}
          <span className="text-[#08b9ed]">yourself</span>
        </h3>
        <div className="flex flex-col gap-5">
          <p className="text-gray-600 text-sm">
            First, please give us some information about yourself to create your
            account.
          </p>
          <p className="text-gray-600 text-sm">
            You do not have to be the person the Lasting Power of Attorney is
            for – you might just be helping someone else make the Lasting Power
            of Attorney.
          </p>
          <p className="text-gray-600 text-sm">
            You'll be able to use these details in any Lasting Power of Attorney
            documents you make using our service , the details for the other
            people featuring on the documents will be taken later.
          </p>
        </div>
      </div>

      {/* Full Legal Name */}
      <div className="space-y-6">
        <h3 className="font-semibold text-lg text-zenco-dark">
          Full legal name
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormControl fullWidth>
            <p>Title</p>
            <Select
              value={formData.title}
              // label="Title"
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
              // label="First Name"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              fullWidth
              className="bg-white"
            />
          </FormControl>
          <FormControl fullWidth>
            <p>Last Name</p>

            <TextField
              // label="Last Name"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              fullWidth
              className="bg-white"
            />
          </FormControl>
        </div>

        <div className="flex flex-col gap-5 max-w-[65%] w-full space-y-2">
          <FormControl fullWidth>
            <p>Middle names (if any)</p>
            <TextField
              // label="Middle names (if any)"
              value={formData.middleName}
              onChange={(e) => handleChange("middleName", e.target.value)}
              fullWidth
              className="bg-white"
            />
          </FormControl>

          <FormControl fullWidth>
            {otherName ? (
              <>
                <div className="w-full space-y-2">
                  <p>
                    If this person has been known by any other names enter them
                    below separated by a comma, for example 'Mary Smith, Mary
                    Smith-Cooper'.
                  </p>

                  <p>
                    This is only for other names you are known by on any legal
                    or medical forms, for example bank account or birth
                    certificate.
                  </p>

                  <p className="text-right text-sm text-gray-500">(Optional)</p>

                  <TextField
                    value={formData.knownByOtherNames}
                    onChange={(e) =>
                      handleChange("knownByOtherNames", e.target.value)
                    }
                    fullWidth
                    className="bg-white"
                  />
                </div>
              </>
            ) : (
              <p
                onClick={() => setOtherName(!otherName)}
                className="cursor-pointer"
              >
                <u>Known by any other names? Click Here</u>
              </p>
            )}
          </FormControl>

          <FormControl fullWidth>
            <p>Preferred Name (Optional)</p>
            <TextField
              // label="Preferred Name (Optional)"
              value={formData.preferredName}
              onChange={(e) => handleChange("preferredName", e.target.value)}
              fullWidth
              className="bg-white"
            />
          </FormControl>
        </div>
      </div>

      {/* Date of Birth */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-zenco-dark">Date of birth</h3>

        <div className="grid grid-cols-3 gap-6">
          <FormControl fullWidth>
            <TextField
              // label="Day"
              value={formData.day}
              onChange={(e) => handleChange("day", e.target.value)}
              className="bg-white"
            />
          </FormControl>

          <FormControl fullWidth>
            <TextField
              // label="Month"
              value={formData.month}
              onChange={(e) => handleChange("month", e.target.value)}
              className="bg-white"
            />
          </FormControl>
          <FormControl fullWidth>
            <TextField
              // label="Year"
              value={formData.year}
              onChange={(e) => handleChange("year", e.target.value)}
              className="bg-white"
            />
          </FormControl>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-zenco-dark">
          What's your address?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* openAddress */}

          {openAddress ? (
            <>
              <div className="flex gap-4">
                <FormControl fullWidth>
                  <p>Address Line 1</p>
                  <TextField
                    // label="Address Line 1"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    fullWidth
                    className="bg-white"
                  />
                </FormControl>
              </div>
              <div className="flex gap-4">
                <FormControl fullWidth>
                  <p>Address Line 2</p>
                  <TextField
                    // label="Address Line 2 (Optional)"
                    value={formData.addressLine2}
                    onChange={(e) =>
                      handleChange("addressLine2", e.target.value)
                    }
                    fullWidth
                    className="bg-white"
                  />
                </FormControl>
              </div>
              <div className="flex gap-4">
                <FormControl fullWidth>
                  <p>Town</p>
                  <TextField
                    // label="Address Line 1"
                    value={formData.town}
                    onChange={(e) => handleChange("town", e.target.value)}
                    fullWidth
                    className="bg-white"
                  />
                </FormControl>
              </div>
              <div className="flex gap-4">
                <FormControl fullWidth>
                  <p>County</p>
                  <TextField
                    // label="Address Line 2 (Optional)"
                    value={formData.county}
                    onChange={(e) => handleChange("county", e.target.value)}
                    fullWidth
                    className="bg-white"
                  />
                </FormControl>
              </div>
              <div className="flex gap-4">
                <FormControl fullWidth>
                  <p>Country</p>
                  <Select
                    displayEmpty
                    value={formData.country || ""}
                    onChange={(e) => handleChange("country", e.target.value)}
                    className="bg-white"
                  >
                    <MenuItem value="">Choose Country...</MenuItem>

                    {countries.map((country) => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              <div className="flex gap-4">
                <FormControl fullWidth>
                  <p>Postcode</p>
                  <TextField
                    // label="Address Line 2 (Optional)"
                    value={formData.postcode}
                    onChange={(e) => handleChange("postcode", e.target.value)}
                    fullWidth
                    className="bg-white"
                  />
                </FormControl>
              </div>
              <p
                onClick={() => {
                  setOpenAddress(!openAddress);
                }}
                className="cursor-pointer text-[#08b9ed]"
              >
                <u>Search for address</u>
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-col w-full">
                <div className="flex gap-4 w-full">
                  <FormControl fullWidth>
                    <p>Enter postcode to search for address</p>
                    <div className="flex w-full justify-between">
                      <TextField
                        // label="Enter postcode"
                        value={formData.postcode}
                        onChange={(e) =>
                          handleChange("postcode", e.target.value)
                        }
                        fullWidth
                        className="bg-white max-w-[49%] w-full"
                      />
                      <Button
                        variant="contained"
                        sx={{
                          backgroundColor: "#08B9ED",
                          "&:hover": { backgroundColor: "#07bdf5ff" },
                        }}
                        className=" max-w-[49%] w-full"
                      >
                        Search
                      </Button>
                    </div>
                  </FormControl>
                </div>
                <p
                  onClick={() => {
                    setOpenAddress(!openAddress);
                  }}
                  className="cursor-pointer text-[#08b9ed]"
                >
                  <u>Enter address manually</u>
                </p>
              </div>
              
            </>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-zenco-dark">
          Contact Number
        </h3>

        <div className="grid grid-cols-2 gap-6">
          <FormControl fullWidth>
            <p>Mobile number</p>
            <TextField
              // label="Mobile number"
              value={formData.mobile}
              onChange={(e) => handleChange("mobile", e.target.value)}
              fullWidth
              className="bg-white"
            />
          </FormControl>

          <FormControl fullWidth>
            <p>Landline number (optional)</p>
            <TextField
              // label="Landline number (optional)"
              value={formData.landline}
              onChange={(e) => handleChange("landline", e.target.value)}
              fullWidth
              className="bg-white"
            />
          </FormControl>
        </div>
      </div>

      {/* Continue */}
      <div className="pt-4 flex justify-end text-md">
        <Button
          variant="contained"
          disabled={!isValid || loading}
          onClick={handleContinue}
          sx={{
            backgroundColor: "#08B9ED",
            // "&:hover": { backgroundColor: "#1d4ed8" },
            padding: "15px",
          }}
          className="max-w-[29%] w-full"
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
