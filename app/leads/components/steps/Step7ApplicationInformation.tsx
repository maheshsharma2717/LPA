"use client";

import { useEffect } from "react";

type Props = {
  onNext: () => void;
  isSaving: boolean;
};

export default function ApplicationInfoTab({ onNext, isSaving }: Props) {
  useEffect(() => {
    if (isSaving) {
      onNext();
    }
  }, [isSaving]);

  return (
    <>
      <p>ApplicationInfoTab</p>
    </>
  );
}
