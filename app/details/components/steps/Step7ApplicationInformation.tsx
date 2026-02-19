"use client";

import { useState } from "react";

export default function ApplicationInfoTab() {
  type ApplicantType = "donor" | "attorney";
  const [selected, setSelected] = useState<ApplicantType>("donor");
  const applicants: Record<ApplicantType, { name: string; email: string }> = {
    donor: {
      name: "John Doe",
      email: "john@email.com",
    },
    attorney: {
      name: "Caleb Leicester",
      email: "caleb@email.com",
    },
  };

  const currentApplicant = applicants[selected];

  return (
    <main className="grow flex items-center justify-center">
      <div className="max-w-3xl w-full">

        {/* Title */}
        <h4 className="text-2xl sm:text-4xl font-bold text-zenco-dark mb-2 text-center leading-tight">
          Who is applying to register?
        </h4>

        <div className="divider"></div>

        {/* Description */}
        <p className="font-bold text-sm mt-4 leading-relaxed">
          This document can’t be used until it is registered by the Office of
          the Public Guardian (OPG).
        </p>

        <p className="font-bold text-sm mt-4 leading-relaxed">
          Only the donor (you) or one of the attorneys can apply to register
          this document.
        </p>

        <p className="font-bold text-sm mt-4 leading-relaxed">
          Select from the options below whether the donor (you) is registering
          or one of the attorneys.
        </p>

        {/* Dropdown */}
        <div className="mt-6">
          <label className="font-semibold text-sm block mb-2">
            Who is applying to register?
          </label>

          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as ApplicantType)}
            className="w-full border rounded-sm p-3 bg-white focus:outline-none focus:ring-2 focus:ring-zenco-blue"
          >
            <option value="donor">Donor</option>
            <option value="attorney">Attorney</option>
          </select>
        </div>

        {/* Selected Person Display */}
        <div className="mt-6 border rounded-sm text-white selected-attorny p-4 flex justify-between items-center">
          <div>
            <p className="font-semibold">{currentApplicant.name}</p>
            <p className="text-sm text-white">
              {currentApplicant.email}
            </p>
          </div>

          <input
            type="checkbox"
            // checked={checked}
            // onChange={() => setChecked(!checked)}
            // onClick={(e) => e.stopPropagation()}
            className="w-4 h-4"
          />
        </div>

      </div>
    </main>
  );
}
