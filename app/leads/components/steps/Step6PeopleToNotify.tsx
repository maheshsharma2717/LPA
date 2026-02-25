"use client";
import {
  SquarePen,
  UserPlus,
  UserRound,
  X,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import styles from "./Steps.module.css";
import { supabase } from "@/lib/supabase";
import { CircularProgress, Alert } from "@mui/material";

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
  isSaving: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allFormData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateData: (data: any) => void;
  currentDonorIndex: number;
};

export default function PeopleToNotifyTab({ onNext, isSaving, allFormData, updateData, currentDonorIndex }: Props) {
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

  useEffect(() => {
    const init = async () => {
      if (!donorId) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const token = session.access_token;

        const donorsRes = await fetch(`/api/donors?applicationId=${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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

        const lpaDocsRes = await fetch(`/api/lpa-documents?donorId=${activeDonorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: lpaDocs } = await lpaDocsRes.json();

        if (lpaDocs && lpaDocs.length > 0) {
          const firstLpaId = lpaDocs[0].id;
          setLpaDocId(firstLpaId);

          const peopleRes = await fetch(`/api/people-to-notify?lpaDocId=${firstLpaId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
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
    setShowModal(true);
  };

  const handleSavePerson = async () => {
    if (!lpaDocId) return;
    if (!formData.first_name || !formData.last_name) {
      alert("First and last name are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;

      if (editingPerson) {
        const res = await fetch("/api/people-to-notify", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: editingPerson.id, ...formData }),
        });
        const { data: updated } = await res.json();
        if (updated) {
          setPeople((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }
      } else {
        if (people.length >= 5) {
          alert("Maximum 5 people to notify allowed per document.");
          setIsSubmitting(false);
          return;
        }

        const res = await fetch("/api/people-to-notify", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      alert("Failed to save person.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePerson = async (id: string) => {
    if (!confirm("Are you sure you want to remove this person?")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
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

  if (loading) return <div className="flex justify-center p-10"><CircularProgress /></div>;

  return (
    <>
      <main className="grow flex justify-center">
        <div className="max-w-6xl w-full grid grid-cols-1 gap-10">
          <div className="lg:col-span-2">
            <h4 className={styles.stepHeading}>
              People to notify
            </h4>

            <div className={styles.dividerZenco}></div>

            <p className={styles.pZenco}>
              You can let people know that you&apos;re going to register this document. They can raise any concerns they have about the
              Lasting Powers of Attorney-for example, if there was any pressure or fraud in making it.
            </p>
            <p className={styles.pZenco}>
              When the document is registered, the person applying to register must send a notice to each &apos;person to notify&apos;.
            </p>
            <p className={styles.pZenco}>
              You can&apos;t put any of the attorneys or replacement attorneys here.
            </p>
            <p className={styles.pZenco}>
              Choose people who care about your best interests and who would be willing to speak up if they were concerned.
            </p>

            <div className="text-zenco-blue font-medium mb-8">
              Most people choose &apos;No&apos; and do not enter anyone here.
            </div>

            <div className="mx-auto">
              <h2 className="font-bold text-lg my-4">
                Are there any people to notify?
              </h2>

              <div className="space-y-3">
                <button
                  onClick={() => setHasPeople(false)}
                  className={hasPeople === false ? styles.btnDark : styles.btnWhite}
                >
                  No, there are no people to notify
                </button>
                <button
                  onClick={() => setHasPeople(true)}
                  className={hasPeople === true ? styles.btnDark : styles.btnWhite}
                >
                  Yes, there are people to notify
                </button>
              </div>

              {hasPeople === true && (
                <div className="mt-8 animate-in fade-in">
                  <button
                    onClick={openAddModal}
                    disabled={people.length >= 5}
                    className={`${styles.btnWhite} mb-6 ${people.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <UserPlus size={18} />
                    Add new person to notify
                  </button>

                  {people.length >= 5 && (
                    <Alert severity="warning" className="mb-4">
                      You have reached the maximum limit of 5 people to notify.
                    </Alert>
                  )}

                  {people.length > 0 && (
                    <>
                      <h2 className="font-bold text-lg my-4">
                        People to notify
                      </h2>

                      <div className="space-y-3">
                        {people.map((person) => (
                          <div
                            key={person.id}
                            className="flex justify-between items-center p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition"
                          >
                            <div className="flex items-center gap-3">
                              <UserRound size={30} className="text-gray-400" />
                              <div>
                                <p className="font-bold text-zenco-dark text-lg">
                                  {person.title} {person.first_name} {person.last_name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {person.address_line_1}, {person.city}, {person.postcode}
                                </p>

                                <div className="flex gap-4 mt-1">
                                  <p
                                    onClick={() => openEditModal(person)}
                                    className="text-sm flex items-center gap-1 text-blue-600 hover:underline cursor-pointer"
                                  >
                                    <SquarePen size={13} />
                                    Update details
                                  </p>
                                  <p
                                    onClick={() => handleDeletePerson(person.id)}
                                    className="text-sm flex items-center gap-1 text-red-600 hover:underline cursor-pointer"
                                  >
                                    <Trash2 size={13} />
                                    Remove
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded shadow-lg overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="bg-[#3b5c77] text-white flex justify-between items-center px-4 py-3">
              <h3 className="font-semibold">{editingPerson ? "Update person" : "Add person"}</h3>
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
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                >
                  {["Mr", "Mrs", "Miss", "Ms", "Mx", "Dr", "Rev", "Prof", "Lady", "Lord"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-sm font-semibold block mb-1">First Name</label>
                    <input
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-semibold block mb-1">Last Name</label>
                    <input
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1">Address Line 1</label>
                <input
                  className="w-full border p-2 rounded mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.address_line_1}
                  onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                />

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-sm font-semibold block mb-1">City</label>
                    <input
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-semibold block mb-1">Postcode</label>
                    <input
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.postcode}
                      onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSavePerson}
                disabled={isSubmitting}
                className="w-full bg-[#00a8cc] hover:bg-[#008aaa] text-white py-3 rounded font-semibold transition-colors flex justify-center items-center gap-2"
              >
                {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Save and continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
