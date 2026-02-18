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
} from "@mui/material";

type Person = {
  firstName: string;
  lastName: string;
  dob: string;
};

type Props = {
  data: any;
  updateData: (data: any) => void;
};

const options = [
  "You",
  "You and your partner",
  "Just your partner",
  "Your mum and dad",
  "Just one of your parents",
  "Someone else",
];

export default function Step1Who({ data, updateData }: Props) {
  const [selected, setSelected] = useState<string>(
    data?.selection || "You"
  );

  const [morePeople, setMorePeople] = useState(
    data?.selection && data.selection !== "You"
  );

  const [openModal, setOpenModal] = useState(false);
  const [people, setPeople] = useState<Person[]>(data?.people || []);

  const [newPerson, setNewPerson] = useState<Person>({
    firstName: "",
    lastName: "",
    dob: "",
  });

  useEffect(() => {
    updateData({
      selection: selected,
      people,
    });
  }, [selected, people]);

  const handleAddPerson = () => {
    if (!newPerson.firstName || !newPerson.lastName || !newPerson.dob)
      return;

    setPeople((prev) => [...prev, newPerson]);
    setNewPerson({ firstName: "", lastName: "", dob: "" });
    setOpenModal(false);
  };

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold text-zenco-dark">
          {morePeople
            ? "Who are the documents for?"
            : "Who is the Lasting Power of Attorney for?"}
        </h2>

        {!morePeople ? (
          <>
            <p>You have chosen to make documents for yourself only.</p>

            <p>
              If you have made a mistake and need these documents for someone
              else then{" "}
              <button
                type="button"
                onClick={() => setMorePeople(true)}
                className="underline text-blue-600"
              >
                click here to change who these documents are for.
              </button>
            </p>

            <p>
              Click the continue button to continue making Lasting Power of
              Attorney document for yourself.
            </p>
          </>
        ) : (
          <Box sx={{ minWidth: 120 }}>
            <FormControl fullWidth>
              <InputLabel id="who-select-label">
                Who are the documents for?
              </InputLabel>

              <Select
                labelId="who-select-label"
                value={selected}
                label="Who are the documents for?"
                onChange={(e) => setSelected(e.target.value)}
              >
                {options.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </div>

      {/* If Someone Else Selected */}
      {selected === "Someone else" && (
        <div className="space-y-6">
          <Button
            variant="outlined"
            onClick={() => setOpenModal(true)}
            sx={{
              borderColor: "#2563eb",
              color: "#2563eb",
              "&:hover": {
                borderColor: "#1d4ed8",
                backgroundColor: "#eff6ff",
              },
            }}
          >
            + Add new person
          </Button>

          {/* List of Added People */}
          {people.map((person, index) => (
            <div
              key={index}
              className="p-4 mt-3 rounded-xl border border-gray-200 bg-gray-50"
            >
              <p className="font-medium text-zenco-dark">
                {person.firstName} {person.lastName}
              </p>
              <p className="text-sm text-gray-600">
                DOB: {person.dob}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        fullWidth
      >
        <DialogTitle>Add person</DialogTitle>

        <DialogContent className="flex flex-col gap-6 mt-4">
          <TextField
            label="First Name"
            fullWidth
            value={newPerson.firstName}
            onChange={(e) =>
              setNewPerson({ ...newPerson, firstName: e.target.value })
            }
          />

          <TextField
            label="Last Name"
            fullWidth
            value={newPerson.lastName}
            onChange={(e) =>
              setNewPerson({ ...newPerson, lastName: e.target.value })
            }
          />

          <TextField
            label="Date of Birth"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={newPerson.dob}
            onChange={(e) =>
              setNewPerson({ ...newPerson, dob: e.target.value })
            }
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleAddPerson}
            sx={{
              backgroundColor: "#2563eb",
              "&:hover": { backgroundColor: "#1d4ed8" },
            }}
          >
            Save and continue
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
