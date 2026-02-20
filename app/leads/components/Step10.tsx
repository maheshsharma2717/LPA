"use client";

import {
  CheckCircle,
  Person,
  Description,
  Gavel,
  Groups,
  Info,
  Verified,
} from "@mui/icons-material";
import { FormControl, MenuItem, Select } from "@mui/material";
import { useRouter } from "next/navigation";

export default function Step10() {
  const routePage = useRouter();
  
  const sections = [
    {
      sno: 2,
      title: "Attorneys",
      desc: "You do not want any replacement attorneys.",
      icon: <Groups fontSize="small" />,
    },
    {
      sno: 3,
      title: "Health and Financial Decisions",
      desc: "The attorneys have the authority to make decisions about life-sustaining treatment.",
      icon: <Gavel fontSize="small" />,
    },
    {
      sno: 4,
      title: "People To Notify",
      desc: "Charles Williams",
      icon: <Groups fontSize="small" />,
    },
    {
      sno: 5,
      title: "Application Information",
      desc: "Person registering: Marie Claire Lenicker Mascot",
      icon: <Info fontSize="small" />,
    },
    {
      sno: 6,
      title: "Certificate Provider",
      desc: "You will enter the certificate provider details later when you receive the documents.",
      icon: <Verified fontSize="small" />,
    },
    {
      sno: 7,
      title: "OPG Fees",
      desc: "You have chosen to pay the OPG by cheque.",
      icon: <Description fontSize="small" />,
    },
  ];

  const people = [
    {
      name: "Charles Williams",
      address:
        "29 Rothesay Road\nLoughborough\nLeicestershire\nLE11 1PJ\nUnited Kingdom",
      dob: "10/05/1992",
    },
    {
      name: "Gabriel Lenicker",
      address:
        "41 Clarence Road\nSale\nGreater Manchester\nM32 8ZQ\nUnited Kingdom",
      dob: "02/09/1987",
    },
    {
      name: "Marie Claire Lenicker Mascot",
      address:
        "41 Clarence Road\nSale\nGreater Manchester\nM32 8ZQ\nUnited Kingdom\nMobile: 0770123456",
      dob: "03/08/1964",
    },
  ];

  return (
    <section className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <p className="text-2xl font-semibold text-cyan-500 text-center">Your</p>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Lasting Power of Attorney
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-5">
            {/* About You */}
            <div>
              <p>(Section 1 of 7)</p>
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Person fontSize="small" />
                    <h3 className="text-xl font-extrabold text-gray-800">
                      About You (The Donor)
                    </h3>
                  </div>
                  <CheckCircle className="text-green-500" />
                </div>

                <p className="text-sm text-gray-600 whitespace-pre-line">
                  Your full name is{" "}
                  <strong>Marie Claire Lenicker Mascot</strong> and you were
                  born on 03/08/1964.
                </p>

                <div className="flex flex-col sm:flex-row sm:gap-6 mb-7 mt-3">
                  <div>Your home address is:</div>
                  <div>
                    <p>48 Clarence Road</p>
                    <p>Sale</p>
                    <p>Greater Manchester</p>
                    <p>M32 8ZQ</p>
                    <p>United Kingdom</p>
                  </div>
                </div>

                <div className="mt-4">
                  <button className="border border-gray-500 leading-loose py-3  px-19 rounded">
                    Edit
                  </button>
                </div>
              </div>
            </div>

            {/* Other Sections */}
            {sections.map((section, index) => (
              <div key={index}>
                <p>(Section {section.sno} of 7)</p>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      {section.icon}
                      <h3 className="text-xl font-extrabold text-gray-800">
                        {section.title}
                      </h3>
                    </div>

                    <CheckCircle className="text-green-500" />
                  </div>

                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {section.desc}
                  </p>

                  <div className="mt-4">
                    <button className="border border-gray-500 leading-loose py-3 px-19 rounded">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-5">
            {/* Info Box */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <h4 className="text-cyan-600 text-xl font-bold mb-2">
                Check this information
              </h4>

              <p className="text-gray-600 mb-4">
                Please check all the information on this page carefully
                including the details of the people in the document.
              </p>

              <p className="text-gray-600 mb-4">
                When you are happy click the button below to continue.
              </p>

              <button 
              onClick={() => {routePage.push("/leads/Acknowledgement")}}
              className="bg-cyan-400 cursor-pointer py-3 w-full text-white rounded">
                Continue to the next person
              </button>
            </div>

            {/* People Cards */}
            {people.map((person, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xl"
              >
                <h5 className="text-xl font-bold text-cyan-500">
                  {person.name}
                </h5>

                {/* Responsive layout fix here */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-3">
                  <p className="whitespace-pre-line">{person.address}</p>

                  <div className="md:text-right">
                    <span className="font-bold">Born on:</span>{" "}
                    <span>{person.dob}</span>
                  </div>
                </div>

                <button className="bg-cyan-400 cursor-pointer py-3 w-full text-white rounded">
                  Change details
                </button>
              </div>
            ))}

            <FormControl fullWidth>
              <Select
                // value={formData.title}
                // label="NEED HELP"
                // onChange={(e) =>
                //   handleFormChange("title", e.target.value)
                // }
                className="bg-white"
              >
                {["FAQ"].map((title) => (
                  <MenuItem key={title} value={title}>
                    {title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>

        {/* Back */}
        <div className="mt-8">
          <button className="text-gray-600 hover:underline">← Back</button>
        </div>
      </div>
    </section>
  );
}
