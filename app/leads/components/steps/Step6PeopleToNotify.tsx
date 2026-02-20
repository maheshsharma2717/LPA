"use client";
import Link from "next/link";
import {
  SquarePen,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import styles from "./Steps.module.css";
import { useEffect } from "react";
type Person = {
  id: number;
  lpa_document_id: string;
  title: string;
  first_name: string;
  last_name: string;
  address_line_1: string;
  city: string;
  postcode: string;
};



type Props = {
  onNext: () => void;
  isSaving: boolean;
};

export default function PeopleToNotifyTab({ onNext, isSaving }: Props) {
  useEffect(() => {
    if (isSaving) {
      onNext();
    }
  }, [isSaving]);

  const [hasPeople, setHasPeople] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const lpaDocId = "LPA-001";

  const staticNewPerson: Person = {
    id: Date.now(),
    lpa_document_id: lpaDocId,
    title: "Dr",
    first_name: "Sarah",
    last_name: "Williams",
    address_line_1: "7 Birch Road",
    city: "Oxford",
    postcode: "OX1 1AA",
  };

  const addPerson = () => {
    setPeople((prev) => [...prev, staticNewPerson]);
    setShowModal(false);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id]
    );
  };

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
              You can let people know that you're going to register this document.
            </p>

            <p className={styles.pZenco}>
              You can let people know that you're going to register this document. They can raise any concerns they have about the
              Lasting Powers of Attorney-for example, if there was any pressure or fraud in making it.
            </p>
            <p className={styles.pZenco}>
              When the document is registered, the person applying to register must send a notice to each 'person to notify'.
            </p>
            <p className={styles.pZenco}>
              You can't put any of the attorneys or replacement attorneys here.
            </p>
            <p className={styles.pZenco}>
              Choose people who care about your best interests and who would be willing to speak up if they were concerned.
            </p>

            <Link href="/" className="text-zenco-blue font-medium">
              Most people choose 'No' and do not enter anyone here.
            </Link>

            <div className="mx-auto">

              <h2 className="font-bold text-lg my-4">
                Are there any people to notify?
              </h2>

              <button
                onClick={() => setHasPeople(false)}
                className={hasPeople !== true ? styles.btnDark : styles.btnWhite}
              >
                No, there are no people to notify
              </button>
              <button
                onClick={() => setHasPeople(true)}
                className={hasPeople === true ? styles.btnDark : styles.btnWhite} style={{ marginBottom: "3rem" }}
              >
                Yes, there are people to notify
              </button>

              {hasPeople && (
                <>
                  <button
                    onClick={() => setShowModal(true)}
                    className={styles.btnWhite}
                  >
                    <UserPlus size={18} />
                    Add new person to notify
                  </button>

                  {people.length > 0 && (
                    <>
                      <h2 className="font-bold text-lg my-4">
                        Select people to notify
                      </h2>

                      <div className="border rounded">
                        {people.map((person) => (
                          <div
                            key={person.id}
                            onClick={() => toggleSelect(person.id)}
                            className={`flex justify-between items-center p-3 cursor-pointer transition ${selectedIds.includes(person.id)
                              ? "bg-blue-50"
                              : "hover:bg-gray-50"
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <UserRound size={30} />
                              <div>
                                <label className="font-bold">
                                  {person.title} {person.first_name} {person.last_name}
                                </label>

                                {/* <p className="text-sm text-gray-600">
                                {person.address_line_1}, {person.city}, {person.postcode}
                              </p> */}

                                <p
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-sm flex items-center gap-1 text-blue-600 hover:underline cursor-pointer"
                                >
                                  <SquarePen size={13} />
                                  Update this person's details
                                </p>
                              </div>
                            </div>

                            <input
                              type="checkbox"
                              checked={selectedIds.includes(person.id)}
                              onChange={() => toggleSelect(person.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4"
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <aside className="bg-white p-6 h-fit">

          <h3 className="text-lg font-bold mb-4">
            Who can be a Person to Notify?
          </h3>

          <p className="text-sm mb-4 text-gray-700">
            The person to notify must meet the following requirements:
          </p>

          <ul className="space-y-3 text-sm">

            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">●</span>
              <span>Aged 18 or over</span>
            </li>

            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">●</span>
              <span>Have mental capacity to make decisions</span>
            </li>

            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">●</span>
              <span>
                Must not be bankrupt, or subject to a debt relief order
              </span>
            </li>

          </ul>
        </aside>

      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[420px] rounded shadow-lg overflow-hidden">

            {/* Header */}
            <div className="bg-[#3b5c77] text-white flex justify-between items-center px-4 py-3">
              <h3 className="font-semibold">Add person</h3>
              <X
                className="cursor-pointer"
                onClick={() => setShowModal(false)}
              />
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">

              <div>
                <label className="text-sm font-semibold block mb-1">
                  Full legal name
                </label>

                <select className="w-full border p-2 rounded mb-3">
                  <option>Dr</option>
                </select>

                <div className="flex gap-3">
                  <input
                    className="w-full border p-2 rounded"
                    defaultValue="Sarah"
                  />
                  <input
                    className="w-full border p-2 rounded"
                    defaultValue="Williams"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1">
                  Address
                </label>
                <input
                  className="w-full border p-2 rounded mb-2"
                  defaultValue="7 Birch Road"
                />
                <input
                  className="w-full border p-2 rounded mb-2"
                  defaultValue="Oxford"
                />
                <input
                  className="w-full border p-2 rounded"
                  defaultValue="OX1 1AA"
                />
              </div>

              <button
                onClick={addPerson}
                className="w-full bg-[#00a8cc] text-white py-3 rounded font-semibold"
              >
                Save and continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
