"use client";
import { SquarePen, UserPlus, UserRound, X, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import styles from "./Steps.module.css";
import { supabase } from "@/lib/supabase";
import { CircularProgress, Alert, Button } from "@mui/material";

type Person = {
  id: string;
  lpa_document_id: string;
  title: string;
  first_name: string;
  last_name: string;
  address_line_1: string;
  city: string;
  postcode: string;
  deleted_at?: string | null;
};

type Props = {
  onNext: () => void;
  onBack: () => void;
  isSaving: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allFormData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateData: (data: any) => void;
  currentDonorIndex: number;
};

export default function PeopleToNotifyTab({
  onNext,
  onBack,
  isSaving,
  allFormData,
  updateData,
  currentDonorIndex,
}: Props) {
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [hasPeople, setHasPeople] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const applicationId = allFormData?.who?.applicationId;
  const donorId = allFormData?.["which-donor"]?.donorId;
  const [lpaDocId, setLpaDocId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "Mr",
    first_name: "",
    last_name: "",
    address_line_1: "",
    city: "",
    postcode: "",
  });

  const [modalError, setModalError] = useState<string | null>(null);
  const [touchedModal, setTouchedModal] = useState<Record<string, boolean>>({});

  const handleModalBlur = (field: string) => {
    setTouchedModal((prev) => ({ ...prev, [field]: true }));
  };

  useEffect(() => {
    const init = async () => {
      if (!donorId) {
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

        let activeDonorId = donorId;
        if (fetchedDonors) {
          const step1Selection = allFormData?.who?.selection;
          const step1SelectedIds = allFormData?.who?.selectedPeopleIds || [];
          const isLeadSelected =
            step1Selection === "You" ||
            step1Selection === "You and your partner" ||
            step1Selection === "You and someone else";

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const activeDonors = fetchedDonors.filter((d: any) => {
            if (d.is_lead) return isLeadSelected;
            return step1SelectedIds.includes(d.id);
          });
          activeDonorId = activeDonors[currentDonorIndex]?.id;
        }

        if (!activeDonorId) {
          setLoading(false);
          return;
        }

        const lpaDocsRes = await fetch(
          `/api/lpa-documents?donorId=${activeDonorId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const { data: lpaDocs } = await lpaDocsRes.json();

        if (lpaDocs && lpaDocs.length > 0) {
          const firstLpaId = lpaDocs[0].id;
          setLpaDocId(firstLpaId);

          const peopleRes = await fetch(
            `/api/people-to-notify?lpaDocId=${firstLpaId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const { data: fetchedPeople } = await peopleRes.json();

          if (fetchedPeople && fetchedPeople.length > 0) {
            setPeople(fetchedPeople);
            setHasPeople(true);
          } else {
            // Fallback to local form data if DB is empty (e.g., rapid back navigation before DB settled OR just local session state)
            if (allFormData["people-to-Notify"]?.people) {
              setPeople(allFormData["people-to-Notify"].people);
            }
            if (allFormData["people-to-Notify"]?.hasPeople !== undefined) {
              setHasPeople(allFormData["people-to-Notify"].hasPeople);
            }
          }
        } else {
          // No LPA doc yet, rely purely on local state
          if (allFormData["people-to-Notify"]?.people) {
            setPeople(allFormData["people-to-Notify"].people);
          }
          if (allFormData["people-to-Notify"]?.hasPeople !== undefined) {
            setHasPeople(allFormData["people-to-Notify"].hasPeople);
          }
        }
      } catch (err) {
        console.error("Error loading people to notify:", err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, currentDonorIndex, allFormData?.who, donorId]);

  useEffect(() => {
    if (isSaving) {
      handleSaveAndNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  const handleSaveAndNext = () => {
    updateData({ hasPeople, people });
    onNext();
  };

  const openAddModal = () => {
    setEditingPerson(null);
    setFormData({
      title: "Mr",
      first_name: "",
      last_name: "",
      address_line_1: "",
      city: "",
      postcode: "",
    });
    setModalError(null);
    setTouchedModal({});
    setShowModal(true);
  };

  const openEditModal = (person: Person) => {
    setEditingPerson(person);
    setFormData({
      title: person.title,
      first_name: person.first_name,
      last_name: person.last_name,
      address_line_1: person.address_line_1,
      city: person.city,
      postcode: person.postcode,
    });
    setModalError(null);
    setTouchedModal({});
    setShowModal(true);
  };

  const handleSavePerson = async () => {
    if (!lpaDocId) return;
    if (!formData.first_name || !formData.last_name) {
      setModalError("First and last name are required.");
      return;
    }
    if (!formData.postcode || formData.postcode.trim() === "") {
      setModalError("Postcode is required.");
      return;
    }
    setModalError(null);

    setIsSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;

      if (editingPerson) {
        const res = await fetch("/api/people-to-notify", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id: editingPerson.id, ...formData }),
        });
        const { data: updated } = await res.json();
        if (updated) {
          setPeople((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p)),
          );
        }
      } else {
        if (people.length >= 5) {
          setModalError("Maximum 5 people to notify allowed per document.");
          setIsSubmitting(false);
          return;
        }

        const res = await fetch("/api/people-to-notify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ lpa_document_id: lpaDocId, ...formData }),
        });
        const { data: created } = await res.json();
        if (created) {
          setPeople((prev) => [...prev, created]);
        }
      }

      setShowModal(false);
    } catch (err) {
      console.error("Error saving person:", err);
      setModalError("Failed to save person. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleBack = async () => {
    setLoading(true);
    try {
      onBack();
    } catch (err) {
      console.error("Error saving reversing step:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleDeletePerson = async (id: string) => {
    if (!confirm("Are you sure you want to remove this person?")) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;

      const res = await fetch(`/api/people-to-notify?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();

      if (result.success) {
        setPeople((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Error deleting person:", err);
      alert("Failed to delete person.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-10">
        <CircularProgress />
      </div>
    );

  return (
    <>
      <main>
        <div className="flex flex-col">
          <h4 className="text-center text-3xl">
            People to <span className="text-[#08b9ed] font-medium">notify</span>
          </h4>

          <div className={styles.dividerZenco}></div>
        </div>{" "}
        <div className="grow grid grid-cols-1 lg:grid-cols-3 gap-7">
          {" "}
          <div className="lg:col-span-2">
            <div className="lg:col-span-2">
              <p className={styles.pZenco}>
                You can let people know that you&apos;re going to register this
                document. They can raise any concerns they have about the
                Lasting Powers of Attorney-for example, if there was any
                pressure or fraud in making it.
              </p>
              <p className={styles.pZenco}>
                When the document is registered, the person applying to register
                must send a notice to each &apos;person to notify&apos;.
              </p>
              <p className={styles.pZenco}>
                You can&apos;t put any of the attorneys or replacement attorneys
                here.
              </p>
              <p className={styles.pZenco}>
                Choose people who care about your best interests and who would
                be willing to speak up if they were concerned.
              </p>

              <div className="text-[#08b9ed] font-medium mb-8">
                Most people choose &apos;No&apos; and do not enter anyone here.
              </div>

              <div className="mx-auto">
                <h2 className="font-bold text-lg my-4">
                  Are there any people to notify?
                </h2>

                {/* <div className="">
                <button
                  onClick={() => setHasPeople(false)}
                  className={
                    hasPeople === false ? styles.btnDark : styles.btnWhite
                  }
                >
                  No, there are no people to notify
                </button>
                <button
                  onClick={() => setHasPeople(true)}
                  className={
                    hasPeople === true ? styles.btnDark : styles.btnWhite
                  }
                >
                  Yes, there are people to notify
                </button>
              </div> */}

                <div className="border border-[#ced4da]">
                  <button
                    onClick={() => setHasPeople(false)}
                    className={`w-full py-4 font-semibold cursor-pointer transition
      ${
        hasPeople === false
          ? "bg-[#35495e] text-white"
          : "bg-white text-[#3A3A3C] shadow-sm flex justify-center items-center"
      }
    `}
                  >
                    No, there are no people to notify
                  </button>

                  <button
                    onClick={() => setHasPeople(true)}
                    className={`w-full py-4 font-semibold cursor-pointer transition
      ${
        hasPeople === true
          ? "bg-[#35495e] text-white"
          : "bg-white text-[#3A3A3C] shadow-sm flex justify-center items-center"
      }
    `}
                  >
                    Yes, there are people to notify
                  </button>
                </div>

                {hasPeople === true && (
                  <div className="mt-8 animate-in fade-in">
                    <button
                      onClick={openAddModal}
                      disabled={people.length >= 5}
                      className={`w-full py-4 rounded font-semibold border border-[#ced4da] 
   bg-white text-[#35495e] flex justify-center items-center  gap-3
  transition mb-6
  ${
    people.length >= 5
      ? "opacity-50 cursor-not-allowed"
      : "hover:bg-gray-50 cursor-pointer"
  }`}
                    >
                      <span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 640 512"
                          className="w-5 h-5 text-[#35495e] transition"
                        >
                          <path d="M285.7 304c98.5 0 178.3 79.8 178.3 178.3 0 16.4-13.3 29.7-29.7 29.7L77.7 512C61.3 512 48 498.7 48 482.3 48 383.8 127.8 304 226.3 304l59.4 0zM528 80c13.3 0 24 10.7 24 24l0 48 48 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-48 0 0 48c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-48-48 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0 0-48c0-13.3 10.7-24 24-24zM256 248a120 120 0 1 1 0-240 120 120 0 1 1 0 240z" />
                        </svg>
                      </span>
                      Add new person to notify
                    </button>

                    {people.length >= 5 && (
                      <Alert severity="warning" className="mb-4">
                        You have reached the maximum limit of 5 people to
                        notify.
                      </Alert>
                    )}

                    {people.length > 0 && (
                      <>
                        <h2 className="font-medium text-2xl my-4">
                          Select People to notify
                        </h2>

                        <div className="space-y-3">
                          {people.map((person) => (
                            <div
                              key={person.id}
                              className="flex justify-between items-center p-4 border border-[#adb5bd] bg-white transition"
                            >
                              <div className="flex justify-between items-center w-full p-3">
                                {/* <UserRound size={30} className="text-gray-400" /> */}

                                <div className="flex items-center gap-5">
                                  <span>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 448 512"
                                      fill="currentColor"
                                      className="w-10 h-10 text-black"
                                    >
                                      <path d="M224 248a120 120 0 1 0 0-240 120 120 0 1 0 0 240zm-29.7 56C95.8 304 16 383.8 16 482.3 16 498.7 29.3 512 45.7 512h356.6c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3h-59.4z" />
                                    </svg>
                                  </span>
                                  <div>
                                    <p className="font-bold text-black text-lg">
                                      {/* {person.title}  */}
                                      {person.first_name} {person.last_name}
                                    </p>
                                    {/* <p className="text-sm text-gray-600">
                                    {person.address_line_1}, {person.city},{" "}
                                    {person.postcode}
                                  </p> */}

                                    <div className="flex gap-4 mt-1">
                                      <p
                                        onClick={() => openEditModal(person)}
                                        className="text-lg flex items-center gap-1 black hover:underline cursor-pointer"
                                      >
                                        <span>
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 512 512"
                                            fill="currentColor"
                                            className="w-5 h-5"
                                            aria-hidden="true"
                                          >
                                            <path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L368 46.1 465.9 144 490.3 119.6c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L432 177.9 334.1 80 172.4 241.7zM96 64C43 64 0 107 0 160v256c0 53 43 96 96 96h256c53 0 96-43 96-96v-96c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z" />
                                          </svg>
                                        </span>
                                        {/* <SquarePen size={13} /> */}
                                        <u>Update this person's details</u>
                                      </p>
                                      <p
                                        onClick={() =>
                                          handleDeletePerson(person.id)
                                        }
                                        className="text-lg flex items-center gap-1 text-red-600 hover:underline cursor-pointer"
                                      >
                                        <Trash2 size={17} />
                                        Remove
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <input
                                  type="checkbox"
                                  // checked={whenCanAct === "loss_of_capacity"}
                                  onChange={() => {}}
                                  className="w-5 h-5 cursor-pointer accent-zenco-blue shrink-0"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-between pt-4">
                <button onClick={handleBack} className={`cursor-pointer`}>
                  <u>← Back</u>
                </button>
                {/* <Button
                variant="contained"
                onClick={handleSaveAndNext}
                sx={{
                  backgroundColor: "#08B9ED",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { backgroundColor: "#07bdf5ff" },
                }}
              >
                Save and Continue
              </Button> */}
                <button
                  onClick={handleSaveAndNext}
                  className={`p-4 rounded text-lg text-white font-bold shadow-lg transition-all flex items-center justify-center min-w-45 
               bg-[#08b9ed] hover:bg-cyan-600 cursor-pointer
              `}
                >
                  Save and continue
                </button>
              </div>
            </div>
          </div>
          <div
            className={`flex flex-col gap-5 transition-opacity duration-300 ${
              hasPeople ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {hasPeople === true && (
              <>
                <p className="text-xl">Who can be a Person to Notify?</p>
                <p>
                  The Person to notify must be meet the following requirements:
                </p>

                <div className="">
                  <div className="flex gap-2 items-center">
                    <span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 512 512"
                        fill="currentColor"
                        className="w-4 h-4 text-[#28a745]"
                      >
                        <path d="M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zM374 145.7c-10.7-7.8-25.7-5.4-33.5 5.3L221.1 315.2 169 263.1c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l72 72c5 5 11.8 7.5 18.8 7s13.4-4.1 17.5-9.8L379.3 179.2c7.8-10.7 5.4-25.7-5.3-33.5z" />
                      </svg>
                    </span>
                    <p>
                      Aged <span className="font-medium">18 or over.</span>
                    </p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 512 512"
                        fill="currentColor"
                        className="w-4 h-4 text-[#28a745] mt-2"
                      >
                        <path d="M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zM374 145.7c-10.7-7.8-25.7-5.4-33.5 5.3L221.1 315.2 169 263.1c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l72 72c5 5 11.8 7.5 18.8 7s13.4-4.1 17.5-9.8L379.3 179.2c7.8-10.7 5.4-25.7-5.3-33.5z" />
                      </svg>
                    </span>
                    <p>
                      {" "}
                      Have <span className="font-medium">
                        mental capacity{" "}
                      </span>{" "}
                      to make decisions.
                    </p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 512 512"
                        fill="currentColor"
                        className="w-4 h-4 text-[#dc3545] mt-2"
                      >
                        <path d="M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM167 167c9.4-9.4 24.6-9.4 33.9 0l55 55 55-55c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-55 55 55 55c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-55-55-55 55c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l55-55-55-55c-9.4-9.4-9.4-24.6 0-33.9z" />
                      </svg>
                    </span>
                    <p>
                      Must <span className="font-medium">not</span> be bankrupt,
                      or subject to a debt relief order.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded shadow-lg overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="bg-[#3b5c77] text-white flex justify-between items-center px-4 py-3">
              <h3 className="font-semibold">
                {editingPerson ? "Update person" : "Add person"}
              </h3>
              <X
                className="cursor-pointer hover:rotate-90 transition"
                onClick={() => setShowModal(false)}
              />
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-1">Title</label>
                <select
                  className="w-full border p-2 rounded mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
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
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-sm font-semibold block mb-1">First Name</label>
                    <input
                      className={`w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none ${
                        touchedModal["first_name"] && formData.first_name.trim() === "" ? "border-red-500" : ""
                      }`}
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      onBlur={() => handleModalBlur("first_name")}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-semibold block mb-1">Last Name</label>
                    <input
                      className={`w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none ${
                        touchedModal["last_name"] && formData.last_name.trim() === "" ? "border-red-500" : ""
                      }`}
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      onBlur={() => handleModalBlur("last_name")}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1">Address Line 1</label>
                <input
                  className={`w-full border p-2 rounded mb-3 focus:ring-2 focus:ring-blue-500 outline-none ${
                    touchedModal["address_line_1"] && formData.address_line_1.trim() === "" ? "border-red-500" : ""
                  }`}
                  value={formData.address_line_1}
                  onChange={(e) =>
                    setFormData({ ...formData, address_line_1: e.target.value })
                  }
                  onBlur={() => handleModalBlur("address_line_1")}
                />

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-sm font-semibold block mb-1">City</label>
                    <input
                      className={`w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none ${
                        touchedModal["city"] && formData.city.trim() === "" ? "border-red-500" : ""
                      }`}
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      onBlur={() => handleModalBlur("city")}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-semibold block mb-1">Postcode</label>
                    <input
                      className={`w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none ${
                        touchedModal["postcode"] && formData.postcode.trim() === "" ? "border-red-500" : ""
                      }`}
                      value={formData.postcode}
                      onChange={(e) =>
                        setFormData({ ...formData, postcode: e.target.value })
                      }
                      onBlur={() => handleModalBlur("postcode")}
                    />
                  </div>
                </div>
              </div>

              {modalError && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {modalError}
                </Alert>
              )}

              <button
                onClick={handleSavePerson}
                disabled={isSubmitting}
                className="w-full bg-[#00a8cc] hover:bg-[#008aaa] text-white py-3 rounded font-semibold transition-colors flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Save and continue"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
