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
            You'll be able to use these details in any documents you make using
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
                  separated by a comma, for example 'Mary Smith, Mary
                  Smith-Cooper'.
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
              error={formData.year !== "" && !isValidYear}
              inputProps={{ inputMode: "numeric" }}
              className="bg-white"
            />
          </FormControl>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4 leading-loose">
        <h3 className="font-semibold text-lg text-zenco-dark">
          What's your address?
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

            {/* Town */}
            <FormControl fullWidth>
              <p className="text-[#6B7588]">Town</p>
              <TextField
                value={formData.town}
                onChange={(e) => handleChange("town", e.target.value)}
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

            {/* Country */}
            <FormControl fullWidth>
              <p className="text-[#6B7588]">Country</p>
              <Select
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
