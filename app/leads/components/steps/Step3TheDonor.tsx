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
  Box,
} from "@mui/material";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./Steps.module.css";

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

export default function DonorTab({
  onNext,
  onBack,
  allFormData,
  updateData,
  currentDonorIndex,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [showManualAddress, setShowManualAddress] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentDonor, setCurrentDonor] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [otherName, setOtherName] = useState(false);
  const [subStep, setSubStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openPostCode, setopenPostCode] = useState(true);

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
    city: "",
    county: "",
    addressLine2: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const applicationId = allFormData?.who?.applicationId;

  useEffect(() => {
    const init = async () => {
      if (!applicationId) {
        setLoading(false);
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;
        const token = session.access_token;

        const donorsRes = await fetch(
          `/api/donors?applicationId=${applicationId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const { data: fetchedDonors } = await donorsRes.json();

        if (!fetchedDonors) {
          setLoading(false);
          return;
        }

        const step1Selection = allFormData?.who?.selection;
        const step1SelectedIds = allFormData?.who?.selectedPeopleIds || [];
        const isLeadSelected =
          step1Selection === "You" ||
          step1Selection === "You and your partner" ||
          step1Selection === "You and someone else";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activeDonors = (fetchedDonors || []).filter((d: any) => {
          if (d.is_lead) return isLeadSelected;
          return step1SelectedIds.includes(d.id);
        });

        const firstDonor = activeDonors[currentDonorIndex];

        if (firstDonor) {
          setCurrentDonor(firstDonor);

          let day = "",
            month = "",
            year = "";
          // if (firstDonor.date_of_birth) {
          //   const date = new Date(firstDonor.date_of_birth);
          //   day = String(date.getDate());

          //   const months = [
          //     "January",
          //     "February",
          //     "March",
          //     "April",
          //     "May",
          //     "June",
          //     "July",
          //     "August",
          //     "September",
          //     "October",
          //     "November",
          //     "December",
          //   ];
          //   month = months[date.getMonth()];
          //   year = String(date.getFullYear());
          // }

          if (firstDonor.date_of_birth) {
            const date = new Date(firstDonor.date_of_birth);
            day = String(date.getDate());
            month = String(date.getMonth() + 1);
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
  }, [applicationId, allFormData?.who, currentDonorIndex]);

  const handleInternalNext = async () => {
    if (subStep === 0) {
      setIsSubmitting(true);
      await handleSave();
      setIsSubmitting(false);
      setSubStep(1);
      window.scrollTo(0, 0);
    } else {
      setIsSubmitting(true);
      await handleSave();
      setIsSubmitting(false);
      onNext();
    }
  };
  const handleBack = async () => {
    if (subStep === 1) {
      setSubStep(0);
      window.scrollTo(0, 0);
    } else {
      onBack();
    }
    setLoading(true);
    try {
    } catch (err) {
      console.error("Error saving reversing step:", err);
    } finally {
      setLoading(false);
    }
  };
  // const handleInternalBack = () => {
  //   if (subStep === 1) {
  //     setSubStep(0);
  //     window.scrollTo(0, 0);
  //   }
  // };

  const handleSave = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;

      let dob = null;
      if (formData.year && formData.month && formData.day) {
        const m = String(formData.month).padStart(2, "0");
        const d = String(formData.day).padStart(2, "0");
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
        address_line_1: formData.address,
        address_line_2: formData.addressLine2,
        city: formData.city,
        county: formData.county,
        postcode: formData.postcode,
      };

      await fetch("/api/donors", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      updateData({ donorId: currentDonor.id });
    } catch (err) {
      console.error("Error saving donor:", err);
      setError("Failed to save details.");
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading)
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!currentDonor)
    return <Alert severity="info">No donor found. Please go back.</Alert>;

  const donorName = `${currentDonor.first_name} ${currentDonor.last_name}`;

  const isValidUKMobile = (phone: string) => {
    if (!phone) return false;
    return /^07\d{9}$/.test(phone)||/^7\d{9}$/.test(phone);
  };

  const isValidUKLandline = (phone: string) => {
    if (!phone) return true;
    return /^(01|02|03|08|09)\d{8,9}$/.test(phone);
  };

  const isSubStep0Valid = Boolean(
    formData.title &&
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    /^(0?[1-9]|[12][0-9]|3[01])$/.test(formData.day) &&
    /^(0?[1-9]|1[0-2])$/.test(formData.month) &&
    /^\d{4}$/.test(formData.year)
  );

  const isCurrentStepValid = subStep === 0 ? isSubStep0Valid : true;

  return (
    <section className="space-y-8  p-2 animate-in fade-in slide-in-from-top-4">
      <div className="flex flex-col gap-5">
        <h1
          className={`text-center text-3xl ${styles.headingBorderBottom} font-bold text-zenco-dark`}
        >
          Contact Details for{" "}
          <span className="text-[#08b9ed]">{donorName}</span> 
        </h1>

        {subStep === 0 && (
          <div className="flex flex-col gap-3 text-black">
            <p>
              The &apos;Donor&apos; is the person appointing other people to
              make decisions on their behalf and must be:
            </p>
            <ul className="list-none space-y-2">
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  className="w-4 h-4 text-[#28a745]"
                  fill="currentColor"
                >
                  <path d="M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zM374 145.7c-10.7-7.8-25.7-5.4-33.5 5.3L221.1 315.2 169 263.1c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l72 72c5 5 11.8 7.5 18.8 7s13.4-4.1 17.5-9.8L379.3 179.2c7.8-10.7 5.4-25.7-5.3-33.5z" />
                </svg>
                Aged 18 or over.
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  className="w-4 h-4 text-[#28a745]"
                  fill="currentColor"
                >
                  <path d="M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zM374 145.7c-10.7-7.8-25.7-5.4-33.5 5.3L221.1 315.2 169 263.1c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l72 72c5 5 11.8 7.5 18.8 7s13.4-4.1 17.5-9.8L379.3 179.2c7.8-10.7 5.4-25.7-5.3-33.5z" />
                </svg>
                Have mental capacity to make decisions at the time their Lasting
                Power of Attorney is being made.
              </li>
            </ul>
            <p>
              The Donor is the only one who can make decisions about their
              Lasting Power of Attorney and the people it should involve.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* SUB-STEP 0: PERSONAL DETAILS */}
        {subStep === 0 && (
          <div className="space-y-5 animate-in fade-in text-[#6B7588]">
            <h3 className="text-xl font-medium text-zenco-dark pb-2">
              Full legal name
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormControl fullWidth>
                <p className="text-lg">Title</p>
                <Select
                  value={formData.title}
                  // label="Title"
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  onBlur={() => handleBlur("title")}
                  error={touched.title && formData.title.trim() === ""}
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
                  ].map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <p className="text-lg">First Name</p>

                <TextField
                  // label="First Name"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleFormChange("firstName", e.target.value)
                  }
                  onBlur={() => handleBlur("firstName")}
                  error={touched.firstName && formData.firstName.trim() === ""}
                  fullWidth
                />
              </FormControl>

              <FormControl fullWidth>
                <p className="text-lg">Last Name</p>

                <TextField
                  // label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleFormChange("lastName", e.target.value)}
                  onBlur={() => handleBlur("lastName")}
                  error={touched.lastName && formData.lastName.trim() === ""}
                  fullWidth
                />
              </FormControl>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <FormControl>
                <p className="text-lg">Their Middle names (if any)</p>
                <TextField
                  // label="Their Middle names (if any)"
                  value={formData.middleName}
                  onChange={(e) =>
                    handleFormChange("middleName", e.target.value)
                  }
                />
              </FormControl>
            </div>
            {otherName ? (
              <>
                <div className="flex flex-col w-[50%]">
                  <p>
                    If this person has been known by any other names enter them
                    below separated by a comma, for example 'Mary Smith, Mary
                    Smith-Cooper'.
                  </p>
                  <p>
                    This is only for other names they are known by on any legal
                    or medical forms, for example bank account or birth
                    certificate.
                  </p>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-end">(Optional)</p>
                    <FormControl fullWidth>
                      <TextField
                        // label="Their Middle names (if any)"
                        // value={}
                        // onChange={(e) =>
                        //   handleFormChange("middleName", e.target.value)
                        // }
                        fullWidth
                      />
                    </FormControl>
                  </div>
                </div>
              </>
            ) : (
              <>
                <button
                  className="cursor-pointer text-black"
                  onClick={() => setOtherName(!otherName)}
                >
                  <u>Known by any other names? Click Here</u>
                </button>
              </>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {" "}
              <FormControl>
                <p className="text-lg">Preferred Name (Optional)</p>
                <TextField
                  // label="Preferred Name (Optional)"
                  value={formData.preferredName}
                  onChange={(e) =>
                    handleFormChange("preferredName", e.target.value)
                  }
                  fullWidth
                />
              </FormControl>
            </div>

            <h3 className="font-semibold text-lg text-zenco-dark pb-2 mt-8">
              Date of birth
            </h3>
            {/* <div className="grid grid-cols-3 gap-6">
              <FormControl fullWidth>
                <InputLabel>Day</InputLabel>
                <Select
                  value={formData.day}
                  label="Day"
                  onChange={(e) => handleFormChange("day", e.target.value)}
                >
                  {[...Array(31)].map((_, i) => (
                    <MenuItem key={i + 1} value={String(i + 1)}>
                      {i + 1}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select
                  value={formData.month}
                  label="Month"
                  onChange={(e) => handleFormChange("month", e.target.value)}
                >
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={formData.year}
                  label="Year"
                  onChange={(e) => handleFormChange("year", e.target.value)}
                >
                  {Array.from({ length: 110 }, (_, i) => {
                    const y = new Date().getFullYear() - i;
                    return (
                      <MenuItem key={y} value={String(y)}>
                        {y}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </div> */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* DAY */}
              <FormControl fullWidth>
                <p className="text-lg">Day</p>

                <TextField
                  placeholder="DD"
                  value={formData.day}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value) && value.length <= 2) {
                      handleFormChange("day", value);
                    }
                  }}
                  error={
                    formData.day !== "" &&
                    !/^(0?[1-9]|[12][0-9]|3[01])$/.test(formData.day)
                  }
                  inputProps={{ inputMode: "numeric" }}
                  fullWidth
                />
              </FormControl>

              {/* MONTH (NUMERIC ONLY 1–12) */}
              <FormControl fullWidth>
                <p className="text-lg">Month</p>

                <TextField
                  placeholder="MM"
                  value={formData.month}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value) && value.length <= 2) {
                      handleFormChange("month", value);
                    }
                  }}
                  error={
                    formData.month !== "" &&
                    !/^(0?[1-9]|1[0-2])$/.test(formData.month)
                  }
                  inputProps={{ inputMode: "numeric" }}
                  fullWidth
                />
              </FormControl>
              {/* YEAR */}
              <FormControl fullWidth>
                <p className="text-lg">Year</p>
                <TextField
                  placeholder="YYYY"
                  value={formData.year}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value) && value.length <= 4) {
                      handleFormChange("year", value);
                    }
                  }}
                  error={formData.year !== "" && !/^\d{4}$/.test(formData.year)}
                  inputProps={{ inputMode: "numeric" }}
                  fullWidth
                />
              </FormControl>
            </div>
          </div>
        )}

        {/* SUB-STEP 1: ADDRESS & CONTACT DETAILS */}
        {subStep === 1 && (
          <div className="space-y-8 animate-in fade-in">
            <h3 className="font-semibold text-lg text-zenco-dark">
              What's Their Address?
            </h3>

            <div className="space-y-6">
              {openPostCode ? (
                <>
                  {" "}
                  {/* POSTCODE + SEARCH */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-end">
                    <FormControl fullWidth>
                      <p className="mb-1 text-sm font-medium text-[#6B7588]">
                        Enter postcode to search for address
                      </p>
                      <TextField
                        value={formData.postcode || ""}
                        onChange={(e) =>
                          handleFormChange("postcode", e.target.value)
                        }
                        error={formData.postcode !== "" && formData.postcode.trim() === ""}
                        fullWidth
                      />
                    </FormControl>

                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        backgroundColor: "#08B9ED",
                        color: "white",
                        height: "56px",
                        textTransform: "none",
                        fontWeight: 600,
                        "&:hover": { backgroundColor: "#07bdf5ff" },
                      }}
                    >
                      Search
                    </Button>
                  </div>
                </>
              ) : (
                ""
              )}

              {/* MANUAL ADDRESS GRID */}
              {showManualAddress && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <FormControl fullWidth>
                    <p className="mb-1 text-sm font-medium text-[#6B7588]">
                      Address Line 1
                    </p>
                    <TextField
                      value={formData.address || ""}
                      onChange={(e) =>
                        handleFormChange("address", e.target.value)
                      }
                      error={formData.address !== "" && formData.address.trim() === ""}
                      fullWidth
                    />
                  </FormControl>

                  <FormControl fullWidth>
                    <p className="mb-1 text-sm font-medium text-[#6B7588]">
                      Address Line 2
                    </p>
                    <TextField
                      value={formData.addressLine2 || ""}
                      onChange={(e) =>
                        handleFormChange("addressLine2", e.target.value)
                      }
                      fullWidth
                    />
                  </FormControl>

                  <FormControl fullWidth>
                    <p className="mb-1 text-sm font-medium text-[#6B7588]">
                      County
                    </p>
                    <TextField
                      value={formData.county || ""}
                      onChange={(e) =>
                        handleFormChange("county", e.target.value)
                      }
                      fullWidth
                    />
                  </FormControl>

                  <FormControl fullWidth>
                    <p className="mb-1 text-sm font-medium text-[#6B7588]">
                      Postcode
                    </p>
                    <TextField
                      value={formData.postcode || ""}
                      onChange={(e) =>
                        handleFormChange("postcode", e.target.value)
                      }
                      error={formData.postcode !== "" && formData.postcode.trim() === ""}
                      fullWidth
                    />
                  </FormControl>

                  <button
                    className="text-start text-[#08b9ed] font-semibold text-sm w-fit cursor-pointer"
                    onClick={() => {
                      setShowManualAddress(false);
                      setopenPostCode(true);
                    }}
                  >
                    <u>Search for address</u>
                  </button>
                </div>
              )}

              {/* MANUAL ADDRESS BUTTON */}
              {!showManualAddress && (
                <button
                  type="button"
                  onClick={() => {
                    setShowManualAddress(true);
                    setopenPostCode(false);
                  }}
                  className="text-[#08b9ed] font-semibold text-sm w-fit cursor-pointer"
                >
                  <u> Enter address manually</u>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Internal Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <button onClick={handleBack} className={`cursor-pointer`}>
          ← back
        </button>

        {/* <Button
          variant="contained"
          onClick={handleInternalNext}
          disabled={isSubmitting}
          sx={{
            backgroundColor: "#08B9ED", // [#08b9ed]
            textTransform: "none",
            borderRadius: "8px",
            padding: "8px 32px",
            "&:hover": { backgroundColor: "#1d4ed8" },
          }}
        >
          {subStep === 1 ? (isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Save and Continue") : "Save and Continue"}
        </Button> */}
        <button
          onClick={handleInternalNext}
          disabled={isSubmitting || !isCurrentStepValid}
          className={`p-4 rounded text-white font-bold transition-all flex items-center justify-center min-w-[180px] 
                       ${
                         isSubmitting || !isCurrentStepValid
                           ? "bg-gray-400 cursor-not-allowed opacity-70"
                           : "bg-[#08b9ed] hover:bg-cyan-600 cursor-pointer"
                       }
              `}
        >
          {subStep === 1 ? (
            isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Save and Continue"
            )
          ) : (
            "Save and Continue"
          )}
        </button>
      </div>
    </section>
  );
}
