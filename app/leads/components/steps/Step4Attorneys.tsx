"use client";

import { useState, useEffect, useCallback, useMemo, useReducer } from "react";
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
  Alert,
} from "@mui/material";
import { supabase } from "@/lib/supabase";
import styles from "./Steps.module.css";
import NeedHelp from "@/app/shared/needHelp";

// ============= TYPES =============
type Person = {
  id: string;
  title: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth?: string;
  is_lead: boolean;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  county?: string;
  postcode?: string;
  email?: string;
};

type AttorneyData = {
  selectedAttorneyIds: string[];
  selectedReplacementIds: string[];
  canViewDocuments: boolean | null;
  wantsReplacement: boolean | null;
  attorneys: Array<{
    firstName: string;
    lastName: string;
    address: string;
    dob: string | undefined;
  }>;
  replacementAttorneys: Array<{
    firstName: string;
    lastName: string;
    address: string;
    dob: string | undefined;
  }>;
};

type ModalFormData = {
  title: string;
  firstName: string;
  lastName: string;
  middleName: string;
  day: string;
  month: string;
  year: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  county: string;
  postcode: string;
  email: string;
};

type Props = {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  isSaving: boolean;
  allFormData:any
  // Record<string, unknown>;
  currentDonorIndex: number;
};

// ============= STATE =============
type State = {
  loading: boolean;
  error: string | null;
  isSubmitting: boolean;
  subStep: number;
  peoplePool: Person[];
  selectedAttorneyIds: string[];
  selectedReplacementIds: string[];
  canViewDocuments: boolean | null;
  wantsReplacement: boolean | null;
  openModal: boolean;
  modalMode: "attorney" | "replacement";
  editingPersonId: string | null;
  formData: ModalFormData;
  showManualAddress: boolean;
};

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "SET_SUBSTEP"; payload: number }
  | { type: "SET_PEOPLE_POOL"; payload: Person[] }
  | { type: "UPDATE_PEOPLE_POOL"; payload: Person[] }
  | { type: "ADD_PERSON"; payload: Person }
  | { type: "UPDATE_PERSON"; payload: Person }
  | { type: "SET_SELECTED_ATTORNEYS"; payload: string[] }
  | { type: "TOGGLE_ATTORNEY"; payload: string }
  | { type: "SET_SELECTED_REPLACEMENTS"; payload: string[] }
  | { type: "TOGGLE_REPLACEMENT"; payload: string }
  | { type: "SET_CAN_VIEW_DOCUMENTS"; payload: boolean | null }
  | { type: "SET_WANTS_REPLACEMENT"; payload: boolean | null }
  | { type: "SET_OPEN_MODAL"; payload: boolean }
  | { type: "SET_MODAL_MODE"; payload: "attorney" | "replacement" }
  | { type: "SET_EDITING_PERSON_ID"; payload: string | null }
  | { type: "SET_FORM_DATA"; payload: ModalFormData }
  | { type: "SET_SHOW_MANUAL_ADDRESS"; payload: boolean }
  | { type: "RESET_MODAL" }
  | { type: "SET_SAVED_DATA"; payload: Partial<AttorneyData> };

const EMPTY_FORM: ModalFormData = {
  title: "Mr",
  firstName: "",
  lastName: "",
  middleName: "",
  day: "",
  month: "",
  year: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  county: "",
  postcode: "",
  email: "",
};

const initialState: State = {
  loading: true,
  error: null,
  isSubmitting: false,
  subStep: 0,
  peoplePool: [],
  selectedAttorneyIds: [],
  selectedReplacementIds: [],
  canViewDocuments: null,
  wantsReplacement: null,
  openModal: false,
  modalMode: "attorney",
  editingPersonId: null,
  formData: { ...EMPTY_FORM },
  showManualAddress: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.payload };
    case "SET_SUBSTEP":
      return { ...state, subStep: action.payload };
    case "SET_PEOPLE_POOL":
      return { ...state, peoplePool: action.payload };
    case "UPDATE_PEOPLE_POOL":
      return { ...state, peoplePool: action.payload };
    case "ADD_PERSON":
      return { ...state, peoplePool: [...state.peoplePool, action.payload] };
    case "UPDATE_PERSON":
      return {
        ...state,
        peoplePool: state.peoplePool.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case "SET_SELECTED_ATTORNEYS":
      return { ...state, selectedAttorneyIds: action.payload };
    case "TOGGLE_ATTORNEY":
      return {
        ...state,
        selectedAttorneyIds: state.selectedAttorneyIds.includes(action.payload)
          ? state.selectedAttorneyIds.filter((id) => id !== action.payload)
          : [...state.selectedAttorneyIds, action.payload],
      };
    case "SET_SELECTED_REPLACEMENTS":
      return { ...state, selectedReplacementIds: action.payload };
    case "TOGGLE_REPLACEMENT":
      return {
        ...state,
        selectedReplacementIds: state.selectedReplacementIds.includes(
          action.payload
        )
          ? state.selectedReplacementIds.filter((id) => id !== action.payload)
          : [...state.selectedReplacementIds, action.payload],
      };
    case "SET_CAN_VIEW_DOCUMENTS":
      return { ...state, canViewDocuments: action.payload };
    case "SET_WANTS_REPLACEMENT":
      return { ...state, wantsReplacement: action.payload };
    case "SET_OPEN_MODAL":
      return { ...state, openModal: action.payload };
    case "SET_MODAL_MODE":
      return { ...state, modalMode: action.payload };
    case "SET_EDITING_PERSON_ID":
      return { ...state, editingPersonId: action.payload };
    case "SET_FORM_DATA":
      return { ...state, formData: action.payload };
    case "SET_SHOW_MANUAL_ADDRESS":
      return { ...state, showManualAddress: action.payload };
    case "RESET_MODAL":
      return {
        ...state,
        openModal: false,
        editingPersonId: null,
        formData: { ...EMPTY_FORM },
        showManualAddress: false,
      };
    case "SET_SAVED_DATA":
      return {
        ...state,
        ...(action.payload.selectedAttorneyIds !== undefined && {
          selectedAttorneyIds: action.payload.selectedAttorneyIds,
        }),
        ...(action.payload.selectedReplacementIds !== undefined && {
          selectedReplacementIds: action.payload.selectedReplacementIds,
        }),
        ...(action.payload.canViewDocuments !== undefined && {
          canViewDocuments: action.payload.canViewDocuments,
        }),
        ...(action.payload.wantsReplacement !== undefined && {
          wantsReplacement: action.payload.wantsReplacement,
        }),
      };
    default:
      return state;
  }
}

