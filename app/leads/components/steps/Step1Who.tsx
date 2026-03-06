"use client";

import {useState, useEffect} from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {supabase} from "@/lib/supabase";

type Person = {
  id?: string;
  title: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  // dob: string;
  day: string;
  month: string;
  year: string;
  isLead: boolean;
  relationship: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  county?: string;
  postcode: string;
};

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving: boolean;
};

const CATEGORIES = {
  SINGLE: ["You", "Just for your partner", "Just for one of your parents"],
  DOUBLE: ["You and your partner", "Your mum and dad"],
  UNLIMITED: ["Someone else"],
};

const options = [
  ...CATEGORIES.SINGLE,
  ...CATEGORIES.DOUBLE,
  ...CATEGORIES.UNLIMITED,
];

export default function Step1Who({
  data,
  updateData,
  onNext,
  onBack,
  isSaving,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>(data?.selection || "You");
  const [morePeople, setMorePeople] = useState(data?.morePeople || false);
  const [applicationId, setApplicationId] = useState<string | null>(
    data?.applicationId || null,
  );
  const [people, setPeople] = useState<Person[]>(data?.people || []);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>(
    data?.selectedPeopleIds || [],
  );
  const [openModal, setOpenModal] = useState(false);
  const [leadPerson, setLeadPerson] = useState<Person | null>(null);

  // New State for View Logic
  const [viewMode, setViewMode] = useState<"CATEGORIES" | "QUANTITY" | "LIST">(
    "CATEGORIES",
  );
  const [selectionLimit, setSelectionLimit] = useState<number>(1);
  const [showManualAddress, setShowManualAddress] = useState(false);

  const [newPerson, setNewPerson] = useState<Omit<Person, "id" | "isLead">>({
    title: "Mr",
    firstName: "",
    lastName: "",
    middleName: "",
    day: "",
    month: "",
    year: "",
    relationship: "other",
    addressLine1: "",
    addressLine2: "",
    city: "",
    county: "",
    postcode: "",
  });

  useEffect(() => {
    if (isSaving) {
      handleContinue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  const isLeadIncluded =
    selected === "You" || selected === "You and your partner";

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: {session},
        } = await supabase.auth.getSession();
        if (!session) return;
        const userId = session.user.id;
        const token = session.access_token;

        const leadRes = await fetch(`/api/leads?userId=${userId}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        const {lead} = await leadRes.json();

        const appsRes = await fetch(`/api/applications?userId=${userId}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        const {data: apps} = await appsRes.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentApp = apps?.find((a: any) => a.status === "draft");

        if (currentApp) {
          setApplicationId(currentApp.id);
          const donorsRes = await fetch(
            `/api/donors?applicationId=${currentApp.id}`,
            {headers: {Authorization: `Bearer ${token}`}},
          );
          const {data: donors} = await donorsRes.json();

          if (donors && donors.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mappedPeople = donors.map((d: any) => ({
              id: d.id,
              title: d.title,
              firstName: d.first_name,
              lastName: d.last_name,
              middleName: d.middle_name,
              // dob: d.date_of_birth,
              day: d.day,
              month: d.month,
              year: d.year,
              isLead: d.is_lead,
              relationship: d.relationship_to_lead,
              addressLine1: d.address_line_1,
              addressLine2: d.address_line_2,
              city: d.city,
              county: d.county,
              postcode: d.postcode,
            }));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dbLeadDonor = mappedPeople.find((p: any) => p.isLead);
            setLeadPerson(
              dbLeadDonor || {
                id: userId,
                title: lead.title,
                firstName: lead.first_name,
                lastName: lead.last_name,
                middleName: lead.middle_name,
                // dob: lead.date_of_birth,
                day: lead.date_of_birth ? new Date(lead.date_of_birth).getDate() : "",// get day from date_of_birth
                month: lead.date_of_birth ? new Date(lead.date_of_birth).getMonth() : "",// get month from date_of_birth
                year: lead.date_of_birth ? new Date(lead.date_of_birth).getFullYear() : "",// get year from date_of_birth

                isLead: true,
                relationship: "self",
                addressLine1: lead.address_line_1,
                addressLine2: lead.address_line_2,
                city: lead.city,
                county: lead.county,
                postcode: lead.postcode,
              },
            );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const others = mappedPeople.filter((p: any) => !p.isLead);
            setPeople(others);

            if (data?.selectedPeopleIds && data.selectedPeopleIds.length > 0) {
              setSelectedPeopleIds(data.selectedPeopleIds);
            } else if (others.length > 0) {
              // On reload, if we have others in DB but no selection in form data,
              // assume all non-lead donors in DB were selected.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setSelectedPeopleIds(others.map((p: any) => p.id));
            } else {
              setSelectedPeopleIds([]);
            }

            if (donors.length === 1 && donors[0].is_lead) {
              setSelected("You");
              setMorePeople(false);
              setViewMode("CATEGORIES");
            } else {
              setMorePeople(true);
              if (CATEGORIES.SINGLE.includes(data?.selection)) {
                setSelectionLimit(1);
                setViewMode("LIST");
              } else if (CATEGORIES.DOUBLE.includes(data?.selection)) {
                setSelectionLimit(
                  data?.selection === "You and your partner" ? 1 : 2,
                );
                setViewMode("LIST");
              } else if (data?.selection === "Someone else") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const count = others.filter((p: any) =>
                  data?.selectedPeopleIds?.includes(p.id),
                ).length;
                setSelectionLimit(count > 1 ? 2 : 1);
                setViewMode("LIST");
              } else {
                setViewMode(data?.selection ? "LIST" : "CATEGORIES");
              }
            }
          } else {
            setLeadPerson({
              id: userId,
              title: lead.title,
              firstName: lead.first_name,
              lastName: lead.last_name,
              middleName: lead.middle_name,
              // dob: lead.date_of_birth,
              day: lead.date_of_birth ? new Date(lead.date_of_birth).getDate().toString() : "",// get day from date_of_birth
              month: lead.date_of_birth ? new Date(lead.date_of_birth).getMonth().toString() : "",// get month from date_of_birth
              year: lead.date_of_birth ? new Date(lead.date_of_birth).getFullYear().toString() : "",// get year from date_of_birth
              isLead: true,
              relationship: "self",
              addressLine1: lead.address_line_1,
              addressLine2: lead.address_line_2,
              city: lead.city,
              county: lead.county,
              postcode: lead.postcode,
            });

            if (data?.selection && data.selection !== "You") {
              setMorePeople(true);

              setViewMode("CATEGORIES");
            }
          }
        } else {
          setLeadPerson({
            id: userId,
            title: lead.title,
            firstName: lead.first_name,
            lastName: lead.last_name,
            middleName: lead.middle_name,
            // dob: lead.date_of_birth,
            day: lead.date_of_birth ? new Date(lead.date_of_birth).getDate().toString() : "",// get day from date_of_birth
            month: lead.date_of_birth ? new Date(lead.date_of_birth).getMonth().toString() : "",// get month from date_of_birth
            year: lead.date_of_birth ? new Date(lead.date_of_birth).getFullYear().toString() : "",// get year from date_of_birth
            isLead: true,
            relationship: "self",
            addressLine1: lead.address_line_1,
            addressLine2: lead.address_line_2,
            city: lead.city,
            county: lead.county,
            postcode: lead.postcode,
          });
        }
      } catch (err) {
        console.error("Error initialising Who step:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    updateData({
      selection: selected,
      people,
      selectedPeopleIds,
      morePeople,
      applicationId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, people, selectedPeopleIds, morePeople, applicationId]);

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

  const refinedHandleNextCategory = () => {
    if (selected === "You") {
      setMorePeople(false);
      return;
    }
    setMorePeople(true);

    if (selected === "Someone else") {
      setViewMode("QUANTITY");
    } else if (CATEGORIES.DOUBLE.includes(selected)) {
      if (selected === "You and your partner") {
        setSelectionLimit(1);
      } else {
        setSelectionLimit(2);
      }
      setViewMode("LIST");
      setSelectedPeopleIds([]);
    } else {
      setSelectionLimit(1);
      setViewMode("LIST");
      setSelectedPeopleIds([]);
    }
  };

  const handleQuantitySelection = (limit: number) => {
    setSelectionLimit(limit);
    setViewMode("LIST");
    setSelectedPeopleIds([]);
  };

  const togglePerson = (id: string) => {
    const limit = selectionLimit;

    setSelectedPeopleIds((prev) => {
      if (prev.includes(id)) return prev.filter((pId) => pId !== id);
      if (prev.length < limit) return [...prev, id];
      return prev;
    });
  };

  const handleCreateApplication = async () => {
    const {
      data: {session},
    } = await supabase.auth.getSession();
    if (!session) return null;

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({userId: session.user.id}),
    });
    const {data: app} = await res.json();
    setApplicationId(app.id);
    return app.id;
  };

  const handleAddPerson = async () => {
    if (!newPerson.firstName || !newPerson.lastName) return;

    setLoading(true);
    try {
      const {
        data: {session},
      } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;

      let appId = applicationId;
      if (!appId) {
        appId = await handleCreateApplication();
      }
      if (!appId) throw new Error("Could not create application");

      const donorBody = {
        application_id: appId,
        is_lead: false,
        title: newPerson.title,
        first_name: newPerson.firstName,
        last_name: newPerson.lastName,
        middle_name: newPerson.middleName,
        // date_of_birth: newPerson.dob,
        day: newPerson.day,
        month: newPerson.month,
        year: newPerson.year,
        relationship_to_lead: newPerson.relationship,
        address_line_1: newPerson.addressLine1,
        address_line_2: newPerson.addressLine2,
        city: newPerson.city,
        county: newPerson.county,
        postcode: newPerson.postcode,
      };

      const res = await fetch("/api/donors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(donorBody),
      });

      const {data: donor} = await res.json();

      const p: Person = {
        id: donor.id,
        title: donor.title,
        firstName: donor.first_name,
        lastName: donor.last_name,
        middleName: donor.middle_name,
        // dob: donor.date_of_birth,
        day: donor.day,
        month: donor.month,
        year: donor.year,
        isLead: false,
        relationship: donor.relationship_to_lead,
        addressLine1: donor.address_line_1,
        addressLine2: donor.address_line_2,
        city: donor.city,
        county: donor.county,
        postcode: donor.postcode,
      };

      setPeople((prev) => [...prev, p]);

      if (selectedPeopleIds.length < selectionLimit) {
        setSelectedPeopleIds((prev) => [...prev, donor.id]);
      }

      setOpenModal(false);
      setShowManualAddress(false);
      setNewPerson({
        title: "Mr",
        firstName: "",
        lastName: "",
        middleName: "",
        // dob: "",
        day: "",
        month: "",
        year: "",
        relationship: "other",
        addressLine1: "",
        addressLine2: "",
        city: "",
        county: "",
        postcode: "",
      });
    } catch (err) {
      console.error("Error adding person:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      const {
        data: {session},
      } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;

      let appId = applicationId;
      if (!appId) {
        const createRes = await fetch("/api/applications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({userId: session.user.id}),
        });
        const {data: app} = await createRes.json();
        appId = app.id;
        setApplicationId(appId);
      }

      const finalSelection: Person[] = [];
      if (isLeadIncluded && leadPerson) finalSelection.push(leadPerson);
      people.forEach((p) => {
        if (selectedPeopleIds.includes(p.id!)) finalSelection.push(p);
      });

      const donorsRes = await fetch(`/api/donors?applicationId=${appId}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      const {data: currentDonors} = await donorsRes.json();

      /*
      const toDelete = currentDonors?.filter((cd: any) => {
        const foundById = finalSelection.some(fs => fs.id === cd.id);
        const isLeadInSelection = finalSelection.some(fs => fs.isLead);
        if (cd.is_lead) return !isLeadInSelection; 
        return !foundById; 
      }) || [];

      for (const p of toDelete) {
        await fetch(`/api/donors?id=${p.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      }
      */

      for (const p of finalSelection) {
        const donorBody = {
          application_id: appId,
          is_lead: p.isLead,
          title: p.title,
          first_name: p.firstName,
          last_name: p.lastName,
          middle_name: p.middleName,
          date_of_birth: `${p.year}-${p.month}-${p.day}`,
          relationship_to_lead: p.relationship,
          address_line_1: p.addressLine1,
          address_line_2: p.addressLine2,
          city: p.city,
          county: p.county,
          postcode: p.postcode,
        };

        const existingRecord = p.isLead
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          currentDonors?.find((cd: any) => cd.is_lead)
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          currentDonors?.find((cd: any) => cd.id === p.id);

        if (existingRecord) {
          await fetch("/api/donors", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({id: existingRecord.id, ...donorBody}),
          });
        } else {
          await fetch("/api/donors", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(donorBody),
          });
        }
      }

      onNext();
    } catch (err) {
      console.error("Error saving step:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const renderCategories = () => (
    <div className="space-y-6">
      <p className="text-xl font-medium text-black">
        Who are these documents for?
      </p>
      <div className="grid grid-cols-1 border border-[#adb5bd]">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => setSelected(option)}
            className={`p-5 text-center border-0 transition-all ${selected === option
              ? "border-[#08b9ed] bg-[#35495E] text-white font-semibold shadow-sm"
              : "border-gray-100 hover:border-blue-100 text-black"
              }`}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="flex justify-end pt-4">
        <Button
          variant="contained"
          onClick={refinedHandleNextCategory}
          sx={{
            backgroundColor: "#08B9ED",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": {backgroundColor: "#07bdf5ff"},
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );

  const renderQuantitySelection = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setViewMode("CATEGORIES")}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
      </div>
      <p className="font-semibold text-zenco-dark">
        How many people do you need documents for?
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => handleQuantitySelection(1)}
          className="p-6 rounded-xl border-2 border-gray-100 hover:border-[#08b9ed] hover:bg-blue-50 transition-all text-center"
        >
          <span className="text-lg font-bold text-zenco-dark block">
            One Person
          </span>
          <span className="text-sm text-gray-500">
            I need documents for 1 person
          </span>
        </button>
        <button
          onClick={() => handleQuantitySelection(2)}
          className="p-6 rounded-xl border-2 border-gray-100 hover:border-[#08b9ed] hover:bg-blue-50 transition-all text-center"
        >
          <span className="text-lg font-bold text-zenco-dark block">
            Two People
          </span>
          <span className="text-sm text-gray-500">
            I need documents for 2 people
          </span>
        </button>
      </div>
    </div>
  );

  const renderList = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
      <p className="text-md text-black">
        You have chosen to make documents for{" "}
        <span className="text-[#08b9ed] font-semibold">{selected}</span>.
      </p>
      <p className="text-sm text-gray-500">
        If you have made a mistake and need these documents for someone else
        then{" "}
        <button
          type="button"
          onClick={() => {
            setViewMode("CATEGORIES");
            setSelectedPeopleIds([]);
          }}
          className="underline text-[#08b9ed] font-medium hover:text-blue-700 px-1"
        >
          click here to change who these documents are for.
        </button>
      </p>

      <div className="flex flex-col gap-1">
        {/* Lead Details */}
        {/* {isLeadIncluded && leadPerson && (
          <div className="flex items-center justify-between p-4 rounded-xl border-[#08b9ed] bg-blue-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#08b9ed]/10 flex items-center justify-center text-[#08b9ed] font-bold">
                {leadPerson.firstName[0]}
              </div>
              <div>
                <p className="font-semibold text-zenco-dark">
                  {leadPerson.firstName} {leadPerson.lastName} (You)
                </p>
                <p className="text-xs text-gray-500">Self</p>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#08b9ed] flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        )} */}

        {people.map((person) => {
          const isSelected = selectedPeopleIds.includes(person.id!);
          const limit = selectionLimit;
          const disabled = !isSelected && selectedPeopleIds.length >= limit;

          return (
            <button
              key={person.id}
              disabled={disabled}
              onClick={() => togglePerson(person.id!)}
              className={`w-full flex items-center justify-between p-5 border transition-all border-[#adb5bd] cursor-pointer ${isSelected
                  ? "bg-[#35495e]"
                  : disabled
                    ? " opacity-50 cursor-not-allowed"
                    : "border-gray-200 bg-white"
                }`}
            >
              <div className="flex items-center gap-3">
                {/* <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    isSelected
                      ? "bg-[#08b9ed]/10 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {person.firstName[0]}
                </div> */}
                <div className="text-left">
                  <p
                    className={`font-semibold ${isSelected ? "text-white" : "text-black"}`}
                  >
                    {person.firstName} {person.lastName}
                  </p>
                  {/* <p className="text-xs text-gray-400 capitalize">
                    {person.relationship}
                  </p> */}
                </div>
              </div>
              <div
                className={`w-6 h-6 border-2 flex items-center justify-center transition-all ${isSelected
                  ? "border-white border-3 rounded"
                  : "border-[#6B7588] rounded bg-white border-3"
                  }`}
              >
                {isSelected && (
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <Button
        fullWidth
        variant="outlined"
        onClick={() => setOpenModal(true)}
        sx={{
          mt: 2,
          py: 1.9,
          borderColor: "#8f90a6",
          backgroundColor: "#fafafa",
          color: "#374151",
          textTransform: "none",
          fontWeight: 600,
          // "&:hover": { borderColor: "#8f90a6", backgroundColor: "#fafafa" },
        }}
      >
        <div className="flex justify-center items-center gap-3 text-lg text-[#334A5E]">
          <span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 512"
              className="w-6 h-6"
              fill="currentColor"
            >
              <path d="M285.7 304c98.5 0 178.3 79.8 178.3 178.3 0 16.4-13.3 29.7-29.7 29.7L77.7 512C61.3 512 48 498.7 48 482.3 48 383.8 127.8 304 226.3 304l59.4 0zM528 80c13.3 0 24 10.7 24 24l0 48 48 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-48 0 0 48c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-48-48 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0 0-48c0-13.3 10.7-24 24-24zM256 248a120 120 0 1 1 0-240 120 120 0 1 1 0 240z" />
            </svg>
          </span>
          <p>Add new person</p>
        </div>
      </Button>

      <div className="flex justify-between pt-4">
        <button onClick={handleBack} className={`cursor-pointer`}>
          ← back
        </button>
        {/* <Button
          variant="contained"
          onClick={handleContinue}
          sx={{
            backgroundColor: "#08B9ED",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { backgroundColor: "#07bdf5ff" },
          }}
        >
          Continue
        </Button> */}
        <button
          onClick={handleContinue}
          className={`px-10 py-3 rounded text-white font-bold shadow-lg transition-all flex items-center justify-center min-w-45 
                       bg-[#06b6d4] hover:bg-cyan-600 cursor-pointer
                      `}
        >
          Continue
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <h3 className="text-2xl font-semibold text-zenco-dark">
          Who is the{" "}
          <span className="text-[#08b9ed]">Lasting Power of Attorney</span> for?
        </h3>

        {!morePeople ? (
          <div className="space-y-6">
            <p className="text-black">
              You have chosen to make documents for{" "}
              <span className="text-[#08b9ed]">yourself only</span>.
            </p>
            <p className="">
              If you have made a mistake and need these documents for someone
              else then
              <button
                type="button"
                onClick={() => {
                  setMorePeople(true);
                  setViewMode("CATEGORIES");
                }}
                className="underline text-[#08b9ed] font-medium px-1"
              >
                click here to change who these documents are for.
              </button>
            </p>

            <p>
              Click the continue button to continue making Lasting Power of
              Attorney documents for yourself.
            </p>
            <div className="flex justify-between pt-4">
              <button onClick={handleBack} className={`cursor-pointer`}>
                ← back
              </button>
              {/* <Button
          variant="contained"
          onClick={handleContinue}
          sx={{
            backgroundColor: "#08B9ED",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { backgroundColor: "#07bdf5ff" },
          }}
        >
          Continue
        </Button> */}
              <button
                onClick={handleContinue}
                className={`px-10 py-3 rounded text-white font-bold shadow-lg transition-all flex items-center justify-center min-w-45 
                       bg-[#06b6d4] hover:bg-cyan-600 cursor-pointer
                      `}
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <>
            {viewMode === "CATEGORIES" && renderCategories()}
            {viewMode === "QUANTITY" && renderQuantitySelection()}
            {viewMode === "LIST" && renderList()}
          </>
        )}
      </div>

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle className="bg-[#40688b]">
          <div className="flex justify-between items-center ">
            <p className="text-white font-bold"> Add person</p>
            <span onClick={() => setOpenModal(false)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 384 512"
                className="w-5 h-5 text-black cursor-pointer transition"
                fill="currentColor"
              >
                <path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z" />
              </svg>
            </span>
          </div>
        </DialogTitle>
        <div className="p-4">
          <DialogContent className="flex flex-col gap-6">
            <p className="text-xl font-semibold text-zenco-dark mb-2">
              Full legal name
            </p>
            <div className="text-[#6B7588]">
              <FormControl className="w-full sm:w-1/2">
                <h6 className="font-medium mb-2">Title</h6>
                <Select
                  value={newPerson.title}
                  onChange={(e) =>
                    setNewPerson({...newPerson, title: e.target.value})
                  }
                  fullWidth
                >
                  <MenuItem value="Choose...">Choose...</MenuItem>
                  <MenuItem value="Mr">Mr</MenuItem>
                  <MenuItem value="Mrs">Mrs</MenuItem>
                  <MenuItem value="Ms">Ms</MenuItem>
                  <MenuItem value="Miss">Miss</MenuItem>
                  <MenuItem value="Dr">Dr</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormControl fullWidth>
                  <p>First Name</p>
                  <TextField
                    fullWidth
                    value={newPerson.firstName}
                    onChange={(e) =>
                      setNewPerson({...newPerson, firstName: e.target.value})
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {border: "2px solid #a0a0a0"},
                        "&:hover fieldset": {border: "2px solid #a0a0a0"},
                        "&.Mui-focused fieldset": {
                          border: "2px solid #a0a0a0",
                        },
                      },
                    }}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <p>Last Name</p>
                  <TextField
                    fullWidth
                    value={newPerson.lastName}
                    onChange={(e) =>
                      setNewPerson({...newPerson, lastName: e.target.value})
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {border: "2px solid #a0a0a0"},
                        "&:hover fieldset": {border: "2px solid #a0a0a0"},
                        "&.Mui-focused fieldset": {
                          border: "2px solid #a0a0a0",
                        },
                      },
                    }}
                  />
                </FormControl>
              </div>
            </div>
            <FormControl fullWidth>
              <p className="text-[#6B7588]">Middle names</p>
              <TextField
                fullWidth
                value={newPerson.middleName}
                onChange={(e) =>
                  setNewPerson({...newPerson, middleName: e.target.value})
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {border: "2px solid #a0a0a0"},
                    "&:hover fieldset": {border: "2px solid #a0a0a0"},
                    "&.Mui-focused fieldset": {border: "2px solid #a0a0a0"},
                  },
                }}
              />
            </FormControl>

            <div className="flex flex-col">
              <p className="text-xl font-medium text-zenco-dark -mb-2">
                What&apos;s their date of birth?
              </p>
              <div className="space-y-4  leading-loose">
                <h3 className="font-semibold text-lg text-zenco-dark">
                  Date of birth
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-[#6B7588]">
                  <FormControl fullWidth>
                    <TextField
                      placeholder="DD"
                      value={newPerson.day}
                      //       onChange={(e) =>
                      //   setNewPerson({ ...newPerson, middleName: e.target.value })
                      // }
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value) && value.length <= 2) {
                          // handleChange("day", value);
                          setNewPerson({...newPerson, day: e.target.value});
                        }
                      }}
                      error={
                        newPerson.day !== "" &&
                        !/^(0?[1-9]|[12][0-9]|3[01])$/.test(newPerson.day)
                      }
                      inputProps={{inputMode: "numeric"}}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {border: "2px solid #a0a0a0"},
                          "&:hover fieldset": {border: "2px solid #a0a0a0"},
                          "&.Mui-focused fieldset": {
                            border: "2px solid #a0a0a0",
                          },
                        },
                      }}
                    />
                  </FormControl>

                  <FormControl fullWidth>
                    <TextField
                      placeholder="MM"
                      value={newPerson.month}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value) && value.length <= 2) {
                          setNewPerson({...newPerson, month: e.target.value});

                          // handleChange("month", value);
                        }
                      }}
                      error={
                        newPerson.month !== "" &&
                        !/^(0?[1-9]|1[0-2])$/.test(newPerson.month)
                      }
                      inputProps={{inputMode: "numeric"}}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {border: "2px solid #a0a0a0"},
                          "&:hover fieldset": {border: "2px solid #a0a0a0"},
                          "&.Mui-focused fieldset": {
                            border: "2px solid #a0a0a0",
                          },
                        },
                      }}
                    />
                  </FormControl>

                  <FormControl fullWidth>
                    <TextField
                      placeholder="YYYY"
                      value={newPerson.year}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value) && value.length <= 4) {
                          setNewPerson({...newPerson, year: e.target.value});

                          // handleChange("year", value);
                        }
                      }}
                      error={
                        newPerson.year !== "" && !/^\d{4}$/.test(newPerson.year)
                      }
                      inputProps={{inputMode: "numeric"}}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {border: "2px solid #a0a0a0"},
                          "&:hover fieldset": {border: "2px solid #a0a0a0"},
                          "&.Mui-focused fieldset": {
                            border: "2px solid #a0a0a0",
                          },
                        },
                      }}
                    />
                  </FormControl>
                </div>
              </div>
              <FormControl></FormControl>
            </div>

            {/* <TextField
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newPerson.dob}
              onChange={(e) =>
                setNewPerson({ ...newPerson, dob: e.target.value })
              }
            /> */}

            {/* <p className="font-semibold text-zenco-dark -mb-2">
              What is their relationship to you?
            </p>
            <FormControl fullWidth>
              <InputLabel>Relationship</InputLabel>
              <Select
                value={newPerson.relationship}
                label="Relationship"
                onChange={(e) =>
                  setNewPerson({ ...newPerson, relationship: e.target.value })
                }
              >
                <MenuItem value="partner">Partner</MenuItem>
                <MenuItem value="parent">Parent</MenuItem>
                <MenuItem value="child">Child</MenuItem>
                <MenuItem value="sibling">Sibling</MenuItem>
                <MenuItem value="friend">Friend</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <p className="font-semibold text-zenco-dark -mb-2">
              What is their address?
            </p>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex gap-4 items-end">
                <TextField
                  label="Postcode"
                  fullWidth
                  value={newPerson.postcode}
                  onChange={(e) =>
                    setNewPerson({ ...newPerson, postcode: e.target.value })
                  }
                />
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#08B9ED",
                    textTransform: "none",
                    borderRadius: "8px",
                    height: "56px",
                    "&:hover": { backgroundColor: "#07bdf5ff" },
                  }}
                >
                  Search
                </Button>
              </div>

              {!showManualAddress && (
                <button
                  type="button"
                  onClick={() => setShowManualAddress(true)}
                  className="text-cyan-500 font-semibold text-sm hover:underline text-left w-fit"
                >
                  Enter address manually
                </button>
              )}

              {showManualAddress && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <TextField
                    label="Address Line 1"
                    fullWidth
                    value={newPerson.addressLine1}
                    onChange={(e) =>
                      setNewPerson({
                        ...newPerson,
                        addressLine1: e.target.value,
                      })
                    }
                  />
                  <TextField
                    label="Address Line 2 (Optional)"
                    fullWidth
                    value={newPerson.addressLine2}
                    onChange={(e) =>
                      setNewPerson({
                        ...newPerson,
                        addressLine2: e.target.value,
                      })
                    }
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      label="City"
                      fullWidth
                      value={newPerson.city}
                      onChange={(e) =>
                        setNewPerson({ ...newPerson, city: e.target.value })
                      }
                    />
                    <TextField
                      label="County (Optional)"
                      fullWidth
                      value={newPerson.county}
                      onChange={(e) =>
                        setNewPerson({ ...newPerson, county: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </div> */}
          </DialogContent>
          <DialogActions className="p-4 gap-2">
            <Button
              onClick={() => setOpenModal(false)}
              sx={{color: "gray", textTransform: "none"}}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAddPerson}
              disabled={loading}
              sx={{
                backgroundColor: "#08B9ED",
                textTransform: "none",
                borderRadius: "8px",
                padding: "10px 24px",
                "&:hover": {backgroundColor: "#07bdf5ff"},
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Add Person"
              )}
            </Button>
          </DialogActions>
        </div>
      </Dialog>
    </div>
  );
}
