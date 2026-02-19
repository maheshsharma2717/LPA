"use client";

import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { useState } from "react";

export default function WhichDoucmentsTab() {
  const [document, setDocument] = useState("");

  const handleDocChange = (event: SelectChangeEvent) => {
    setDocument(event.target.value as string);
  };
  return (
    <>
      <section>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-5">
            <p className="text-3xl font-bold">
              Which Lasting Power of Attorney document do you need?
            </p>
            <p>
              You need to choose which type of documents you want for you and
              your partner, choose either Health and Welfare for health
              decisions , Property and Finance for decisions about your finances
              or choose both.
            </p>
            <p>
              We strongly recommend taking both documents for peace of mind and
              the best protection.
            </p>
          </div>
          <div className=""></div>
          <div className="flex flex-col gap-3">
            <p className="text-2xl font-bold">Which documents do you need?</p>
            <Box sx={{ minWidth: 120 }}>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Document</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={document}
                  label="Document"
                  onChange={handleDocChange}
                >
                  <MenuItem value={"Health and Welfare"}>Health and Welfare</MenuItem>
                  <MenuItem value={"Property and Finance"}>Property and Finance</MenuItem>
                  <MenuItem value={"Both"}>Both</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-2xl font-bold">
              Which documents does Gabriel Lenicker need?
            </p>
            <Box sx={{ minWidth: 120 }}>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Document</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={document}
                  label="Document"
                  onChange={handleDocChange}
                >
                  <MenuItem value={"Health and Welfare"}>Health and Welfare</MenuItem>
                  <MenuItem value={"Property and Finance<"}>Property and Finance</MenuItem>
                  <MenuItem value={"Both"}>Both</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </div>
        </div>
      </section>
    </>
  );
}
