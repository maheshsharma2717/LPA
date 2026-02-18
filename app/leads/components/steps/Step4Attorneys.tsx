"use client";
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
import { useState } from "react";

type Person = {
  title: string;
  firstName: string;
  lastName: string;
  middleName: string;
  postcode: string;
  day: string;
  month: string;
  year: string;
  email: string;
};
type Props = {
  data: any;
  updateData: (data: any) => void;
};
export default function AttorneysTab({ data, updateData }: Props) {
  const [openModal, setOpenModal] = useState(false);
  const [people, setPeople] = useState<Person[]>(data?.people || []);

  const [repAttorney, setRepAttorney] = useState(false);

  const [newPerson, setNewPerson] = useState<Person>({
    title: "",
    firstName: "",
    lastName: "",
    middleName: "",
    postcode: "",
    day: "",
    month: "",
    year: "",
    email: "",
  });
  const handleAddPerson = () => {
    if (
      !newPerson.title ||
      !newPerson.firstName ||
      !newPerson.lastName ||
      !newPerson.middleName ||
      !newPerson.postcode ||
      !newPerson.email
    )
      return;

    setPeople((prev) => [...prev, newPerson]);
    setNewPerson({
      title: "",
      firstName: "",
      lastName: "",
      middleName: "",
      postcode: "",
      day: "",
      month: "",
      year: "",
      email: "",
    });
    setOpenModal(false);
  };
  return (
    <>
      <section>
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-5">
            <p className="text-center text-3xl font-bold">Attorneys</p>
            <div className="flex flex-col gap-3">
              <p>
                Attorneys are people a donor appoints to make decisions on their
                behalf, you need to choose at least one Attorney.
              </p>

              <p className="text-lg font-semibold">Select your attorneys</p>
              <div className="flex justify-between border border-gray-300 p-3 items-center">
                <div className="flex gap-2 items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="36"
                    height="36"
                    fill="currentColor"
                  >
                    <path d="M4 22C4 17.5817 7.58172 14 12 14C16.4183 14 20 17.5817 20 22H4ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13Z"></path>
                  </svg>
                  <div className="">
                    <p>Gabriel Lenicker</p>
                    <p>02/08/1987</p>
                    <div className="flex gap-2 items-center">
                      <svg
                        className=""
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="15"
                        height="15"
                        fill="currentColor"
                      >
                        <path d="M16.7574 2.99678L14.7574 4.99678H5V18.9968H19V9.23943L21 7.23943V19.9968C21 20.5491 20.5523 20.9968 20 20.9968H4C3.44772 20.9968 3 20.5491 3 19.9968V3.99678C3 3.4445 3.44772 2.99678 4 2.99678H16.7574ZM20.4853 2.09729L21.8995 3.5115L12.7071 12.7039L11.2954 12.7064L11.2929 11.2897L20.4853 2.09729Z"></path>
                      </svg>
                      <p>
                        {" "}
                        <u
                          onClick={() => setOpenModal(true)}
                          className="cursor-pointer hover:text-blue-500"
                        >
                          {" "}
                          Update this person's details
                        </u>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="checkarea">
                  {" "}
                  <input
                    type="checkbox"
                    // checked={formData.marketing}

                    className="w-5 h-5 mt-0.5 cursor-pointer accent-zenco-blue"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col ">
              <button
                onClick={() => setOpenModal(true)}
                className="border-2 border-gray-300 p-3 flex items-center justify-center gap-2 font-semibold cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                >
                  <path d="M14 14.252V22H4C4 17.5817 7.58172 14 12 14C12.6906 14 13.3608 14.0875 14 14.252ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13ZM18 17V14H20V17H23V19H20V22H18V19H15V17H18Z" />
                </svg>

                <span>Add new Attorney</span>
              </button>
            </div>
          </div>
          <div></div>
        </div>
      </section>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth>
        <div className="flex justify-between items-center px-3 bg-[#334a5e]">
          <DialogTitle className="text-white">Add Person</DialogTitle>

          <span
            className="hover:cursor-pointer"
            onClick={() => setOpenModal(false)}
          >
            {" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="25"
              height="25"
              fill="currentColor"
            >
              <path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"></path>
            </svg>
          </span>
        </div>

        <DialogContent className="flex flex-col gap-6 mt-4 my-5">
          <p className="text-xl font-semibold">Full legal name</p>

          {/* TITLE */}
          <FormControl fullWidth>
            <p>Title</p>
            <Select
              value={newPerson.title}
              onChange={(e) =>
                setNewPerson({ ...newPerson, title: e.target.value })
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
              ].map((title) => (
                <MenuItem key={title} value={title}>
                  {title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* FIRST + LAST NAME */}
          <div className="flex gap-5">
            <FormControl fullWidth>
              <p>First Name</p>
              <TextField
                fullWidth
                value={newPerson.firstName}
                onChange={(e) =>
                  setNewPerson({ ...newPerson, firstName: e.target.value })
                }
              />
            </FormControl>

            <FormControl fullWidth>
              <p>Last Name</p>
              <TextField
                fullWidth
                value={newPerson.lastName}
                onChange={(e) =>
                  setNewPerson({ ...newPerson, lastName: e.target.value })
                }
              />
            </FormControl>
          </div>

          {/* MIDDLE NAME */}
          <FormControl fullWidth>
            <p>Middle Name</p>
            <TextField
              fullWidth
              value={newPerson.middleName}
              onChange={(e) =>
                setNewPerson({ ...newPerson, middleName: e.target.value })
              }
            />
          </FormControl>

          {/* ADDRESS */}
          <div className="flex flex-col gap-5">
            <p className="text-xl font-bold">What's their address?</p>

            <FormControl fullWidth>
              <p>Postcode</p>
              <TextField
                fullWidth
                value={newPerson.postcode}
                onChange={(e) =>
                  setNewPerson({ ...newPerson, postcode: e.target.value })
                }
              />
            </FormControl>
          </div>

          {/* DATE OF BIRTH */}
          <div className="flex flex-col gap-5">
            <p className="text-xl font-bold">What's their date of birth?</p>

            <div className="flex gap-4">
              {/* DAY */}
              <FormControl fullWidth>
                <p>Day</p>
                <Select
                  value={newPerson.day}
                  label="Day"
                  onChange={(e) =>
                    setNewPerson({ ...newPerson, day: e.target.value })
                  }
                >
                  {[...Array(31)].map((_, i) => (
                    <MenuItem key={i + 1} value={String(i + 1)}>
                      {i + 1}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* MONTH */}
              <FormControl fullWidth>
                <p>Month</p>
                <Select
                  value={newPerson.month}
                  label="Month"
                  onChange={(e) =>
                    setNewPerson({ ...newPerson, month: e.target.value })
                  }
                >
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((month) => (
                    <MenuItem key={month} value={month}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* YEAR */}
              <FormControl fullWidth>
                <p>Year</p>
                <Select
                  value={newPerson.year}
                  label="Year"
                  onChange={(e) =>
                    setNewPerson({ ...newPerson, year: e.target.value })
                  }
                >
                  {Array.from({ length: 100 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <MenuItem key={year} value={String(year)}>
                        {year}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </div>

            <FormControl fullWidth>
              <p className="text-xl font-bold mb-2">
                What's their email address? (optional)
              </p>
              <TextField
                fullWidth
                value={newPerson.email}
                onChange={(e) =>
                  setNewPerson({ ...newPerson, email: e.target.value })
                }
              />
            </FormControl>
          </div>
        </DialogContent>

        <DialogActions>
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
      <section>
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-5">
            <p className="text-center text-3xl font-bold">
              Replacement Attorneys
            </p>
            <div className="flex flex-col gap-3">
              <p>
                One or more rerplacement attorneys can be appointed, this is
                optional.
              </p>
              <p>
                Replacement attorneys are people a donor appoints to make
                decisions on their behalf if one of their attorneys can no
                longer make decisions on their behalf.
              </p>

              <p className="text-lg font-semibold">
                Do you want any replacement attorneys?
              </p>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                  <button className="border-2 border-gray-300 leading-loose p-3 cursor-pointer">
                    No
                  </button>
                  <button className="border-2 border-[#334a5e] leading-loose p-3 bg-[#334a5e] hover:bg-[#263645] text-white cursor-pointer">
                    Yes
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <button
                onClick={() => setOpenModal(true)}
                className="border-2 border-gray-300 p-3 flex items-center justify-center gap-2 font-semibold cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                >
                  <path d="M14 14.252V22H4C4 17.5817 7.58172 14 12 14C12.6906 14 13.3608 14.0875 14 14.252ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13ZM18 17V14H20V17H23V19H20V22H18V19H15V17H18Z" />
                </svg>

                <span>Add new Replacement Attorney</span>
              </button>
            </div>
          </div>
          <div></div>
        </div>
      </section>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth>
        <div className="flex justify-between items-center px-3 bg-[#334a5e]">
          <DialogTitle className="text-white">
            Add replacement attorney
          </DialogTitle>

          <span
            className="hover:cursor-pointer"
            onClick={() => setOpenModal(false)}
          >
            {" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="25"
              height="25"
              fill="currentColor"
            >
              <path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"></path>
            </svg>
          </span>
        </div>

        <DialogContent className="flex flex-col gap-6 mt-4 my-5">
          <p className="text-xl font-semibold">Full legal name</p>

          {/* TITLE */}
          <FormControl fullWidth>
            <p>Title</p>
            <Select
              value={newPerson.title}
              onChange={(e) =>
                setNewPerson({ ...newPerson, title: e.target.value })
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
              ].map((title) => (
                <MenuItem key={title} value={title}>
                  {title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* FIRST + LAST NAME */}
          <div className="flex gap-5">
            <FormControl fullWidth>
              <p>First Name</p>
              <TextField
                fullWidth
                value={newPerson.firstName}
                onChange={(e) =>
                  setNewPerson({ ...newPerson, firstName: e.target.value })
                }
              />
            </FormControl>

            <FormControl fullWidth>
              <p>Last Name</p>
              <TextField
                fullWidth
                value={newPerson.lastName}
                onChange={(e) =>
                  setNewPerson({ ...newPerson, lastName: e.target.value })
                }
              />
            </FormControl>
          </div>

          {/* MIDDLE NAME */}
          <FormControl fullWidth>
            <p>Middle Name</p>
            <TextField
              fullWidth
              value={newPerson.middleName}
              onChange={(e) =>
                setNewPerson({ ...newPerson, middleName: e.target.value })
              }
            />
          </FormControl>

          {/* ADDRESS */}
          <div className="flex flex-col gap-5">
            <p className="text-xl font-bold">What's their address?</p>

            <FormControl fullWidth>
              <p>Postcode</p>
              <TextField
                fullWidth
                value={newPerson.postcode}
                onChange={(e) =>
                  setNewPerson({ ...newPerson, postcode: e.target.value })
                }
              />
            </FormControl>
          </div>

          {/* DATE OF BIRTH */}
          <div className="flex flex-col gap-5">
            <p className="text-xl font-bold">What's their date of birth?</p>

            <div className="flex gap-4">
              {/* DAY */}
              <FormControl fullWidth>
                <p>Day</p>
                <Select
                  value={newPerson.day}
                  label="Day"
                  onChange={(e) =>
                    setNewPerson({ ...newPerson, day: e.target.value })
                  }
                >
                  {[...Array(31)].map((_, i) => (
                    <MenuItem key={i + 1} value={String(i + 1)}>
                      {i + 1}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* MONTH */}
              <FormControl fullWidth>
                <p>Month</p>
                <Select
                  value={newPerson.month}
                  label="Month"
                  onChange={(e) =>
                    setNewPerson({ ...newPerson, month: e.target.value })
                  }
                >
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((month) => (
                    <MenuItem key={month} value={month}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* YEAR */}
              <FormControl fullWidth>
                <p>Year</p>
                <Select
                  value={newPerson.year}
                  label="Year"
                  onChange={(e) =>
                    setNewPerson({ ...newPerson, year: e.target.value })
                  }
                >
                  {Array.from({ length: 100 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <MenuItem key={year} value={String(year)}>
                        {year}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </div>

            <FormControl fullWidth>
              <p className="text-xl font-bold mb-2">
                What's their email address? (optional)
              </p>
              <TextField
                fullWidth
                value={newPerson.email}
                onChange={(e) =>
                  setNewPerson({ ...newPerson, email: e.target.value })
                }
              />
            </FormControl>
          </div>
        </DialogContent>

        <DialogActions>
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
    </>
  );
}
