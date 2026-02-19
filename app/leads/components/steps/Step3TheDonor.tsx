"use client";

import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useState } from "react";

type Props = {
  onComplete: () => void;
};

export default function DonorTab() {
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

  const handleFormChange = (field: string, value: string) => {
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
    <>
      <section>
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-5">
            <p className="text-center text-3xl font-bold">
              About You (The Donor)
            </p>
            <div className="flex flex-col gap-3">
              <p>
                The 'Donor' is the person appointing other people to make
                decisions on their behalf and must be:
              </p>
              <div>
                <p>Aged 18 or over.</p>
                <p>
                  Have mental capacity to make decisions at the time their
                  Lasting Power of Attorney is being made.
                </p>
              </div>
              <p>
                The Donor is the only one who can make decisions about their
                Lasting Power of Attorney and the people ith should involve.
              </p>
            </div>
            {/* <div></div> */}
          </div>
          <div>
            <div className="space-y-8">
              {/* Heading */}
              {/* <div>
                    <h2 className="text-2xl font-bold text-zenco-dark">
                      Tell us a little about yourself
                    </h2>
                    <p className="text-gray-600 mt-2 text-sm">
                      First, please give us some information about yourself to create your
                      account.
                    </p>
                  </div> */}

              {/* Full Legal Name */}
              <div className="space-y-6">
                <h3 className="font-semibold text-lg text-zenco-dark">
                  Full legal name
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* TITLE */}
                  <FormControl fullWidth>
                    <p>Title</p>
                    <Select
                      value={formData.title}
                      label="Title"
                      onChange={(e) =>
                        handleFormChange("title", e.target.value)
                      }
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

                  {/* FIRST NAME */}
                  <FormControl fullWidth>
                    <p>First Name</p>
                    <TextField
                      value={formData.firstName}
                      onChange={(e) =>
                        handleFormChange("firstName", e.target.value)
                      }
                      fullWidth
                    />
                  </FormControl>

                  {/* LAST NAME */}
                  <FormControl fullWidth>
                    <p>Last Name</p>
                    <TextField
                      value={formData.lastName}
                      onChange={(e) =>
                        handleFormChange("lastName", e.target.value)
                      }
                      fullWidth
                    />
                  </FormControl>
                </div>

                {/* MIDDLE + PREFERRED NAME */}
                <div className="flex flex-col gap-5">
                  <FormControl fullWidth>
                    <p>Middle names (if any)</p>
                    <TextField
                      value={formData.middleName}
                      onChange={(e) =>
                        handleFormChange("middleName", e.target.value)
                      }
                      fullWidth
                    />
                  </FormControl>

                  <FormControl fullWidth>
                    <p>Preferred Name (Optional)</p>
                    <TextField
                      value={formData.preferredName}
                      onChange={(e) =>
                        handleFormChange("preferredName", e.target.value)
                      }
                      fullWidth
                    />
                  </FormControl>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-zenco-dark">
                  Date of birth
                </h3>

                <div className="grid grid-cols-3 gap-6">
                  {/* DAY */}
                  <FormControl fullWidth>
                    <p>Day</p>
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

                  {/* MONTH */}
                  <FormControl fullWidth>
                    <p>Month</p>
                    <Select
                      value={formData.month}
                      label="Month"
                      onChange={(e) =>
                        handleFormChange("month", e.target.value)
                      }
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
                      ].map((month) => (
                        <MenuItem key={month} value={month}>
                          {month}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* YEAR */}
                  <FormControl fullWidth>
                    <p>Year</p>
                    <Select
                      value={formData.year}
                      label="Year"
                      onChange={(e) => handleFormChange("year", e.target.value)}
                    >
                      {Array.from({ length: 100 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <MenuItem key={year} value={String(year)}>
                            {year}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </div>
              </div>

              {/* Continue */}
              {/* <div className="pt-4">
                    <Button
                      fullWidth
                      variant="contained"
                      disabled={!isValid}
                      onClick={
                        onComplete
                      }
                      sx={{
                        backgroundColor: "#2563eb",
                        "&:hover": { backgroundColor: "#1d4ed8" },
                        paddingY: 1.5,
                      }}
                    >
                      Continue
                    </Button>
                  </div> */}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
