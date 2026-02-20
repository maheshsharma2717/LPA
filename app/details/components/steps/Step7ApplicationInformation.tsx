"use client";

import { useState } from "react";
import styles from "./Steps.module.css";

export default function ApplicationInfoTab() {
  type ApplicantType = "donor" | "attorney";
  const [selected, setSelected] = useState<ApplicantType>("donor");
  const [isChecked, setIsChecked] = useState(false);
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
        <h4 className={styles.stepHeading}>
          Who is applying to register?
        </h4>

        <div className={styles.dividerZenco}></div>

        {/* Description */}
        <p className={styles.pZenco}>
          This document can’t be used until it is registered by the Office of
          the Public Guardian (OPG).
        </p>

        <p className={styles.pZenco}>
          Only the donor (you) or one of the attorneys can apply to register
          this document.
        </p>

        <p className={styles.pZenco}>
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
            className={styles.applicantDropdown}
          >
            <option value="donor">Donor</option>
            <option value="attorney">Attorney</option>
          </select>
        </div>

        {/* Selected Person Display */}
        <div
          className={styles.selectedApplication}
          onClick={() => setIsChecked(!isChecked)}
        >
          <div>
            <p className="font-semibold">{currentApplicant.name}</p>
            <p className="text-sm text-white">
              {currentApplicant.email}
            </p>
          </div>

          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => setIsChecked(!isChecked)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4"
          />
        </div>

      </div>
    </main>
  );
}