// ============= API HELPERS =============
async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function fetchDonors(applicationId: string, token: string): Promise<Person[]> {
  const res = await fetch(`/api/donors?applicationId=${applicationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const { data } = await res.json();
  return data ?? [];
}

async function fetchAttorneys(applicationId: string, token: string): Promise<Person[]> {
  const res = await fetch(`/api/attorneys?applicationId=${applicationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const { data } = await res.json();
  return data ?? [];
}

async function fetchLpaDocuments(donorId: string, token: string): Promise<unknown[]> {
  const res = await fetch(`/api/lpa-documents?donorId=${donorId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const { data } = await res.json();
  return data ?? [];
}

async function fetchJunctionLinks(lpaDocId: string, token: string): Promise<unknown[]> {
  const res = await fetch(`/api/lpa-document-attorneys?lpaDocId=${lpaDocId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const { data } = await res.json();
  return data ?? [];
}

async function saveAttorney(
  attorneyData: Record<string, unknown>,
  token: string,
  existingId?: string
): Promise<Person | null> {
  const res = await fetch("/api/attorneys", {
    method: existingId ? "PATCH" : "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(existingId ? { id: existingId, ...attorneyData } : attorneyData),
  });
  const { data } = await res.json();
  return data ?? null;
}

async function deleteAttorney(id: string, token: string): Promise<void> {
  await fetch(`/api/attorneys?id=${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function deleteJunctionLink(id: string, token: string): Promise<void> {
  await fetch(`/api/lpa-document-attorneys?id=${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function deleteAllApplicants(lpaDocId: string, token: string): Promise<void> {
  await fetch(`/api/lpa-document-applicants?lpaDocId=${lpaDocId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function createJunctionLink(
  data: { lpa_document_id: string; attorney_id: string; role: string; sort_order: number },
  token: string
): Promise<void> {
  await fetch("/api/lpa-document-attorneys", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

async function createApplicant(
  data: { lpa_document_id: string; applicant_role: string; attorney_id: null },
  token: string
): Promise<void> {
  await fetch("/api/lpa-document-applicants", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

// ============= DOB HELPERS =============
function buildDob(day: string, month: string, year: string): string | null {
  if (!day || !month || !year) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function splitDob(dob?: string): { day: string; month: string; year: string } {
  if (!dob) return { day: "", month: "", year: "" };
  const parts = dob.split("-");
  if (parts.length !== 3) return { day: "", month: "", year: "" };
  return {
    year: parts[0],
    month: String(Number(parts[1])),
    day: String(Number(parts[2])),
  };
}

// Timezone-safe DOB formatter (no Date constructor)
function formatDobSafe(dob: string | undefined): string {
  if (!dob) return "";
  const parts = dob.split("-");
  if (parts.length !== 3) return "";
  return `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`;
}

// ============= VALIDATION =============
function validateDob(
  day: string,
  month: string,
  year: string
): { valid: boolean; error?: string; dob?: string } {
  if (!day && !month && !year) {
    return { valid: false, error: "Date of birth is required." };
  }

  if (!day || !month || !year) {
    return { valid: false, error: "Please enter complete date of birth." };
  }

  const dayNum = Number(day);
  const monthNum = Number(month);
  const yearNum = Number(year);

  // Check valid numbers
  if (
    isNaN(dayNum) ||
    isNaN(monthNum) ||
    isNaN(yearNum) ||
    dayNum < 1 ||
    dayNum > 31 ||
    monthNum < 1 ||
    monthNum > 12 ||
    yearNum < 1900 ||
    yearNum > new Date().getFullYear()
  ) {
    return { valid: false, error: "Invalid date of birth." };
  }

  // Validate actual date
  const date = new Date(yearNum, monthNum - 1, dayNum);
  if (
    date.getFullYear() !== yearNum ||
    date.getMonth() !== monthNum - 1 ||
    date.getDate() !== dayNum
  ) {
    return { valid: false, error: "Invalid date of birth." };
  }

  const today = new Date();
  if (date > today) {
    return { valid: false, error: "Date of birth cannot be in the future." };
  }

  // Check age >= 18
  let age = today.getFullYear() - yearNum;
  const hasHadBirthdayThisYear =
    today.getMonth() > monthNum - 1 ||
    (today.getMonth() === monthNum - 1 && today.getDate() >= dayNum);
  if (!hasHadBirthdayThisYear) age--;

  if (age < 18) {
    return { valid: false, error: "Attorney must be at least 18 years old." };
  }

  const dob = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
  return { valid: true, dob };
}

// ============= COMPONENT =============
export default function AttorneysTab({
  onNext,
  onBack,
  allFormData,
  updateData,
  currentDonorIndex,
}: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const applicationId = allFormData?.who?.applicationId;

  // Memoized data fetch
  const loadInitialData = useCallback(async () => {
    if (!applicationId) {
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const token = await getAuthToken();
      if (!token) {
        dispatch({ type: "SET_ERROR", payload: "Authentication required." });
        return;
      }

      // Parallel fetch for performance
      const [donors, existingAttorneys] = await Promise.all([
        fetchDonors(applicationId, token),
        fetchAttorneys(applicationId, token),
      ]);

      // Determine subject donor
      let subjectDonorId: string | undefined;
      if (donors && donors.length > 0) {
        const step1Selection = allFormData?.who?.selection as string | undefined;
        const step1SelectedIds = (allFormData?.who?.selectedPeopleIds as string[]) || [];
        const isLeadSelected =
          step1Selection === "You" ||
          step1Selection === "You and your partner" ||
          step1Selection === "You and someone else";

        const activeDonors = donors.filter((d: Person) => {
          if (d.is_lead) return isLeadSelected;
          return step1SelectedIds.includes(d.id);
        });
        subjectDonorId = activeDonors[currentDonorIndex]?.id;
      }

      // Build people pool - exclude subject donor
      const pool = donors?.filter((d: Person) => d.id !== subjectDonorId) || [];

      // Add existing attorneys to pool if not already present
      const existingIds = new Set(pool.map((p: Person) => p.id));
      const newAttorneys = (existingAttorneys || []).filter(
        (a: Person) => !existingIds.has(a.id)
      );

      dispatch({
        type: "SET_PEOPLE_POOL",
        payload: [...pool, ...newAttorneys],
      });

      // Load saved data
      const savedData = allFormData?.attorneys as Partial<AttorneyData> | undefined;
      if (savedData) {
        dispatch({ type: "SET_SAVED_DATA", payload: savedData });
      }
    } catch (err) {
      console.error("Error loading Step 4:", err);
      dispatch({ type: "SET_ERROR", payload: "Failed to load attorney details." });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [applicationId, currentDonorIndex, allFormData]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Memoized derived data
  const replacementPool = useMemo(
    () => state.peoplePool.filter((p) => !state.selectedAttorneyIds.includes(p.id)),
    [state.peoplePool, state.selectedAttorneyIds]
  );

  // ============= HANDLERS =============
  const handleBack = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      onBack();
    } catch (err) {
      console.error("Error saving reversing step:", err);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [onBack]);

  const toggleAttorney = useCallback((id: string) => {
    dispatch({ type: "TOGGLE_ATTORNEY", payload: id });
  }, []);

  const toggleReplacement = useCallback((id: string) => {
    dispatch({ type: "TOGGLE_REPLACEMENT", payload: id });
  }, []);

  const openAddModal = useCallback((mode: "attorney" | "replacement") => {
    dispatch({ type: "SET_MODAL_MODE", payload: mode });
    dispatch({ type: "SET_EDITING_PERSON_ID", payload: null });
    dispatch({ type: "SET_FORM_DATA", payload: { ...EMPTY_FORM } });
    dispatch({ type: "SET_OPEN_MODAL", payload: true });
  }, []);

  const openEditModal = useCallback(
    (person: Person, mode: "attorney" | "replacement") => {
      dispatch({ type: "SET_MODAL_MODE", payload: mode });
      dispatch({ type: "SET_EDITING_PERSON_ID", payload: person.id });

      const { day, month, year } = splitDob(person.date_of_birth);

      dispatch({
        type: "SET_FORM_DATA",
        payload: {
          title: person.title || "Mr",
          firstName: person.first_name || "",
          lastName: person.last_name || "",
          middleName: person.middle_name || "",
          day,
          month,
          year,
          addressLine1: person.address_line_1 || "",
          addressLine2: person.address_line_2 || "",
          city: person.city || "",
          county: person.county || "",
          postcode: person.postcode || "",
          email: person.email || "",
        },
      });
      dispatch({ type: "SET_OPEN_MODAL", payload: true });
    },
    []
  );

  const closeModal = useCallback(() => {
    dispatch({ type: "RESET_MODAL" });
  }, []);

  const handleSaveModal = useCallback(async () => {
    dispatch({ type: "SET_ERROR", payload: null });

    const { firstName, lastName, day, month, year } = state.formData;

    if (!firstName || !lastName) {
      dispatch({ type: "SET_ERROR", payload: "First and last name are required." });
      return;
    }

    // Validate DOB
    const dobValidation = validateDob(day, month, year);
    if (!dobValidation.valid) {
      dispatch({ type: "SET_ERROR", payload: dobValidation.error??"" });
      return;
    }

    dispatch({ type: "SET_SUBMITTING", payload: true });

    try {
      const token = await getAuthToken();
      if (!token) return;

      const attorneyBody = {
        application_id: applicationId,
        title: state.formData.title,
        first_name: state.formData.firstName,
        last_name: state.formData.lastName,
        middle_name: state.formData.middleName,
        date_of_birth: dobValidation.dob || null,
        address_line_1: state.formData.addressLine1,
        address_line_2: state.formData.addressLine2,
        city: state.formData.city,
        county: state.formData.county,
        postcode: state.formData.postcode,
        email: state.formData.email,
      };

      const saved = await saveAttorney(attorneyBody, token, state.editingPersonId || undefined);

      if (saved) {
        if (state.editingPersonId) {
          dispatch({ type: "UPDATE_PERSON", payload: saved });
        } else {
          dispatch({ type: "ADD_PERSON", payload: saved });

          // Auto-select based on modal mode
          if (state.modalMode === "attorney") {
            dispatch({
              type: "SET_SELECTED_ATTORNEYS",
              payload: [...state.selectedAttorneyIds, saved.id],
            });
          } else {
            dispatch({
              type: "SET_SELECTED_REPLACEMENTS",
              payload: [...state.selectedReplacementIds, saved.id],
            });
          }
        }
      }

      closeModal();
    } catch (err) {
      console.error("Error saving person:", err);
      dispatch({ type: "SET_ERROR", payload: "Failed to save person." });
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  }, [state.formData, state.editingPersonId, state.modalMode, applicationId, state.selectedAttorneyIds, state.selectedReplacementIds, closeModal]);

  const handleInternalNext = useCallback(async () => {
    dispatch({ type: "SET_ERROR", payload: null });

    // Validation for sub-steps
    if (state.subStep === 0) {
      if (state.selectedAttorneyIds.length === 0) {
        dispatch({ type: "SET_ERROR", payload: "Please select at least one attorney." });
        return;
      }
      dispatch({ type: "SET_SUBSTEP", payload: 1 });
      window.scrollTo(0, 0);
      return;
    }

    if (state.subStep === 1) {
      if (state.canViewDocuments === null) {
        dispatch({ type: "SET_ERROR", payload: "Please select an option." });
        return;
      }
      dispatch({ type: "SET_SUBSTEP", payload: 2 });
      window.scrollTo(0, 0);
      return;
    }

    // SubStep 2 - Final save
    dispatch({ type: "SET_SUBMITTING", payload: true });

    try {
      const token = await getAuthToken();
      if (!token) return;

      // Get donor ID - reuse existing data if available
      let activeDonorId = allFormData?.["which-donor"]?.donorId as string | undefined;

      if (!activeDonorId) {
        const donors = await fetchDonors(applicationId!, token);
        if (donors && donors.length > 0) {
          const step1Selection = allFormData?.who?.selection as string | undefined;
          const step1SelectedIds = (allFormData?.who?.selectedPeopleIds as string[]) || [];
          const isLeadSelected =
            step1Selection === "You" ||
            step1Selection === "You and your partner" ||
            step1Selection === "You and someone else";

          const activeDonors = donors.filter((d: Person) => {
            if (d.is_lead) return isLeadSelected;
            return step1SelectedIds.includes(d.id);
          });
          activeDonorId = activeDonors[0]?.id;
        }
      }

      if (!activeDonorId) {
        dispatch({ type: "SET_ERROR", payload: "Could not find the donor. Please go back to Step 3." });
        dispatch({ type: "SET_SUBMITTING", payload: false });
        return;
      }

      // Fetch LPA documents
      const lpaDocs = await fetchLpaDocuments(activeDonorId, token);

      if (lpaDocs && lpaDocs.length > 0) {
        // Clean up existing links in parallel
        const cleanupPromises = lpaDocs.flatMap((doc: any) => [
          fetchJunctionLinks(doc.id, token).then((links) =>
            Promise.all(links.map((link: any) => deleteJunctionLink(link.id, token)))
          ),
          deleteAllApplicants(doc.id, token),
        ]);
        await Promise.all(cleanupPromises);
      }

      // Fetch existing attorneys
      const existingAttorneys = await fetchAttorneys(applicationId!, token);

      // Determine which attorneys to keep, update, or create
      const currentAttorneyIds = new Set(state.selectedAttorneyIds);
      const currentReplacementIds = new Set(state.selectedReplacementIds);
      const existingAttorneyIds = new Set(existingAttorneys.map((a: Person) => a.id));

      // Find attorneys to delete (not in current selection)
      const toDelete = existingAttorneys.filter(
        (a: Person) => !currentAttorneyIds.has(a.id) && !currentReplacementIds.has(a.id)
      );

      // Delete removed attorneys in parallel
      await Promise.all(toDelete.map((a: Person) => deleteAttorney(a.id, token)));

      // Upsert attorneys using diff logic
      const primaryAttorneyDbIds: string[] = [];
      const replacementAttorneyDbIds: string[] = [];

      // Get current pool data
      const getPersonData = (id: string) => state.peoplePool.find((p) => p.id === id);

      // Process primary attorneys
      const primaryPromises = state.selectedAttorneyIds.map(async (donorId, index) => {
        const person = getPersonData(donorId);
        if (!person) return null;

        // Check if attorney already exists
        const existing = existingAttorneys.find(
          (a: Person) => a.id === person.id || (a.first_name === person.first_name && a.last_name === person.last_name)
        );

        const attorneyData = {
          application_id: applicationId,
          title: person.title,
          first_name: person.first_name,
          last_name: person.last_name,
          middle_name: person.middle_name,
          date_of_birth: person.date_of_birth || null,
          address_line_1: person.address_line_1,
          address_line_2: person.address_line_2,
          city: person.city,
          county: person.county,
          postcode: person.postcode,
          email: person.email,
        };

        if (existing) {
          await saveAttorney(attorneyData, token, existing.id);
          return existing.id;
        } else {
          const saved = await saveAttorney(attorneyData, token);
          return saved?.id || null;
        }
      });

      const primaryResults = await Promise.all(primaryPromises);
      primaryAttorneyDbIds.push(...primaryResults.filter(Boolean) as string[]);

      // Process replacement attorneys
      if (state.wantsReplacement) {
        const replacementPromises = state.selectedReplacementIds.map(async (donorId) => {
          const person = getPersonData(donorId);
          if (!person) return null;

          const existing = existingAttorneys.find(
            (a: Person) => a.id === person.id || (a.first_name === person.first_name && a.last_name === person.last_name)
          );

          const attorneyData = {
            application_id: applicationId,
            title: person.title,
            first_name: person.first_name,
            last_name: person.last_name,
            middle_name: person.middle_name,
            date_of_birth: person.date_of_birth,
            address_line_1: person.address_line_1,
            address_line_2: person.address_line_2,
            city: person.city,
            county: person.county,
            postcode: person.postcode,
            email: person.email,
          };

          if (existing) {
            await saveAttorney(attorneyData, token, existing.id);
            return existing.id;
          } else {
            const saved = await saveAttorney(attorneyData, token);
            return saved?.id || null;
          }
        });

        const replacementResults = await Promise.all(replacementPromises);
        replacementAttorneyDbIds.push(...replacementResults.filter(Boolean) as string[]);
      }

      // Create junction links in parallel
      if (lpaDocs && lpaDocs.length > 0) {
        const junctionPromises = lpaDocs.flatMap((doc: any) => {
          const links: Promise<void>[] = [];

          // Primary attorneys
          primaryAttorneyDbIds.forEach((attorneyId, i) => {
            links.push(
              createJunctionLink(
                { lpa_document_id: doc.id, attorney_id: attorneyId, role: "primary", sort_order: i + 1 },
                token
              )
            );
          });

          // Replacement attorneys
          replacementAttorneyDbIds.forEach((attorneyId, i) => {
            links.push(
              createJunctionLink(
                { lpa_document_id: doc.id, attorney_id: attorneyId, role: "replacement", sort_order: i + 1 },
                token
              )
            );
          });

          // Donor applicant
          links.push(
            createApplicant(
              { lpa_document_id: doc.id, applicant_role: "donor", attorney_id: null },
              token
            )
          );

          return links;
        });

        await Promise.all(junctionPromises);
      }

      // Prepare data for parent
      const attorneyObjects = state.selectedAttorneyIds
        .map((id) => {
          const p = getPersonData(id);
          return p
            ? {
                firstName: p.first_name,
                lastName: p.last_name,
                address: p.postcode,
                dob: p.date_of_birth,
              }
            : null;
        })
        .filter(Boolean);

      const replacementObjects = state.selectedReplacementIds
        .map((id) => {
          const p = getPersonData(id);
          return p
            ? {
                firstName: p.first_name,
                lastName: p.last_name,
                address: p.postcode,
                dob: p.date_of_birth,
              }
            : null;
        })
        .filter(Boolean);

      updateData({
        selectedAttorneyIds: state.selectedAttorneyIds,
        selectedReplacementIds: state.selectedReplacementIds,
        canViewDocuments: state.canViewDocuments,
        wantsReplacement: state.wantsReplacement,
        attorneys: attorneyObjects,
        replacementAttorneys: replacementObjects,
      });

      onNext();
    } catch (err) {
      console.error("Error saving attorneys:", err);
      dispatch({ type: "SET_ERROR", payload: "Failed to save attorney details." });
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  }, [
    state.subStep,
    state.selectedAttorneyIds,
    state.selectedReplacementIds,
    state.canViewDocuments,
    state.wantsReplacement,
    state.peoplePool,
    applicationId,
    allFormData,
    updateData,
    onNext,
  ]);

  const handleInternalBack = useCallback(() => {
    if (state.subStep > 0) {
      dispatch({ type: "SET_SUBSTEP", payload: state.subStep - 1 });
      window.scrollTo(0, 0);
    }
  }, [state.subStep]);

  // ============= RENDER =============
  if (state.loading) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (state.error && !state.peoplePool.length && state.subStep === 0) {
    return <Alert severity="error">{state.error}</Alert>;
  }

  return (
    <section className="space-y-8 p-2 animate-in fade-in slide-in-from-top-4">
      {/* SUB-STEP 0: SELECT PRIMARY ATTORNEYS */}
      {state.subStep === 0 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column - Attorney Selection */}
            <div className="flex-1 space-y-5">
              <h1 className={`text-center text-3xl font-bold text-zenco-dark ${styles.headingBorderBottom}`}>
                Attorneys
              </h1>

              <div className="flex flex-col gap-3 text-black font-medium">
                <p>
                  Attorneys are people a donor appoints to make decisions on their behalf, you need to choose at least one Attorney.
                </p>
              </div>

              <p className="text-xl font-medium text-zenco-dark">Select your attorneys</p>

              {state.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {state.error}
                </Alert>
              )}

              <div className="space-y-1">
                {state.peoplePool.map((person) => {
                  const isSelected = state.selectedAttorneyIds.includes(person.id);
                  return (
                    <div
                      key={person.id}
                      className={`flex items-center justify-between p-4 border-2 transition-all ${
                        isSelected
                          ? "border-[#334a5e] bg-[#334a5e] text-white"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 448 512"
                            className={`w-9 h-9 ${isSelected ? "text-white" : "text-black"}`}
                            fill="currentColor"
                          >
                            <path d="M224 248a120 120 0 1 0 0-240 120 120 0 1 0 0 240zm-29.7 56C95.8 304 16 383.8 16 482.3 16 498.7 29.3 512 45.7 512l356.6 0c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3l-59.4 0z" />
                          </svg>
                        </span>
                        <div className="flex flex-col gap-1">
                          <p className="font-semibold">
                            {person.first_name} {person.last_name}
                            {person.is_lead ? " (You)" : ""}
                          </p>
                          <p className={`text-sm ${isSelected ? "text-white" : "text-black"}`}>
                            {formatDobSafe(person.date_of_birth)}
                          </p>

                          <div className="flex gap-1 items-center">
                            <span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 512 512"
                                className="w-4 h-4 hover:text-blue-500 transition cursor-pointer"
                                fill="currentColor"
                              >
                                <path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L368 46.1 465.9 144 490.3 119.6c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L432 177.9 334.1 80 172.4 241.7zM96 64C43 64 0 107 0 160L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-96c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 64z" />
                              </svg>
                            </span>
                            <p
                              className={`text-sm underline cursor-pointer ${isSelected ? "text-white " : "text-black"}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(person, "attorney");
                              }}
                            >
                              Update this person&apos;s details
                            </p>
                          </div>
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAttorney(person.id)}
                        className="w-5 h-5 cursor-pointer accent-zenco-blue"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Add new attorney */}
              <button
                onClick={() => openAddModal("attorney")}
                className="w-full border-2 text[#334a5e] border-[#8f90a6] bg-white p-4 flex items-center justify-center gap-2 font-semibold cursor-pointer transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 512"
                  className="w-6 h-6 text-gray-700 hover:text-blue-500 transition cursor-pointer"
                  fill="currentColor"
                >
                  <path d="M285.7 304c98.5 0 178.3 79.8 178.3 178.3 0 16.4-13.3 29.7-29.7 29.7L77.7 512C61.3 512 48 498.7 48 482.3 48 383.8 127.8 304 226.3 304l59.4 0zM528 80c13.3 0 24 10.7 24 24l0 48 48 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-48 0 0 48c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-48-48 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0 0-48c0-13.3 10.7-24 24-24zM256 248a120 120 0 1 1 0-240 120 120 0 1 1 0 240z" />
                </svg>
                <span className="text-lg">Add new attorney</span>
              </button>
            </div>

            {/* Right Column - Info */}
            <div className="md:w-72 space-y-3">
              <h3 className="text-lg text-zenco-dark">Who can be an Attorney?</h3>
              <p className="text-sm text-gray-600">The Attorney must be meet the following requirements:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    className="w-4 h-4 text-[#28a745]"
                    fill="currentColor"
                  >
                    <path d="M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zM374 145.7c-10.7-7.8-25.7-5.4-33.5 5.3L221.1 315.2 169 263.1c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l72 72c5 5 11.8 7.5 18.8 7s13.4-4.1 17.5-9.8L379.3 179.2c7.8-10.7 5.4-25.7-5.3-33.5z" />
                  </svg>
                  Aged <strong>18 or over</strong>.
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    className="w-4 h-4 text-[#28a745]"
                    fill="currentColor"
                  >
                    <path d="M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zM374 145.7c-10.7-7.8-25.7-5.4-33.5 5.3L221.1 315.2 169 263.1c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l72 72c5 5 11.8 7.5 18.8 7s13.4-4.1 17.5-9.8L379.3 179.2c7.8-10.7 5.4-25.7-5.3-33.5z" />
                  </svg>
                  <p>Have <strong>mental capacity</strong> to make decisions.</p>
                </li>
                <li className="flex gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    className="w-6 h-6 text-[#dc3545]"
                    fill="currentColor"
                  >
                    <path d="M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM167 167c9.4-9.4 24.6-9.4 33.9 0l55 55 55-55c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-55 55 55 55c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-55-55-55 55c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l55-55-55-55c-9.4-9.4-9.4-24.6 0-33.9z" />
                  </svg>
                  <p>Must <strong>not</strong> be bankrupt, or subject to a debt relief order.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUB-STEP 1: DOCUMENT VIEW AUTHORITY */}
      {state.subStep === 1 && (
        <div className="space-y-6 animate-in fade-in">
          <h1 className={`text-center text-3xl font-bold text-zenco-dark ${styles.headingBorderBottom}`}>
            Can attorneys <span className="text-zenco-blue">view your legal documents?</span>
          </h1>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <p className="text-zenco-dark text-lg font-semibold">
                Are you happy for your Attorneys to view your legal documents if you lose mental capacity?
              </p>

              {state.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {state.error}
                </Alert>
              )}

              <div className="flex flex-col gap-0">
                <button
                  onClick={() => dispatch({ type: "SET_CAN_VIEW_DOCUMENTS", payload: true })}
                  className={`border-2 p-4 text-center transition-all ${
                    state.canViewDocuments === true
                      ? "border-[#334a5e] bg-[#334a5e] text-white font-semibold"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Yes - give the attorneys authority
                </button>
                <button
                  onClick={() => dispatch({ type: "SET_CAN_VIEW_DOCUMENTS", payload: false })}
                  className={`border-2 border-t-0 p-4 text-center transition-all ${
                    state.canViewDocuments === false
                      ? "border-[#334a5e] bg-[#334a5e] text-white font-semibold"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  No - do not give the attorneys authority
                </button>
              </div>
            </div>

            {/* Right Column - Help */}
            <div className="md:w-72">
              {/* <details className="border border-gray-200 rounded-lg">
                <summary className="p-3 font-semibold text-zenco-blue cursor-pointer">NEED HELP?</summary>
                <div className="p-3 text-sm text-gray-600">
                  <p>This gives your attorneys the authority to view your will, other LPAs, and related legal documents.</p>
                </div>
              </details> */}
              <NeedHelp/>
            </div>
          </div>
        </div>
      )}

      {/* SUB-STEP 2: REPLACEMENT ATTORNEYS */}
      {state.subStep === 2 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-5">
              <h1 className={`text-center text-3xl font-bold text-zenco-dark ${styles.headingBorderBottom}`}>
                Replacement <span className="text-zenco-blue">Attorneys</span>
              </h1>

              <div className="flex flex-col gap-3 text-gray-600">
                <p>One or more replacement attorneys can be appointed, this is optional.</p>
                <p>
                  Replacement attorneys are people a donor appoints to make decisions on their behalf if one of their
                  attorneys can no longer make decisions on their behalf.
                </p>
              </div>

              <p className="text-lg font-semibold text-zenco-dark">Do you want any replacement attorneys?</p>

              <div className="flex flex-col gap-0">
                <button
                  onClick={() => {
                    dispatch({ type: "SET_WANTS_REPLACEMENT", payload: false });
                    dispatch({ type: "SET_SELECTED_REPLACEMENTS", payload: [] });
                  }}
                  className={`border-2 p-4 text-center transition-all ${
                    state.wantsReplacement === false
                      ? "border-[#334a5e] bg-[#334a5e] text-white font-semibold"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  No
                </button>
                <button
                  onClick={() => dispatch({ type: "SET_WANTS_REPLACEMENT", payload: true })}
                  className={`border-2 border-t-0 p-4 text-center transition-all ${
                    state.wantsReplacement === true
                      ? "border-[#334a5e] bg-[#334a5e] text-white font-semibold"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Yes
                </button>
              </div>

              {/* Show replacement selection if Yes */}
              {state.wantsReplacement && (
                <div className="space-y-4 animate-in fade-in mt-4">
                  <p className="text-lg font-semibold text-zenco-dark">Select your Replacement Attorneys</p>

                  <div className="space-y-3">
                    {replacementPool.map((person) => {
                      const isSelected = state.selectedReplacementIds.includes(person.id);
                      return (
                        <div
                          key={person.id}
                          className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected ? "border-[#334a5e] bg-white shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              width="28"
                              height="28"
                              fill="currentColor"
                              className="text-gray-500"
                            >
                              <path d="M4 22C4 17.5817 7.58172 14 12 14C16.4183 14 20 17.5817 20 22H4ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13Z" />
                            </svg>
                            <div>
                              <p className="font-semibold text-zenco-dark">
                                {person.first_name} {person.last_name}
                              </p>
                              <p
                                className="text-sm underline text-blue-600 hover:text-blue-800 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(person, "replacement");
                                }}
                              >
                                ✎ Update this person&apos;s details
                              </p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleReplacement(person.id)}
                            className="w-5 h-5 cursor-pointer accent-zenco-blue"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Add new replacement attorney */}
                  <button
                    onClick={() => openAddModal("replacement")}
                    className="w-full border-2 border-dashed border-gray-300 p-4 flex items-center justify-center gap-2 font-semibold cursor-pointer rounded-lg hover:border-gray-400 transition-all"
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
                    <span>Add new replacement attorney</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Column - Info */}
            <div className="md:w-72 space-y-3">
              <h3 className="font-semibold text-zenco-dark">Who can be a Replacement Attorney?</h3>
              <p className="text-sm text-gray-600">The replacement attorney must be meet the following requirements:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Aged <strong>18 or over</strong>.
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p>Have <strong>mental capacity</strong> to make decisions.</p>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p>Must <strong>not</strong> be bankrupt, or subject to a debt relief order.</p>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p>Must not already be assigned as an <strong>Attorney</strong></p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* INTERNAL NAVIGATION */}
      <div className="flex justify-between pt-6">
        <button onClick={handleBack} className="cursor-pointer">
          ← back
        </button>
        <button
          onClick={handleInternalNext}
          disabled={state.isSubmitting}
          className={`px-10 py-3 rounded text-white font-bold shadow-lg transition-all flex items-center justify-center min-w-45 
               bg-[#06b6d4] hover:bg-cyan-600 cursor-pointer`}
        >
          {state.isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Save and continue"}
        </button>
      </div>

      {/* ADD / EDIT PERSON MODAL */}
      <Dialog open={state.openModal} onClose={closeModal} fullWidth maxWidth="sm">
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 bg-[#40688b]">
          <DialogTitle className="text-white p-0! text-lg font-semibold">
            {state.editingPersonId
              ? "Update person's details"
              : state.modalMode === "attorney"
                ? "Add attorney"
                : "Add replacement attorney"}
          </DialogTitle>

          <span className="cursor-pointer text-white text-xl" onClick={closeModal}>
            ✕
          </span>
        </div>

        <DialogContent className="px-6 py-6 space-y-8">
          {/* FULL LEGAL NAME */}
          <div className="space-y-6">
            <p className="text-xl font-semibold text-zenco-dark">Full legal name</p>

            {/* Title - Half Width */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-sm font-medium text-[#6B7588]">Title</p>
                <Select
                  fullWidth
                  value={state.formData.title}
                  onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { ...state.formData, title: e.target.value } })}
                >
                  {["Choose...", "Mr", "Mrs", "Miss", "Ms", "Mx", "Rev", "Prof", "Lady", "Dr", "Lord"].map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </div>
            </div>

            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-sm font-medium text-[#6B7588]">First Name</p>
                <TextField
                  fullWidth
                  value={state.formData.firstName}
                  onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { ...state.formData, firstName: e.target.value } })}
                />
              </div>

              <div>
                <p className="mb-1 text-sm font-medium text-[#6B7588]">Last Name</p>
                <TextField
                  fullWidth
                  value={state.formData.lastName}
                  onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { ...state.formData, lastName: e.target.value } })}
                />
              </div>
            </div>

            {/* Middle Name - Full Width */}
            <div>
              <p className="mb-1 text-sm font-medium text-[#6B7588]">Middle names (if any)</p>
              <TextField
                fullWidth
                value={state.formData.middleName}
                onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { ...state.formData, middleName: e.target.value } })}
              />
            </div>
          </div>

          {/* ADDRESS SECTION */}
          <div className="space-y-6">
            <p className="text-xl font-semibold text-zenco-dark">What&apos;s their address?</p>

            {/* Postcode + Search (Single Row) */}
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <p className="mb-1 text-sm font-medium text-[#6B7588]">Postcode</p>
                <TextField
                  fullWidth
                  value={state.formData.postcode}
                  onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { ...state.formData, postcode: e.target.value } })}
                />
              </div>

              <Button
                variant="contained"
                fullWidth
                sx={{
                  backgroundColor: "#08B9ED",
                  height: "56px",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { backgroundColor: "#07bdf5ff" },
                }}
              >
                Search
              </Button>
            </div>

            {!state.showManualAddress && (
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_SHOW_MANUAL_ADDRESS", payload: true })}
                className="text-cyan-500 font-semibold text-sm hover:underline"
              >
                Enter address manually
              </button>
            )}

            {state.showManualAddress && (
              <div className="space-y-6">
                {/* Address 1 & 2 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-1 text-sm font-medium text-[#6B7588]">Address Line 1</p>
                    <TextField
                      fullWidth
                      value={state.formData.addressLine1}
                      onChange={(e) =>
                        dispatch({ type: "SET_FORM_DATA", payload: { ...state.formData, addressLine1: e.target.value } })
                      }
                    />
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-medium text-[#6B7588]">Address Line 2 (Optional)</p>
                    <TextField
                      fullWidth
                      value={state.formData.addressLine2}
                      onChange={(e) =>
                        dispatch({ type: "SET_FORM_DATA", payload: { ...state.formData, addressLine2: e.target.value } })
                      }
                    />
                  </div>
                </div>

                {/* Town & County */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-1 text-sm font-medium text-[#6B7588]">Town</p>
                    <TextField
                      fullWidth
                      value={state.formData.city}
                      onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { ...state.formData, city: e.target.value } })}
                    />
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-medium text-[#6B7588]">County</p>
                    <TextField
                      fullWidth
                      value={state.formData.county}
                      onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { ...state.formData, county: e.target.value } })}
                    />
                  </div>
                </div>

                {/* Postcode (Manual Toggle Single Row) */}
                <div>
                  <p className="mb-1 text-sm font-medium text-[#6B7588]">Postcode</p>
                  <TextField
                    fullWidth
                    value={state.formData.postcode}
                    onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { ...state.formData, postcode: e.target.value } })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* DATE OF BIRTH */}
          <div className="space-y-4">
            <p className="text-xl font-semibold text-zenco-dark">What&apos;s their date of birth?</p>

            {state.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {state.error}
              </Alert>
            )}

            <div className="grid grid-cols-3 gap-4">
              {/* DAY */}
              <TextField
                placeholder="DD"
                value={state.formData.day}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value) && value.length <= 2) {
                    dispatch({ type: "SET_FORM_DATA", payload: { ...state.formData, day: value } });
                  }
                }}
                error={state.formData.day !== "" && !/^(0?[1-9]|[12][0-9]|3[01])$/.test(state.formData.day)}
                inputProps={{ inputMode: "numeric" }}
                fullWidth
              />

              {/* MONTH */}
              <TextField
                placeholder="MM"
                value={state.formData.month}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value) && value.length <= 2) {
                    dispatch({ type: "SET_FORM_DATA", payload: { ...state.formData, month: value } });
                  }
                }}
                error={state.formData.month !== "" && !/^(0?[1-9]|1[0-2])$/.test(state.formData.month)}
                inputProps={{ inputMode: "numeric" }}
                fullWidth
              />

              {/* YEAR */}
              <TextField
                placeholder="YYYY"
                value={state.formData.year}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value) && value.length <= 4) {
                    dispatch({ type: "SET_FORM_DATA", payload: { ...state.formData, year: value } });
                  }
                }}
                error={
                  state.formData.year !== "" &&
                  (!/^\d{4}$/.test(state.formData.year) || Number(state.formData.year) > new Date().getFullYear())
                }
                inputProps={{ inputMode: "numeric" }}
                fullWidth
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-[#6B7588]">Email</p>
            <TextField
              fullWidth
              value={state.formData.email}
              onChange={(e) => dispatch({ type: "SET_FORM_DATA", payload: { ...state.formData, email: e.target.value } })}
            />
          </div>

          <Button
            fullWidth
            variant="contained"
            onClick={handleSaveModal}
            disabled={state.isSubmitting}
            sx={{
              backgroundColor: "#08B9ED",
              textTransform: "none",
              padding: "14px",
              fontSize: "18px",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#1d4ed8" },
            }}
          >
            {state.isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Save and continue"}
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
