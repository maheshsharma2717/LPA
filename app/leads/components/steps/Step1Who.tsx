"use client";

import { useState, useEffect } from "react";
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
import { supabase } from "@/lib/supabase";

type Person = {
  id?: string;
  title: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dob: string;
  isLead: boolean;
  relationship: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  county?: string;
  postcode: string;
};

type Props = {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  isSaving: boolean;
};

const CATEGORIES = {
  SINGLE: ["You", "Just for your partner", "Just for one of your parents"],
  DOUBLE: ["You and your partner", "Your mum and dad"],
  UNLIMITED: ["Someone else"],
};

const options = [...CATEGORIES.SINGLE, ...CATEGORIES.DOUBLE, ...CATEGORIES.UNLIMITED];

export default function Step1Who({ data, updateData, onNext, isSaving }: Props) {
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>(data?.selection || "You");
  const [morePeople, setMorePeople] = useState(data?.morePeople || false);
  const [applicationId, setApplicationId] = useState<string | null>(data?.applicationId || null);
  const [people, setPeople] = useState<Person[]>(data?.people || []);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>(data?.selectedPeopleIds || []);
  const [openModal, setOpenModal] = useState(false);
  const [leadPerson, setLeadPerson] = useState<Person | null>(null);

  // New State for View Logic
  const [viewMode, setViewMode] = useState<'CATEGORIES' | 'QUANTITY' | 'LIST'>('CATEGORIES');
  const [selectionLimit, setSelectionLimit] = useState<number>(1);

  const [newPerson, setNewPerson] = useState<Omit<Person, "id" | "isLead">>({
    title: "Mr",
    firstName: "",
    lastName: "",
    middleName: "",
    dob: "",
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
  }, [isSaving]);

  // Determine if Lead is included based on selection
  const isLeadIncluded = selected === "You" || selected === "You and your partner";

  // Re-derive view state on load if data exists
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const userId = session.user.id;
        const token = session.access_token;

        // Fetch lead and application data (same as before)
        const leadRes = await fetch(`/api/leads?userId=${userId}`, { headers: { Authorization: `Bearer ${token}` } });
        const { lead } = await leadRes.json();

        const appsRes = await fetch(`/api/applications?userId=${userId}`, { headers: { Authorization: `Bearer ${token}` } });
        const { data: apps } = await appsRes.json();
        let currentApp = apps?.find((a: any) => a.status === 'draft');

        if (currentApp) {
          setApplicationId(currentApp.id);
          const donorsRes = await fetch(`/api/donors?applicationId=${currentApp.id}`, { headers: { Authorization: `Bearer ${token}` } });
          const { data: donors } = await donorsRes.json();

          if (donors && donors.length > 0) {
            const mappedPeople = donors.map((d: any) => ({
              id: d.id,
              title: d.title,
              firstName: d.first_name,
              lastName: d.last_name,
              middleName: d.middle_name,
              dob: d.date_of_birth,
              isLead: d.is_lead,
              relationship: d.relationship_to_lead,
              addressLine1: d.address_line_1,
              addressLine2: d.address_line_2,
              city: d.city,
              county: d.county,
              postcode: d.postcode,
            }));

            const dbLeadDonor = mappedPeople.find((p: any) => p.isLead);
            setLeadPerson(dbLeadDonor || {
              id: userId, title: lead.title, firstName: lead.first_name, lastName: lead.last_name,
              middleName: lead.middle_name, dob: lead.date_of_birth, isLead: true, relationship: 'self',
              addressLine1: lead.address_line_1, addressLine2: lead.address_line_2, city: lead.city, county: lead.county, postcode: lead.postcode,
            });

            const others = mappedPeople.filter((p: any) => !p.isLead);
            setPeople(others);

            if (data?.selectedPeopleIds && data.selectedPeopleIds.length > 0) {

              setSelectedPeopleIds(data.selectedPeopleIds);
            } else {
              setSelectedPeopleIds([]);
            }

            if (donors.length === 1 && donors[0].is_lead) {

              setSelected("You");
              setMorePeople(false);
              setViewMode('CATEGORIES');
            } else {
              setMorePeople(true);
              if (CATEGORIES.SINGLE.includes(data?.selection)) {
                setSelectionLimit(1);
                setViewMode('LIST');
              } else if (CATEGORIES.DOUBLE.includes(data?.selection)) {

                setSelectionLimit(data?.selection === "You and your partner" ? 1 : 2);
                setViewMode('LIST');
              } else if (data?.selection === "Someone else") {
                const count = others.filter((p: any) => data?.selectedPeopleIds?.includes(p.id)).length;
                setSelectionLimit(count > 1 ? 2 : 1);
                setViewMode('LIST');
              } else {

                setViewMode(data?.selection ? 'LIST' : 'CATEGORIES');
              }
            }
          } else {

            setLeadPerson({
              id: userId, title: lead.title, firstName: lead.first_name, lastName: lead.last_name,
              middleName: lead.middle_name, dob: lead.date_of_birth, isLead: true, relationship: 'self',
              addressLine1: lead.address_line_1, addressLine2: lead.address_line_2, city: lead.city, county: lead.county, postcode: lead.postcode,
            });

            if (data?.selection && data.selection !== "You") {
              setMorePeople(true);

              setViewMode('CATEGORIES');
            }
          }
        } else {
          setLeadPerson({
            id: userId, title: lead.title, firstName: lead.first_name, lastName: lead.last_name,
            middleName: lead.middle_name, dob: lead.date_of_birth, isLead: true, relationship: 'self',
            addressLine1: lead.address_line_1, addressLine2: lead.address_line_2, city: lead.city, county: lead.county, postcode: lead.postcode,
          });
        }
      } catch (err) {
        console.error("Error initialising Who step:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    updateData({
      selection: selected,
      people,
      selectedPeopleIds,
      morePeople,
      applicationId
    });
  }, [selected, people, selectedPeopleIds, morePeople, applicationId]);


  const refinedHandleNextCategory = () => {
    if (selected === "You") {
      setMorePeople(false);
      return;
    }
    setMorePeople(true);

    if (selected === "Someone else") {
      setViewMode('QUANTITY');
    } else if (CATEGORIES.DOUBLE.includes(selected)) {

      if (selected === "You and your partner") {
        setSelectionLimit(1);
      } else {
        setSelectionLimit(2);
      }
      setViewMode('LIST');
      setSelectedPeopleIds([]);
    } else {

      setSelectionLimit(1);
      setViewMode('LIST');
      setSelectedPeopleIds([]);
    }
  };

  const handleQuantitySelection = (limit: number) => {
    setSelectionLimit(limit);
    setViewMode('LIST');
    setSelectedPeopleIds([]);
  };

  const togglePerson = (id: string) => {
    const limit = selectionLimit;

    setSelectedPeopleIds(prev => {
      if (prev.includes(id)) return prev.filter(pId => pId !== id);
      if (prev.length < limit) return [...prev, id];
      return prev;
    });
  };

  const handleCreateApplication = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ userId: session.user.id })
    });
    const { data: app } = await res.json();
    setApplicationId(app.id);
    return app.id;
  };

  const handleAddPerson = async () => {
    if (!newPerson.firstName || !newPerson.lastName) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
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
        date_of_birth: newPerson.dob,
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
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(donorBody)
      });

      const { data: donor } = await res.json();

      const p: Person = {
        id: donor.id,
        title: donor.title,
        firstName: donor.first_name,
        lastName: donor.last_name,
        middleName: donor.middle_name,
        dob: donor.date_of_birth,
        isLead: false,
        relationship: donor.relationship_to_lead,
        addressLine1: donor.address_line_1,
        addressLine2: donor.address_line_2,
        city: donor.city,
        county: donor.county,
        postcode: donor.postcode,
      };

      setPeople(prev => [...prev, p]);

      if (selectedPeopleIds.length < selectionLimit) {
        setSelectedPeopleIds(prev => [...prev, donor.id]);
      }

      setOpenModal(false);
      setNewPerson({
        title: "Mr",
        firstName: "",
        lastName: "",
        middleName: "",
        dob: "",
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;
      const userId = session.user.id;

      let appId = applicationId;
      if (!appId) {

        const createRes = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ userId: session.user.id })
        });
        const { data: app } = await createRes.json();
        appId = app.id;
        setApplicationId(appId);
      }


      const finalSelection: Person[] = [];
      if (isLeadIncluded && leadPerson) finalSelection.push(leadPerson);
      people.forEach(p => {
        if (selectedPeopleIds.includes(p.id!)) finalSelection.push(p);
      });


      const donorsRes = await fetch(`/api/donors?applicationId=${appId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { data: currentDonors } = await donorsRes.json();


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
          date_of_birth: p.dob,
          relationship_to_lead: p.relationship,
          address_line_1: p.addressLine1,
          address_line_2: p.addressLine2,
          city: p.city,
          county: p.county,
          postcode: p.postcode,
        };

        const existingRecord = p.isLead
          ? currentDonors?.find((cd: any) => cd.is_lead)
          : currentDonors?.find((cd: any) => cd.id === p.id);

        if (existingRecord) {
          await fetch("/api/donors", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ id: existingRecord.id, ...donorBody })
          });
        } else {
          await fetch("/api/donors", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(donorBody)
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

  // --- RENDER HELPERS ---

  const renderCategories = () => (
    <div className="space-y-6">
      <p className="font-semibold text-zenco-dark">Who are these documents for?</p>
      <div className="grid grid-cols-1 gap-3">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => setSelected(option)}
            className={`p-4 text-left rounded-xl border-2 transition-all ${selected === option
              ? "border-zenco-blue bg-blue-50 text-zenco-dark font-semibold shadow-sm"
              : "border-gray-100 hover:border-blue-100 text-gray-600"
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
            textTransform: 'none',
            fontWeight: 600,
            "&:hover": { backgroundColor: "#07bdf5ff" },
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
        <button onClick={() => setViewMode('CATEGORIES')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
      </div>
      <p className="font-semibold text-zenco-dark">How many people do you need documents for?</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => handleQuantitySelection(1)}
          className="p-6 rounded-xl border-2 border-gray-100 hover:border-zenco-blue hover:bg-blue-50 transition-all text-center"
        >
          <span className="text-lg font-bold text-zenco-dark block">One Person</span>
          <span className="text-sm text-gray-500">I need documents for 1 person</span>
        </button>
        <button
          onClick={() => handleQuantitySelection(2)}
          className="p-6 rounded-xl border-2 border-gray-100 hover:border-zenco-blue hover:bg-blue-50 transition-all text-center"
        >
          <span className="text-lg font-bold text-zenco-dark block">Two People</span>
          <span className="text-sm text-gray-500">I need documents for 2 people</span>
        </button>
      </div>
    </div>
  );

  const renderList = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
      <p className="text-gray-600">
        You have chosen to make documents for <span className="text-zenco-blue font-semibold">{selected}</span>.
      </p>
      <p className="text-sm text-gray-500">
        If you have made a mistake and need these documents for someone else then{" "}
        <button
          type="button"
          onClick={() => {
            // Reset fully logic? Or just go back?
            // Requirement: "if no one is created then we show all options"
            // But here we might have Created people. 
            // "click here to change" implies going back.
            setViewMode('CATEGORIES');
            setSelectedPeopleIds([]);
          }}
          className="underline text-zenco-blue font-medium hover:text-blue-700"
        >
          click here to change who these documents are for.
        </button>
      </p>

      <div className="space-y-3">
        {/* Lead Details */}
        {isLeadIncluded && leadPerson && (
          <div className="flex items-center justify-between p-4 rounded-xl border border-zenco-blue bg-blue-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zenco-blue/10 flex items-center justify-center text-zenco-blue font-bold">
                {leadPerson.firstName[0]}
              </div>
              <div>
                <p className="font-semibold text-zenco-dark">{leadPerson.firstName} {leadPerson.lastName} (You)</p>
                <p className="text-xs text-gray-500">Self</p>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-zenco-blue flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}

        {people.map((person) => {
          const isSelected = selectedPeopleIds.includes(person.id!);
          const limit = selectionLimit;
          const disabled = !isSelected && selectedPeopleIds.length >= limit;

          return (
            <button
              key={person.id}
              disabled={disabled}
              onClick={() => togglePerson(person.id!)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${isSelected
                ? "border-zenco-blue bg-white shadow-sm"
                : disabled
                  ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                  : "border-gray-200 bg-white hover:border-blue-200"
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isSelected ? "bg-zenco-blue/10 text-zenco-blue" : "bg-gray-100 text-gray-400"
                  }`}>
                  {person.firstName[0]}
                </div>
                <div className="text-left">
                  <p className={`font-semibold ${isSelected ? "text-zenco-dark" : "text-gray-600"}`}>
                    {person.firstName} {person.lastName}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">{person.relationship}</p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "bg-zenco-blue border-zenco-blue" : "border-gray-200 bg-white"
                }`}>
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
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
          py: 1.5,
          borderColor: '#E5E7EB',
          color: '#374151',
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '0.75rem',
          '&:hover': { borderColor: '#D1D5DB', backgroundColor: '#F9FAFB' }
        }}
      >
        + Add new person
      </Button>

      <div className="flex justify-end pt-4">
        <Button
          variant="contained"
          onClick={handleContinue}
          sx={{
            backgroundColor: "#08B9ED",
            textTransform: 'none',
            fontWeight: 600,
            "&:hover": { backgroundColor: "#07bdf5ff" },
          }}
        >
          Continue
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold text-zenco-dark">
          Who is the <span className="text-zenco-blue">Lasting Power of Attorney</span> for?
        </h2>

        {!morePeople ? (
          <div className="space-y-6">
            <p className="text-gray-600">You have chosen to make documents for <span className="text-zenco-blue font-semibold">yourself only</span>.</p>
            <p className="text-sm text-gray-500">
              If you have made a mistake and need these documents for someone else then{" "}
              <button
                type="button"
                onClick={() => {
                  setMorePeople(true);
                  setViewMode('CATEGORIES');
                }}
                className="underline text-zenco-blue font-medium hover:text-blue-700"
              >
                click here to change who these documents are for.
              </button>
            </p>
            <div className="flex justify-start">
            </div>
            {/* Continue button for "You" only flow (implied in original layout or handled by WizardLayout) */}
            {/* If we strictly follow the new flow, "You" is just another leaf. But original code had special "You" view. Keeping it. */}
          </div>
        ) : (
          <>
            {viewMode === 'CATEGORIES' && renderCategories()}
            {viewMode === 'QUANTITY' && renderQuantitySelection()}
            {viewMode === 'LIST' && renderList()}
          </>
        )}
      </div>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle className="font-bold text-zenco-dark">Add person</DialogTitle>
        <DialogContent className="flex flex-col gap-6 mt-2">
          <p className="font-semibold text-zenco-dark -mb-2">Full legal name</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormControl fullWidth>
              <InputLabel>Title</InputLabel>
              <Select
                value={newPerson.title}
                label="Title"
                onChange={(e) => setNewPerson({ ...newPerson, title: e.target.value })}
              >
                <MenuItem value="Mr">Mr</MenuItem>
                <MenuItem value="Mrs">Mrs</MenuItem>
                <MenuItem value="Ms">Ms</MenuItem>
                <MenuItem value="Miss">Miss</MenuItem>
                <MenuItem value="Dr">Dr</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="First Name"
              fullWidth
              sx={{ md: { gridColumn: 'span 1' } }}
              value={newPerson.firstName}
              onChange={(e) => setNewPerson({ ...newPerson, firstName: e.target.value })}
            />
            <TextField
              label="Middle names"
              fullWidth
              value={newPerson.middleName}
              onChange={(e) => setNewPerson({ ...newPerson, middleName: e.target.value })}
            />
            <TextField
              label="Last Name"
              fullWidth
              value={newPerson.lastName}
              onChange={(e) => setNewPerson({ ...newPerson, lastName: e.target.value })}
            />
          </div>

          <p className="font-semibold text-zenco-dark -mb-2">What's their date of birth?</p>
          <TextField
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={newPerson.dob}
            onChange={(e) => setNewPerson({ ...newPerson, dob: e.target.value })}
          />

          <p className="font-semibold text-zenco-dark -mb-2">What is their relationship to you?</p>
          <FormControl fullWidth>
            <InputLabel>Relationship</InputLabel>
            <Select
              value={newPerson.relationship}
              label="Relationship"
              onChange={(e) => setNewPerson({ ...newPerson, relationship: e.target.value })}
            >
              <MenuItem value="partner">Partner</MenuItem>
              <MenuItem value="parent">Parent</MenuItem>
              <MenuItem value="child">Child</MenuItem>
              <MenuItem value="sibling">Sibling</MenuItem>
              <MenuItem value="friend">Friend</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <p className="font-semibold text-zenco-dark -mb-2">What is their address?</p>
          <div className="grid grid-cols-1 gap-4">
            <TextField
              label="Address Line 1"
              fullWidth
              value={newPerson.addressLine1}
              onChange={(e) => setNewPerson({ ...newPerson, addressLine1: e.target.value })}
            />
            <TextField
              label="Address Line 2 (Optional)"
              fullWidth
              value={newPerson.addressLine2}
              onChange={(e) => setNewPerson({ ...newPerson, addressLine2: e.target.value })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="City"
                fullWidth
                value={newPerson.city}
                onChange={(e) => setNewPerson({ ...newPerson, city: e.target.value })}
              />
              <TextField
                label="County (Optional)"
                fullWidth
                value={newPerson.county}
                onChange={(e) => setNewPerson({ ...newPerson, county: e.target.value })}
              />
            </div>
            <TextField
              label="Postcode"
              fullWidth
              value={newPerson.postcode}
              onChange={(e) => setNewPerson({ ...newPerson, postcode: e.target.value })}
            />
          </div>
        </DialogContent>
        <DialogActions className="p-4 gap-2">
          <Button onClick={() => setOpenModal(false)} sx={{ color: 'gray', textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddPerson}
            disabled={loading}
            sx={{
              backgroundColor: "#08B9ED",
              textTransform: "none",
              borderRadius: "8px",
              padding: "10px 24px",
              "&:hover": { backgroundColor: "#07bdf5ff" },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Add Person"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
