"use client";

import {
  CheckCircle,
  Person,
  Description,
  Gavel,
  Groups,
  Info,
  Verified,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CircularProgress, FormControl, Select, MenuItem } from "@mui/material";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allFormData: any;
  onEdit: (stepIndex: number) => void;
  currentDonorIndex: number;
}

type Attorney = {
  id: string;
  title?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  county?: string;
  postcode?: string;
  email?: string;
  mobile?: string;
};

export default function Step10({ allFormData, onEdit, currentDonorIndex }: Props) {
  const routePage = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [donorDetails, setDonorDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [peopleToNotify, setPeopleToNotify] = useState<any[]>([]);

  // Attorney decision state — summary shows first, decision page only on Edit click
  const [showAttorneyDecision, setShowAttorneyDecision] = useState(false);
  const [attorneySameForBoth, setAttorneySameForBoth] = useState<boolean | null>(null);
  const [attorneyDocAssignments, setAttorneyDocAssignments] = useState<Record<string, string>>({});
  const [isSavingAttorneyPrefs, setIsSavingAttorneyPrefs] = useState(false);
  const [totalDonors, setTotalDonors] = useState<number>(1);

  const applicationId = allFormData?.who?.applicationId;

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setLoading(false); return; }
        const token = session.access_token;

        // Get application ID - fallback if not in formData
        let appId = applicationId;
        if (!appId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: apps } = await supabase
              .from("applications")
              .select("id")
              .eq("lead_id", user.id)
              .is("deleted_at", null)
              .order("created_at", { ascending: false })
              .limit(1);
            if (apps && apps.length > 0) {
              appId = apps[0].id;
            }
          }
        }

        if (!appId) { setLoading(false); return; }

        // Fetch donors
        const donorsRes = await fetch(`/api/donors?applicationId=${appId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: fetchedDonors } = await donorsRes.json();

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

          // If active donors filtering returns empty, fall back to all donors
          const donorsList = activeDonors.length > 0 ? activeDonors : fetchedDonors;
          setDonorDetails(donorsList[currentDonorIndex] || donorsList[0]);
          setTotalDonors(donorsList.length);
        }

        // Fetch attorneys from DB
        const attorneysRes = await fetch(`/api/attorneys?applicationId=${appId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: fetchedAttorneys } = await attorneysRes.json();
        if (fetchedAttorneys && fetchedAttorneys.length > 0) {
          setAttorneys(fetchedAttorneys);
          // Default all to "both"
          const defaults: Record<string, string> = {};
          fetchedAttorneys.forEach((a: Attorney) => { defaults[a.id] = "both"; });
          setAttorneyDocAssignments(defaults);
        }

        // Get people to notify from formData
        const ptn = allFormData?.["people-to-Notify"]?.people || [];
        setPeopleToNotify(ptn);

      } catch (err) {
        console.error("Error fetching data in Step 10:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, currentDonorIndex, allFormData?.who]);

  const decisions = allFormData?.["health-&-finances"] || {};
  const appInfo = allFormData?.["application-information"] || {};
  const certProvider = allFormData?.["certificate-provider"] || {};
  const opgFees = allFormData?.["opg-fees"] || {};

  const donorName = donorDetails
    ? `${donorDetails.first_name} ${donorDetails.last_name}`
    : "Name not provided";
  const donorDob = donorDetails?.date_of_birth
    ? formatDate(donorDetails.date_of_birth)
    : "DOB not provided";

  const donorAddressLines = donorDetails
    ? [
      donorDetails.address_line_1,
      donorDetails.address_line_2,
      donorDetails.city,
      donorDetails.county,
      donorDetails.postcode,
      "United Kingdom",
    ].filter(Boolean)
    : ["Address not provided"];

  function formatDate(dateStr: string) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }

  const sections = [
    {
      sno: 2,
      title: "Attorneys",
      desc: attorneys.length > 0
        ? <>
          {attorneys.map((a, i) => (
            <span key={a.id}>{a.first_name} {a.last_name}{i < attorneys.length - 1 ? ", " : ""}</span>
          ))}
          {" "}for health and finance decisions.
          {allFormData?.attorneys?.wantsReplacement === false && (
            <><br /><br />You do not want any replacement attorneys.</>
          )}
        </>
        : "No attorneys selected.",
      icon: <Groups fontSize="small" />,
      step: 3,
      customEdit: () => setShowAttorneyDecision(true),
    },
    {
      sno: 3,
      title: "Health and Financial Decisions",
      desc: <>
        {decisions.lifeSustaining !== undefined && (
          <>
            The attorneys {decisions.lifeSustaining ? "have" : "do not have"} the authority to make decisions about life-sustaining treatment.
            <br /><br />
            The attorneys have the authority to make decisions for you as soon as this document is registered.
          </>
        )}
        {!decisions.lifeSustaining && decisions.lifeSustaining !== false && "No decisions configured yet."}
      </>,
      icon: <Gavel fontSize="small" />,
      step: 4,
    },
    {
      sno: 4,
      title: "People To Notify",
      desc: peopleToNotify.length > 0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? peopleToNotify.map((p: any) => p.first_name || p.firstName).join(", ")
        : "No people to notify selected.",
      icon: <Groups fontSize="small" />,
      step: 5,
    },
    {
      sno: 5,
      title: "Application Information",
      desc: <>
        Person registering: <br />
        {appInfo.registeringPerson || donorName}.<br /><br />
        Person to receive registered document: <br />
        {appInfo.receivingPerson || donorName}.
      </>,
      icon: <Info fontSize="small" />,
      step: 6,
    },
    {
      sno: 6,
      title: "Certificate Provider",
      desc: certProvider.hasProvider
        ? "Certificate provider details have been added."
        : "You will enter the certificate provider details later when you receive the documents.",
      icon: <Verified fontSize="small" />,
      step: 7,
    },
    {
      sno: 7,
      title: "OPG Fees",
      desc: `You have chosen to pay the OPG by ${(opgFees.paymentMethod || "CHEQUE").toUpperCase()}.`,
      icon: <Description fontSize="small" />,
      step: 8,
    },
  ];

  // People list for the right sidebar
  const sidebarPeople = [
    ...(donorDetails ? [{
      name: donorName,
      addressLines: donorAddressLines,
      dob: donorDob,
      email: donorDetails.email,
      mobile: donorDetails.mobile,
    }] : []),
    ...attorneys.map((a) => ({
      name: `${a.first_name} ${a.last_name}`,
      addressLines: [a.address_line_1, a.address_line_2, a.city, a.county, a.postcode, "United Kingdom"].filter(Boolean),
      dob: a.date_of_birth ? formatDate(a.date_of_birth) : "DOB not provided",
      email: a.email,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mobile: (a as any).mobile,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...peopleToNotify.map((p: any) => ({
      name: `${p.first_name || p.firstName} ${p.last_name || p.lastName}`,
      addressLines: [p.address_line_1 || p.address, p.city, p.postcode].filter(Boolean),
      dob: p.dob ? formatDate(p.dob) : (p.date_of_birth ? formatDate(p.date_of_birth) : "DOB not provided"),
      email: p.email,
      mobile: p.mobile,
    })),
  ];

  // Handle attorney preference save
  const handleSaveAttorneyPrefs = async () => {
    setIsSavingAttorneyPrefs(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;

      // Get app ID
      let appId = applicationId;
      if (!appId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: apps } = await supabase
            .from("applications")
            .select("id")
            .eq("lead_id", user.id)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(1);
          if (apps && apps.length > 0) appId = apps[0].id;
        }
      }
      if (!appId) return;

      // Get the current donor
      const donor = donorDetails;
      if (!donor) return;

      // Fetch LPA documents for this donor
      const lpasRes = await fetch(`/api/lpa-documents?donorId=${donor.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { data: lpaDocs } = await lpasRes.json();

      if (!lpaDocs || lpaDocs.length === 0) {
        setIsSavingAttorneyPrefs(false);
        setShowAttorneyDecision(true);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const healthDoc = lpaDocs.find((d: any) => d.lpa_type === "health_and_welfare");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const financeDoc = lpaDocs.find((d: any) => d.lpa_type === "property_and_finance");

      // For each LPA doc, clear existing attorney links and re-create based on preferences
      for (const doc of lpaDocs) {
        // Delete existing links
        const junctionRes = await fetch(`/api/lpa-document-attorneys?lpaDocId=${doc.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: existingLinks } = await junctionRes.json();
        if (existingLinks && existingLinks.length > 0) {
          for (const link of existingLinks) {
            await fetch(`/api/lpa-document-attorneys?id=${link.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }
      }

      // Re-create links based on assignment preferences
      for (let i = 0; i < attorneys.length; i++) {
        const att = attorneys[i];
        const assignment = attorneySameForBoth ? "both" : (attorneyDocAssignments[att.id] || "both");

        if (assignment === "both" || assignment === "health") {
          if (healthDoc) {
            await fetch("/api/lpa-document-attorneys", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                lpa_document_id: healthDoc.id,
                attorney_id: att.id,
                role: "primary",
                sort_order: i + 1,
              }),
            });
          }
        }

        if (assignment === "both" || assignment === "property") {
          if (financeDoc) {
            await fetch("/api/lpa-document-attorneys", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                lpa_document_id: financeDoc.id,
                attorney_id: att.id,
                role: "primary",
                sort_order: i + 1,
              }),
            });
          }
        }
      }

      setShowAttorneyDecision(false);
    } catch (err) {
      console.error("Error saving attorney preferences:", err);
    } finally {
      setIsSavingAttorneyPrefs(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <CircularProgress />
      </div>
    );
  }

  // ───── ATTORNEY DECISION SUB-VIEW (shown only when Edit clicked) ─────
  if (showAttorneyDecision && attorneys.length > 0) {
    return (
      <section className="min-h-screen p-6 animate-fadeIn">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-center text-2xl font-bold text-[#334a5e] mb-2">
            Do you want your attorneys to make decisions about both
          </h1>
          <h2 className="text-center text-xl mb-6">
            <span className="text-cyan-500 font-semibold">Health and Welfare</span>
            {" "}and{" "}
            <span className="text-cyan-500 font-semibold">Property and Finance</span>?
          </h2>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Left — Yes/No + Attorney list */}
            <div className="flex-1 space-y-5">
              <p className="text-gray-600 text-sm">
                If you choose YES the attorneys you have picked will appear on both documents and be able to make decisions about health and welfare and property and finance.
              </p>
              <p className="text-gray-600 text-sm">
                If you choose NO then you can pick which documents you want them to appear on.
              </p>
              <p className="text-cyan-500 text-sm cursor-pointer hover:underline">
                Most people choose YES here.
              </p>

              {/* Yes / No Buttons */}
              <div className="flex flex-col gap-0">
                <button
                  onClick={() => { setAttorneySameForBoth(true); }}
                  className={`border-2 p-4 text-center font-semibold transition-all ${attorneySameForBoth === true
                    ? "border-[#334a5e] bg-[#334a5e] text-white"
                    : "border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => { setAttorneySameForBoth(false); }}
                  className={`border-2 border-t-0 p-4 text-center font-semibold transition-all ${attorneySameForBoth === false
                    ? "border-[#334a5e] bg-[#334a5e] text-white"
                    : "border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  No
                </button>
              </div>

              {/* If No → per-attorney doc type selector */}
              {attorneySameForBoth === false && (
                <div className="space-y-4 mt-4 animate-in fade-in">
                  {attorneys.map((att) => (
                    <div key={att.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Person className="text-gray-500" fontSize="small" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#334a5e]">{att.first_name} {att.last_name}</p>
                        <div className="flex flex-col gap-1 mt-2">
                          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input
                              type="radio"
                              name={`doc-${att.id}`}
                              value="health"
                              checked={attorneyDocAssignments[att.id] === "health"}
                              onChange={() => setAttorneyDocAssignments(prev => ({ ...prev, [att.id]: "health" }))}
                              className="accent-cyan-500"
                            />
                            Health & Welfare
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input
                              type="radio"
                              name={`doc-${att.id}`}
                              value="property"
                              checked={attorneyDocAssignments[att.id] === "property"}
                              onChange={() => setAttorneyDocAssignments(prev => ({ ...prev, [att.id]: "property" }))}
                              className="accent-cyan-500"
                            />
                            Property & Finance
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input
                              type="radio"
                              name={`doc-${att.id}`}
                              value="both"
                              checked={attorneyDocAssignments[att.id] === "both"}
                              onChange={() => setAttorneyDocAssignments(prev => ({ ...prev, [att.id]: "both" }))}
                              className="accent-cyan-500"
                            />
                            Both
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6">
                <button
                  onClick={() => setShowAttorneyDecision(false)}
                  className="text-gray-400 font-bold flex items-center gap-2 hover:text-[#334a5e] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  <u>Back</u>
                </button>
                <button
                  onClick={handleSaveAttorneyPrefs}
                  disabled={attorneySameForBoth === null || isSavingAttorneyPrefs}
                  className="bg-[#06b6d4] hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingAttorneyPrefs ? <CircularProgress size={20} color="inherit" /> : "Save and continue"}
                </button>
              </div>
            </div>

            {/* Right — Help */}
            <div className="md:w-64">
              <details className="border border-gray-200 rounded-lg">
                <summary className="p-3 font-semibold text-cyan-500 cursor-pointer">NEED HELP?</summary>
                <div className="p-3 text-sm text-gray-600">
                  <p>If you choose YES the attorneys you have picked will appear on both documents and be able to make decisions about health and welfare and property and finance.</p>
                  <br />
                  <p>If you choose NO then you can pick which documents you want them to appear on.</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ───── MAIN SUMMARY VIEW ─────
  return (
    <section className="min-h-screen p-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <p className="text-2xl font-semibold text-cyan-500 text-center">Your</p>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Lasting Power of Attorney
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-5">
            {/* About You */}
            <div>
              <p className="text-sm text-gray-500 mb-2 font-medium">(Section 1 of 7)</p>
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:border-cyan-200 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Person className="text-cyan-600" fontSize="small" />
                    <h3 className="text-xl font-extrabold text-[#334a5e]">
                      About You (The Donor)
                    </h3>
                  </div>
                  <CheckCircle className="text-green-500" />
                </div>

                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                  Your full name is{" "}
                  <strong className="text-gray-800">{donorName}</strong> and you were
                  born on <span className="font-semibold">{donorDob}</span>.
                </p>

                <div className="flex flex-col sm:flex-row sm:gap-6 mb-7 mt-3 text-sm">
                  <div className="text-gray-500 font-medium">Your home address is:</div>
                  <div className="text-gray-800 font-semibold italic">
                    {donorAddressLines.map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => onEdit(2)}
                    className="border-2 border-[#334a5e] text-[#334a5e] font-bold py-2 px-10 rounded-lg hover:bg-[#334a5e] hover:text-white transition-all"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>

            {/* Other Sections */}
            {sections.map((section, index) => (
              <div key={index}>
                <p className="text-sm text-gray-500 mb-2 font-medium">(Section {section.sno} of 7)</p>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-cyan-100 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-600">{section.icon}</span>
                      <h3 className="text-xl font-extrabold text-[#334a5e]">
                        {section.title}
                      </h3>
                    </div>

                    <CheckCircle className="text-green-500" />
                  </div>

                  <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                    {section.desc}
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => onEdit(section.step)}
                      className="border-2 border-[#334a5e] text-[#334a5e] font-bold py-2 px-10 rounded-lg hover:bg-[#334a5e] hover:text-white transition-all"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-6 sticky">
            {/* Info Box */}
            <div className="bg-white border-b-4 border-cyan-400 rounded-xl p-6 shadow-xl z-1 ">
              <h4 className="text-cyan-600 text-2xl font-black mb-4 uppercase tracking-tighter">
                Check this information
              </h4>

              <p className="text-gray-600 mb-4 font-medium leading-normal">
                Please check all the information on this page carefully
                including the details of the people in the document.
              </p>

              <p className="text-gray-600 mb-6 font-medium leading-normal">
                {currentDonorIndex < totalDonors - 1
                  ? "When you are happy, continue to fill in the next person's details."
                  : "When you are happy, click below to continue to payment."}
              </p>

              <button
                onClick={async () => {
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) return;
                    const token = session.access_token;

                    // Get app ID
                    let appId = applicationId;
                    if (!appId) {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                        const { data: apps } = await supabase
                          .from("applications")
                          .select("id")
                          .eq("lead_id", user.id)
                          .is("deleted_at", null)
                          .order("created_at", { ascending: false })
                          .limit(1);
                        if (apps && apps.length > 0) appId = apps[0].id;
                      }
                    }
                    if (!appId) throw new Error("No application found");

                    // Fetch actual donors from DB to be absolutely sure of the count
                    const donorsRes = await fetch(`/api/donors?applicationId=${appId}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    const { data: fetchedDonors } = await donorsRes.json();

                    if (!fetchedDonors || fetchedDonors.length === 0) {
                      // Fallback to old logic if fetch fails
                      const step1Selection = allFormData?.who?.selection;
                      const selectedPeopleIds = allFormData?.who?.selectedPeopleIds || [];
                      const isLeadSelected =
                        step1Selection === "You" ||
                        step1Selection === "You and your partner" ||
                        step1Selection === "You and someone else";
                      const totalDonorsNeeded = (isLeadSelected ? 1 : 0) + selectedPeopleIds.length;

                      if (currentDonorIndex < totalDonorsNeeded - 1) {
                        routePage.push(`/leads/Acknowledgement?finishedIndex=${currentDonorIndex}&nextIndex=${currentDonorIndex + 1}`);
                      } else {
                        routePage.push(`/leads/Acknowledgement?finishedIndex=${currentDonorIndex}&done=true`);
                      }
                      return;
                    }

                    // Sort them correctly (same as in Acknowledgement page)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const sortedDonors = fetchedDonors.sort((a: any, b: any) =>
                      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );

                    if (currentDonorIndex < sortedDonors.length - 1) {
                      routePage.push(`/leads/Acknowledgement?finishedIndex=${currentDonorIndex}&nextIndex=${currentDonorIndex + 1}`);
                    } else {
                      routePage.push(`/leads/Acknowledgement?finishedIndex=${currentDonorIndex}&done=true`);
                    }
                  } catch (err) {
                    console.error("Error in Step10 transition:", err);
                    // Minimal fallback
                    routePage.push(`/leads/Acknowledgement?finishedIndex=${currentDonorIndex}&done=true`);
                  }
                }}
                className="bg-[#06b6d4] hover:bg-cyan-600 shadow-lg shadow-cyan-100 cursor-pointer py-4 w-full text-white rounded-lg font-black text-lg transition-all active:scale-95"
              >
                {currentDonorIndex < totalDonors - 1
                  ? "Continue to next person →"
                  : "Continue to payment →"}
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">People in this LPA</p>
              {/* People Cards */}
              {sidebarPeople.map((person, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-100 rounded-3xl p-5 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-cyan-500"
                >
                  <h5 className="text-xl font-black text-cyan-500 mb-2">
                    {person.name}
                  </h5>

                  <div className="flex flex-col gap-2 mb-4 text-xs font-medium text-gray-600">
                    <div className="italic">
                      {person.addressLines.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-gray-50 flex justify-between">
                      <span className="text-gray-400">Born on:</span>
                      <span className="text-[#334a5e] font-bold">{person.dob}</span>
                    </div>
                    {person.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email:</span>
                        <span className="text-[#334a5e] font-bold text-xs">{person.email}</span>
                      </div>
                    )}
                    {person.mobile && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Mobile:</span>
                        <span className="text-[#334a5e] font-bold">{person.mobile}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onEdit(2)}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 w-full rounded-xl transition-colors text-sm"
                  >
                    Change details
                  </button>
                </div>
              ))}
            </div>

            <FormControl fullWidth className="mt-6">
              <Select
                value="FAQ"
                className="bg-white rounded-xl font-bold text-[#334a5e]"
                sx={{ borderRadius: '12px' }}
              >
                <MenuItem value="FAQ" className="font-bold">NEED HELP? (FAQ)</MenuItem>
                <MenuItem value="SUPPORT">Contact Support</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>

        {/* Back */}
        <div className="mt-12 mb-20 flex justify-center">
          <button
            onClick={() => onEdit(8)}
            className="text-gray-400 font-black flex items-center gap-2 hover:text-[#334a5e] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <u>Back to OPG Fees</u>
          </button>
        </div>
      </div>
    </section>
  );
}
