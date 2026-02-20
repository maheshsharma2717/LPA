"use client";

import { useEffect } from "react";

type Props = {
  onNext: () => void;
  isSaving: boolean;
};

export default function OPGFeesTab({ onNext, isSaving }: Props) {
  useEffect(() => {
    if (isSaving) {
      onNext();
    }
  }, [isSaving]);

  return (
    <>
      <p>OPGFeesTab</p>
    </>
  );
}
